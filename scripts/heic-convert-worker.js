/**
 * HEIC/HEIF 转 JPEG 工作线程
 * 用于 Piscina 线程池并行执行耗时的 HEIC 转码计算
 *
 * 主线程只把文件路径传进来，由 Worker 自己完成读取、转码和写入，
 * 主线程仅负责转换成功后的「移动原文件」这一轻量操作。
 */

import fs from 'fs';
import path from 'path';
import { createHash } from 'crypto';
import heicConvert from 'heic-convert';

/**
 * 计算 Buffer 的 MD5
 * @param {Buffer} buffer
 * @returns {string} MD5 哈希值
 */
function md5(buffer) {
    return createHash('md5').update(buffer).digest('hex');
}

/**
 * 在目录下寻找一个不存在的输出路径（形如 name_1.jpg、name_2.jpg），避免覆盖已有文件
 * @param {string} outputPath - 原始输出路径
 * @returns {string} 可安全写入的新路径
 */
function findAvailablePath(outputPath) {
    const dir = path.dirname(outputPath);
    const ext = path.extname(outputPath);
    const stem = path.basename(outputPath, ext);

    let candidate = outputPath;
    let counter = 1;
    while (fs.existsSync(candidate)) {
        candidate = path.join(dir, `${stem}_${counter}${ext}`);
        counter++;
    }
    return candidate;
}

/**
 * 读取 HEIC/HEIF 文件并转换为 JPEG（质量 1，即最高质量），然后写入目标路径
 * @param {{inputPath: string, outputPath: string}} task - 输入/输出文件路径
 * @returns {Promise<{success: boolean, outputPath: string, skipped?: boolean}>} 处理结果
 */
export default async function convertHeicToJpeg({ inputPath, outputPath }) {
    // 读取原始 HEIC/HEIF 文件
    const buffer = fs.readFileSync(inputPath);

    // 转码为 JPEG
    const jpegBuffer = await heicConvert({
        buffer,
        format: 'JPEG',
        quality: 1,
    });

    const newMd5 = md5(jpegBuffer);

    // 目标文件已存在时，先比较内容 MD5
    if (fs.existsSync(outputPath)) {
        const existingBuffer = fs.readFileSync(outputPath);
        const existingMd5 = md5(existingBuffer);

        // 内容一致：跳过写入，直接返回原路径
        if (existingMd5 === newMd5) {
            return { success: true, outputPath, skipped: true };
        }

        // 内容不一致：不覆盖原图，重命名后输出新路径
        outputPath = findAvailablePath(outputPath);
    }

    // 写入 JPEG 文件
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, jpegBuffer);

    return { success: true, outputPath, skipped: false };
}
