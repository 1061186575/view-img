import { NextResponse } from 'next/server';
import { AUTH_CONFIG } from './lib/auth-config';
import { getAuthenticatedSession } from './lib/session';

const publicPaths = new Set([
    '/login',
    '/api/auth/login',
]);

export async function proxy(request) {
    if (!AUTH_CONFIG.LOGIN_REQUIRED || publicPaths.has(request.nextUrl.pathname)) {
        return NextResponse.next();
    }

    try {
        const authenticatedSession = await getAuthenticatedSession(request);

        if (authenticatedSession) {
            return NextResponse.next();
        }
    } catch (error) {
        console.error('登录鉴权配置错误:', error);
    }

    if (request.nextUrl.pathname.startsWith('/api/')) {
        return NextResponse.json(
            { error: '未登录或登录已过期' },
            { status: 401 },
        );
    }

    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', `${request.nextUrl.pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(loginUrl);
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.[^/]+$).*)'],
};
