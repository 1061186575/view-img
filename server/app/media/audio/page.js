'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import 'react-photo-view/dist/react-photo-view.css';
import { getMediaDirectory } from '@/lib/api';

export default function AudioPage() {

    const searchParams = useSearchParams();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [curPlayItem, setCurPlayItem] = useState({});

    // 加载目录内容
    const loadDirectory = async (path = '') => {
        setLoading(true);
        try {
            const result = await getMediaDirectory(path);

            if (result.success) {
                const items = result.data.items.filter(item => item.type === 'audio')
                setItems(items);

                const audioName = searchParams.get('audioName') || '';
                const curItem = items.find(item => item.name === audioName) || {}
                setCurPlayItem(curItem)
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
    }, []);


    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* 头部导航 */}
            <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                            媒体预览器
                        </h1>


                    </div>
                </div>
            </header>

            {/* 主内容区域 */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <button
                    onClick={() => {
                        history.back()
                    }}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors cursor-pointer"
                >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
                    </svg>
                    返回上级
                </button>

                {/*播放列表*/}
                <div style={{}}>
                    {items.map(item => {
                        return (
                            <div key={item.name} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                                <button
                                    className="text-lg font-semibold text-gray-900 dark:text-white mb-2 cursor-pointer"
                                    onClick={() => {
                                        setCurPlayItem(item)
                                    }}>
                                    {item.name}
                                </button>
                            </div>
                        )
                    })}
                </div>

                {/*当前播放项*/}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        当前播放项: {curPlayItem.name}
                    </h2>
                    <audio controls className="w-full" src={curPlayItem.url}>
                    </audio>
                </div>
            </main>
        </div>
    );
}
