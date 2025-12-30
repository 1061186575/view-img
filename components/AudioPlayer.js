'use client';

import { useState, useEffect, useRef } from 'react';
import {
    PreviousIcon,
    NextIcon,
    ShuffleIcon,
    RepeatIcon,
    PlayIcon,
    PauseIcon,
    VolumeIcon
} from './icons';

// 播放模式常量
const PLAY_MODES = {
    SEQUENTIAL: 'sequential', // 顺序播放
    LOOP: 'loop', // 列表循环
    RANDOM: 'random', // 随机播放
    SINGLE_LOOP: 'single_loop' // 单曲循环
};

export default function AudioPlayer({
    items = [],
    currentItem = {},
    onCurrentItemChange = () => {},
    className = ''
}) {
    const audioRef = useRef(null);
    const [playMode, setPlayMode] = useState(PLAY_MODES.SEQUENTIAL);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(0.8);

    // 获取当前播放项的索引
    const currentIndex = items.findIndex(item => item.name === currentItem.name);

    // 播放模式图标和标题
    const getModeIcon = (mode) => {
        switch (mode) {
            case PLAY_MODES.SEQUENTIAL:
                return <PreviousIcon className="w-5 h-5" />;
            case PLAY_MODES.LOOP:
                return <RepeatIcon className="w-5 h-5" />;
            case PLAY_MODES.RANDOM:
                return <ShuffleIcon className="w-5 h-5" />;
            case PLAY_MODES.SINGLE_LOOP:
                return <RepeatIcon className="w-5 h-5" />;
            default:
                return null;
        }
    };

    const getModeTitle = (mode) => {
        switch (mode) {
            case PLAY_MODES.SEQUENTIAL:
                return '顺序播放';
            case PLAY_MODES.LOOP:
                return '列表循环';
            case PLAY_MODES.RANDOM:
                return '随机播放';
            case PLAY_MODES.SINGLE_LOOP:
                return '单曲循环';
            default:
                return '';
        }
    };

    // 切换播放模式
    const togglePlayMode = () => {
        const modes = Object.values(PLAY_MODES);
        const currentModeIndex = modes.indexOf(playMode);
        const nextModeIndex = (currentModeIndex + 1) % modes.length;
        setPlayMode(modes[nextModeIndex]);
    };

    // 获取下一首歌曲
    const getNextTrack = () => {
        if (!items.length || currentIndex === -1) return null;

        switch (playMode) {
            case PLAY_MODES.SEQUENTIAL:
                return currentIndex < items.length - 1 ? items[currentIndex + 1] : null;

            case PLAY_MODES.LOOP:
                return items[(currentIndex + 1) % items.length];

            case PLAY_MODES.RANDOM:
                if (items.length === 1) return items[0];
                let randomIndex;
                do {
                    randomIndex = Math.floor(Math.random() * items.length);
                } while (randomIndex === currentIndex);
                return items[randomIndex];

            case PLAY_MODES.SINGLE_LOOP:
                return items[currentIndex];

            default:
                return null;
        }
    };

    // 获取上一首歌曲
    const getPrevTrack = () => {
        if (!items.length || currentIndex === -1) return null;

        switch (playMode) {
            case PLAY_MODES.SEQUENTIAL:
                return currentIndex > 0 ? items[currentIndex - 1] : null;

            case PLAY_MODES.LOOP:
                return items[currentIndex === 0 ? items.length - 1 : currentIndex - 1];

            case PLAY_MODES.RANDOM:
                if (items.length === 1) return items[0];
                let randomIndex;
                do {
                    randomIndex = Math.floor(Math.random() * items.length);
                } while (randomIndex === currentIndex);
                return items[randomIndex];

            case PLAY_MODES.SINGLE_LOOP:
                return items[currentIndex];

            default:
                return null;
        }
    };

    // 播放下一首
    const playNext = () => {
        const nextTrack = getNextTrack();
        if (nextTrack) {
            onCurrentItemChange(nextTrack);
        }
    };

    // 播放上一首
    const playPrev = () => {
        const prevTrack = getPrevTrack();
        if (prevTrack) {
            onCurrentItemChange(prevTrack);
        }
    };

    // 播放/暂停
    const togglePlayPause = () => {
        if (!audioRef.current || !currentItem.url) return;

        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
    };

    // 时间格式化
    const formatTime = (seconds) => {
        if (isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // 音频事件处理
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const handleLoadedMetadata = () => {
            setDuration(audio.duration);
        };

        const handleTimeUpdate = () => {
            setCurrentTime(audio.currentTime);
        };

        const handlePlay = () => {
            setIsPlaying(true);
        };

        const handlePause = () => {
            setIsPlaying(false);
        };

        const handleEnded = () => {
            setIsPlaying(false);
            // 播放结束时自动播放下一首
            playNext();
        };

        audio.addEventListener('loadedmetadata', handleLoadedMetadata);
        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('play', handlePlay);
        audio.addEventListener('pause', handlePause);
        audio.addEventListener('ended', handleEnded);

        return () => {
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('play', handlePlay);
            audio.removeEventListener('pause', handlePause);
            audio.removeEventListener('ended', handleEnded);
        };
    }, [currentItem]);

    // 更新音量
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume;
        }
    }, [volume]);

    if (!currentItem.url) {
        return (
            <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 ${className}`}>
                <div className="text-center text-gray-500 dark:text-gray-400">
                    请选择要播放的音频文件
                </div>
            </div>
        );
    }

    return (
        <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 ${className}`}>
            {/* 音频元素 */}
            <audio
                ref={audioRef}
                src={currentItem.url}
                preload="metadata"
                autoPlay={true}
            />

            {/* 当前播放信息 */}
            <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 truncate">
                    {currentItem.name}
                </h3>

                {/* 进度条 */}
                <div className="mb-4">
                    <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
                        <span>{formatTime(currentTime)}</span>
                        <span className="flex-1 text-center">{currentItem.name}</span>
                        <span>{formatTime(duration)}</span>
                    </div>

                    {/* 交互式进度条 */}
                    <div className="relative">
                        <input
                            type="range"
                            min="0"
                            max={duration || 0}
                            value={currentTime}
                            onChange={(e) => {
                                const audio = audioRef.current;
                                if (audio) {
                                    audio.currentTime = e.target.value;
                                    setCurrentTime(parseFloat(e.target.value));
                                }
                            }}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700
                                     [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                                     [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500
                                     [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-md
                                     [&::-webkit-slider-thumb]:hover:bg-blue-600 [&::-webkit-slider-thumb]:transition-colors
                                     [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full
                                     [&::-moz-range-thumb]:bg-blue-500 [&::-moz-range-thumb]:cursor-pointer
                                     [&::-moz-range-thumb]:border-none [&::-moz-range-thumb]:shadow-md
                                     hover:[&::-moz-range-thumb]:bg-blue-600"
                            style={{
                                background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${duration ? (currentTime / duration) * 100 : 0}%, #e5e7eb ${duration ? (currentTime / duration) * 100 : 0}%, #e5e7eb 100%)`
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* 控制按钮 */}
            <div className="flex items-center justify-center space-x-4 mb-4">
                {/* 上一首 */}
                <button
                    onClick={playPrev}
                    disabled={!getPrevTrack()}
                    className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <PreviousIcon className="w-6 h-6" />
                </button>

                {/* 播放/暂停 */}
                <button
                    onClick={togglePlayPause}
                    className="p-3 rounded-full bg-blue-500 hover:bg-blue-600 text-white transition-colors"
                >
                    {isPlaying ? (
                        <PauseIcon className="w-8 h-8" />
                    ) : (
                        <PlayIcon className="w-8 h-8" />
                    )}
                </button>

                {/* 下一首 */}
                <button
                    onClick={playNext}
                    disabled={!getNextTrack()}
                    className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <NextIcon className="w-6 h-6" />
                </button>
            </div>

            {/* 底部控制栏 */}
            <div className="flex items-center justify-between">
                {/* 播放模式 */}
                <button
                    onClick={togglePlayMode}
                    className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    title={getModeTitle(playMode)}
                >
                    {getModeIcon(playMode)}
                    <span className="text-sm">{getModeTitle(playMode)}</span>
                </button>

                {/* 音量控制 */}
                <div className="flex items-center space-x-2">
                    <VolumeIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={volume}
                        onChange={(e) => setVolume(parseFloat(e.target.value))}
                        className="w-20 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                    />
                    <span className="text-sm text-gray-500 dark:text-gray-400 min-w-[3rem]">
                        {Math.round(volume * 100)}%
                    </span>
                </div>
            </div>
        </div>
    );
}
