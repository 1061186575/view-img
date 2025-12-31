#!/usr/bin/env node

/**
 * 批量生成缩略图脚本
 * 遍历 public/media 目录下的所有图片，预先生成缩略图
 */

import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

// 缩略图配置（与API路由保持一致）
const THUMBNAIL_CONFIG = {
    width: 300,
    height: 300,
    quality: 80,
    format: 'jpeg'
};

// 支持的图片格式
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'];

// 统计信息
const stats = {
    total: 0,
    generated: 0,
    cached: 0,
    errors: 0,
    startTime: Date.now()
};

/**
 * 递归遍历目录获取所有图片文件
 */
function getAllImageFiles(dir, basePath = '') {
    const files = [];

    try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            const relativePath = path.join(basePath, entry.name);

            if (entry.isDirectory()) {
                // 递归处理子目录
                files.push(...getAllImageFiles(fullPath, relativePath));
            } else if (entry.isFile()) {
                const ext = path.extname(entry.name).toLowerCase();
                if (IMAGE_EXTENSIONS.includes(ext)) {
                    files.push({
                        fullPath,
                        relativePath: relativePath.replace(/\\/g, '/') // 统一使用正斜杠
                    });
                }
            }
        }
    } catch (error) {
        console.error(`❌ 无法读取目录 ${dir}:`, error.message);
    }

    return files;
}

/**
 * 生成单个图片的缩略图
 */
async function generateThumbnail(imageFile) {
    try {
        const { fullPath, relativePath } = imageFile;

        // 检查缓存目录
        const cacheDir = path.join(process.cwd(), '.next', 'cache', 'thumbnails');
        if (!fs.existsSync(cacheDir)) {
            fs.mkdirSync(cacheDir, { recursive: true });
        }

        // 生成缓存文件名（与API路由逻辑保持一致）
        const imageStat = fs.statSync(fullPath);
        const cacheKey = `${relativePath}_${imageStat.mtime.getTime()}_${THUMBNAIL_CONFIG.width}x${THUMBNAIL_CONFIG.height}`;
        const base64 = Buffer.from(cacheKey).toString('base64');
        const cacheFilePath = path.join(cacheDir, `${base64.replaceAll('/', '_')}.${THUMBNAIL_CONFIG.format}`);

        // 检查缓存是否已存在
        if (fs.existsSync(cacheFilePath)) {
            stats.cached++;
            return { success: true, cached: true, path: relativePath };
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

        // 保存缓存
        fs.writeFileSync(cacheFilePath, thumbnailBuffer);

        stats.generated++;
        return { success: true, cached: false, path: relativePath };

    } catch (error) {
        stats.errors++;
        return {
            success: false,
            error: error.message,
            path: imageFile.relativePath
        };
    }
}

/**
 * 格式化文件大小
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * 格式化持续时间
 */
function formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
        return `${hours}小时${minutes % 60}分钟${seconds % 60}秒`;
    } else if (minutes > 0) {
        return `${minutes}分钟${seconds % 60}秒`;
    } else {
        return `${seconds}秒`;
    }
}

/**
 * 显示进度
 */
function showProgress(current, total) {
    const percentage = Math.floor((current / total) * 100);
    const bar = '█'.repeat(Math.floor(percentage / 2)) + '░'.repeat(50 - Math.floor(percentage / 2));
    process.stdout.write(`\r进度: [${bar}] ${percentage}% (${current}/${total})`);
}

/**
 * 主函数
 */
async function main() {
    console.log('🚀 开始批量生成缩略图...\n');

    // 检查media目录
    const mediaDir = path.join(process.cwd(), 'public', 'media');
    if (!fs.existsSync(mediaDir)) {
        console.error('❌ 错误: public/media 目录不存在');
        process.exit(1);
    }

    // 获取所有图片文件
    console.log('📁 扫描图片文件...');
    const imageFiles = getAllImageFiles(mediaDir);
    stats.total = imageFiles.length;

    if (stats.total === 0) {
        console.log('ℹ️  没有找到图片文件');
        return;
    }

    console.log(`📊 找到 ${stats.total} 个图片文件\n`);

    // 批量生成缩略图
    let processed = 0;

    for (const imageFile of imageFiles) {
        showProgress(processed, stats.total);

        const result = await generateThumbnail(imageFile);

        if (!result.success) {
            console.log(`\n❌ 处理失败: ${result.path} - ${result.error}`);
        }

        processed++;
    }

    // 完成统计
    showProgress(stats.total, stats.total);
    console.log('\n');

    const duration = Date.now() - stats.startTime;
    const cacheDir = path.join(process.cwd(), '.next', 'cache', 'thumbnails');
    let cacheDirSize = 0;

    // 计算缓存目录大小
    try {
        const cacheFiles = fs.readdirSync(cacheDir);
        for (const file of cacheFiles) {
            const filePath = path.join(cacheDir, file);
            const stat = fs.statSync(filePath);
            cacheDirSize += stat.size;
        }
    } catch (error) {
        // 忽略错误
    }

    // 显示完成统计
    console.log('✅ 批量生成完成!\n');
    console.log('📊 统计信息:');
    console.log(`   总文件数: ${stats.total}`);
    console.log(`   新生成: ${stats.generated}`);
    console.log(`   已缓存: ${stats.cached}`);
    console.log(`   处理失败: ${stats.errors}`);
    console.log(`   用时: ${formatDuration(duration)}`);
    console.log(`   缓存目录大小: ${formatFileSize(cacheDirSize)}`);

    if (stats.errors > 0) {
        console.log('\n⚠️  部分文件处理失败，请检查上方的错误信息');
    }

    if (stats.generated > 0) {
        console.log('\n💡 提示: 重启开发服务器以确保缓存生效');
    }
}

// 运行脚本
main().catch(error => {
    console.error('\n💥 脚本执行失败:', error);
    process.exit(1);
});