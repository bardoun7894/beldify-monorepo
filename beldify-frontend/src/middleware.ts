import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import logger from '@/utils/consoleLogger';

export const LOCALES = ['en', 'ar', 'fr', 'es', 'ma', 'nl', 'de'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'en';

function getLocale(request: NextRequest): Locale {
  // Fast path: check cookie first as it's most common
  const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value;
  if (cookieLocale && LOCALES.includes(cookieLocale as Locale)) {
    return cookieLocale as Locale;
  }

  // Then check URL param
  const urlLocale = request.nextUrl.searchParams.get('locale');
  if (urlLocale && LOCALES.includes(urlLocale as Locale)) {
    return urlLocale as Locale;
  }

  return DEFAULT_LOCALE;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for common paths to reduce overhead
  if (
    pathname === '/' ||
    pathname.startsWith('/_next') || 
    pathname.startsWith('/api') || 
    pathname.includes('.') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next();
  }

  const locale = getLocale(request);
  const response = NextResponse.next();

  // Set cookie only if needed (when locale comes from URL or is different from cookie)
  const currentCookieLocale = request.cookies.get('NEXT_LOCALE')?.value;
  if (currentCookieLocale !== locale) {
    response.cookies.set('NEXT_LOCALE', locale);
  }

  // Set Content-Language header
  response.headers.set('Content-Language', locale);

  return response;
}

export const config = {
  // Reduce the number of paths the middleware runs on to minimize overhead
  matcher: [
    // Exclude API routes, Next.js internals, and common static assets
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|icon.svg|images).*)',
  ],
};
