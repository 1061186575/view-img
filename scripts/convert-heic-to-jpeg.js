#!/usr/bin/env node

/**
 * 批量将 HEIC/HEIF 图片转换为 JPEG
 *
 * - 使用 heic-convert 转换，quality 为 1（最高质量）
 * - 使用 Piscina 线程池充分利用多核 CPU
 * - 转换成功后，将原始 HEIC/HEIF 文件移动到 MEDIA_ROOT_PATH/heic-backup 目录
 *
 * 使用: node scripts/convert-heic-to-jpeg.js
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import Piscina from 'piscina';

// 加载 .env 配置
const envConfig = loadEnvFile();

// 优先级：环境变量 > .env 文件 > 默认值
const MEDIA_ROOT_PATH = process.env.MEDIA_ROOT_PATH || envConfig.MEDIA_ROOT_PATH || 'public/media';
const BACKUP_DIR_NAME = 'heic-backup';
const HEIC_EXTENSIONS = ['.heic', '.heif'];

const mediaDir = path.resolve(MEDIA_ROOT_PATH);
const backupRootDir = path.join(mediaDir, BACKUP_DIR_NAME);

// 多线程配置
const MAX_WORKERS = Math.max(1, os.cpus().length - 1);
// 主线程并发任务数，略大于线程数，保证线程池一直有活干
const MAX_CONCURRENT_TASKS = MAX_WORKERS * 2;

// 统计信息
const stats = {
    total: 0,
    converted: 0,
    moved: 0,
    errors: 0,
    startTime: Date.now(),
};

// 创建 Piscina 线程池
const piscina = new Piscina({
    filename: path.resolve(process.cwd(), 'scripts/heic-convert-worker.js'),
    minThreads: 1,
    maxThreads: MAX_WORKERS,
    idleTimeout: 30000, // 30 秒后关闭空闲线程
    maxQueue: 200, // 最大队列长度
});

/**
 * 读取 .env 文件配置
 * @param {string} envPath - .env 文件路径
 * @returns {Object} 环境变量对象
 */
function loadEnvFile(envPath = '.env') {
    const envConfig = {};

    try {
        const envContent = fs.readFileSync(envPath, 'utf8');

        // 按行分割并处理每一行
        envContent.split('\n').forEach(line => {
            line = line.trim();

            // 跳过空行和注释行
            if (!line || line.startsWith('#')) {
                return;
            }

            // 解析 KEY=VALUE 格式
            const equalIndex = line.indexOf('=');
            if (equalIndex > 0) {
                const key = line.substring(0, equalIndex).trim();
                let value = line.substring(equalIndex + 1).trim();

                // 去除引号
                if ((value.startsWith('"') && value.endsWith('"')) ||
                    (value.startsWith("'") && value.endsWith("'"))) {
                    value = value.slice(1, -1);
                }

                envConfig[key] = value;
            }
        });
    } catch (error) {
        // 如果 .env 文件不存在或读取失败，使用默认值
        console.log('📝 未找到 .env 文件，使用默认配置');
    }

    return envConfig;
}

/**
 * 递归遍历目录获取所有 HEIC/HEIF 文件
 * @param {string} dir - 要遍历的目录
 * @param {string} basePath - 相对于媒体根目录的相对路径
 * @returns {Array<{fullPath: string, relativePath: string}>} HEIC/HEIF 文件列表
 */
function getAllHeicFiles(dir, basePath = '') {
    const files = [];

    try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });

        for (const entry of entries) {
            // 跳过备份目录，避免重复处理已经备份过的文件
            if (entry.isDirectory() && entry.name === BACKUP_DIR_NAME) {
                continue;
            }

            const fullPath = path.join(dir, entry.name);
            const relativePath = path.join(basePath, entry.name);

            if (entry.isDirectory()) {
                // 递归处理子目录
                files.push(...getAllHeicFiles(fullPath, relativePath));
            } else if (entry.isFile()) {
                const ext = path.extname(entry.name).toLowerCase();
                if (HEIC_EXTENSIONS.includes(ext)) {
                    files.push({
                        fullPath,
                        relativePath: relativePath.replace(/\\/g, '/'), // 统一使用正斜杠
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
 * 获取 JPEG 输出路径（替换原扩展名为 .jpg）
 * @param {string} fullPath - 原始 HEIC/HEIF 文件路径
 * @returns {string} JPEG 输出路径
 */
function getJpegPath(fullPath) {
    const dir = path.dirname(fullPath);
    const ext = path.extname(fullPath);
    const stem = path.basename(fullPath, ext);
    return path.join(dir, `${stem}.jpg`);
}

/**
 * 将原始 HEIC/HEIF 文件移动到 heic-backup 目录（保留相对目录结构）
 * @param {string} fullPath - 原始文件完整路径
 */
function moveToBackup(fullPath) {
    const relDir = path.relative(mediaDir, path.dirname(fullPath));
    const backupDir = path.join(backupRootDir, relDir);
    fs.mkdirSync(backupDir, { recursive: true });

    const baseName = path.basename(fullPath);
    let targetPath = path.join(backupDir, baseName);

    // 处理重名冲突，避免覆盖已有备份
    let counter = 1;
    while (fs.existsSync(targetPath)) {
        const ext = path.extname(baseName);
        const stem = path.basename(baseName, ext);
        targetPath = path.join(backupDir, `${stem}_${counter}${ext}`);
        counter++;
    }

    fs.renameSync(fullPath, targetPath);
    stats.moved++;
}

/**
 * 处理单个 HEIC/HEIF 文件
 * @param {Object} heicFile - 文件信息
 */
async function processFile(heicFile) {
    try {
        const buffer = fs.readFileSync(heicFile.fullPath);
        const jpegBuffer = await piscina.run(buffer);

        const outputPath = getJpegPath(heicFile.fullPath);
        fs.mkdirSync(path.dirname(outputPath), { recursive: true });
        fs.writeFileSync(outputPath, jpegBuffer);

        // 生成 JPEG 成功后再移动原始文件
        moveToBackup(heicFile.fullPath);
        stats.converted++;
    } catch (error) {
        stats.errors++;
        console.log(`\n❌ 转换失败: ${heicFile.relativePath} - ${error.message}`);
    }
}

/**
 * 格式化持续时间
 * @param {number} ms - 毫秒
 */
function formatDuration(ms) {
    const seconds = Number((ms / 1000).toFixed(2));
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
 * 使用并发任务池处理所有文件
 * @param {Array} heicFiles - 要处理的文件列表
 * @param {number} maxConcurrentTasks - 最大并发任务数
 */
async function processConcurrentTasks(heicFiles, maxConcurrentTasks) {
    let processed = 0;
    let currentIndex = 0;
    const runningTasks = new Set();

    const processTask = async (heicFile) => {
        await processFile(heicFile);

        processed++;
        showProgress(processed, stats.total);
    };

    const addTask = () => {
        if (currentIndex >= heicFiles.length) {
            return null;
        }

        const heicFile = heicFiles[currentIndex++];
        const taskPromise = processTask(heicFile);

        runningTasks.add(taskPromise);

        // 任务完成后从运行中的任务集合中移除
        taskPromise.finally(() => {
            runningTasks.delete(taskPromise);
        });

        return taskPromise;
    };

    // 初始化任务池 - 启动初始的并发任务
    for (let i = 0; i < Math.min(maxConcurrentTasks, heicFiles.length); i++) {
        addTask();
    }

    // 持续处理直到所有任务完成
    while (runningTasks.size > 0 || currentIndex < heicFiles.length) {
        // 等待至少一个任务完成
        if (runningTasks.size > 0) {
            await Promise.race(runningTasks);
        }

        // 如果还有未处理的文件，并且当前运行的任务数少于最大值，则添加新任务
        while (runningTasks.size < maxConcurrentTasks && currentIndex < heicFiles.length) {
            addTask();
        }
    }
}

/**
 * 主函数
 */
async function main() {
    const projectName = 'view-img';
    if (!process.cwd().endsWith(projectName)) {
        console.log('请在项目根目录下运行本文件');
        return;
    }

    console.log('开始批量转换 HEIC/HEIF 为 JPEG...\n');
    console.log(`媒体目录: ${mediaDir}`);
    console.log(`备份目录: ${backupRootDir}`);
    console.log(`工作线程数: ${MAX_WORKERS}\n`);

    if (!fs.existsSync(mediaDir)) {
        console.error(`❌ 错误: ${mediaDir} 目录不存在`);
        process.exit(1);
    }

    // 获取所有 HEIC/HEIF 文件
    console.log('📁 扫描 HEIC/HEIF 文件...');
    const heicFiles = getAllHeicFiles(mediaDir);
    stats.total = heicFiles.length;

    if (stats.total === 0) {
        console.log('ℹ️  没有找到 HEIC/HEIF 文件');
        return;
    }

    console.log(`📊 找到 ${stats.total} 个 HEIC/HEIF 文件\n`);

    showProgress(0, stats.total);

    // 使用并发任务池处理所有文件
    await processConcurrentTasks(heicFiles, MAX_CONCURRENT_TASKS);

    showProgress(stats.total, stats.total);

    const duration = Date.now() - stats.startTime;

    // 显示完成统计
    console.log('\n✅ 批量转换完成!\n');
    console.log('统计信息:');
    console.log(`   总文件数: ${stats.total}`);
    console.log(`   转换成功: ${stats.converted}`);
    console.log(`   已备份: ${stats.moved}`);
    console.log(`   转换失败: ${stats.errors}`);
    console.log(`   用时: ${formatDuration(duration)}`);
    console.log(`   平均转换速度: ${(stats.converted / (duration / 1000)).toFixed(2)} 文件/秒`);

    if (stats.errors > 0) {
        console.log('\n⚠️  部分文件转换失败，请检查上方的错误信息');
    }
}

main();
