import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import { createHash } from 'crypto';
import path from 'path';
import heicConvert from 'heic-convert';
import { MEDIA_CONFIG, THUMBNAIL_CONFIG } from '@/lib/config';

/**
 * 验证媒体文件路径的安全性
 * @param {string} mediaPath - 媒体文件路径
 * @returns {Promise<{isValid: boolean, fullPath?: string, basePath?: string, error?: string}>}
 */
export async function validateMediaPath(mediaPath) {
    if (!mediaPath) {
        return {
            isValid: false,
            error: '缺少文件路径参数'
        };
    }

    // 构建完整路径，确保安全性
    const mediaRootPath = MEDIA_CONFIG.ROOT_PATH;
    const basePath = path.isAbsolute(mediaRootPath)
        ? path.join(mediaRootPath)
        : path.join(process.cwd(), mediaRootPath);
    const fullPath = path.join(basePath, mediaPath);

    // 安全检查：确保路径在media目录内
    if (!fullPath.startsWith(basePath)) {
        return {
            isValid: false,
            error: '访问路径不合法'
        };
    }

    // 检查文件是否存在（异步）
    try {
        await fs.access(fullPath);
    } catch (error) {
        return {
            isValid: false,
            error: '文件未找到'
        };
    }

    return {
        isValid: true,
        fullPath,
        basePath
    };
}

/**
 * 确保缓存目录存在
 * @param {string} cacheType - 缓存类型 ('thumbnails' | 'video-thumbnails')
 * @returns {Promise<string>} 缓存目录路径
 */
export async function ensureCacheDir(cacheType = 'thumbnails') {
    const cacheDir = path.join(process.cwd(), '.next', 'cache', cacheType);
    try {
        await fs.access(cacheDir);
    } catch (error) {
        await fs.mkdir(cacheDir, { recursive: true });
    }
    return cacheDir;
}

export function md5(str) {
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
    const fileStat = await fs.stat(fullPath);
    const cacheKey = md5(`${fullPath}_${fileStat.mtimeMs}_${config.width}x${config.height}`)
    const filename = `${cacheKey}.${config.format}`;
    return path.join(cacheDir, filename);
}

/**
 * 检查缓存文件是否存在，存在则返回响应
 * @param {string} cacheFilePath - 缓存文件路径
 * @param {string} contentType - 内容类型
 * @returns {Promise<NextResponse|null>} 缓存响应或null
 */
export async function getCachedResponse(cacheFilePath, contentType) {
    try {
        await fs.access(cacheFilePath);
        const cachedBuffer = await fs.readFile(cacheFilePath);
        return new NextResponse(cachedBuffer, {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=31536000',
            }
        });
    } catch (error) {
        return null;
    }
}

/**
 * 创建媒体文件响应
 * @param {Buffer} buffer - 文件缓冲区
 * @param {string} contentType - 内容类型
 * @returns {NextResponse} 响应对象
 */
export function createMediaResponse(buffer, contentType) {
    return new NextResponse(buffer, {
        headers: {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=31536000',
        }
    });
}

/**
 * 保存缓冲区到缓存文件
 * @param {string} cacheFilePath - 缓存文件路径
 * @param {Buffer} buffer - 文件缓冲区
 * @returns {Promise<void>}
 */
export async function saveCacheFile(cacheFilePath, buffer) {
    await fs.writeFile(cacheFilePath, buffer);
}

/**
 * 读取文件缓冲区
 * @param {string} filePath - 文件路径
 * @returns {Promise<Buffer>} 文件缓冲区
 */
export async function readFileBuffer(filePath) {
    return await fs.readFile(filePath);
}

/**
 * 检查文件大小，决定是否使用流式处理
 * @param {string} filePath - 文件路径
 * @returns {Promise<{useStream: boolean, size: number}>} 是否使用流和文件大小
 */
export async function shouldUseStream(filePath) {
    const stats = await fs.stat(filePath);
    const size = stats.size;
    // 超过 30MB 的文件使用流式处理
    const STREAM_THRESHOLD = 30 * 1024 * 1024;
    return {
        useStream: size > STREAM_THRESHOLD,
        size
    };
}

/**
 * 根据文件扩展名获取内容类型
 * @param {string} filePath - 文件路径
 * @returns {string} 内容类型
 */
export function getContentType(filePath) {
    const ext = path.extname(filePath).toLowerCase();

    const mimeTypes = {
        // 图片
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
        '.svg': 'image/svg+xml',
        '.bmp': 'image/bmp',
        // '.heic': 'image/heic',
        '.heic': 'image/jpeg',
        // 视频
        '.mp4': 'video/mp4',
        '.webm': 'video/webm',
        '.avi': 'video/x-msvideo',
        // '.mov': 'video/quicktime', // video/quicktime 在新标签打开会默认下载而不是播放
        '.mov': 'video/mp4',
        '.wmv': 'video/x-ms-wmv',
        '.flv': 'video/x-flv',
        '.mkv': 'video/x-matroska',
        // 音频
        '.mp3': 'audio/mpeg',
        '.wav': 'audio/wav',
        '.ogg': 'audio/ogg',
        '.m4a': 'audio/m4a',
    };
    return mimeTypes[ext] || 'application/octet-stream';
}

/**
 * 创建错误响应
 * @param {string} message - 错误消息
 * @param {number} status - HTTP状态码
 * @returns {NextResponse} 错误响应
 */
export function createErrorResponse(message, status = 500) {
    return NextResponse.json({ error: message }, { status });
}

/**
 * 缩略图配置常量
 */
export const DEFAULT_THUMBNAIL_CONFIG = THUMBNAIL_CONFIG;

export async function heic2Jpeg(fullPath, buffer) {
    // TODO 后续改为 Promise + Worker Threads
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
