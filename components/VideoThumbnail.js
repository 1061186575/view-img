'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { PlaySimpleIcon, VideoIcon } from './icons';

const VideoThumbnail = ({ src, videoPath, onThumbnailClick }) => {
    const [thumbnailUrl, setThumbnailUrl] = useState(null);
    const [thumbnailLoading, setThumbnailLoading] = useState(true);
    const [thumbnailError, setThumbnailError] = useState(false);

    // 生成视频缩略图
    const generateThumbnail = async () => {
        if (!videoPath) {
            setThumbnailLoading(false);
            return;
        }

        try {
            const thumbnailApiUrl = `/api/media/thumbnail/video?path=${encodeURIComponent(videoPath)}`;
            setThumbnailUrl(thumbnailApiUrl);
        } catch (error) {
            setThumbnailError(true);
            console.error('Error setting thumbnail URL:', error);
        } finally {
            setThumbnailLoading(false);
        }
    };

    // 组件挂载时生成缩略图
    useEffect(() => {
        generateThumbnail();
    }, [videoPath]);

    const handleThumbnailClick = (e) => {
        e.stopPropagation();
        if (onThumbnailClick) {
            onThumbnailClick(src);
        }
    };

    const handleImageLoad = () => {
        setThumbnailLoading(false);
        setThumbnailError(false);
    };

    const handleImageError = () => {
        setThumbnailLoading(false);
        setThumbnailError(true);
    };

    // 显示缩略图
    if (thumbnailUrl) {
        return (
            <div className="relative h-full cursor-pointer" onClick={handleThumbnailClick}>
                <Image
                    src={thumbnailUrl}
                    alt="视频缩略图"
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, (max-width: 1280px) 16vw, 12vw"
                    onLoad={handleImageLoad}
                    onError={handleImageError}
                />
                {/* 播放按钮覆盖层 */}
                <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center hover:bg-opacity-20 transition-colors">
                    <PlaySimpleIcon className="w-8 h-8 text-white drop-shadow-lg" />
                </div>

                {/* 加载状态 */}
                {thumbnailLoading && (
                    <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <div className="animate-pulse">
                            <VideoIcon className="w-6 h-6 text-gray-400" />
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // 加载中或出错时显示图标
    return (
        <div className={`flex items-center justify-center bg-gray-100 dark:bg-gray-800 w-full h-full cursor-pointer`} onClick={handleThumbnailClick}>
            <div className={thumbnailLoading ? "animate-pulse" : ""}>
                <VideoIcon className="w-8 h-8 text-gray-400" />
            </div>
            {thumbnailError && (
                <div className="absolute bottom-1 right-1 text-xs text-red-500 bg-white dark:bg-gray-800 px-1 rounded">
                    缩略图生成失败
                </div>
            )}
        </div>
    );
};

export default VideoThumbnail;
