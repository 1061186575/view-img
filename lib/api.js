// 通用API请求函数，使用HTTP状态码判断
export const apiRequest = async (url, options = {}) => {
    try {
        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            ...options,
        });

        // 检查HTTP状态码
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `请求失败 (${response.status})`);
        }

        const data = await response.json();
        return {
            success: true,
            data: data,
        };

    } catch (error) {
        console.error('API Request Error:', error);

        // 如果是网络错误或解析错误
        if (!error.message) {
            throw new Error('网络连接异常，请检查网络后重试');
        }

        throw error;
    }
};

// 专门用于媒体API的请求函数
export const getMediaDirectory = async (folderPath = '', page = 1, limit = 100) => {
    const params = new URLSearchParams({
        folder: folderPath,
        page: page.toString(),
        limit: limit.toString()
    });
    return apiRequest(`/api/media?${params.toString()}`);
};
