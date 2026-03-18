import { updateSession } from '@/lib/supabase/middleware';
import { type NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  try {
    return await updateSession(request);
  } catch (error) {
    console.error('[middleware] Error:', error);
    // Don't silently pass through — redirect to login for protected routes
    const pathname = request.nextUrl.pathname;
    const protectedPrefixes = ['/dashboard', '/family', '/generate', '/gallery', '/books', '/checkout', '/orders', '/admin'];
    if (protectedPrefixes.some(p => pathname.startsWith(p))) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
