'use client';

import { useToastContext } from '@/context/ToastContext';

export default function TestToastPage() {
    const { showError, showSuccess, showWarning, showInfo, clearAllToasts } = useToastContext();

    const handleError = () => {
        showError('这是一个错误提示，3秒后自动消失！');
    };

    const handleSuccess = () => {
        showSuccess('操作成功！数据已保存。', 4000);
    };

    const handleWarning = () => {
        showWarning('警告：请检查您的输入内容。');
    };

    const handleInfo = () => {
        showInfo('提示：这是一条信息提示。');
    };

    const handleMultiple = () => {
        showError('错误提示');
        setTimeout(() => showWarning('警告提示'), 200);
        setTimeout(() => showSuccess('成功提示'), 400);
        setTimeout(() => showInfo('信息提示'), 600);
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
            <div className="max-w-2xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
                    Toast 全局提示测试页面
                </h1>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                        测试不同类型的 Toast 提示
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <button
                            onClick={handleError}
                            className="px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors font-medium"
                        >
                            显示错误提示
                        </button>

                        <button
                            onClick={handleSuccess}
                            className="px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors font-medium"
                        >
                            显示成功提示
                        </button>

                        <button
                            onClick={handleWarning}
                            className="px-4 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors font-medium"
                        >
                            显示警告提示
                        </button>

                        <button
                            onClick={handleInfo}
                            className="px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-medium"
                        >
                            显示信息提示
                        </button>
                    </div>

                    <div className="flex gap-4 mb-6">
                        <button
                            onClick={handleMultiple}
                            className="px-4 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors font-medium flex-1"
                        >
                            显示多个提示（测试堆叠）
                        </button>

                        <button
                            onClick={clearAllToasts}
                            className="px-4 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium"
                        >
                            清除所有提示
                        </button>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                            使用方法：
                        </h3>
                        <div className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
                            <p><code className="bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded">showError(message, duration?)</code> - 显示错误提示</p>
                            <p><code className="bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded">showSuccess(message, duration?)</code> - 显示成功提示</p>
                            <p><code className="bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded">showWarning(message, duration?)</code> - 显示警告提示</p>
                            <p><code className="bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded">showInfo(message, duration?)</code> - 显示信息提示</p>
                            <p><code className="bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded">clearAllToasts()</code> - 清除所有提示</p>
                        </div>
                    </div>

                    <div className="mt-6 text-center">
                        <a
                            href="/media"
                            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                        >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
                            </svg>
                            返回媒体浏览器
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
