'use client';

import { useState } from 'react';
import Image from 'next/image';
import { PlaySimpleIcon, VideoIcon } from './icons';

const VideoThumbnail = ({ thumbnail }) => {
    const [thumbnailLoading, setThumbnailLoading] = useState(true);
    const [thumbnailError, setThumbnailError] = useState(false);


    const handleImageLoad = () => {
        setThumbnailLoading(false);
        setThumbnailError(false);
    };

    const handleImageError = () => {
        setThumbnailLoading(false);
        setThumbnailError(true);
    };

    // 加载错误
    if (thumbnailError) {
        return (
            <div className={`flex items-center justify-center bg-gray-100 dark:bg-gray-800 w-full h-full cursor-pointer`}>
                <div className={thumbnailLoading ? "animate-pulse" : ""}>
                    <VideoIcon className="w-8 h-8 text-gray-400" />
                </div>
            </div>
        );
    }

    // 显示缩略图
    return (
        <div className="relative h-full cursor-pointer">
            <Image
                src={thumbnail}
                alt="video"
                fill
                className="object-cover"
                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, (max-width: 1280px) 16vw, 12vw"
                onLoad={handleImageLoad}
                onError={handleImageError}
            />
            {/* 播放按钮覆盖层 */}
            <div className="absolute inset-0 bg-opacity-30 flex items-center justify-center hover:bg-opacity-20 transition-colors">
                <PlaySimpleIcon className="w-8 h-8 text-white drop-shadow-lg" />
            </div>
            {/* 加载状态 */}
            {thumbnailLoading && (
                <div className={`flex items-center justify-center bg-gray-100 dark:bg-gray-800 w-full h-full cursor-pointer`}>
                    <div className={thumbnailLoading ? "animate-pulse" : ""}>
                        <VideoIcon className="w-8 h-8 text-gray-400" />
                    </div>
                </div>
            )}
        </div>
    );
};

export default VideoThumbnail;
