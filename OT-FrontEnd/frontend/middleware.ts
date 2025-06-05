import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Public routes that don't require authentication
const publicRoutes = [
  '/',                // Landing page
  '/sign-in',         // Auth pages
  '/sign-up',
  '/api/',            // API routes for auth
  '/_next',           // Next.js system routes
  '/favicon.ico',     // Assets
  '/images/',
  '/fonts/',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get('session');
  
  // Check if the current path is a public route
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(route)
  );

  // If not a public route and no session cookie, redirect to sign-in
  if (!isPublicRoute && !sessionCookie) {
    const signInUrl = new URL('/sign-in', request.url);
    // Add the current path as redirect parameter
    signInUrl.searchParams.set('redirect', encodeURIComponent(pathname));
    return NextResponse.redirect(signInUrl);
  }

  // Otherwise, proceed with the request
  return NextResponse.next();
}

export const config = {
  // Match all routes except those that contain the specified patterns
  matcher: ['/((?!api|_next/static|_next/image|images|favicon.ico).*)'],
};