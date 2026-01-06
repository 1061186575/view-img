import fs from 'fs';
import ffmpeg from 'fluent-ffmpeg';
import {
    validateMediaPath,
    ensureCacheDir,
    generateCacheFilePath,
    getCachedResponse,
    createMediaResponse,
    createErrorResponse,
    DEFAULT_THUMBNAIL_CONFIG
} from '@/lib/thumbnail-utils';

// 视频缩略图配置
const THUMBNAIL_CONFIG = DEFAULT_THUMBNAIL_CONFIG.VIDEO;

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const videoPath = searchParams.get('path');

        // 验证路径
        const pathValidation = validateMediaPath(videoPath);
        if (!pathValidation.isValid) {
            return createErrorResponse(pathValidation.error, 400);
        }

        const { fullPath: fullVideoPath } = pathValidation;

        // 检查缓存目录
        const cacheDir = ensureCacheDir('video-thumbnails');

        // 生成缓存文件名
        const cacheFilePath = generateCacheFilePath(videoPath, fullVideoPath, THUMBNAIL_CONFIG, cacheDir);

        // 检查缓存是否存在
        const cachedResponse = getCachedResponse(cacheFilePath, `image/${THUMBNAIL_CONFIG.format}`);
        if (cachedResponse) {
            return cachedResponse;
        }

        // 生成缩略图
        return new Promise((resolve) => {
            ffmpeg(fullVideoPath)
                .frames(1) // 只取一帧
                .size(`${THUMBNAIL_CONFIG.width}x${THUMBNAIL_CONFIG.height}`) // 指定尺寸
                .on('end', () => {
                    try {
                        // 读取生成的缩略图文件
                        const thumbnailBuffer = fs.readFileSync(cacheFilePath);
                        resolve(createMediaResponse(thumbnailBuffer, `image/${THUMBNAIL_CONFIG.format}`));
                    } catch (readError) {
                        console.error('Error reading thumbnail file:', readError);
                        resolve(createErrorResponse('读取缩略图文件失败'));
                    }
                })
                .on('error', (err) => {
                    console.error('FFmpeg error:', err);
                    resolve(createErrorResponse('生成缩略图失败: ' + err.message));
                })
                .save(cacheFilePath);
        });

    } catch (error) {
        console.error('Error generating video thumbnail:', error);
        return createErrorResponse('生成缩略图时发生错误: ' + error.message);
    }
}
