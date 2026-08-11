import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { AUTH_CONFIG, validateAuthConfig } from '@/lib/auth-config';

function createSignature(sessionId) {
    return crypto
        .createHmac('sha256', AUTH_CONFIG.SESSION_SECRET)
        .update(sessionId)
        .digest('base64')
        .replace(/=+$/, '');
}

function parseSignedSessionId(cookieValue) {
    if (!cookieValue) return null;

    let decodedValue;

    try {
        decodedValue = decodeURIComponent(cookieValue);
    } catch {
        return null;
    }

    if (!decodedValue.startsWith('s:')) return null;

    const signedValue = decodedValue.slice(2);
    const separatorIndex = signedValue.lastIndexOf('.');

    if (separatorIndex <= 0) return null;

    const sessionId = signedValue.slice(0, separatorIndex);
    const signature = signedValue.slice(separatorIndex + 1);
    const expectedSignature = createSignature(sessionId);
    const signatureBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);

    if (
        signatureBuffer.length !== expectedBuffer.length ||
        !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
    ) {
        return null;
    }

    return sessionId;
}

function getSessionFilePath(sessionId) {
    if (!/^[a-zA-Z0-9_-]+$/.test(sessionId)) return null;
    return path.join(AUTH_CONFIG.SESSION_CACHE_PATH, `${sessionId}.json`);
}

export function getSignedSessionCookie(sessionId) {
    validateAuthConfig();
    return `s:${sessionId}.${createSignature(sessionId)}`;
}

export async function createSession(username) {
    validateAuthConfig();

    const sessionId = crypto.randomBytes(24).toString('base64url');
    const expires = new Date(Date.now() + AUTH_CONFIG.SESSION_MAX_AGE);
    const session = {
        cookie: {
            originalMaxAge: AUTH_CONFIG.SESSION_MAX_AGE,
            expires: expires.toISOString(),
            secure: false,
            httpOnly: true,
            path: '/',
            sameSite: 'lax',
        },
        authenticated: true,
        userInfo: {
            time: Date.now(),
            msg: '登录成功',
        },
        user: {
            username,
        },
        __lastAccess: Date.now(),
    };

    await fs.mkdir(AUTH_CONFIG.SESSION_CACHE_PATH, { recursive: true });
    await fs.writeFile(
        getSessionFilePath(sessionId),
        JSON.stringify(session),
        { encoding: 'utf8', mode: 0o600 },
    );

    return { sessionId, expires };
}

export async function getAuthenticatedSession(request) {
    if (!AUTH_CONFIG.LOGIN_REQUIRED) return null;

    validateAuthConfig();

    const cookieValue = request.cookies.get(AUTH_CONFIG.SESSION_COOKIE_NAME)?.value;
    const sessionId = parseSignedSessionId(cookieValue);
    const sessionFilePath = sessionId ? getSessionFilePath(sessionId) : null;

    if (!sessionFilePath) return null;

    try {
        const session = JSON.parse(await fs.readFile(sessionFilePath, 'utf8'));
        const expiresAt = new Date(session.cookie?.expires).getTime();

        const isAuthenticated = session.authenticated === true || Boolean(session.userInfo);

        if (!isAuthenticated || !Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
            await fs.rm(sessionFilePath, { force: true });
            return null;
        }

        return { sessionId, session };
    } catch (error) {
        if (error.code !== 'ENOENT') {
            console.error('读取登录 Session 失败:', error);
        }
        return null;
    }
}

export async function destroySession(request) {
    const cookieValue = request.cookies.get(AUTH_CONFIG.SESSION_COOKIE_NAME)?.value;
    const sessionId = parseSignedSessionId(cookieValue);
    const sessionFilePath = sessionId ? getSessionFilePath(sessionId) : null;

    if (sessionFilePath) {
        await fs.rm(sessionFilePath, { force: true });
    }
}

export function getSessionCookieOptions(expires) {
    return {
        path: '/',
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        expires,
        ...(AUTH_CONFIG.SESSION_COOKIE_DOMAIN
            ? { domain: AUTH_CONFIG.SESSION_COOKIE_DOMAIN }
            : {}),
    };
}
