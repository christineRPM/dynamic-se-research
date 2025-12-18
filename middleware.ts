import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { clerkMiddleware } from '@clerk/nextjs/server';

export default clerkMiddleware(async (auth, request: NextRequest) => {
  // Create response
  const response = NextResponse.next();

  // Check if request is coming from ngrok
  const host = request.headers.get('host') || '';
  const isNgrok = host.includes('ngrok') || host.includes('ngrok-free.app') || host.includes('ngrok.io');
  
  // Skip CSP entirely for ngrok to avoid blocking issues
  // ngrok development doesn't need strict CSP
  if (!isNgrok) {
  // Add Content Security Policy header for Dynamic embedded wallets
    // Skip CSP for Next.js bundle files and static assets
    const pathname = request.nextUrl.pathname;
    const isBundleFile = pathname.includes('.bundle.js') || pathname.startsWith('/_next/');
    
    if (!isBundleFile) {
      // Standard CSP for production/localhost
    response.headers.set(
      'Content-Security-Policy',
        "default-src 'self' * 'unsafe-inline' 'unsafe-eval' data: blob:; " +
        "script-src 'self' * 'unsafe-inline' 'unsafe-eval' blob: data:; " +
        "connect-src 'self' * 'unsafe-inline'; " +
        "img-src 'self' * data: blob: 'unsafe-inline'; " +
        "frame-src 'self' *; " +
        "style-src 'self' * 'unsafe-inline'; " +
        "font-src 'self' * data: blob: 'unsafe-inline'; " +
        "worker-src 'self' * blob: data: 'unsafe-inline' 'unsafe-eval'; " +
        "child-src 'self' * blob: data:;"
    );
  }
  }
  // When using ngrok, no CSP is set - allowing all resources to load freely

  return response;
});

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