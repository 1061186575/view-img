import sharp from 'sharp';
import {
    validateMediaPath,
    ensureCacheDir,
    generateCacheFilePath,
    getCachedResponse,
    createMediaResponse,
    getContentType,
    createErrorResponse,
    saveCacheFile,
    readFileBuffer,
    shouldUseStream,
    createStreamMediaResponse,
    DEFAULT_THUMBNAIL_CONFIG
} from '@/lib/thumbnail-utils';

// 图片缩略图配置
const THUMBNAIL_CONFIG = DEFAULT_THUMBNAIL_CONFIG.IMAGE;

// 支持缩略图, 前端+后端缓存
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const imagePath = searchParams.get('path');
        const thumbnail = searchParams.get('thumbnail') === 'true';

        // 验证路径
        const pathValidation = await validateMediaPath(imagePath);
        if (!pathValidation.isValid) {
            return createErrorResponse(pathValidation.error, 400);
        }

        const { fullPath } = pathValidation;

        // 如果不是要缩略图，直接返回原图
        if (!thumbnail) {
            return await responseImage(fullPath);
        }

        // 生成缩略图
        try {
            // 检查缓存目录
            const cacheDir = await ensureCacheDir('thumbnails');

            // 生成缓存文件名
            const cacheFilePath = await generateCacheFilePath(imagePath, fullPath, THUMBNAIL_CONFIG, cacheDir);

            // 检查缓存是否存在
            const cachedResponse = await getCachedResponse(cacheFilePath, `image/${THUMBNAIL_CONFIG.format}`);
            if (cachedResponse) {
                return cachedResponse;
            }

            // 生成缩略图
            const imageBuffer = await readFileBuffer(fullPath);
            const thumbnailBuffer = await sharp(imageBuffer)
                .rotate() // 自动根据 EXIF 方向信息旋转图片
                .resize(THUMBNAIL_CONFIG.width, THUMBNAIL_CONFIG.height, {
                    fit: 'cover',
                    position: 'center'
                })
                .jpeg({ quality: THUMBNAIL_CONFIG.quality })
                .toBuffer();

            await saveCacheFile(cacheFilePath, thumbnailBuffer);

            return createMediaResponse(thumbnailBuffer, `image/${THUMBNAIL_CONFIG.format}`);

        } catch (sharpError) {
            console.error('Sharp error, falling back to original image:', sharpError);
            return await responseImage(fullPath);
        }

    } catch (error) {
        console.error('Error serving image:', error);
        return createErrorResponse('服务器错误');
    }
}

async function responseImage(fullPath) {
    const contentType = getContentType(fullPath);

    // 检查文件大小，决定是否使用流式处理
    const { useStream } = await shouldUseStream(fullPath);

    if (useStream) {
        // 大文件使用流式传输
        return await createStreamMediaResponse(fullPath, contentType);
    } else {
        // 小文件直接读取到内存
        const imageBuffer = await readFileBuffer(fullPath);
        return createMediaResponse(imageBuffer, contentType);
    }
}
