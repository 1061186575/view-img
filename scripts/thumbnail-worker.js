#!/usr/bin/env node

/**
 * 缩略图生成工作线程
 * 用于多线程并行处理缩略图生成任务
 */

import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import {createHash} from 'crypto';
import ffmpeg from 'fluent-ffmpeg';
import heicConvert from 'heic-convert';
import {parentPort, workerData} from 'worker_threads';

/**
 * MD5 哈希函数
 * @param {string} str - 要哈希的字符串
 * @returns {string} MD5 哈希值
 */
function md5(str) {
    return createHash('md5').update(str, 'utf8').digest('hex');
}

/**
 * 将 HEIC/HEIF 格式转换为 JPEG
 * @param {string} fullPath - 完整文件路径
 * @param {Buffer} buffer - 文件缓冲区
 * @returns {Promise<Buffer>} 转换后的缓冲区
 */
async function heic2Jpeg(fullPath, buffer) {
    const fp = fullPath.toLowerCase();
    if (fp.endsWith('.heic') || fp.endsWith('.heif')) {
        return await heicConvert({
            buffer,
            format: 'JPEG',
            quality: 1
        });
    }
    return buffer;
}

/**
 * 生成缓存文件路径
 * @param {string} fullPath - 完整文件路径
 * @param {object} config - 缩略图配置
 * @param {string} cacheDir - 缓存目录
 * @returns {Promise<string>} 缓存文件路径
 */
async function generateCacheFilePath(fullPath, config, cacheDir) {
    const fileStat = fs.statSync(fullPath);
    const cacheKey = md5(`${fullPath}_${fileStat.mtimeMs}_${config.width}x${config.height}`);
    const filename = `${cacheKey}.${config.format}`;
    return path.join(cacheDir, filename);
}

/**
 * 异步生成视频缩略图
 * @param {string} videoPath - 视频文件路径
 * @param {string} outputPath - 输出缩略图路径
 * @param {object} config - 缩略图配置
 * @returns {Promise<void>} 生成完成的Promise
 */
async function generateVideoThumbnail(videoPath, outputPath, config) {
    return new Promise((resolve, reject) => {
        ffmpeg(videoPath)
            .frames(1)
            .size(`${config.width}x${config.height}`)
            .on('end', resolve)
            .on('error', (err) => reject(new Error(`FFmpeg processing failed: ${err.message}`)))
            .save(outputPath);
    });
}

/**
 * 生成单个图片的缩略图（工作线程版本）
 * @param {Object} imageFile - 图片文件信息
 * @param {string} cacheDir - 图片缓存目录
 * @param {string} videoCacheDir - 视频缓存目录
 * @param {Object} THUMBNAIL_CONFIG_IMAGE - 图片缩略图配置
 * @param {Object} THUMBNAIL_CONFIG_VIDEO - 视频缩略图配置
 * @param {Object} THUMBNAIL_CONFIG - 通用缩略图配置
 * @returns {Promise<Object>} 处理结果
 */
async function generateThumbnailWorker(imageFile, cacheDir, videoCacheDir, THUMBNAIL_CONFIG_IMAGE, THUMBNAIL_CONFIG_VIDEO, THUMBNAIL_CONFIG) {
    try {
        const { fullPath, relativePath, type } = imageFile;

        if (type === 'image') {
            // 检查缓存目录
            if (!fs.existsSync(cacheDir)) {
                fs.mkdirSync(cacheDir, { recursive: true });
            }

            // 生成缓存文件名
            const cacheFilePath = await generateCacheFilePath(fullPath, THUMBNAIL_CONFIG_IMAGE, cacheDir);

            // 检查缓存是否已存在
            if (fs.existsSync(cacheFilePath)) {
                return { success: true, cached: true, path: relativePath };
            }

            // 生成图片缩略图，支持 HEIC 转换
            let imageBuffer = fs.readFileSync(fullPath);
            imageBuffer = await heic2Jpeg(fullPath, imageBuffer);
            const thumbnailBuffer = await sharp(imageBuffer)
                .rotate() // 自动根据 EXIF 方向信息旋转图片
                .resize(THUMBNAIL_CONFIG_IMAGE.width, THUMBNAIL_CONFIG_IMAGE.height, {
                    fit: 'cover',
                    position: 'center'
                })
                .jpeg({ quality: THUMBNAIL_CONFIG.quality })
                .toBuffer();

            // 保存缓存
            fs.writeFileSync(cacheFilePath, thumbnailBuffer);
        } else if (type === 'video') {
            // 检查缓存目录
            if (!fs.existsSync(videoCacheDir)) {
                fs.mkdirSync(videoCacheDir, { recursive: true });
            }

            // 生成缓存文件名
            const cacheFilePath = await generateCacheFilePath(fullPath, THUMBNAIL_CONFIG_VIDEO, videoCacheDir);

            // 检查缓存是否已存在
            if (fs.existsSync(cacheFilePath)) {
                return { success: true, cached: true, path: relativePath };
            }

            // 生成视频缩略图
            await generateVideoThumbnail(fullPath, cacheFilePath, THUMBNAIL_CONFIG_VIDEO);
        }

        return { success: true, cached: false, path: relativePath };

    } catch (error) {
        return {
            success: false,
            error: error.message,
            path: imageFile.relativePath
        };
    }
}

// 监听来自主线程的消息
parentPort.on('message', async (data) => {
    const {
        imageFile,
        taskId,
        cacheDir,
        videoCacheDir,
        THUMBNAIL_CONFIG_IMAGE,
        THUMBNAIL_CONFIG_VIDEO,
        THUMBNAIL_CONFIG
    } = data;
    try {

        const result = await generateThumbnailWorker(
            imageFile,
            cacheDir,
            videoCacheDir,
            THUMBNAIL_CONFIG_IMAGE,
            THUMBNAIL_CONFIG_VIDEO,
            THUMBNAIL_CONFIG
        );

        // 发送处理结果回主线程
        parentPort.postMessage({
            success: true,
            taskId,
            result
        });
    } catch (error) {
        // 发送错误信息回主线程
        parentPort.postMessage({
            success: false,
            taskId,
            error: error.message
        });
    }
});
