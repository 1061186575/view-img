/**
 * 格式化相关工具函数
 */

/**
 * 格式化文件大小，将字节数转换为可读格式
 * @param {number} bytes - 文件大小（字节）
 * @returns {string} 格式化后的文件大小字符串
 */
export const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * 格式化时间为短格式显示
 * @param {Date|string|number} date - 日期对象、日期字符串或时间戳
 * @returns {string} 短格式时间字符串
 */
export const formatShortTime = (date) => {
    const target = new Date(date);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const targetDate = new Date(target.getFullYear(), target.getMonth(), target.getDate());

    // 如果是今天
    if (targetDate.getTime() === today.getTime()) {
        return target.toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // 如果是今年
    if (target.getFullYear() === now.getFullYear()) {
        return target.toLocaleDateString('zh-CN', {
            month: '2-digit',
            day: '2-digit'
        });
    }

    // 其他年份
    return target.toLocaleDateString('zh-CN', {
        year: '2-digit',
        month: '2-digit',
        day: '2-digit'
    });
};
