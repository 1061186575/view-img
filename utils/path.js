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
