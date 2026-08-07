'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getMediaDirectory } from '@/lib/api';
import AudioPlayer from '@/components/AudioPlayer';
import AudioPlaylist from '@/components/AudioPlaylist';
import { getLocation } from "@/utils";
import { ArrowLeftIcon, SpeakerIcon, ClipboardIcon } from '@/components/icons';

export default function AudioPage() {
    const router = useRouter();
    const search = getLocation().search;
    const searchParams = new URLSearchParams(search);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentItem, setCurrentItem] = useState({});
    const [currentPath, setCurrentPath] = useState('');

    // 加载目录内容
    const loadDirectory = async (path = '') => {
        setLoading(true);
        try {
            const result = await getMediaDirectory(path, 1, 5000);

            if (result.success) {
                const audioItems = result.data.items.filter(item => item.type === 'audio');
                setItems(audioItems);
                setCurrentPath(result.data.currentPath);

                // 从URL获取要播放的音频文件名
                const audioName = searchParams.get('audioName') || '';
                const targetItem = audioItems.find(item => item.name === audioName);

                if (targetItem) {
                    setCurrentItem(targetItem);
                } else if (audioItems.length > 0) {
                    // 如果没有指定音频或找不到指定音频，默认选择第一个
                    setCurrentItem(audioItems[0]);
                }
            }
        } catch (error) {
            console.error('Error loading directory:', error);
        } finally {
            setLoading(false);
        }
    };

    // 初始化时从URL获取路径
    useEffect(() => {
        const path = searchParams.get('path') || '';
        loadDirectory(path);
    }, [search]);

    // 处理播放项改变
    const handleCurrentItemChange = (item) => {
        setCurrentItem(item);
        // 更新URL以反映当前播放的音频
        const path = searchParams.get('path') || '';
        router.replace(`/media/audio?path=${path}&audioName=${encodeURIComponent(item.name)}`, { scroll: false });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-300">加载音频文件中...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* 头部导航 */}
            <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => {
                                    const path = searchParams.get('path') || '';
                                    router.push(`/media?path=${path}`);
                                }}
                                className="inline-flex items-center px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
                            >
                                <ArrowLeftIcon className="w-4 h-4 mr-2" />
                                返回
                            </button>

                            <div className="flex items-center space-x-2">
                                <SpeakerIcon className="w-6 h-6 text-blue-500" />
                                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                                    音频播放器
                                </h1>
                            </div>
                        </div>

                        {/* 路径面包屑 */}
                        {currentPath && (
                            <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                                <ClipboardIcon className="w-4 h-4" />
                                <span>/{currentPath}</span>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* 主内容区域 */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* 播放列表 */}
                    <div className="lg:col-span-1">
                        <AudioPlaylist
                            items={items}
                            currentItem={currentItem}
                            onItemSelect={handleCurrentItemChange}
                        />
                    </div>

                    {/* 音频播放器 */}
                    <div className="lg:col-span-2">
                        <AudioPlayer
                            items={items}
                            currentItem={currentItem}
                            onCurrentItemChange={handleCurrentItemChange}
                        />

                        {/* 音频信息面板 */}
                        {currentItem.name && (
                            <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                    文件信息
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="font-medium text-gray-600 dark:text-gray-400">文件名：</span>
                                        <span className="text-gray-900 dark:text-white ml-2">{currentItem.name}</span>
                                    </div>
                                    <div>
                                        <span className="font-medium text-gray-600 dark:text-gray-400">文件大小：</span>
                                        <span className="text-gray-900 dark:text-white ml-2">
                                            {currentItem.size ? (() => {
                                                const bytes = currentItem.size;
                                                if (bytes === 0) return '0 Bytes';
                                                const k = 1024;
                                                const sizes = ['Bytes', 'KB', 'MB', 'GB'];
                                                const i = Math.floor(Math.log(bytes) / Math.log(k));
                                                return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
                                            })() : '未知'}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="font-medium text-gray-600 dark:text-gray-400">文件路径：</span>
                                        <span className="text-gray-900 dark:text-white ml-2">{currentItem.path || '/'}</span>
                                    </div>
                                    <div>
                                        <span className="font-medium text-gray-600 dark:text-gray-400">访问链接：</span>
                                        <a
                                            href={currentItem.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 ml-2 break-all"
                                        >
                                            {currentItem.url}
                                        </a>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* 没有音频文件时的提示 */}
                {!loading && items.length === 0 && (
                    <div className="text-center py-12">
                        <SpeakerIcon className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                            没有找到音频文件
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-6">
                            在当前目录中没有发现任何支持的音频格式文件
                        </p>
                        <p className="text-sm text-gray-400 dark:text-gray-500">
                            支持的格式：MP3, WAV, FLAC, AAC, OGG, M4A, WMA, OPUS
                        </p>
                    </div>
                )}
            </main>
        </div>
    );
}
