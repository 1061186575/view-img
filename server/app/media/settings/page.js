'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToastContext } from "@/context/ToastContext";

export default function SettingsPage() {
    const { showSuccess, showError } = useToastContext();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState({
        enableThumbnails: true // 默认开启缩略图
    });

    // 加载设置
    const loadSettings = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/media/settings');
            if (response.ok) {
                const data = await response.json();
                setSettings(data);
            } else {
                // 如果配置文件不存在，使用默认设置
                console.log('Using default settings');
            }
        } catch (error) {
            console.error('Error loading settings:', error);
            showError('加载设置失败');
        } finally {
            setLoading(false);
        }
    };

    // 保存设置
    const saveSettings = async () => {
        setSaving(true);
        try {
            const response = await fetch('/api/media/settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(settings),
            });

            if (response.ok) {
                showSuccess('设置保存成功');
            } else {
                const errorData = await response.json();
                showError(errorData.error || '保存设置失败');
            }
        } catch (error) {
            console.error('Error saving settings:', error);
            showError('保存设置失败');
        } finally {
            setSaving(false);
        }
    };

    // 处理设置更改
    const handleSettingChange = (key, value) => {
        setSettings(prev => ({
            ...prev,
            [key]: value
        }));
    };

    // 页面加载时获取设置
    useEffect(() => {
        loadSettings();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-300">正在加载设置...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* 头部导航 */}
            <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center">
                            <button
                                onClick={() => router.back()}
                                className="inline-flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white mr-4"
                            >
                                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
                                </svg>
                                返回
                            </button>
                            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                                设置
                            </h1>
                        </div>
                    </div>
                </div>
            </header>

            {/* 主内容区域 */}
            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                    <div className="p-6">
                        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
                            显示设置
                        </h2>

                        {/* 缩略图设置 */}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <label className="text-sm font-medium text-gray-900 dark:text-white">
                                        启用缩略图
                                    </label>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                        开启后，图片将先显示缩略图，点击后展示完整图片，可提高页面加载速度
                                    </p>
                                </div>
                                <div className="ml-4">
                                    <button
                                        type="button"
                                        onClick={() => handleSettingChange('enableThumbnails', !settings.enableThumbnails)}
                                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 ${
                                            settings.enableThumbnails ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
                                        }`}
                                    >
                                        <span
                                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                                settings.enableThumbnails ? 'translate-x-5' : 'translate-x-0'
                                            }`}
                                        />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* 保存按钮 */}
                        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                            <div className="flex justify-end">
                                <button
                                    onClick={saveSettings}
                                    disabled={saving}
                                    className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white ${
                                        saving
                                            ? 'bg-gray-400 cursor-not-allowed'
                                            : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                                    } transition-colors`}
                                >
                                    {saving && (
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                    )}
                                    {saving ? '保存中...' : '保存设置'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 设置说明 */}
                <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                                关于缩略图功能
                            </h3>
                            <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                                <ul className="list-disc list-inside space-y-1">
                                    <li>启用缩略图可以显著提高页面加载速度，特别是在查看大量图片时</li>
                                    <li>缩略图会自动生成并缓存，首次加载可能会稍慢</li>
                                    <li>点击缩略图即可查看完整的高清图片</li>
                                    <li>配置保存后会立即生效，无需重启应用</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
