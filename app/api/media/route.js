import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import {
    SupportedTypes,
    SUPPORTED_IMAGE_EXTENSIONS,
    SUPPORTED_VIDEO_EXTENSIONS,
    SUPPORTED_AUDIO_EXTENSIONS,
} from "@/app/media/const";
import { MEDIA_CONFIG } from "@/lib/config";

async function isDirectoryEmpty(directoryPath) {
    try {
        const files = await fs.readdir(directoryPath);
        return files.length === 0;
    } catch (e) {
        console.log(`isDirectoryEmpty:`, e);
        return true;
    }
}

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const folder = searchParams.get('folder') || '';

        // 分页参数
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '100');
        const offset = (page - 1) * limit;

        // 构建完整路径，确保安全性
        // 根据配置的媒体路径构建基础路径
        const mediaRootPath = MEDIA_CONFIG.ROOT_PATH;
        const basePath = path.isAbsolute(mediaRootPath)
            ? path.join(mediaRootPath)
            : path.join(process.cwd(), mediaRootPath);
        const fullPath = path.join(basePath, folder);

        // 安全检查：确保路径在media目录内
        if (!fullPath.startsWith(basePath)) {
            return NextResponse.json({
                error: '访问路径不合法'
            }, { status: 400 });
        }

        // 检查目录是否存在
        try {
            await fs.access(fullPath);
        } catch (error) {
            return NextResponse.json({
                error: '请求的目录未找到'
            }, { status: 404 });
        }

        // 读取目录内容
        const items = await fs.readdir(fullPath);

        // 并发处理文件信息，使用批量限制防止过多并发
        const BATCH_SIZE = 50; // 每批处理50个文件
        const result = [];

        // 处理单个文件的异步函数
        const processItem = async (item) => {
            try {
                const itemPath = path.join(fullPath, item);
                const stats = await fs.stat(itemPath);
                const filepath = folder ? `${folder}/${item}` : item;

                if (stats.isDirectory()) {
                    const isEmpty = await isDirectoryEmpty(itemPath);
                    // 添加文件夹
                    return {
                        name: item,
                        type: SupportedTypes.folder,
                        path: filepath,
                        isEmpty,
                        mtime: stats.mtime.getTime(), // 修改时间
                        birthtime: stats.birthtime.getTime() // 创建时间
                    };
                } else if (stats.isFile()) {
                    const ext = path.extname(item).toLowerCase();

                    const baseInfo = {
                        name: item,
                        path: filepath,
                        url: `/api/media/file?path=${encodeURIComponent(filepath)}`,
                        size: stats.size,
                        mtime: stats.mtime.getTime(), // 修改时间
                        birthtime: stats.birthtime.getTime() // 创建时间
                    }

                    if (SUPPORTED_IMAGE_EXTENSIONS.includes(ext)) {
                        // 添加图片
                        return {
                            type: SupportedTypes.image,
                            thumbnail: `/api/media/thumbnail/image?path=${encodeURIComponent(filepath)}&thumbnail=true`,
                            ...baseInfo,
                        };
                    } else if (SUPPORTED_VIDEO_EXTENSIONS.includes(ext)) {
                        // 添加视频
                        return {
                            type: SupportedTypes.video,
                            thumbnail: `/api/media/thumbnail/video?path=${encodeURIComponent(filepath)}&thumbnail=true`,
                            ...baseInfo,
                        };
                    } else if (SUPPORTED_AUDIO_EXTENSIONS.includes(ext)) {
                        // 添加音频
                        return {
                            type: SupportedTypes.audio,
                            ...baseInfo,
                        };
                    }
                }
                // 忽略其他文件类型
                return null;
            } catch (error) {
                console.error(`Error processing file ${item}:`, error);
                return null; // 跳过出错的文件
            }
        };

        // 分批并发处理文件
        for (let i = 0; i < items.length; i += BATCH_SIZE) {
            const batch = items.slice(i, i + BATCH_SIZE);
            const batchResults = await Promise.all(batch.map(processItem));

            // 过滤掉null结果并添加到结果数组
            result.push(...batchResults.filter(item => item !== null));
        }

        // 排序：文件夹优先，然后按更新时间优先，最后按创建时间优先
        result.sort((a, b) => {
            const folderType = SupportedTypes.folder;
            // 1. 文件夹优先
            if (a.type === folderType && b.type !== folderType) return -1;
            if (a.type !== folderType && b.type === folderType) return 1;
            if (a.type === folderType && b.type === folderType) {
                return a.name.localeCompare(b.name);
            }

            // 2. 按更新时间排序（新的在前）
            const mtimeDiff = b.mtime - a.mtime;
            if (mtimeDiff !== 0) return mtimeDiff;

            // 3. 如果更新时间相同，按创建时间排序（新的在前）
            const birthtimeDiff = b.birthtime - a.birthtime;
            if (birthtimeDiff !== 0) return birthtimeDiff;

            // 4. 如果时间都相同，按名称排序
            return a.name.localeCompare(b.name);
        });

        // 计算总数和分页信息
        const totalItems = result.length;
        const totalPages = Math.ceil(totalItems / limit);
        const hasNextPage = page < totalPages;
        const hasPreviousPage = page > 1;

        // 应用分页
        const paginatedItems = result.slice(offset, offset + limit);

        return NextResponse.json({
            currentPath: folder,
            items: paginatedItems,
            pagination: {
                page,
                limit,
                totalItems,
                totalPages,
                hasNextPage,
                hasPreviousPage,
                currentItemCount: paginatedItems.length
            }
        });

    } catch (error) {
        console.error('Error reading directory:', error);
        return NextResponse.json({
            error: '读取目录时发生错误，请稍后重试'
        }, { status: 500 });
    }
}
