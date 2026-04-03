import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl;

  // Basic mobile detection
  const userAgent = request.headers.get('user-agent') || '';
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);

  // If mobile user visits root '/', redirect to mobile welcome
  if (url.pathname === '/' && isMobile) {
    const redirectUrl = new URL('/m/welcome', request.url);
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/'],
};
