import Link from 'next/link';
import { ImageIcon, VideoIcon, ArchiveIcon, ServerIcon, SettingsIcon } from '@/components/icons';

export default function Home() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
            {/* 头部导航 */}
            <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                            图片视频预览站
                        </h1>
                        <nav className="flex items-center space-x-4">
                            <Link
                                href="/media"
                                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                            >
                                媒体库
                            </Link>
                        </nav>
                    </div>
                </div>
            </header>

            {/* 主内容区域 */}
            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="text-center">
                    {/* Hero Section */}
                    <div className="mb-12">
                        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-6">
                            欢迎使用
                            <span className="block text-blue-600 dark:text-blue-400">媒体预览站</span>
                        </h1>
                        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
                            一个简洁、优雅的在线图片和视频预览平台。支持文件夹管理、全屏预览、响应式设计，让您的媒体文件管理变得简单高效。
                        </p>
                    </div>

                    {/* 功能特性 */}
                    <div className="grid md:grid-cols-3 gap-8 mb-12">
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mx-auto mb-4">
                                <ImageIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">图片预览</h3>
                            <p className="text-gray-600 dark:text-gray-400">支持 JPG、PNG、GIF、WebP 等多种格式，点击放大查看高清图片</p>
                        </div>

                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mx-auto mb-4">
                                <VideoIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">视频播放</h3>
                            <p className="text-gray-600 dark:text-gray-400">支持 MP4、WebM、MOV 等格式，内置播放器支持全屏和进度控制</p>
                        </div>

                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mx-auto mb-4">
                                <ArchiveIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">文件夹管理</h3>
                            <p className="text-gray-600 dark:text-gray-400">支持无限层级的文件夹嵌套，URL同步，刷新页面保持当前位置</p>
                        </div>
                    </div>

                    {/* CTA按钮 */}
                    <div className="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
                        <Link
                            href="/media"
                            className="inline-flex items-center px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                        >
                            <ServerIcon className="w-5 h-5 mr-2" />
                            进入媒体库
                        </Link>

                        <a
                            href="#features"
                            className="inline-flex items-center px-8 py-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-medium rounded-lg shadow-lg hover:shadow-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
                        >
                            了解更多
                        </a>
                    </div>
                </div>

                {/* 使用说明 */}
                <div id="features" className="mt-20">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-12">
                        如何使用
                    </h2>

                    <div className="space-y-8">
                        <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg">
                            <div className="flex items-start space-x-4">
                                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                                    <span className="text-blue-600 dark:text-blue-400 font-semibold">1</span>
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                        上传媒体文件
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-400">
                                        将您的图片和视频文件放入 <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">public/media/</code> 目录中。支持创建子文件夹来组织您的文件。
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg">
                            <div className="flex items-start space-x-4">
                                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                                    <span className="text-blue-600 dark:text-blue-400 font-semibold">2</span>
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                        浏览和管理
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-400">
                                        点击进入媒体库，通过网格视图浏览所有文件。点击文件夹可以深入查看，面包屑导航帮您快速定位。
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg">
                            <div className="flex items-start space-x-4">
                                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                                    <span className="text-blue-600 dark:text-blue-400 font-semibold">3</span>
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                        预览和分享
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-400">
                                        点击图片放大查看，点击视频直接播放。URL会自动更新，您可以复制链接分享特定文件夹给他人。
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
