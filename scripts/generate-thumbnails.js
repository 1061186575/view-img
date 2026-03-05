#!/usr/bin/env node

/**
 * 批量生成缩略图脚本
 * 遍历 process.env.MEDIA_ROOT_PATH || public/media 目录下的所有图片，预先生成缩略图
 * 使用: node scripts/generate-thumbnails.js
 */

import fs from 'fs';
import path from 'path';
import { createHash } from 'crypto';
import ffmpeg from 'fluent-ffmpeg';
import os from 'os';
import { Worker } from 'worker_threads';
import { THUMBNAIL_CONFIG } from "../lib/config.js";
import { SUPPORTED_IMAGE_EXTENSIONS, SUPPORTED_VIDEO_EXTENSIONS } from "../app/media/const.js";

// 加载 .env 配置
const envConfig = loadEnvFile();

// 优先级：环境变量 > .env 文件 > 默认值
const MEDIA_ROOT_PATH = process.env.MEDIA_ROOT_PATH || envConfig.MEDIA_ROOT_PATH || 'public/media';
const FFMPEG_PATH = process.env.FFMPEG_PATH || envConfig.MEDIA_ROOT_PATH;
const projectName = 'view-img'

// 设置 缓存 目录
const cacheDir = path.join(process.cwd(), '.next', 'cache', 'thumbnails');
const videoCacheDir = path.join(process.cwd(), '.next', 'cache', 'video-thumbnails');

// 统计信息
const stats = {
    total: 0,
    generated: 0,
    cached: 0,
    errors: 0,
    startTime: Date.now()
};

// 多线程配置
const numCPUs = os.cpus().length;
const MAX_WORKERS = Math.max(1, numCPUs - 1);
let workerPool = [];
let currentWorkerIndex = 0;

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
            // 去除空白字符
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
        console.log(`📝 未找到 .env 文件，使用默认配置`);
    }

    return envConfig;
}

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
                if (SUPPORTED_IMAGE_EXTENSIONS.includes(ext)) {
                    files.push({
                        fullPath,
                        type: 'image',
                        relativePath: relativePath.replace(/\\/g, '/') // 统一使用正斜杠
                    });
                } else if (SUPPORTED_VIDEO_EXTENSIONS.includes(ext)) {
                    files.push({
                        fullPath,
                        type: 'video',
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

function md5(str) {
    return createHash('md5').update(str, 'utf8').digest('hex');
}

/**
 * 创建缩略图生成工作线程
 * @returns {Worker} 工作线程实例
 */
function createThumbnailWorker() {
    return new Worker(new URL('./thumbnail-worker.js', import.meta.url));
}

/**
 * 初始化缩略图生成工作线程池
 */
function initWorkerPool(MAX_WORKERS) {
    for (let i = 0; i < MAX_WORKERS; i++) {
        workerPool.push(createThumbnailWorker());
    }
}

/**
 * 使用工作线程生成缩略图
 * @param {Object} imageFile - 图片文件信息
 * @returns {Promise<Object>} 处理结果
 */
function generateThumbnailInWorker(imageFile) {
    return new Promise((resolve, reject) => {
        const worker = workerPool[currentWorkerIndex];
        const taskId = Date.now() + Math.random();

        // 轮询使用不同的工作线程
        currentWorkerIndex = (currentWorkerIndex + 1) % workerPool.length;

        const messageHandler = (data) => {
            if (data.taskId === taskId) {
                // 确保每个任务的消息只被处理一次
                worker.off('message', messageHandler);
                if (data.success) {
                    resolve(data.result);
                } else {
                    reject(new Error(data.error));
                }
            }
        };

        worker.on('message', messageHandler);
        worker.postMessage({
            imageFile,
            taskId,
            cacheDir,
            videoCacheDir,
            THUMBNAIL_CONFIG_IMAGE: THUMBNAIL_CONFIG.IMAGE,
            THUMBNAIL_CONFIG_VIDEO: THUMBNAIL_CONFIG.VIDEO,
            THUMBNAIL_CONFIG
        });
    });
}

/**
 * 格式化持续时间
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

function setFfmpegPath() {
    // 如果有 FFMPEG_PATH, 就在这里设置 ffmpeg 文件路径
    const absPath = path.resolve(FFMPEG_PATH || '');
    if (FFMPEG_PATH && fs.existsSync(absPath)) {
        ffmpeg.setFfmpegPath(absPath);
    }
}

/**
 * 清理工作线程池
 */
function cleanupWorkers() {
    workerPool.forEach(worker => {
        worker.terminate();
    });
    workerPool = [];
}

/**
 * 使用并发任务池处理所有文件
 * @param {Array} imageFiles - 要处理的文件列表
 * @param {number} maxConcurrentTasks - 最大并发任务数, 如果子线程是 CPU 密集型任务或同步任务, 可以将此值设置为 CPU 核心数, 否则可以设置大一点
 * @returns {Promise<void>} 处理完成的Promise
 */
async function processConcurrentTasks(imageFiles, maxConcurrentTasks = 40) {
    let processed = 0;
    let currentIndex = 0;
    const runningTasks = new Set();

    // 处理单个任务的函数
    const processTask = async (imageFile) => {
        try {
            const result = await generateThumbnailInWorker(imageFile);

            // 更新统计信息
            if (result.cached) {
                stats.cached++;
            } else {
                stats.generated++;
            }

            if (!result.success) {
                stats.errors++;
                console.log(`\n❌ 处理失败: ${result.path} - ${result.error}`);
            }
        } catch (error) {
            stats.errors++;
            console.log(`\n❌ 处理失败: ${imageFile.relativePath} - ${error.message}`);
        }

        processed++;
        showProgress(processed, stats.total);
    };

    // 添加新任务到任务池
    const addTask = () => {
        if (currentIndex >= imageFiles.length) {
            return null;
        }

        const imageFile = imageFiles[currentIndex++];
        const taskPromise = processTask(imageFile);

        runningTasks.add(taskPromise);

        // 任务完成后从运行中的任务集合中移除
        taskPromise.finally(() => {
            runningTasks.delete(taskPromise);
        });

        return taskPromise;
    };

    // 初始化任务池 - 启动初始的并发任务
    for (let i = 0; i < Math.min(maxConcurrentTasks, imageFiles.length); i++) {
        addTask();
    }

    // 持续处理直到所有任务完成
    while (runningTasks.size > 0 || currentIndex < imageFiles.length) {
        // 等待至少一个任务完成
        if (runningTasks.size > 0) {
            await Promise.race(runningTasks);
        }

        // 如果还有未处理的文件，并且当前运行的任务数少于最大值，则添加新任务
        while (runningTasks.size < maxConcurrentTasks && currentIndex < imageFiles.length) {
            addTask();
        }
    }
}

/**
 * 主函数
 */
async function main() {
    if (!process.cwd().endsWith(projectName)) {
        console.log('请在项目根目录下运行本文件')
        return;
    }
    setFfmpegPath();

    const mediaDir = path.resolve(MEDIA_ROOT_PATH);

    console.log('开始批量生成缩略图...\n');
    console.log(`媒体目录: ${mediaDir}`);
    console.log('cacheDir', cacheDir);
    console.log('videoCacheDir', videoCacheDir);

    if (!fs.existsSync(mediaDir)) {
        console.error(`❌ 错误: ${mediaDir} 目录不存在`);
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

    console.log(`📊 找到 ${stats.total} 个媒体文件\n`);

    // 初始化工作线程池
    console.log(`使用 ${MAX_WORKERS} 个工作线程\n`);
    showProgress(0, stats.total);
    initWorkerPool(MAX_WORKERS);

    // 使用并发任务池处理所有文件
    await processConcurrentTasks(imageFiles, MAX_WORKERS * 2);

    // 清理工作线程池
    cleanupWorkers();

    // 完成统计
    showProgress(stats.total, stats.total);

    const duration = Date.now() - stats.startTime;

    // 显示完成统计
    console.log('\n✅ 批量生成完成!\n');
    console.log('统计信息:');
    console.log(`   总文件数: ${stats.total}`);
    console.log(`   新生成: ${stats.generated}`);
    console.log(`   已缓存: ${stats.cached}`);
    console.log(`   处理失败: ${stats.errors}`);
    console.log(`   用时: ${formatDuration(duration)}`);
    console.log(`   平均速度: ${(stats.total / (duration / 1000)).toFixed(2)} 文件/秒`);

    if (stats.errors > 0) {
        console.log('\n⚠️  部分文件处理失败，请检查上方的错误信息');
    }
}

main()
