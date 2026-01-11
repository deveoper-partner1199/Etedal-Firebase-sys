import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Protected routes that require authentication
const protectedRoutes = ['/dashboard'];

// Auth routes that should redirect to dashboard if user is already authenticated
const authRoutes = ['/login'];

// Public routes that don't require authentication
const publicRoutes = ['/'];

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Get the auth token from cookies
    const authToken = request.cookies.get('auth_token');
    const isAuthenticated = !!authToken?.value;

    // Check if the current path is a protected route
    const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));

    // Check if the current path is an auth route
    const isAuthRoute = authRoutes.some((route) => pathname === route);

    // Check if the current path is a public route
    const isPublicRoute = publicRoutes.some((route) => pathname === route);

    // If user is authenticated and trying to access auth routes (like /login)
    // Redirect to dashboard
    if (isAuthenticated && isAuthRoute) {
        const url = request.nextUrl.clone();
        url.pathname = '/dashboard';
        return NextResponse.redirect(url);
    }

    // If user is not authenticated and trying to access protected routes
    // Redirect to login
    if (!isAuthenticated && isProtectedRoute) {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        // Add the original path as a query parameter so we can redirect back after login
        // url.searchParams.set('redirect', pathname);
        return NextResponse.redirect(url);
    }

    // If user is authenticated and trying to access root path, redirect to dashboard
    if (isAuthenticated && isPublicRoute && pathname === '/') {
        const url = request.nextUrl.clone();
        url.pathname = '/dashboard';
        return NextResponse.redirect(url);
    }

    // Allow the request to proceed
    return NextResponse.next();
}

// Configure which routes the middleware should run on
export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public files (public folder)
         */
        '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
