import { NextResponse } from 'next/server';
import { AUTH_CONFIG, validateAuthConfig } from '@/lib/auth-config';
import {
    createSession,
    getSessionCookieOptions,
    getSignedSessionCookie,
} from '@/lib/session';

export async function POST(request) {
    try {
        validateAuthConfig();

        if (!AUTH_CONFIG.LOGIN_REQUIRED) {
            return NextResponse.json({ success: true });
        }

        const { username, password } = await request.json();

        if (username !== AUTH_CONFIG.USERNAME || password !== AUTH_CONFIG.PASSWORD) {
            return NextResponse.json(
                { error: '用户名或密码错误' },
                { status: 401 },
            );
        }

        const { sessionId, expires } = await createSession(username);
        const response = NextResponse.json({ success: true });

        response.cookies.set(
            AUTH_CONFIG.SESSION_COOKIE_NAME,
            getSignedSessionCookie(sessionId),
            getSessionCookieOptions(expires),
        );

        return response;
    } catch (error) {
        console.error('登录失败:', error);
        return NextResponse.json(
            { error: '登录服务配置错误' },
            { status: 500 },
        );
    }
}
