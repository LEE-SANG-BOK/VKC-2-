'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'nextjs-toploader/app';
import { useParams, usePathname, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Home, Search, PenSquare, ShieldCheck, User } from 'lucide-react';

interface BottomNavigationProps {
  translations: Record<string, unknown>;
}

export default function BottomNavigation({ translations }: BottomNavigationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const params = useParams();
  const { data: session } = useSession();
  const user = session?.user;
  const lang = (params?.lang as string) || 'ko';

  const isHomePath = pathname === `/${lang}`;

  const homeFeed = useMemo(() => {
    const c = searchParams?.get('c');
    if (!c) return 'popular';
    if (c === 'popular' || c === 'latest') return c;
    return null;
  }, [searchParams]);

  const popularLabel = useMemo(() => {
    const labels = (translations?.sidebar || {}) as Record<string, string>;
    return labels.popular || (lang === 'vi' ? 'Phổ biến' : lang === 'en' ? 'Popular' : '인기');
  }, [lang, translations]);

  const latestLabel = useMemo(() => {
    const labels = (translations?.sidebar || {}) as Record<string, string>;
    return labels.latest || (lang === 'vi' ? 'Mới nhất' : lang === 'en' ? 'Latest' : '최신');
  }, [lang, translations]);

  const handleHomeFeedToggle = (next: 'popular' | 'latest') => {
    router.push(`/${lang}?c=${encodeURIComponent(next)}`);
  };

  useEffect(() => {
    const root = document.documentElement;
    const baseOffset = 72;
    const feedToggleOffset = 116;
    root.style.setProperty(
      '--vk-bottom-safe-offset',
      `${isHomePath ? feedToggleOffset : baseOffset}px`
    );

    return () => {
      root.style.setProperty('--vk-bottom-safe-offset', `${baseOffset}px`);
    };
  }, [isHomePath]);

  const navItems = useMemo(() => {
    const labels = (translations?.bottomNav || {}) as Record<string, string>;
    const labelHome = labels.home || (lang === 'vi' ? 'Trang chủ' : lang === 'en' ? 'Home' : '홈');
    const labelSearch = labels.search || (lang === 'vi' ? 'Tìm kiếm' : lang === 'en' ? 'Search' : '검색');
    const labelWrite = labels.write || (lang === 'vi' ? 'Viết bài' : lang === 'en' ? 'Write' : '글쓰기');
    const labelVerification = labels.verification || (lang === 'vi' ? 'Xác minh' : lang === 'en' ? 'Verify' : '인증하기');
    const labelProfile = labels.profile || (lang === 'vi' ? 'Hồ sơ' : lang === 'en' ? 'Profile' : '프로필');
    return [
      {
        key: 'home',
        label: labelHome,
        icon: Home,
        href: `/${lang}`,
        requiresAuth: false,
      },
      {
        key: 'search',
        label: labelSearch,
        icon: Search,
        href: `/${lang}/search`,
        requiresAuth: false,
      },
      {
        key: 'write',
        label: labelWrite,
        icon: PenSquare,
        href: `/${lang}/posts/new`,
        requiresAuth: true,
      },
      {
        key: 'verification',
        label: labelVerification,
        icon: ShieldCheck,
        href: `/${lang}/verification/request`,
        requiresAuth: true,
      },
      {
        key: 'profile',
        label: labelProfile,
        icon: User,
        href: user ? `/${lang}/profile/${user.id || 'me'}` : `/${lang}/login`,
        requiresAuth: true,
      },
    ];
  }, [lang, translations, user]);

  const isActive = (href: string) => {
    if (!pathname) return false;
    if (href === `/${lang}`) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  const handleNavigate = (href: string, requiresAuth: boolean) => {
    if (requiresAuth && !user) {
      router.push(`/${lang}/login`);
      return;
    }
    if (href === `/${lang}`) {
      router.push(`/${lang}?c=popular`);
      return;
    }
    router.push(href);
  };

  return (
    <nav className="md:hidden fixed inset-x-0 bottom-0 z-50 border-t border-gray-200/80 dark:border-gray-800/80 bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg shadow-lg">
      {isHomePath ? (
        <div className="px-2 pt-2 pb-2 border-b border-gray-200/70 dark:border-gray-800/70">
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => handleHomeFeedToggle('popular')}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                homeFeed === 'popular'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'border border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-gray-900/40 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
              aria-label={popularLabel}
            >
              <span aria-hidden>🔥</span>
              <span>{popularLabel}</span>
            </button>
            <button
              type="button"
              onClick={() => handleHomeFeedToggle('latest')}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                homeFeed === 'latest'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'border border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-gray-900/40 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
              aria-label={latestLabel}
            >
              <span aria-hidden>🕒</span>
              <span>{latestLabel}</span>
            </button>
          </div>
        </div>
      ) : null}
      <div className="pb-[env(safe-area-inset-bottom,0px)]">
        <div className="grid grid-cols-5 h-14 px-2">
          {navItems.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => handleNavigate(item.href, item.requiresAuth)}
                className={`h-full flex flex-col items-center justify-center gap-1 rounded-xl px-2 text-xs font-medium transition-colors ${
                  active
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/60'
                }`}
                aria-label={item.label}
              >
                <div className="relative flex items-center justify-center">
                  <Icon className={`h-5 w-5 ${active ? 'stroke-[2.5]' : ''}`} />
                  {'badge' in item && (item as any).badge ? (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-gradient-to-br from-red-500 to-amber-500 text-[10px] font-bold text-white flex items-center justify-center shadow-lg">
                      {(item as any).badge > 99 ? '99+' : (item as any).badge}
                    </span>
                  ) : null}
                </div>
                <span className="leading-none">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
