import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const SETTINGS_FILE = path.join(process.cwd(), 'data', 'settings.json');

// 确保数据目录存在
async function ensureDataDir() {
    const dataDir = path.dirname(SETTINGS_FILE);
    try {
        await fs.access(dataDir);
    } catch {
        await fs.mkdir(dataDir, { recursive: true });
    }
}

// 获取默认设置
function getDefaultSettings() {
    return {
        enableThumbnails: true,
        autoLoadVideo: true,
    };
}

// GET - 读取设置
export async function GET() {
    try {
        await ensureDataDir();

        try {
            const data = await fs.readFile(SETTINGS_FILE, 'utf8');
            const settings = JSON.parse(data);
            return NextResponse.json(settings);
        } catch (error) {
            // 文件不存在时返回默认设置
            if (error.code === 'ENOENT') {
                const defaultSettings = getDefaultSettings();
                return NextResponse.json(defaultSettings);
            }
            throw error;
        }
    } catch (error) {
        console.error('Error reading settings:', error);
        return NextResponse.json(
            { error: '读取设置失败' },
            { status: 500 }
        );
    }
}

// POST - 保存设置
export async function POST(request) {
    try {
        const body = await request.json();

        // 验证请求数据
        if (typeof body.enableThumbnails !== 'boolean' || typeof body.autoLoadVideo !== 'boolean') {
            return NextResponse.json(
                { error: '无效的设置数据' },
                { status: 400 }
            );
        }

        await ensureDataDir();

        // 读取现有设置（如果存在）
        let existingSettings = {};
        try {
            const data = await fs.readFile(SETTINGS_FILE, 'utf8');
            existingSettings = JSON.parse(data);
        } catch (error) {
            // 文件不存在时使用空对象
            if (error.code !== 'ENOENT') {
                throw error;
            }
        }

        // 合并设置
        const newSettings = {
            ...existingSettings,
            ...body,
        };

        // 保存设置
        await fs.writeFile(SETTINGS_FILE, JSON.stringify(newSettings, null, 2));

        return NextResponse.json({
            success: true,
            message: '设置保存成功',
            settings: newSettings
        });

    } catch (error) {
        console.error('Error saving settings:', error);
        return NextResponse.json(
            { error: '保存设置失败' },
            { status: 500 }
        );
    }
}
