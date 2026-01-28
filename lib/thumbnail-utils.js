import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { MEDIA_CONFIG } from '@/lib/config';

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
        ? mediaRootPath
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

/**
 * 生成缓存文件路径
 * @param {string} mediaPath - 媒体文件路径
 * @param {string} fullPath - 完整文件路径
 * @param {object} config - 缩略图配置
 * @param {string} cacheDir - 缓存目录
 * @returns {Promise<string>} 缓存文件路径
 */
export async function generateCacheFilePath(mediaPath, fullPath, config, cacheDir) {
    const fileStat = await fs.stat(fullPath);
    const cacheKey = `${mediaPath}_${fileStat.mtime.getTime()}_${config.width}x${config.height}`;
    const base64 = Buffer.from(cacheKey).toString('base64');
    return path.join(cacheDir, `${base64.replaceAll('/', '_')}.${config.format}`);
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
 * 根据文件扩展名获取内容类型
 * @param {string} filePath - 文件路径
 * @returns {string} 内容类型
 */
export function getContentType(filePath) {
    const ext = path.extname(filePath).toLowerCase();

    switch (ext) {
        case '.png': return 'image/png';
        case '.gif': return 'image/gif';
        case '.webp': return 'image/webp';
        case '.svg': return 'image/svg+xml';
        case '.bmp': return 'image/bmp';
        case '.jpg':
        case '.jpeg':
        default: return 'image/jpeg';
    }
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
export const DEFAULT_THUMBNAIL_CONFIG = {
    IMAGE: {
        width: 300,
        height: 300,
        quality: 80,
        format: 'jpeg'
    },
    VIDEO: {
        width: 300,
        height: 240,
        quality: 80,
        format: 'jpg'
    }
};
