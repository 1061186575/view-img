'use client';

import { createContext, useContext, useState, useCallback } from 'react';
import Toast from '@/components/Toast';

const ToastContext = createContext();

let toastId = 0;

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    const addToast = useCallback((message, type = 'error', duration = 3000) => {
        const id = ++toastId;
        const toast = {
            id,
            message,
            type,
            duration
        };

        setToasts(prev => [...prev, toast]);

        // 返回一个可以手动关闭 toast 的函数
        return () => removeToast(id);
    }, [removeToast]);

    // 封装常用的 toast 方法
    const showError = useCallback((message, duration = 3000) => {
        return addToast(message, 'error', duration);
    }, [addToast]);

    const showSuccess = useCallback((message, duration = 2000) => {
        return addToast(message, 'success', duration);
    }, [addToast]);

    const showWarning = useCallback((message, duration = 3000) => {
        return addToast(message, 'warning', duration);
    }, [addToast]);

    const showInfo = useCallback((message, duration = 3000) => {
        return addToast(message, 'info', duration);
    }, [addToast]);

    const clearAllToasts = useCallback(() => {
        setToasts([]);
    }, []);

    const value = {
        addToast,
        removeToast,
        showError,
        showSuccess,
        showWarning,
        showInfo,
        clearAllToasts
    };

    return (
        <ToastContext.Provider value={value}>
            {children}

            {/* Toast 容器 - 固定定位在页面顶部中央 */}
            {toasts.length > 0 && (
                <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-[9999] pointer-events-none">
                    <div className="flex flex-col items-center space-y-3 pointer-events-auto">
                        {toasts.map(toast => (
                            <Toast
                                key={toast.id}
                                id={toast.id}
                                message={toast.message}
                                type={toast.type}
                                duration={toast.duration}
                                onClose={removeToast}
                            />
                        ))}
                    </div>
                </div>
            )}
        </ToastContext.Provider>
    );
};

export const useToastContext = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToastContext must be used within a ToastProvider');
    }
    return context;
};
