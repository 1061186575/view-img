import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

// 缩略图配置
const THUMBNAIL_CONFIG = {
    width: 300,
    height: 300,
    quality: 80,
    format: 'jpeg'
};

// 支持缩略图, 前端+后端缓存
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const imagePath = searchParams.get('path');
        const thumbnail = searchParams.get('thumbnail') === 'true';

        if (!imagePath) {
            return NextResponse.json({
                error: '缺少图片路径参数'
            }, { status: 400 });
        }

        // 构建完整路径，确保安全性
        const mediaPath = 'media';
        const basePath = path.join(process.cwd(), 'public', mediaPath);
        const fullPath = path.join(basePath, imagePath);

        // 安全检查：确保路径在media目录内
        if (!fullPath.startsWith(basePath)) {
            return NextResponse.json({
                error: '访问路径不合法'
            }, { status: 400 });
        }

        // 检查文件是否存在
        if (!fs.existsSync(fullPath)) {
            return NextResponse.json({
                error: '图片文件未找到'
            }, { status: 404 });
        }

        // 如果不是要缩略图，直接返回原图
        if (!thumbnail) {
            return responseImage(fullPath);
        }

        // 生成缩略图
        try {
            // 检查缓存目录
            const cacheDir = path.join(process.cwd(), '.next', 'cache', 'thumbnails');
            if (!fs.existsSync(cacheDir)) {
                fs.mkdirSync(cacheDir, { recursive: true });
            }

            // 生成缓存文件名
            const imageStat = fs.statSync(fullPath);
            const cacheKey = `${imagePath}_${imageStat.mtime.getTime()}_${THUMBNAIL_CONFIG.width}x${THUMBNAIL_CONFIG.height}`;
            const base64 = Buffer.from(cacheKey).toString('base64');
            const cacheFilePath = path.join(cacheDir, `${base64.replaceAll('/', '_')}.${THUMBNAIL_CONFIG.format}`);

            // 检查缓存是否存在
            if (fs.existsSync(cacheFilePath)) {
                const cachedBuffer = fs.readFileSync(cacheFilePath);
                return new NextResponse(cachedBuffer, {
                    headers: {
                        'Content-Type': `image/${THUMBNAIL_CONFIG.format}`,
                        'Cache-Control': 'public, max-age=31536000',
                    }
                });
            }

            // 生成缩略图
            const imageBuffer = fs.readFileSync(fullPath);
            const thumbnailBuffer = await sharp(imageBuffer)
                .rotate() // 自动根据 EXIF 方向信息旋转图片
                .resize(THUMBNAIL_CONFIG.width, THUMBNAIL_CONFIG.height, {
                    fit: 'cover',
                    position: 'center'
                })
                .jpeg({ quality: THUMBNAIL_CONFIG.quality })
                .toBuffer();

            fs.writeFileSync(cacheFilePath, thumbnailBuffer);

            return new NextResponse(thumbnailBuffer, {
                headers: {
                    'Content-Type': `image/${THUMBNAIL_CONFIG.format}`,
                    'Cache-Control': 'public, max-age=31536000', // 1年缓存
                }
            });

        } catch (sharpError) {
            console.error('Sharp error, falling back to original image:', sharpError);
            return responseImage(fullPath);
        }

    } catch (error) {
        console.error('Error serving image:', error);
        return NextResponse.json({
            error: '服务器错误'
        }, { status: 500 });
    }
}

function responseImage(fullPath) {
    const imageBuffer = fs.readFileSync(fullPath);
    const ext = path.extname(fullPath).toLowerCase();

    let contentType = 'image/jpeg';
    switch (ext) {
        case '.png': contentType = 'image/png'; break;
        case '.gif': contentType = 'image/gif'; break;
        case '.webp': contentType = 'image/webp'; break;
        case '.svg': contentType = 'image/svg+xml'; break;
        case '.bmp': contentType = 'image/bmp'; break;
        default: contentType = 'image/jpeg';
    }

    return new NextResponse(imageBuffer, {
        headers: {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=31536000',
        }
    });
}
