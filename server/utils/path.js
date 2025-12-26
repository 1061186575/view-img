/**
 * 路径处理相关工具函数
 */

/**
 * 生成面包屑导航数据
 * @param {string} currentPath - 当前路径
 * @returns {Array} 面包屑数组
 */
export const generateBreadcrumbs = (currentPath) => {
    if (!currentPath) return [{ name: '根目录', path: '' }];

    const parts = currentPath.split('/').filter(part => part.length > 0);
    const breadcrumbs = [{ name: '根目录', path: '' }];

    let currentBreadcrumbPath = '';
    parts.forEach(part => {
        currentBreadcrumbPath += (currentBreadcrumbPath ? '/' : '') + part;
        breadcrumbs.push({
            name: part,
            path: currentBreadcrumbPath
        });
    });

    return breadcrumbs;
};

/**
 * 获取父级路径
 * @param {string} currentPath - 当前路径
 * @returns {string} 父级路径
 */
export const getParentPath = (currentPath) => {
    const pathParts = currentPath.split('/').filter(part => part.length > 0);
    if (pathParts.length > 0) {
        pathParts.pop();
        return pathParts.join('/');
    }
    return '';
};

/**
 * 标准化路径，移除多余的斜杠和空格
 * @param {string} path - 路径字符串
 * @returns {string} 标准化后的路径
 */
export const normalizePath = (path) => {
    if (!path) return '';

    return path
        .trim()
        .replace(/\/+/g, '/') // 替换多个连续斜杠为单个斜杠
        .replace(/^\/+|\/+$/g, ''); // 移除开头和结尾的斜杠
};

/**
 * 检查路径是否有效（安全性检查）
 * @param {string} path - 路径字符串
 * @returns {boolean} 路径是否有效
 */
export const isValidPath = (path) => {
    if (!path) return true; // 空路径是有效的（根目录）

    // 不允许包含危险字符
    const dangerousPatterns = [
        /\.\./,  // 不允许 ..
        /^\/+/,  // 不允许以斜杠开始
        /[<>:"|?*]/  // 不允许文件名中的非法字符
    ];

    return !dangerousPatterns.some(pattern => pattern.test(path));
};