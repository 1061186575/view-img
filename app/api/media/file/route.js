import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import { createReadStream } from 'fs';
import path from 'path';
import { MEDIA_CONFIG } from "@/lib/config";
import { getContentType, heic2Jpeg, readFileBuffer, shouldUseStream } from "@/lib/thumbnail-utils";

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const filePath = searchParams.get('path');
        const rangeHeader = request.headers.get('range');

        if (!filePath) {
            return NextResponse.json({
                error: '缺少文件路径参数'
            }, { status: 400 });
        }

        // 构建完整路径，确保安全性
        const mediaRootPath = MEDIA_CONFIG.ROOT_PATH;
        const basePath = path.isAbsolute(mediaRootPath)
            ? path.join(mediaRootPath)
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

        const fileSize = stats.size;
        let mimeType = getContentType(filePath);

        // 处理Range请求（用于视频/音频的进度控制）
        if (rangeHeader) {
            const ranges = parseRange(rangeHeader, fileSize);

            if (ranges === -1) {
                // 无效的range请求
                return new NextResponse(null, {
                    status: 416,
                    headers: {
                        'Content-Range': `bytes */${fileSize}`,
                    },
                });
            }

            if (ranges && ranges.length === 1) {
                const { start, end } = ranges[0];
                const contentLength = end - start + 1;

                // 使用createReadStream读取部分文件
                const stream = createReadStream(fullPath, { start, end });

                return new NextResponse(stream, {
                    status: 206,
                    headers: {
                        'Content-Type': mimeType,
                        'Content-Length': contentLength.toString(),
                        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                        'Accept-Ranges': 'bytes',
                        'Cache-Control': 'public, max-age=604800',
                    },
                });
            }
        }

        // 非Range请求，根据文件大小智能选择处理方式
        const { useStream } = await shouldUseStream(fullPath);

        if (useStream) {
            // 大文件使用流式传输，避免占用过多内存
            const stream = createReadStream(fullPath);

            return new NextResponse(stream, {
                headers: {
                    'Content-Type': mimeType,
                    'Content-Length': fileSize.toString(),
                    'Accept-Ranges': 'bytes',
                    'Cache-Control': 'public, max-age=604800', // 缓存7天
                },
            });
        } else {
            // 小文件直接读取到内存，响应速度更快
            let fileBuffer = await readFileBuffer(fullPath);

            fileBuffer = await heic2Jpeg(fullPath, fileBuffer);
            const newLength = fileBuffer.length.toString();

            return new NextResponse(fileBuffer, {
                headers: {
                    'Content-Type': mimeType,
                    'Content-Length': newLength,
                    'Accept-Ranges': 'bytes',
                    'Cache-Control': 'public, max-age=604800', // 缓存7天
                },
            });
        }

    } catch (error) {
        console.error('Error serving file:', error);
        return NextResponse.json({
            error: '读取文件时发生错误，请稍后重试'
        }, { status: 500 });
    }
}

/**
 * 解析HTTP Range头
 * @param {string} rangeHeader - Range头的值
 * @param {number} size - 文件大小
 * @returns {Array|number} 解析后的ranges数组，或-1表示无效
 */
function parseRange(rangeHeader, size) {
    if (!rangeHeader || !rangeHeader.startsWith('bytes=')) {
        return -1;
    }

    const ranges = [];
    const rangeSpecs = rangeHeader.slice(6).split(',');

    for (const rangeSpec of rangeSpecs) {
        const range = rangeSpec.trim();
        let start, end;

        if (range.startsWith('-')) {
            // 后缀范围: -500
            start = size - parseInt(range.slice(1), 10);
            end = size - 1;
        } else if (range.endsWith('-')) {
            // 前缀范围: 500-
            start = parseInt(range.slice(0, -1), 10);
            end = size - 1;
        } else {
            // 完整范围: 0-499
            const parts = range.split('-');
            start = parseInt(parts[0], 10);
            end = parseInt(parts[1], 10);
        }

        if (start < 0 || end >= size || start > end) {
            return -1;
        }

        ranges.push({ start, end });
    }

    return ranges.length > 0 ? ranges : -1;
}

