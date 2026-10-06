import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// Soft client-side gate: decodes (does NOT verify signature) the JWT payload
// to check expiry. Real authorization is still enforced server-side.
function isTokenValid(token: string | undefined): boolean {
  if (!token) return false;
  const parts = token.split('.');
  if (parts.length < 2) return false;
  try {
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    if (typeof payload.exp === 'number') {
      return payload.exp * 1000 > Date.now();
    }
    return true;
  } catch {
    return false;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Cookie auth utama (baru) + fallback legacy agar backward compatible.
  const token =
    request.cookies.get('darussunnah_token')?.value ||
    request.cookies.get('token')?.value;

  const authenticated = isTokenValid(token);

  // Jika user mengakses /admin tanpa token valid, redirect ke /login
  if (pathname.startsWith('/admin') && !authenticated) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Jika user mengakses /portal tanpa token valid, redirect ke alur login PSB
  if (pathname.startsWith('/portal') && !authenticated) {
    const loginUrl = new URL('/login?from=psb', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // /audit adalah dashboard audit internal: memuat versi stack, mesin database,
  // dan daftar temuan kerentanan. Ini petaattack yang tidak boleh publik meski
  // sudah noindex. /audit-hacked tetap publik karena itu laporan insiden.
  if (pathname === '/audit' && !authenticated) {
    const loginUrl = new URL('/login', request.url);
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
