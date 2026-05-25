import { auth } from '@/lib/auth/server';
import { NextResponse } from 'next/server';

const middleware = auth.middleware({
  // Redirects unauthenticated users to sign-in page
  loginUrl: '/auth/sign-in',
});

export default async function authMiddleware(req: any) {
  // 1. Check if the user is authenticated at all using the standard Neon Auth middleware
  const response = await middleware(req);
  
  // If the standard middleware redirects (e.g. user is not logged in), return that redirect
  // if (response.status !== 200 && response.headers.has('Location')) {
  //   return response;
  // }
  
  // 1. If user is authenticated and it is auth path, redirect to home
  if (req.nextUrl.pathname.startsWith('/auth')) {
    const { data: session } = await auth.getSession();
    if (session?.user) {
      return NextResponse.redirect(new URL('/', req.url));
    }
  }

  // 2. If trying to access /admin routes, enforce the admin role
  if (req.nextUrl.pathname.startsWith('/admin')) {
    const { data: session } = await auth.getSession();
    if (!session?.user) {
      return NextResponse.redirect(new URL('/auth/sign-in', req.url));
    }

    const userRole = (session.user as any).role || (session.user as any).metadata?.role;
    const isAdmin = userRole === "admin";

    if (!isAdmin) {
      // Non-admins are redirected to their profile page
      return NextResponse.redirect(new URL('/profile', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Protected routes requiring authentication
    '/ledger/:path*',
    '/inventory/:path*',
    '/profile/:path*',
    '/products/:path*',
    '/admin/:path*',
  ],
};
