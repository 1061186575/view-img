import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';

// 视频缩略图配置
const THUMBNAIL_CONFIG = {
    width: 300,
    height: 240,
    quality: 80,
    format: 'jpeg'
};

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const videoPath = searchParams.get('path');

        if (!videoPath) {
            return NextResponse.json({
                error: '缺少视频路径参数'
            }, { status: 400 });
        }

        // 构建完整的视频文件路径
        const mediaBasePath = path.join(process.cwd(), 'public', 'media');
        const fullVideoPath = path.join(mediaBasePath, videoPath);

        // 安全检查：确保路径在media目录内
        if (!fullVideoPath.startsWith(mediaBasePath)) {
            return NextResponse.json({
                error: '访问路径不合法'
            }, { status: 400 });
        }

        // 检查视频文件是否存在
        if (!fs.existsSync(fullVideoPath)) {
            return NextResponse.json({
                error: '视频文件不存在'
            }, { status: 404 });
        }

        // 检查缓存目录
        const cacheDir = path.join(process.cwd(), '.next', 'cache', 'video-thumbnails');
        if (!fs.existsSync(cacheDir)) {
            fs.mkdirSync(cacheDir, { recursive: true });
        }

        // 生成缓存文件名
        const videoStat = fs.statSync(fullVideoPath);
        const cacheKey = `${videoPath}_${videoStat.mtime.getTime()}_${THUMBNAIL_CONFIG.width}x${THUMBNAIL_CONFIG.height}`;
        const base64 = Buffer.from(cacheKey).toString('base64');
        const cacheFilePath = path.join(cacheDir, `${base64.replaceAll('/', '_')}.${THUMBNAIL_CONFIG.format}`);

        // 检查缓存是否存在
        if (fs.existsSync(cacheFilePath)) {
            const cachedBuffer = fs.readFileSync(cacheFilePath);
            return new NextResponse(cachedBuffer, {
                headers: {
                    'Content-Type': `image/${THUMBNAIL_CONFIG.format}`,
                    'Cache-Control': 'public, max-age=31536000', // 1年缓存
                }
            });
        }

        // 生成缩略图
        return new Promise((resolve) => {
            ffmpeg(fullVideoPath)
                .seekInput('00:00:01') // 第1秒
                .frames(1) // 只取一帧
                .size(`${THUMBNAIL_CONFIG.width}x${THUMBNAIL_CONFIG.height}`) // 指定尺寸
                .format(THUMBNAIL_CONFIG.format)
                .on('end', () => {
                    try {
                        // 读取生成的缩略图文件
                        const thumbnailBuffer = fs.readFileSync(cacheFilePath);
                        resolve(new NextResponse(thumbnailBuffer, {
                            headers: {
                                'Content-Type': `image/${THUMBNAIL_CONFIG.format}`,
                                'Cache-Control': 'public, max-age=31536000', // 1年缓存
                            }
                        }));
                    } catch (readError) {
                        console.error('Error reading thumbnail file:', readError);
                        resolve(NextResponse.json({
                            error: '读取缩略图文件失败'
                        }, { status: 500 }));
                    }
                })
                .on('error', (err) => {
                    console.error('FFmpeg error:', err);
                    resolve(NextResponse.json({
                        error: '生成缩略图失败: ' + err.message
                    }, { status: 500 }));
                })
                .save(cacheFilePath);
        });

    } catch (error) {
        console.error('Error generating video thumbnail:', error);
        return NextResponse.json({
            error: '生成缩略图时发生错误: ' + error.message
        }, { status: 500 });
    }
}
