import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const locales = ['ko', 'en', 'vi'];
const defaultLocale = 'vi';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 정적 파일, API 라우트, admin 경로는 무시
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/admin') ||
    pathname.includes('.') ||
    pathname.startsWith('/favicon.ico')
  ) {
    return;
  }

  // 이미 locale이 있는지 확인
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (pathnameHasLocale) return;

  // Accept-Language 헤더에서 언어 감지
  const locale = getLocale(request);

  // 루트 경로인 경우 기본 언어로 리다이렉트
  request.nextUrl.pathname = `/${locale}${pathname}`;
  return NextResponse.redirect(request.nextUrl);
}

function getLocale(request: NextRequest): string {
  // 쿠키에서 저장된 언어 확인
  const savedLocale = request.cookies.get('NEXT_LOCALE')?.value;
  if (savedLocale && locales.includes(savedLocale)) {
    return savedLocale;
  }

  // Accept-Language 헤더에서 언어 감지
  const acceptLanguage = request.headers.get('accept-language');
  if (acceptLanguage) {
    const preferredLocale = acceptLanguage
      .split(',')
      .map((lang) => lang.split(';')[0].trim().toLowerCase())
      .find((lang) => {
        // 정확한 매칭
        if (locales.includes(lang)) return true;
        // 언어 코드만 매칭 (예: en-US -> en)
        const shortLang = lang.split('-')[0];
        return locales.includes(shortLang);
      });

    if (preferredLocale) {
      const locale = locales.includes(preferredLocale)
        ? preferredLocale
        : preferredLocale.split('-')[0];
      if (locales.includes(locale)) return locale;
    }
  }

  return defaultLocale;
}

export const config = {
  matcher: ['/((?!_next|api|.*\\..*).*)'],
};
