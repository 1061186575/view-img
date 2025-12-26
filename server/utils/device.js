/**
 * 设备检测相关工具函数
 */

/**
 * 检测是否为PC端设备
 * @returns {boolean} 如果是PC端返回true，移动端返回false
 */
export const checkIsPC = () => {
    if (typeof window === 'undefined') {
        // 服务端渲染时返回默认值
        return false;
    }

    const userAgent = navigator.userAgent;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    const isTablet = /iPad/i.test(userAgent);

    // iPad被视为PC端设备（用户体验更接近PC）
    return !isMobile || isTablet;
};

/**
 * 获取设备类型信息
 * @returns {object} 包含设备类型详细信息的对象
 */
export const getDeviceInfo = () => {
    if (typeof window === 'undefined') {
        return {
            isPC: false,
            isMobile: true,
            isTablet: false,
            userAgent: ''
        };
    }

    const userAgent = navigator.userAgent;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    const isTablet = /iPad/i.test(userAgent);
    const isPC = !isMobile || isTablet;

    return {
        isPC,
        isMobile: !isPC,
        isTablet,
        userAgent
    };
};