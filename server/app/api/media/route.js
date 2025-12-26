import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// 支持的图片和视频文件扩展名
const SUPPORTED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'];
const SUPPORTED_VIDEO_EXTENSIONS = ['.mp4', '.webm', '.ogg', '.avi', '.mov', '.wmv', '.flv', '.mkv'];

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const folder = searchParams.get('folder') || '';

        // 构建完整路径，确保安全性
        const basePath = path.join(process.cwd(), 'public', 'media');
        const fullPath = path.join(basePath, folder);

        // 安全检查：确保路径在media目录内
        if (!fullPath.startsWith(basePath)) {
            return NextResponse.json({
                error: '访问路径不合法'
            }, { status: 400 });
        }

        // 检查目录是否存在
        if (!fs.existsSync(fullPath)) {
            return NextResponse.json({
                error: '请求的目录未找到'
            }, { status: 404 });
        }

        // 读取目录内容
        const items = fs.readdirSync(fullPath);
        const result = [];

        for (const item of items) {
            const itemPath = path.join(fullPath, item);
            const stats = fs.statSync(itemPath);

            if (stats.isDirectory()) {
                // 添加文件夹
                result.push({
                    name: item,
                    type: 'folder',
                    path: folder ? `${folder}/${item}` : item
                });
            } else if (stats.isFile()) {
                const ext = path.extname(item).toLowerCase();

                if (SUPPORTED_IMAGE_EXTENSIONS.includes(ext)) {
                    // 添加图片
                    result.push({
                        name: item,
                        type: 'image',
                        path: folder ? `${folder}/${item}` : item,
                        url: `/media/${folder ? `${folder}/` : ''}${item}`,
                        size: stats.size
                    });
                } else if (SUPPORTED_VIDEO_EXTENSIONS.includes(ext)) {
                    // 添加视频
                    result.push({
                        name: item,
                        type: 'video',
                        path: folder ? `${folder}/${item}` : item,
                        url: `/media/${folder ? `${folder}/` : ''}${item}`,
                        size: stats.size
                    });
                }
                // 忽略其他文件类型
            }
        }

        // 排序：文件夹在前，然后按名称排序
        result.sort((a, b) => {
            if (a.type === 'folder' && b.type !== 'folder') return -1;
            if (a.type !== 'folder' && b.type === 'folder') return 1;
            return a.name.localeCompare(b.name);
        });

        return NextResponse.json({
            currentPath: folder,
            items: result
        });

    } catch (error) {
        console.error('Error reading directory:', error);
        return NextResponse.json({
            error: '读取目录时发生错误，请稍后重试'
        }, { status: 500 });
    }
}
