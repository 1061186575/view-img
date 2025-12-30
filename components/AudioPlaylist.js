'use client';

import { PlayIcon, MoreIcon } from './icons';

export default function AudioPlaylist({
    items = [],
    currentItem = {},
    onItemSelect = () => {},
    className = ''
}) {
    if (!items.length) {
        return (
            <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 ${className}`}>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">播放列表</h3>
                <div className="text-center text-gray-500 dark:text-gray-400">
                    没有找到音频文件
                </div>
            </div>
        );
    }

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatDuration = (seconds) => {
        if (!seconds) return '';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg ${className}`}>
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    播放列表 ({items.length})
                </h3>
            </div>

            <div className="max-h-96 overflow-y-auto">
                {items.map((item, index) => {
                    const isCurrentItem = currentItem.name === item.name;

                    return (
                        <div
                            key={item.name}
                            onClick={() => onItemSelect(item)}
                            className={`
                                flex items-center space-x-3 p-4 cursor-pointer transition-colors
                                hover:bg-gray-50 dark:hover:bg-gray-700
                                ${isCurrentItem
                                    ? 'bg-blue-50 dark:bg-blue-900/20 border-r-4 border-blue-500'
                                    : ''
                                }
                                ${index !== items.length - 1 ? 'border-b border-gray-100 dark:border-gray-700' : ''}
                            `}
                        >
                            {/* 播放状态图标 */}
                            <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
                                {isCurrentItem ? (
                                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                                        <PlayIcon className="w-3 h-3 text-white" />
                                    </div>
                                ) : (
                                    <div className={`
                                        w-6 h-6 rounded-full border-2 border-gray-300 dark:border-gray-600
                                        flex items-center justify-center text-gray-400 dark:text-gray-500
                                        group-hover:border-blue-400 group-hover:text-blue-400 transition-colors
                                    `}>
                                        <PlayIcon className="w-3 h-3" />
                                    </div>
                                )}
                            </div>

                            {/* 文件信息 */}
                            <div className="flex-1 min-w-0">
                                <div className={`
                                    font-medium truncate
                                    ${isCurrentItem
                                        ? 'text-blue-900 dark:text-blue-100'
                                        : 'text-gray-900 dark:text-white'
                                    }
                                `}>
                                    {item.name}
                                </div>

                                <div className={`
                                    text-sm truncate mt-1
                                    ${isCurrentItem
                                        ? 'text-blue-700 dark:text-blue-300'
                                        : 'text-gray-500 dark:text-gray-400'
                                    }
                                `}>
                                    {formatFileSize(item.size)}
                                </div>
                            </div>

                            {/* 更多操作按钮 */}
                            <div className="flex-shrink-0">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        // 这里可以添加更多操作，如下载、删除等
                                    }}
                                    className={`
                                        p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity
                                        hover:bg-gray-200 dark:hover:bg-gray-600
                                        ${isCurrentItem ? 'opacity-100' : ''}
                                    `}
                                >
                                    <MoreIcon className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* 播放列表底部信息 */}
            {items.length > 0 && (
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400">
                    共 {items.length} 首歌曲
                    {items.reduce((total, item) => total + (item.size || 0), 0) > 0 && (
                        <span> · 总大小 {formatFileSize(items.reduce((total, item) => total + (item.size || 0), 0))}</span>
                    )}
                </div>
            )}
        </div>
    );
}