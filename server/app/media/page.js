'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { PhotoProvider, PhotoView } from 'react-photo-view';
import 'react-photo-view/dist/react-photo-view.css';
import { getMediaDirectory } from '@/lib/api';
import VideoThumbnail from '../../components/VideoThumbnail';
import { checkIsPC, formatFileSize, formatShortTime, generateBreadcrumbs, getParentPath } from '@/utils';
import { useToastContext } from "@/context/ToastContext";
import { getLocation } from "@/utils";
import { pageSize, SupportedTypes } from "@/app/media/const";
import {
    SettingsIcon,
    ArrowLeftIcon,
    FolderIcon,
    MusicIcon,
    ChevronDownIcon,
    FolderEmptyIcon,
    CloseIcon,
    LoadingIcon
} from '@/components/icons';

export default function MediaPage() {
    const { showError } = useToastContext();
    const router = useRouter();
    const searchParams = new URLSearchParams(getLocation().search);

    const [currentPath, setCurrentPath] = useState('');
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedVideo, setSelectedVideo] = useState(null);
    const [pathInput, setPathInput] = useState('');
    const [isPC, setIsPC] = useState(false);
    const [settings, setSettings] = useState({
        enableThumbnails: true,
        autoLoadVideo: true
    });

    // 分页和滚动加载状态
    const [currentPage, setCurrentPage] = useState(1);
    const [hasNextPage, setHasNextPage] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [totalItems, setTotalItems] = useState(0);

    // 防重复请求的引用
    const loadingRef = useRef(false);
    const loadMoreRef = useRef(false);
    const scrollTimeoutRef = useRef(null);

    // 更新URL路径
    const updateURL = (path) => {
        const url = new URL(window.location);
        if (path) {
            url.searchParams.set('path', path);
        } else {
            url.searchParams.delete('path');
        }
        // 使用replace避免创建历史记录
        window.history.replaceState({}, '', url);
    };

    // 加载目录内容（首次加载）
    const loadDirectory = useCallback(async (path = '') => {
        // 防止重复请求
        if (loadingRef.current) return;

        loadingRef.current = true;
        setLoading(true);
        setCurrentPage(1);

        try {
            const result = await getMediaDirectory(path, 1, pageSize);

            if (result.success) {
                setCurrentPath(result.data.currentPath);
                setItems(result.data.items);
                setHasNextPage(result.data.pagination.hasNextPage);
                setTotalItems(result.data.pagination.totalItems);
                updateURL(path);
            }
        } catch (error) {
            console.error('Error loading directory:', error);
            showError(error.message);
        } finally {
            loadingRef.current = false;
            setLoading(false);
        }
    }, [showError]);

    // 加载更多内容
    const loadMoreItems = useCallback(async () => {
        // 防止重复请求
        if (loadMoreRef.current || loadingMore || !hasNextPage) return;

        loadMoreRef.current = true;
        setLoadingMore(true);
        const nextPage = currentPage + 1;

        try {
            const result = await getMediaDirectory(currentPath, nextPage, pageSize);

            if (result.success) {
                setItems(prevItems => [...prevItems, ...result.data.items]);
                setHasNextPage(result.data.pagination.hasNextPage);
                setCurrentPage(nextPage);
            }
        } catch (error) {
            console.error('Error loading more items:', error);
            showError(error.message);
        } finally {
            loadMoreRef.current = false;
            setLoadingMore(false);
        }
    }, [loadingMore, hasNextPage, currentPage, currentPath, showError]);

    // 检测是否为PC端
    useEffect(() => {
        const updateDeviceType = () => {
            setIsPC(checkIsPC());
        };

        updateDeviceType();
        window.addEventListener('resize', updateDeviceType);
        return () => window.removeEventListener('resize', updateDeviceType);
    }, []);

    // 初始化时从URL获取路径
    useEffect(() => {
        const pathFromUrl = searchParams.get('path') || '';
        loadDirectory(pathFromUrl);
        setPathInput(pathFromUrl);
    }, []);

    // 当currentPath改变时，更新输入框
    useEffect(() => {
        setPathInput(currentPath);
    }, [currentPath]);

    // 加载设置
    useEffect(() => {
        const loadSettings = async () => {
            try {
                const response = await fetch('/api/media/settings');
                if (response.ok) {
                    const data = await response.json();
                    setSettings(data);
                }
            } catch (error) {
                console.error('Error loading settings:', error);
                // 使用默认设置，不显示错误
            }
        };
        loadSettings();
    }, []);

    // 滚动加载监听 - 使用节流优化
    useEffect(() => {
        const handleScroll = () => {
            // 清除之前的定时器
            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current);
            }

            // 使用节流，100ms内只处理一次滚动事件
            scrollTimeoutRef.current = setTimeout(() => {
                if (loading || loadingMore || !hasNextPage || loadMoreRef.current) return;

                const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
                const scrollHeight = document.documentElement.scrollHeight || document.body.scrollHeight;
                const clientHeight = document.documentElement.clientHeight || window.innerHeight;

                // 当滚动到距离底部200px时开始加载更多
                if (scrollTop + clientHeight >= scrollHeight - 200) {
                    loadMoreItems();
                }
            }, 100);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => {
            window.removeEventListener('scroll', handleScroll);
            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current);
            }
        };
    }, [loading, loadingMore, hasNextPage, loadMoreItems]);

    // 处理文件夹点击
    const handleFolderClick = useCallback((folderPath) => {
        loadDirectory(folderPath);
    }, [loadDirectory]);

    // 返回上一级
    const handleBackClick = useCallback(() => {
        const parentPath = getParentPath(currentPath);
        loadDirectory(parentPath);
    }, [currentPath, loadDirectory]);

    // 面包屑导航点击
    const handleBreadcrumbClick = useCallback((targetPath) => {
        loadDirectory(targetPath);
    }, [loadDirectory]);

    // 处理路径输入
    const handlePathInputChange = (e) => {
        setPathInput(e.target.value);
    };

    // 处理路径输入提交
    const handlePathInputSubmit = useCallback((e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            loadDirectory(pathInput);
        }
    }, [pathInput, loadDirectory]);

    // 处理跳转按钮点击
    const handleGoClick = useCallback(() => {
        loadDirectory(pathInput);
    }, [pathInput, loadDirectory]);


    // 处理视频点击
    const handleVideoClick = (videoUrl) => {
        setSelectedVideo(videoUrl);
    };

    const handleAudioClick = (audioName) => {
        const path = searchParams.get('path') || '';
        router.push(`/media/audio?audioName=${audioName}&path=${path}`)
    };

    const clickItem = (item) => {
        if (item.type === SupportedTypes.folder) {
            handleFolderClick(item.path);
        } else if (item.type === SupportedTypes.image) {
            console.log('click image');
        } else if (item.type === SupportedTypes.video) {
            handleVideoClick(item.url);
        } else if (item.type === SupportedTypes.audio) {
            handleAudioClick(item.name);
        } else {
            showError('不支持的文件类型');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* 头部导航 */}
            <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                            媒体预览器
                        </h1>

                        <div className="flex items-center space-x-4">
                            {/* 面包屑导航 */}
                            <div className="flex items-center space-x-2 text-sm">
                                {generateBreadcrumbs(currentPath).map((breadcrumb, index, array) => (
                                    <div key={index} className="flex items-center">
                                        <button
                                            onClick={() => handleBreadcrumbClick(breadcrumb.path)}
                                            className={`cursor-pointer ${
                                                index === array.length - 1
                                                    ? 'text-gray-900 dark:text-white font-medium'
                                                    : 'text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300'
                                            }`}
                                        >
                                            {breadcrumb.name}
                                        </button>
                                        {index < array.length - 1 && (
                                            <span className="mx-2 text-gray-400">/</span>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* 设置按钮 */}
                            <button
                                onClick={() => router.push('/media/settings')}
                                className="inline-flex items-center p-2 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                title="设置"
                            >
                                <SettingsIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* 主内容区域 */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* 导航栏：返回按钮和路径输入 */}
                <div className="flex items-center gap-4 mb-6">
                    {/* 返回按钮 */}
                    {currentPath && (
                        <button
                            onClick={handleBackClick}
                            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors cursor-pointer"
                        >
                            <ArrowLeftIcon className="w-4 h-4 mr-2" />
                            返回上级
                        </button>
                    )}

                    {/* PC端路径输入框 */}
                    {isPC && (
                        <div className="flex items-center gap-2 flex-1 max-w-md">
                            <input
                                type="text"
                                value={pathInput}
                                onChange={handlePathInputChange}
                                onKeyDown={handlePathInputSubmit}
                                placeholder="输入文件夹路径 (例如: images/2024)"
                                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <button
                                onClick={handleGoClick}
                                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors cursor-pointer"
                            >
                                跳转
                            </button>
                        </div>
                    )}
                </div>

                {/* 加载状态 */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <LoadingIcon className="h-12 w-12 text-blue-600" />
                    </div>
                ) : (
                    /* 文件网格 */
                    <PhotoProvider
                        speed={() => 200}
                        easing={(type) => (type === 2 ? 'cubic-bezier(0.36, 0, 0.66, -0.56)' : 'cubic-bezier(0.34, 1.56, 0.64, 1)')}
                    >
                        <div
                            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                            {items.map((item, index) => (
                                <div key={index}
                                     className="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden"
                                     onClick={() => clickItem(item)}
                                >
                                    <div className="aspect-square relative">
                                        {item.type === SupportedTypes.folder && <div
                                            className="flex items-center justify-center h-full bg-blue-50 dark:bg-blue-900/20">
                                            <FolderIcon className="w-12 h-12 text-blue-600 dark:text-blue-400" />
                                        </div>}
                                        {item.type === SupportedTypes.image && (
                                            /* 图片项目 - 使用PhotoView包装 */
                                            <PhotoView src={item.url}>
                                                <Image
                                                    src={settings.enableThumbnails
                                                        ? `/api/media/image?path=${encodeURIComponent(item.path)}&thumbnail=true`
                                                        : item.url}
                                                    alt={item.name}
                                                    fill
                                                    className="object-cover"
                                                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, (max-width: 1280px) 16vw, 12vw"
                                                />
                                            </PhotoView>
                                        )}
                                        {item.type === SupportedTypes.video && <VideoThumbnail
                                            autoLoadVideo={settings.autoLoadVideo}
                                            src={item.url}
                                        />}
                                        {item.type === SupportedTypes.audio && <div
                                            className="flex items-center justify-center h-full bg-blue-50 dark:bg-blue-900/20">
                                            <MusicIcon className="w-16 h-16 text-blue-600 dark:text-blue-400" />
                                        </div>}
                                        {!Object.values(SupportedTypes).includes(item.type) && <div
                                            className="flex items-center justify-center h-full bg-blue-50 dark:bg-blue-900/20">
                                            Unknown
                                        </div>}
                                    </div>
                                    {/* 文件信息 */}
                                    <div className="p-3">
                                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                            {item.name}
                                        </p>
                                        <div className="flex justify-between items-center mt-1">
                                            {item.size && (
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    {formatFileSize(item.size)}
                                                </p>
                                            )}
                                            {item.mtime && (
                                                <p className="text-xs text-gray-400 dark:text-gray-500">
                                                    {formatShortTime(item.mtime)}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </PhotoProvider>
                )}

                {/* 加载更多提示 */}
                {!loading && items.length > 0 && (
                    <div className="mt-8 text-center">
                        {loadingMore ? (
                            <div className="flex items-center justify-center py-8">
                                <LoadingIcon className="h-8 w-8 text-blue-600 mr-3" />
                                <span className="text-gray-600 dark:text-gray-300">正在加载更多...</span>
                            </div>
                        ) : hasNextPage ? (
                            <button
                                onClick={loadMoreItems}
                                className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                            >
                                <ChevronDownIcon className="w-5 h-5 mr-2" />
                                加载更多
                            </button>
                        ) : items.length > 0 ? (
                            <div className="py-8">
                                <div className="flex items-center justify-center space-x-4">
                                    <div className="h-px bg-gray-300 dark:bg-gray-600 flex-1"></div>
                                    <span className="text-gray-500 dark:text-gray-400 text-sm">已显示全部 {totalItems} 个文件</span>
                                    <div className="h-px bg-gray-300 dark:bg-gray-600 flex-1"></div>
                                </div>
                            </div>
                        ) : null}
                    </div>
                )}

                {/* 空文件夹提示 */}
                {!loading && items.length === 0 && (
                    <div className="text-center py-20">
                        <FolderEmptyIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                            暂无媒体文件
                        </h3>
                        <p className="mt-2 text-gray-500 dark:text-gray-400">
                            请在 public/media 目录下添加图片或视频文件
                        </p>
                    </div>
                )}
            </main>


            {/* 视频播放模态框 */}
            {selectedVideo && (
                <div
                    className="fixed inset-0 bg-opacity-90 flex items-center justify-center z-50 p-4"
                    onClick={() => setSelectedVideo(null)}
                >
                    <div className="relative max-w-full max-h-full">
                        <button
                            className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
                            onClick={() => setSelectedVideo(null)}
                        >
                            <CloseIcon className="w-8 h-8" />
                        </button>
                        <video
                            src={selectedVideo}
                            controls
                            autoPlay
                            className="max-w-full max-h-full"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                </div>
            )}

        </div>
    );
}
