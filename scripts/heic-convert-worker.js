/**
 * HEIC/HEIF 转 JPEG 工作线程
 * 用于 Piscina 线程池并行执行耗时的 HEIC 转码计算
 */

import heicConvert from 'heic-convert';

/**
 * 将 HEIC/HEIF 缓冲区转换为 JPEG（质量 1，即最高质量）
 * @param {Buffer} buffer - HEIC/HEIF 文件缓冲区
 * @returns {Promise<Buffer>} JPEG 文件缓冲区
 */
export default async function convertHeicToJpeg(buffer) {
    return await heicConvert({
        buffer,
        format: 'JPEG',
        quality: 1,
    });
}
