'use client';

import { useMemo } from 'react';
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

  const sidebarTranslations = (translations?.sidebar || {}) as Record<string, string>;
  const isHomeRoute = pathname === `/${lang}`;
  const currentFeed = (searchParams?.get('c') || 'popular').toLowerCase();
  const showFeedToggle = isHomeRoute && (currentFeed === 'popular' || currentFeed === 'latest');

  const navItems = useMemo(() => {
    const labels = (translations?.bottomNav || {}) as Record<string, string>;
    const labelHome = labels.home || (lang === 'vi' ? 'Trang chủ' : lang === 'en' ? 'Home' : '홈');
    const labelSearch = labels.search || (lang === 'vi' ? 'Tìm kiếm' : lang === 'en' ? 'Search' : '검색');
    const labelWrite = labels.write || (lang === 'vi' ? 'Viết bài' : lang === 'en' ? 'Write' : '글쓰기');
    const labelVerification = labels.verification || (lang === 'vi' ? 'Xác minh' : lang === 'en' ? 'Verify' : '인증하기');
    const labelProfile = labels.profile || (lang === 'vi' ? 'Hồ sơ' : lang === 'en' ? 'Profile' : '프로필');
    return [
      {
        key: 'write',
        label: labelWrite,
        icon: PenSquare,
        href: `/${lang}/posts/new`,
        requiresAuth: true,
      },
      {
        key: 'search',
        label: labelSearch,
        icon: Search,
        href: `/${lang}/search`,
        requiresAuth: false,
      },
      {
        key: 'home',
        label: labelHome,
        icon: Home,
        href: `/${lang}`,
        requiresAuth: false,
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
    router.push(href);
  };

  return (
    <nav className="md:hidden fixed inset-x-0 bottom-0 z-50 border-t border-gray-200/80 dark:border-gray-800/80 bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg shadow-lg">
      <div className="relative">
        {showFeedToggle ? (
          <div className="absolute -top-11 left-1/2 -translate-x-1/2 z-10">
            <div className="flex items-center gap-1 rounded-full border border-gray-200/80 dark:border-gray-700/80 bg-white/95 dark:bg-gray-900/95 backdrop-blur px-1 py-1 shadow-md">
              <button
                type="button"
                onClick={() => router.push(`/${lang}?c=popular`)}
                aria-pressed={currentFeed === 'popular'}
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                  currentFeed === 'popular'
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-100'
                    : 'text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800'
                }`}
              >
                <span aria-hidden>🔥</span>
                <span>{sidebarTranslations.popular || (lang === 'vi' ? 'Phổ biến' : lang === 'en' ? 'Popular' : '인기')}</span>
              </button>
              <button
                type="button"
                onClick={() => router.push(`/${lang}?c=latest`)}
                aria-pressed={currentFeed === 'latest'}
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                  currentFeed === 'latest'
                    ? 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-100'
                    : 'text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800'
                }`}
              >
                <span aria-hidden>✨</span>
                <span>{sidebarTranslations.latest || (lang === 'vi' ? 'Mới nhất' : lang === 'en' ? 'Latest' : '최신')}</span>
              </button>
            </div>
          </div>
        ) : null}
        <div className="grid grid-cols-5 px-2 pt-2 pb-[calc(env(safe-area-inset-bottom,0px)+10px)]">
          {navItems.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => handleNavigate(item.href, item.requiresAuth)}
                className={`flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-2.5 text-xs font-medium transition-colors ${
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
