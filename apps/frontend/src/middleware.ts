import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Cookie auth utama (baru) + fallback legacy agar backward compatible.
  const token =
    request.cookies.get('darussunnah_token')?.value ||
    request.cookies.get('token')?.value;

  // Jika user mengakses /admin tanpa token, redirect ke /login
  if (pathname.startsWith('/admin') && !token) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Jika user mengakses /portal tanpa token, redirect ke alur login PSB
  if (pathname.startsWith('/portal') && !token) {
    const loginUrl = new URL('/login?from=psb', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match semua routes kecuali static files, api routes, dan _next
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
