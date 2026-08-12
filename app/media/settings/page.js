'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToastContext } from "@/context/ToastContext";
import { ArrowLeftIcon, LoadingIcon } from '@/components/icons';

export default function SettingsPage() {
    const { showSuccess, showError } = useToastContext();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    // 默认设置
    const defaultSettings = {
        newTabOpenVideo: false,
        hideFileInfo: false,
    };

    const [settings, setSettings] = useState(defaultSettings);

    // 从 localStorage 加载设置
    const loadSettings = () => {
        setLoading(true);
        try {
            const savedSettings = localStorage.getItem('media-settings');
            if (savedSettings) {
                const parsedSettings = JSON.parse(savedSettings);
                setSettings(parsedSettings);
            } else {
                // 如果没有保存的设置，使用默认设置
                setSettings(defaultSettings);
            }
        } catch (error) {
            console.error('Error loading settings from localStorage:', error);
            // 如果解析失败，使用默认设置
            setSettings(defaultSettings);
        } finally {
            setLoading(false);
        }
    };

    // 保存设置到 localStorage
    const saveSettings = () => {
        setSaving(true);
        try {
            localStorage.setItem('media-settings', JSON.stringify(settings));
            showSuccess('设置保存成功');
        } catch (error) {
            console.error('Error saving settings to localStorage:', error);
            showError('保存设置失败');
        } finally {
            setSaving(false);
        }
    };

    const logout = async () => {
        try {
            const response = await fetch('/api/auth/logout', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                // 登出成功，重定向到登录页面
                router.push('/login');
            } else {
                // 登出失败，处理错误
                const errorData = await response.json();
                showError(errorData.message);
            }
        } catch (e) {
            showError(e.message);
        }
    }

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
                    <LoadingIcon className="h-12 w-12 text-blue-600 mx-auto mb-4" />
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
                                <ArrowLeftIcon className="w-5 h-5 mr-1" />
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
                            设置
                        </h2>

                        {/* 缩略图设置 */}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <label className="text-sm font-medium text-gray-900 dark:text-white">
                                        是否在新页面播放视频
                                    </label>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                        开启后，用 window.open 打开视频
                                    </p>
                                </div>
                                <div className="ml-4">
                                    <button
                                        type="button"
                                        onClick={() => handleSettingChange('newTabOpenVideo', !settings.newTabOpenVideo)}
                                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 ${
                                            settings.newTabOpenVideo ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
                                        }`}
                                    >
                                        <span
                                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                                settings.newTabOpenVideo ? 'translate-x-5' : 'translate-x-0'
                                            }`}
                                        />
                                    </button>
                                </div>
                            </div>

                            {/* 分割线 */}
                            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                                <h3 className="text-base font-medium text-gray-900 dark:text-white mb-4">
                                    信息隐藏设置
                                </h3>
                            </div>

                            {/* 隐藏文件信息 */}
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <label className="text-sm font-medium text-gray-900 dark:text-white">
                                        隐藏文件信息
                                    </label>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                        不显示文件的名称/修改时间/大小
                                    </p>
                                </div>
                                <div className="ml-4">
                                    <button
                                        type="button"
                                        onClick={() => handleSettingChange('hideFileInfo', !settings.hideFileInfo)}
                                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 ${
                                            settings.hideFileInfo ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
                                        }`}
                                    >
                                        <span
                                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                                settings.hideFileInfo ? 'translate-x-5' : 'translate-x-0'
                                            }`}
                                        />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* 按钮 */}
                        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                            <div className="flex justify-end">
                                <button
                                    onClick={logout}
                                    className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white ${
                                        'bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500'
                                    } transition-colors`}
                                >
                                    退出登录
                                </button>
                                <button
                                    onClick={saveSettings}
                                    disabled={saving}
                                    className={`ml-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white ${
                                        saving
                                            ? 'bg-gray-400 cursor-not-allowed'
                                            : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                                    } transition-colors`}
                                >
                                    {saving && (
                                        <LoadingIcon className="-ml-1 mr-2 h-4 w-4 text-white" />
                                    )}
                                    {saving ? '保存中...' : '保存设置'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
