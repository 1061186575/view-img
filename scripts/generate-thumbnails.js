#!/usr/bin/env node

/**
 * 批量生成缩略图脚本
 * 遍历 public/media 目录下的所有图片，预先生成缩略图
 */

import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import {createHash} from 'crypto';
import ffmpeg from 'fluent-ffmpeg';
import {THUMBNAIL_CONFIG} from "../lib/config.js";
import {SUPPORTED_IMAGE_EXTENSIONS, SUPPORTED_VIDEO_EXTENSIONS} from "../app/media/const.js";

const projectName = 'view-img'

// 设置 mediaDir 目录
const mediaRootPath = process.env.MEDIA_ROOT_PATH || 'public/media'
const mediaDir = path.isAbsolute(mediaRootPath) ? path.join(mediaRootPath) : path.join(process.cwd(), mediaRootPath);
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

            // 生成图片缩略图
            const imageBuffer = fs.readFileSync(fullPath);
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
 * 主函数
 */
async function main() {
    if (!process.cwd().endsWith(projectName)) {
        console.log('请在项目根目录下运行本文件')
        return;
    }
    setFfmpegPath();

    console.log('🚀 开始批量生成缩略图...\n');

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

    // 批量生成缩略图
    let processed = 0;

    for (const imageFile of imageFiles) {
        showProgress(processed, stats.total);

        const result = await generateThumbnail(imageFile);

        if (!result.success) {
            console.log(`\n❌ 处理失败: ${result.path} - ${result.error}`);
        }

        processed++;
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

    if (stats.errors > 0) {
        console.log('\n⚠️  部分文件处理失败，请检查上方的错误信息');
    }
}

console.log('mediaDir', mediaDir)
console.log('cacheDir', cacheDir)
console.log('videoCacheDir', videoCacheDir)
console.log('3 秒后开始运行...')
setTimeout(main, 3000)
