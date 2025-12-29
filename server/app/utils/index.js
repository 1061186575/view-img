/**
 * 获取当前页面的 URL 查询参数
 * @returns {Object} 参数对象
 */
export function getURLParams(queryString = '') {
    if (typeof window === 'undefined') {
        return {};
    }

    if (!queryString) {
        queryString = window.location.search;
    }

    const searchParams = new URLSearchParams(queryString);
    const params = {};

    for (const [key, value] of searchParams.entries()) {
        params[key] = value;
    }

    return params;
}

export function getLocation() {
    if (typeof window === 'undefined') {
        return {};
    }
    return window.location;
}
