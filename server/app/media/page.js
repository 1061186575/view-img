'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { PhotoProvider, PhotoView } from 'react-photo-view';
import 'react-photo-view/dist/react-photo-view.css';
import { getMediaDirectory } from '@/lib/api';
import VideoThumbnail from '../../components/VideoThumbnail';
import { checkIsPC, formatFileSize, generateBreadcrumbs, getParentPath } from '@/utils';

export default function MediaPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [currentPath, setCurrentPath] = useState('');
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedVideo, setSelectedVideo] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [pathInput, setPathInput] = useState('');
    const [isPC, setIsPC] = useState(false);
    const autoLoadVideo = true;
    // const autoLoadVideo = false;

    // 全局错误处理函数
    const showError = (message) => {
        setErrorMessage(message);
        setShowErrorModal(true);
    };

    // 关闭错误弹窗
    const closeErrorModal = () => {
        setShowErrorModal(false);
        setErrorMessage('');
    };

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

    // 加载目录内容
    const loadDirectory = async (path = '') => {
        setLoading(true);
        try {
            const result = await getMediaDirectory(path);

            if (result.success) {
                setCurrentPath(result.data.currentPath);
                setItems(result.data.items);
                updateURL(path);
            }
        } catch (error) {
            console.error('Error loading directory:', error);
            showError(error.message);
        } finally {
            setLoading(false);
        }
    };

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

    // 处理文件夹点击
    const handleFolderClick = (folderPath) => {
        loadDirectory(folderPath);
    };

    // 返回上一级
    const handleBackClick = () => {
        const parentPath = getParentPath(currentPath);
        loadDirectory(parentPath);
    };

    // 面包屑导航点击
    const handleBreadcrumbClick = (targetPath) => {
        loadDirectory(targetPath);
    };

    // 处理路径输入
    const handlePathInputChange = (e) => {
        setPathInput(e.target.value);
    };

    // 处理路径输入提交
    const handlePathInputSubmit = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            loadDirectory(pathInput);
        }
    };

    // 处理跳转按钮点击
    const handleGoClick = () => {
        loadDirectory(pathInput);
    };


    // 处理视频点击
    const handleVideoClick = (videoUrl) => {
        setSelectedVideo(videoUrl);
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
                            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                        >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
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
                                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                            >
                                跳转
                            </button>
                        </div>
                    )}
                </div>

                {/* 加载状态 */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                ) : (
                    /* 文件网格 */
                    <PhotoProvider
                        speed={() => 200}
                        easing={(type) => (type === 2 ? 'cubic-bezier(0.36, 0, 0.66, -0.56)' : 'cubic-bezier(0.34, 1.56, 0.64, 1)')}
                    >
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                            {items.map((item, index) => (
                                <div key={index}>
                                    {item.type === 'image' ? (
                                        /* 图片项目 - 使用PhotoView包装 */
                                        <PhotoView src={item.url}>
                                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden">
                                                <div className="aspect-square relative">
                                                    <Image
                                                        src={item.url}
                                                        alt={item.name}
                                                        fill
                                                        className="object-cover"
                                                        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, (max-width: 1280px) 16vw, 12vw"
                                                    />
                                                </div>
                                                {/* 文件信息 */}
                                                <div className="p-3">
                                                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                                        {item.name}
                                                    </p>
                                                    {item.size && (
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                            {formatFileSize(item.size)}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </PhotoView>
                                    ) : (
                                        /* 非图片项目 - 普通处理 */
                                        <div
                                            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden"
                                            onClick={() => {
                                                if (item.type === 'folder') {
                                                    handleFolderClick(item.path);
                                                } else if (item.type === 'video') {
                                                    handleVideoClick(item.url);
                                                }
                                            }}
                                        >
                                            <div className="aspect-square relative">
                                                {item.type === 'folder' ?
                                                    (
                                                        /* 文件夹图标 */
                                                        <div
                                                            className="flex items-center justify-center h-full bg-blue-50 dark:bg-blue-900/20">
                                                            <svg className="w-12 h-12 text-blue-600 dark:text-blue-400"
                                                                 fill="currentColor" viewBox="0 0 24 24">
                                                                <path
                                                                    d="M10 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2h-8l-2-2z"/>
                                                            </svg>
                                                        </div>
                                                    ) :
                                                    <VideoThumbnail
                                                        autoLoadVideo={autoLoadVideo}
                                                        src={item.url}
                                                    />
                                                }
                                            </div>
                                            {/* 文件信息 */}
                                            <div className="p-3">
                                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                                    {item.name}
                                                </p>
                                                {item.size && (
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                        {formatFileSize(item.size)}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </PhotoProvider>
                )}

                {/* 空文件夹提示 */}
                {!loading && items.length === 0 && (
                    <div className="text-center py-20">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                        </svg>
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
                    className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
                    onClick={() => setSelectedVideo(null)}
                >
                    <div className="relative max-w-full max-h-full">
                        <button
                            className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
                            onClick={() => setSelectedVideo(null)}
                        >
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
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

            {/* 错误弹窗模态框 */}
            {showErrorModal && (
                <div className="fixed top-4 right-4 z-50 max-w-md w-auto">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 p-6 animate-slide-in-right">
                        {/* 错误图标和关闭按钮 */}
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                    </svg>
                                </div>
                                <h3 className="ml-2 text-sm font-medium text-gray-900 dark:text-white">
                                    错误提示
                                </h3>
                            </div>
                            <button
                                onClick={closeErrorModal}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* 错误信息 */}
                        <div className="mb-4">
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                {errorMessage}
                            </p>
                        </div>

                        {/* 按钮 */}
                        <div className="flex justify-end">
                            <button
                                onClick={closeErrorModal}
                                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
                            >
                                确定
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
