import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// 支持的图片和视频文件扩展名
const SUPPORTED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'];
const SUPPORTED_VIDEO_EXTENSIONS = ['.mp4', '.webm', '.ogg', '.avi', '.mov', '.wmv', '.flv', '.mkv'];
const SUPPORTED_AUDIO_EXTENSIONS = ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.m4a', '.wma', '.opus'];

export async function GET(request) {
    try {
        const mediaPath = 'media';
        const { searchParams } = new URL(request.url);
        const folder = searchParams.get('folder') || '';

        // 构建完整路径，确保安全性
        const basePath = path.join(process.cwd(), 'public', mediaPath);
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
                    path: folder ? `${folder}/${item}` : item,
                    mtime: stats.mtime.getTime(), // 修改时间
                    birthtime: stats.birthtime.getTime() // 创建时间
                });
            } else if (stats.isFile()) {
                const ext = path.extname(item).toLowerCase();

                const baseInfo = {
                    name: item,
                    path: folder ? `${folder}/${item}` : item,
                    url: `/${mediaPath}/${folder ? `${folder}/` : ''}${item}`,
                    size: stats.size,
                    mtime: stats.mtime.getTime(), // 修改时间
                    birthtime: stats.birthtime.getTime() // 创建时间
                }

                if (SUPPORTED_IMAGE_EXTENSIONS.includes(ext)) {
                    // 添加图片
                    result.push({
                        type: 'image',
                        ...baseInfo,
                    });
                } else if (SUPPORTED_VIDEO_EXTENSIONS.includes(ext)) {
                    // 添加视频
                    result.push({
                        type: 'video',
                        ...baseInfo,
                    });
                } else if (SUPPORTED_AUDIO_EXTENSIONS.includes(ext)) {
                    // 添加音频
                    result.push({
                        type: 'audio',
                        ...baseInfo,
                    });
                }
                // 忽略其他文件类型
            }
        }

        // 排序：文件夹优先，然后按更新时间优先，最后按创建时间优先
        result.sort((a, b) => {
            // 1. 文件夹优先
            if (a.type === 'folder' && b.type !== 'folder') return -1;
            if (a.type !== 'folder' && b.type === 'folder') return 1;

            // 2. 按更新时间排序（新的在前）
            const mtimeDiff = b.mtime - a.mtime;
            if (mtimeDiff !== 0) return mtimeDiff;

            // 3. 如果更新时间相同，按创建时间排序（新的在前）
            const birthtimeDiff = b.birthtime - a.birthtime;
            if (birthtimeDiff !== 0) return birthtimeDiff;

            // 4. 如果时间都相同，按名称排序
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
