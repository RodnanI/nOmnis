// src/middleware.ts
import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
    // Skip middleware for static files
    const { pathname } = request.nextUrl;
    if (
        pathname.includes('.') || // Static files like .ico, .jpg, etc.
        pathname.startsWith('/api/socket') // Socket.io endpoint
    ) {
        return NextResponse.next();
    }

    // Define which paths need authentication
    const authPaths = ['/preferences', '/statistics', '/projects/file-uploader'];
    const path = request.nextUrl.pathname;

    // Check if the path requires auth
    const isAuthPath = authPaths.some(authPath =>
        path === authPath || path.startsWith(`${authPath}/`)
    );

    // Get authentication token
    const session = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
    });

    if (isAuthPath && !session) {
        // Redirect unauthenticated users to login
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('callbackUrl', request.url);
        return NextResponse.redirect(loginUrl);
    }

    // If at login page but already authenticated
    if (path === '/login' && session) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    return NextResponse.next();
}

// Specify which paths this middleware should run for
export const config = {
    matcher: [
        '/preferences/:path*', 
        '/statistics/:path*', 
        '/projects/:path*', 
        '/login',
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};