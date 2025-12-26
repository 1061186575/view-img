'use client';

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
                <svg className="w-8 h-8 text-white"
                     fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                </svg>
            </div>
        </div>
    }

    // 使用 icon
    return (
        <div className={`flex items-center justify-center bg-gray-100 dark:bg-gray-800 w-full h-full`}>
            <div className="animate-pulse">
                <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
            </div>
        </div>
    );
};

export default VideoThumbnail;
