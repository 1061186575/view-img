import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { MEDIA_CONFIG } from "@/lib/config";

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const filePath = searchParams.get('path');

        if (!filePath) {
            return NextResponse.json({
                error: '缺少文件路径参数'
            }, { status: 400 });
        }

        // 构建完整路径，确保安全性
        const mediaRootPath = MEDIA_CONFIG.ROOT_PATH;
        const basePath = path.isAbsolute(mediaRootPath)
            ? mediaRootPath
            : path.join(process.cwd(), mediaRootPath);
        const fullPath = path.join(basePath, filePath);

        // 安全检查：确保路径在media目录内
        if (!fullPath.startsWith(basePath)) {
            return NextResponse.json({
                error: '访问路径不合法'
            }, { status: 400 });
        }

        // 检查文件是否存在
        try {
            await fs.access(fullPath);
        } catch (error) {
            return NextResponse.json({
                error: '请求的文件未找到'
            }, { status: 404 });
        }

        // 检查是否为文件而非目录
        const stats = await fs.stat(fullPath);
        if (!stats.isFile()) {
            return NextResponse.json({
                error: '请求的不是一个文件'
            }, { status: 400 });
        }

        // 读取文件
        const fileBuffer = await fs.readFile(fullPath);

        // 获取文件扩展名来确定MIME类型
        const ext = path.extname(filePath).toLowerCase();
        let mimeType = 'application/octet-stream'; // 默认MIME类型

        // 根据文件扩展名设置MIME类型
        const mimeTypes = {
            // 图片
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.webp': 'image/webp',
            '.svg': 'image/svg+xml',
            '.bmp': 'image/bmp',
            // 视频
            '.mp4': 'video/mp4',
            '.webm': 'video/webm',
            '.avi': 'video/x-msvideo',
            '.mov': 'video/quicktime',
            '.wmv': 'video/x-ms-wmv',
            '.flv': 'video/x-flv',
            '.mkv': 'video/x-matroska',
            // 音频
            '.mp3': 'audio/mpeg',
            '.wav': 'audio/wav',
        };

        if (mimeTypes[ext]) {
            mimeType = mimeTypes[ext];
        }

        return new NextResponse(fileBuffer, {
            headers: {
                'Content-Type': mimeType,
                'Cache-Control': 'public, max-age=604800', // 缓存7天
                'Content-Length': fileBuffer.length.toString(),
            },
        });

    } catch (error) {
        console.error('Error serving file:', error);
        return NextResponse.json({
            error: '读取文件时发生错误，请稍后重试'
        }, { status: 500 });
    }
}
