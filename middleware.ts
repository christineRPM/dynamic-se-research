import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Create response
  const response = NextResponse.next();

  // Add Content Security Policy header for Dynamic embedded wallets
  // Skip CSP for Next.js bundle files
  if (!request.nextUrl.pathname.match(/\.bundle\.js$|^\/_next\//)) {
    response.headers.set(
      'Content-Security-Policy',
      "default-src 'self' * 'unsafe-inline' 'unsafe-eval' data: blob:; script-src 'self' * 'unsafe-inline' 'unsafe-eval' blob: data:; connect-src 'self' * 'unsafe-inline'; img-src 'self' * data: blob: 'unsafe-inline'; frame-src 'self' *; style-src 'self' * 'unsafe-inline'; worker-src 'self' * blob: data: 'unsafe-inline' 'unsafe-eval'; child-src 'self' * blob: data:;"
    );
  }

  return response;
}

// Configure which paths the middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next|.*\\.bundle\\.js|favicon.ico).*)',
  ],
}; 