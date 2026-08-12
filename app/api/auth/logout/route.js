import { NextResponse } from 'next/server';
import { AUTH_CONFIG } from '@/lib/auth-config';
import { destroySession, getSessionCookieOptions } from '@/lib/session';

export async function GET(request) {
    await destroySession(request);

    const response = NextResponse.json({ success: true });
    response.cookies.set(
        AUTH_CONFIG.SESSION_COOKIE_NAME,
        '',
        getSessionCookieOptions(new Date(0)),
    );

    return response;
}
