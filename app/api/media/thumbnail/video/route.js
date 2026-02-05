import ffmpeg from 'fluent-ffmpeg';
import {
    validateMediaPath,
    ensureCacheDir,
    generateCacheFilePath,
    getCachedResponse,
    createMediaResponse,
    createErrorResponse,
    readFileBuffer,
    shouldUseStream,
    createStreamMediaResponse,
    getContentType,
    DEFAULT_THUMBNAIL_CONFIG
} from '@/lib/thumbnail-utils';

// 视频缩略图配置
const THUMBNAIL_CONFIG = DEFAULT_THUMBNAIL_CONFIG.VIDEO;
let notFfmpeg = false;

export async function GET(request) {
    if (notFfmpeg) {
        return createErrorResponse('请安装 FFmpeg 并将其添加到环境变量中。');
    }
    try {
        const { searchParams } = new URL(request.url);
        const videoPath = searchParams.get('path');
        const thumbnail = searchParams.get('thumbnail') === 'true';

        // 验证路径
        const pathValidation = await validateMediaPath(videoPath);
        if (!pathValidation.isValid) {
            return createErrorResponse(pathValidation.error, 400);
        }

        const { fullPath: fullVideoPath } = pathValidation;

        // 如果不是要缩略图，直接返回
        if (!thumbnail) {
            return await responseVideo(fullVideoPath);
        }

        // 检查缓存目录
        const cacheDir = await ensureCacheDir('video-thumbnails');

        // 生成缓存文件名
        const cacheFilePath = await generateCacheFilePath(videoPath, fullVideoPath, THUMBNAIL_CONFIG, cacheDir);

        // 检查缓存是否存在
        const cachedResponse = await getCachedResponse(cacheFilePath, `image/${THUMBNAIL_CONFIG.format}`);
        if (cachedResponse) {
            return cachedResponse;
        }

        // 生成缩略图
        try {
            await generateVideoThumbnail(fullVideoPath, cacheFilePath, THUMBNAIL_CONFIG);

            // 读取生成的缩略图文件
            const thumbnailBuffer = await readFileBuffer(cacheFilePath);
            return createMediaResponse(thumbnailBuffer, `image/${THUMBNAIL_CONFIG.format}`);

        } catch (ffmpegError) {
            if (ffmpegError.message.includes('Cannot find ffmpeg')) {
                notFfmpeg = true;
            } else {
                console.error('Error generating video thumbnail:', ffmpegError);
            }
            return createErrorResponse('生成视频缩略图失败: ' + ffmpegError.message);
        }

    } catch (error) {
        console.error('Error generating video thumbnail:', error);
        return createErrorResponse('生成缩略图时发生错误: ' + error.message);
    }
}

async function responseVideo(fullPath) {
    const contentType = getContentType(fullPath);

    // 检查文件大小，决定是否使用流式处理
    const { useStream } = await shouldUseStream(fullPath);

    if (useStream) {
        // 大文件使用流式传输
        return await createStreamMediaResponse(fullPath, contentType);
    } else {
        // 小文件直接读取到内存
        const videoBuffer = await readFileBuffer(fullPath);
        return createMediaResponse(videoBuffer, contentType);
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
