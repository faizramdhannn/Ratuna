import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Public routes
  if (pathname === '/login' || pathname === '/register' || pathname === '/') {
    return NextResponse.next();
  }

  // Protected routes
  if (pathname.startsWith('/dashboard')) {
    const token = request.cookies.get('auth-token');

    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
      const secret = new TextEncoder().encode(
        process.env.JWT_SECRET || 'fallback-secret-key'
      );
      
      await jwtVerify(token.value, secret);
      return NextResponse.next();
    } catch (error) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/register'],
};