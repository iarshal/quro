import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl;
  
  // Basic mobile detection
  const userAgent = request.headers.get('user-agent') || '';
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);

  // If mobile user visits root '/', redirect to mobile welcome or home
  if (url.pathname === '/' && isMobile) {
    // Check if they are already logged in (you'd check a session cookie here in production)
    // For now, redirect to mobile welcome screen
    url.pathname = '/m/welcome';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/'],
};
