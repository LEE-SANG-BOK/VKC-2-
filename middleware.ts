import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const locales = ['ko', 'en', 'vi'];
const defaultLocale = 'vi';
const rateStore = new Map<string, { count: number; resetAt: number }>();
const writeLimitWindowMs = 60_000;
const writeLimitMax = 60;

const getClientIp = (request: NextRequest) => {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim() || 'unknown';
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  return 'unknown';
};

const checkRateLimit = (key: string) => {
  const now = Date.now();
  const entry = rateStore.get(key);
  if (!entry || now >= entry.resetAt) {
    const resetAt = now + writeLimitWindowMs;
    rateStore.set(key, { count: 1, resetAt });
    return { ok: true, resetAt, remaining: writeLimitMax - 1 };
  }
  if (entry.count >= writeLimitMax) {
    return { ok: false, resetAt: entry.resetAt, remaining: 0 };
  }
  entry.count += 1;
  rateStore.set(key, entry);
  return { ok: true, resetAt: entry.resetAt, remaining: writeLimitMax - entry.count };
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/api')) {
    const method = request.method.toUpperCase();
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      const ip = getClientIp(request);
      const rateKey = `${ip}:write`;
      const result = checkRateLimit(rateKey);
      if (!result.ok) {
        const retryAfter = Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000));
        return new NextResponse(JSON.stringify({ error: 'Too many requests' }), {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(retryAfter),
          },
        });
      }
    }
    return NextResponse.next();
  }

  // 정적 파일, admin 경로는 무시
  if (
    pathname.startsWith('/_next') ||
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
  matcher: ['/((?!_next|.*\\..*).*)'],
};
