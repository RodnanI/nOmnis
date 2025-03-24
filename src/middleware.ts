// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This middleware ensures the Socket.io endpoint is accessible but still secured
export function middleware(request: NextRequest) {
  // Handle Socket.io specifically
  if (request.nextUrl.pathname.startsWith('/api/socket')) {
    // Allow the connection, authentication happens in the socket server
    return NextResponse.next();
  }

  // For all other routes, use your existing middleware logic
  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: ['/api/socket/:path*'],
};