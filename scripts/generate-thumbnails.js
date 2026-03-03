#!/usr/bin/env node

/**
 * 批量生成缩略图脚本
 * 遍历 public/media 目录下的所有图片，预先生成缩略图
 * 使用: MEDIA_ROOT_PATH=/home/admin/Desktop/project/media node scripts/generate-thumbnails.js
 */

import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import {createHash} from 'crypto';
import ffmpeg from 'fluent-ffmpeg';
import heicConvert from 'heic-convert';
import os from 'os';
import {Worker} from 'worker_threads';
import {THUMBNAIL_CONFIG} from "../lib/config.js";
import {SUPPORTED_IMAGE_EXTENSIONS, SUPPORTED_VIDEO_EXTENSIONS} from "../app/media/const.js";

/**
 * 读取 .env 文件配置
 * @param {string} envPath - .env 文件路径
 * @returns {Object} 环境变量对象
 */
function loadEnvFile(envPath = '.env') {
    const envConfig = {};

    try {
        const envContent = fs.readFileSync(envPath, 'utf8');

        // 按行分割并处理每一行
        envContent.split('\n').forEach(line => {
            // 去除空白字符
            line = line.trim();

            // 跳过空行和注释行
            if (!line || line.startsWith('#')) {
                return;
            }

            // 解析 KEY=VALUE 格式
            const equalIndex = line.indexOf('=');
            if (equalIndex > 0) {
                const key = line.substring(0, equalIndex).trim();
                let value = line.substring(equalIndex + 1).trim();

                // 去除引号
                if ((value.startsWith('"') && value.endsWith('"')) ||
                    (value.startsWith("'") && value.endsWith("'"))) {
                    value = value.slice(1, -1);
                }

                envConfig[key] = value;
            }
        });
    } catch (error) {
        // 如果 .env 文件不存在或读取失败，使用默认值
        console.log(`📝 未找到 .env 文件，使用默认配置`);
    }

    return envConfig;
}

// 加载 .env 配置
const envConfig = loadEnvFile();

// 优先级：环境变量 > .env 文件 > 默认值
const MEDIA_ROOT_PATH = process.env.MEDIA_ROOT_PATH || envConfig.MEDIA_ROOT_PATH || 'public/media';
const projectName = 'view-img'

// 多线程配置
const numCPUs = os.cpus().length;
const WORKER_COUNT = Math.max(1, numCPUs - 1); // 保留一个 CPU 核心给主线程
const CHUNK_SIZE = 10; // 每个工作线程一次处理的文件数量

// 设置 mediaDir 目录
const mediaDir = path.resolve(process.cwd(), MEDIA_ROOT_PATH);
const cacheDir = path.join(process.cwd(), '.next', 'cache', 'thumbnails');
const videoCacheDir = path.join(process.cwd(), '.next', 'cache', 'video-thumbnails');

// 缩略图配置（与API路由保持一致）
const THUMBNAIL_CONFIG_IMAGE = THUMBNAIL_CONFIG.IMAGE
const THUMBNAIL_CONFIG_VIDEO = THUMBNAIL_CONFIG.VIDEO

// 支持的图片格式（与API路由保持一致）
const IMAGE_EXTENSIONS = SUPPORTED_IMAGE_EXTENSIONS;
const VIDEO_EXTENSIONS = SUPPORTED_VIDEO_EXTENSIONS;

// 统计信息
const stats = {
    total: 0,
    generated: 0,
    cached: 0,
    errors: 0,
    startTime: Date.now()
};

/**
 * 递归遍历目录获取所有图片文件
 */
function getAllImageFiles(dir, basePath = '') {
    const files = [];

    try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            const relativePath = path.join(basePath, entry.name);

            if (entry.isDirectory()) {
                // 递归处理子目录
                files.push(...getAllImageFiles(fullPath, relativePath));
            } else if (entry.isFile()) {
                const ext = path.extname(entry.name).toLowerCase();
                if (IMAGE_EXTENSIONS.includes(ext)) {
                    files.push({
                        fullPath,
                        type: 'image',
                        relativePath: relativePath.replace(/\\/g, '/') // 统一使用正斜杠
                    });
                } else if (VIDEO_EXTENSIONS.includes(ext)) {
                    files.push({
                        fullPath,
                        type: 'video',
                        relativePath: relativePath.replace(/\\/g, '/') // 统一使用正斜杠
                    });
                }
            }
        }
    } catch (error) {
        console.error(`❌ 无法读取目录 ${dir}:`, error.message);
    }

    return files;
}

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
    // 如果是 HEIC / HEIF，就转成 JPEG buffer
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
export async function generateCacheFilePath(fullPath, config, cacheDir) {
    const fileStat = fs.statSync(fullPath);
    const cacheKey = md5(`${fullPath}_${fileStat.mtimeMs}_${config.width}x${config.height}`)
    const filename = `${cacheKey}.${config.format}`;
    return path.join(cacheDir, filename);
}

/**
 * 生成单个图片的缩略图
 */
async function generateThumbnail(imageFile) {
    try {
        const { fullPath, relativePath, type } = imageFile;

        if (type === 'image') {
            // 检查缓存目录
            if (!fs.existsSync(cacheDir)) {
                fs.mkdirSync(cacheDir, { recursive: true });
            }

            // 生成缓存文件名（与API路由逻辑保持一致）
            const cacheFilePath = await generateCacheFilePath(fullPath, THUMBNAIL_CONFIG_IMAGE, cacheDir);

            // 检查缓存是否已存在
            if (fs.existsSync(cacheFilePath)) {
                stats.cached++;
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

            // 生成缓存文件名（与API路由逻辑保持一致）
            const cacheFilePath = await generateCacheFilePath(fullPath, THUMBNAIL_CONFIG_VIDEO, videoCacheDir);

            // 检查缓存是否已存在
            if (fs.existsSync(cacheFilePath)) {
                stats.cached++;
                return { success: true, cached: true, path: relativePath };
            }

            // 生成视频缩略图
            await generateVideoThumbnail(fullPath, cacheFilePath, THUMBNAIL_CONFIG.VIDEO);
        }

        stats.generated++;
        return { success: true, cached: false, path: relativePath };

    } catch (error) {
        stats.errors++;
        return {
            success: false,
            error: error.message,
            path: imageFile.relativePath
        };
    }
}

/**
 * 格式化文件大小
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * 格式化持续时间
 */
function formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
        return `${hours}小时${minutes % 60}分钟${seconds % 60}秒`;
    } else if (minutes > 0) {
        return `${minutes}分钟${seconds % 60}秒`;
    } else {
        return `${seconds}秒`;
    }
}

/**
 * 显示进度
 */
function showProgress(current, total) {
    const percentage = Math.floor((current / total) * 100);
    const bar = '█'.repeat(Math.floor(percentage / 2)) + '░'.repeat(50 - Math.floor(percentage / 2));
    process.stdout.write(`\r进度: [${bar}] ${percentage}% (${current}/${total})`);
}

function setFfmpegPath() {
    // 如果找不到 ffmpeg 命令, 可以在这里设置 ffmpeg 文件路径
    const possiblePaths = [
        process.env.FFMPEG_PATH,
        'C:\\Users\\Administrator\\AppData\\Roaming\\bilibili\\ffmpeg\\ffmpeg.exe',
    ];

    for (const path of possiblePaths) {
        if (path && fs.existsSync(path)) {
            ffmpeg.setFfmpegPath(path);
            break;
        }
    }
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
            .frames(1) // 只取一帧
            .size(`${config.width}x${config.height}`) // 指定尺寸
            .on('end', () => {
                resolve();
            })
            .on('error', (err) => {
                reject(new Error(`FFmpeg processing failed: ${err.message}`));
            })
            .save(outputPath);
    });
}

/**
 * 将文件数组按指定大小分块
 * @param {Array} array - 要分块的数组
 * @param {number} size - 每块的大小
 * @returns {Array[]} 分块后的数组
 */
function chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
}

/**
 * 创建工作线程处理文件块
 * @param {Array} filesChunk - 文件块
 * @param {number} workerId - 工作线程ID
 * @returns {Promise} 处理完成的Promise
 */
function createWorkerPromise(filesChunk, workerId) {
    return new Promise((resolve, reject) => {
        const workerData = {
            files: filesChunk,
            workerId,
            mediaDir,
            cacheDir,
            videoCacheDir,
            THUMBNAIL_CONFIG_IMAGE,
            THUMBNAIL_CONFIG_VIDEO,
            THUMBNAIL_CONFIG
        };

        const worker = new Worker(new URL(import.meta.url), {
            workerData,
            // 如果是在工作线程中运行，则执行工作线程逻辑
            env: { ...process.env, IS_WORKER: '1' }
        });

        worker.on('message', (data) => {
            if (data.type === 'progress') {
                // 更新统计信息
                stats.generated += data.generated;
                stats.cached += data.cached;
                stats.errors += data.errors;
            } else if (data.type === 'complete') {
                resolve(data.results);
            }
        });

        worker.on('error', reject);
        worker.on('exit', (code) => {
            if (code !== 0) {
                reject(new Error(`工作线程 ${workerId} 退出，代码: ${code}`));
            }
        });
    });
}

/**
 * 使用多线程并行处理缩略图生成
 * @param {Array} imageFiles - 所有需要处理的文件
 * @returns {Promise} 处理完成的Promise
 */
async function processWithMultiThread(imageFiles) {
    console.log(`💻 使用 ${WORKER_COUNT} 个工作线程并行处理...\n`);

    // 将文件分块
    const fileChunks = chunkArray(imageFiles, CHUNK_SIZE);
    const promises = [];

    // 创建工作线程池
    for (let i = 0; i < WORKER_COUNT && i < fileChunks.length; i++) {
        const chunks = fileChunks.filter((_, index) => index % WORKER_COUNT === i);
        if (chunks.length > 0) {
            // 将多个块合并为一个数组传递给工作线程
            const allFiles = chunks.flat();
            promises.push(createWorkerPromise(allFiles, i + 1));
        }
    }

    // 等待所有工作线程完成
    const results = await Promise.all(promises);
    return results.flat();
}

/**
 * 工作线程处理逻辑
 */
async function workerMain() {
    const { workerData } = await import('worker_threads');
    const { files, workerId, mediaDir, cacheDir, videoCacheDir, THUMBNAIL_CONFIG_IMAGE, THUMBNAIL_CONFIG_VIDEO, THUMBNAIL_CONFIG } = workerData;

    // 导入必要的模块
    const fs = await import('fs');
    const path = await import('path');
    const sharp = await import('sharp');
    const { createHash } = await import('crypto');
    const ffmpeg = await import('fluent-ffmpeg');
    const heicConvert = await import('heic-convert');
    const { parentPort } = await import('worker_threads');

    // 工作线程统计
    const workerStats = {
        generated: 0,
        cached: 0,
        errors: 0
    };

    // 工作线程版本的heic2Jpeg函数
    async function heic2JpegWorker(fullPath, buffer) {
        const fp = fullPath.toLowerCase();
        if (fp.endsWith('.heic') || fp.endsWith('.heif')) {
            return await heicConvert.default({
                buffer,
                format: 'JPEG',
                quality: 1
            });
        }
        return buffer;
    }

    // 工作线程版本的md5函数
    function md5Worker(str) {
        return createHash('md5').update(str, 'utf8').digest('hex');
    }

    // 工作线程版本的generateCacheFilePath函数
    async function generateCacheFilePathWorker(fullPath, config, cacheDir) {
        const fileStat = fs.default.statSync(fullPath);
        const cacheKey = md5Worker(`${fullPath}_${fileStat.mtimeMs}_${config.width}x${config.height}`);
        const filename = `${cacheKey}.${config.format}`;
        return path.default.join(cacheDir, filename);
    }

    // 工作线程版本的generateVideoThumbnail函数
    async function generateVideoThumbnailWorker(videoPath, outputPath, config) {
        return new Promise((resolve, reject) => {
            ffmpeg.default(videoPath)
                .frames(1)
                .size(`${config.width}x${config.height}`)
                .on('end', resolve)
                .on('error', (err) => reject(new Error(`FFmpeg processing failed: ${err.message}`)))
                .save(outputPath);
        });
    }

    // 工作线程版本的generateThumbnail函数
    async function generateThumbnailWorker(imageFile) {
        try {
            const { fullPath, relativePath, type } = imageFile;

            if (type === 'image') {
                if (!fs.default.existsSync(cacheDir)) {
                    fs.default.mkdirSync(cacheDir, { recursive: true });
                }

                const cacheFilePath = await generateCacheFilePathWorker(fullPath, THUMBNAIL_CONFIG_IMAGE, cacheDir);

                if (fs.default.existsSync(cacheFilePath)) {
                    workerStats.cached++;
                    return { success: true, cached: true, path: relativePath };
                }

                let imageBuffer = fs.default.readFileSync(fullPath);
                imageBuffer = await heic2JpegWorker(fullPath, imageBuffer);
                const thumbnailBuffer = await sharp.default(imageBuffer)
                    .rotate()
                    .resize(THUMBNAIL_CONFIG_IMAGE.width, THUMBNAIL_CONFIG_IMAGE.height, {
                        fit: 'cover',
                        position: 'center'
                    })
                    .jpeg({ quality: THUMBNAIL_CONFIG.quality })
                    .toBuffer();

                fs.default.writeFileSync(cacheFilePath, thumbnailBuffer);
            } else if (type === 'video') {
                if (!fs.default.existsSync(videoCacheDir)) {
                    fs.default.mkdirSync(videoCacheDir, { recursive: true });
                }

                const cacheFilePath = await generateCacheFilePathWorker(fullPath, THUMBNAIL_CONFIG_VIDEO, videoCacheDir);

                if (fs.default.existsSync(cacheFilePath)) {
                    workerStats.cached++;
                    return { success: true, cached: true, path: relativePath };
                }

                await generateVideoThumbnailWorker(fullPath, cacheFilePath, THUMBNAIL_CONFIG_VIDEO);
            }

            workerStats.generated++;
            return { success: true, cached: false, path: relativePath };

        } catch (error) {
            workerStats.errors++;
            return {
                success: false,
                error: error.message,
                path: imageFile.relativePath
            };
        }
    }

    // 处理分配给这个工作线程的文件
    const results = [];
    for (const file of files) {
        const result = await generateThumbnailWorker(file);
        results.push(result);

        // 定期报告进度
        if (results.length % 5 === 0) {
            parentPort.postMessage({
                type: 'progress',
                workerId,
                processed: results.length,
                total: files.length,
                generated: workerStats.generated,
                cached: workerStats.cached,
                errors: workerStats.errors
            });
        }
    }

    // 发送最终结果
    parentPort.postMessage({
        type: 'complete',
        workerId,
        results,
        stats: workerStats
    });
}


/**
 * 主函数
 */
async function main() {
    if (!process.cwd().endsWith(projectName)) {
        console.log('请在项目根目录下运行本文件')
        return;
    }
    setFfmpegPath();

    console.log('🚀 开始批量生成缩略图...\n');
    console.log(`📁 媒体目录: ${MEDIA_ROOT_PATH}`);
    console.log(`🧠 CPU 信息: ${numCPUs} 核心，使用 ${WORKER_COUNT} 个工作线程\n`);

    if (!fs.existsSync(mediaDir)) {
        console.error(`❌ 错误: ${mediaDir} 目录不存在`);
        process.exit(1);
    }

    // 获取所有图片文件
    console.log('📁 扫描图片文件...');
    const imageFiles = getAllImageFiles(mediaDir);
    stats.total = imageFiles.length;

    if (stats.total === 0) {
        console.log('ℹ️  没有找到图片文件');
        return;
    }

    console.log(`📊 找到 ${stats.total} 个图片文件\n`);

    // 根据文件数量决定是否使用多线程
    let results;
    if (stats.total > CHUNK_SIZE && WORKER_COUNT > 1) {
        // 使用多线程处理
        console.log(`💻 启用多线程处理（${WORKER_COUNT} 个工作线程）...\n`);

        let processed = 0;
        const progressInterval = setInterval(() => {
            showProgress(processed, stats.total);
        }, 500);

        try {
            results = await processWithMultiThread(imageFiles);
            processed = stats.total;
        } finally {
            clearInterval(progressInterval);
            showProgress(stats.total, stats.total);
        }
    } else {
        // 使用单线程处理
        console.log(`🔧 使用单线程处理...\n`);
        results = [];
        let processed = 0;

        for (const imageFile of imageFiles) {
            showProgress(processed, stats.total);
            const result = await generateThumbnail(imageFile);
            results.push(result);

            if (!result.success) {
                console.log(`\n❌ 处理失败: ${result.path} - ${result.error}`);
            }

            processed++;
        }
    }

    // 完成统计
    showProgress(stats.total, stats.total);
    console.log('\n');

    const duration = Date.now() - stats.startTime;

    // 显示完成统计
    console.log('✅ 批量生成完成!\n');
    console.log('统计信息:');
    console.log(`   总文件数: ${stats.total}`);
    console.log(`   新生成: ${stats.generated}`);
    console.log(`   已缓存: ${stats.cached}`);
    console.log(`   处理失败: ${stats.errors}`);
    console.log(`   用时: ${formatDuration(duration)}`);
    console.log(`   平均速度: ${(stats.total / (duration / 1000)).toFixed(2)} 文件/秒`);

    if (stats.errors > 0) {
        console.log('\n⚠️  部分文件处理失败，请检查上方的错误信息');
    }
}

// 检查是否为工作线程
if (process.env.IS_WORKER === '1') {
    workerMain().catch(console.error);
} else {
    // 主线程逻辑
    console.log('mediaDir', mediaDir);
    console.log('cacheDir', cacheDir);
    console.log('videoCacheDir', videoCacheDir);
    console.log('1 秒后开始运行...');
    setTimeout(main, 1000);
}
