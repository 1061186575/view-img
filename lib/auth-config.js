import path from 'path';

const loginRequired = process.env.LOGIN_REQUIRED?.toLowerCase() === 'true';

export const AUTH_CONFIG = {
    LOGIN_REQUIRED: loginRequired,
    USERNAME: process.env.LOGIN_USERNAME || '',
    PASSWORD: process.env.LOGIN_PASSWORD || '',
    SESSION_CACHE_PATH: path.resolve(process.env.SESSION_CACHE_PATH || 'sessionsCache'),
    SESSION_SECRET: process.env.SESSION_SECRET || '',
    SESSION_COOKIE_NAME: process.env.SESSION_COOKIE_NAME || 'rpi_sid',
    SESSION_COOKIE_DOMAIN: process.env.SESSION_COOKIE_DOMAIN || undefined,
    SESSION_MAX_AGE: 1000 * 60 * 60 * 50,
};

export function validateAuthConfig() {
    if (!AUTH_CONFIG.LOGIN_REQUIRED) {
        return;
    }

    const missingConfig = [];

    if (!AUTH_CONFIG.USERNAME) missingConfig.push('LOGIN_USERNAME');
    if (!AUTH_CONFIG.PASSWORD) missingConfig.push('LOGIN_PASSWORD');
    if (!AUTH_CONFIG.SESSION_SECRET) missingConfig.push('SESSION_SECRET');

    if (missingConfig.length > 0) {
        throw new Error(`登录功能缺少环境变量: ${missingConfig.join(', ')}`);
    }
}
