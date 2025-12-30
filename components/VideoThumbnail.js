'use client';

import { PlaySimpleIcon, VideoIcon } from './icons';

const VideoThumbnail = ({ src, autoLoadVideo }) => {
    // 使用 video 标签
    if (autoLoadVideo) {
        return  <div className="relative h-full">
            <video
                className="w-full h-full object-cover"
                preload="metadata"
                muted
            >
                <source src={src}/>
            </video>
            {/* 播放按钮覆盖层 */}
            <div
                className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                <PlaySimpleIcon className="w-8 h-8 text-white" />
            </div>
        </div>
    }

    // 使用 icon
    return (
        <div className={`flex items-center justify-center bg-gray-100 dark:bg-gray-800 w-full h-full`}>
            <div className="animate-pulse">
                <VideoIcon className="w-8 h-8 text-gray-400" />
            </div>
        </div>
    );
};

export default VideoThumbnail;
