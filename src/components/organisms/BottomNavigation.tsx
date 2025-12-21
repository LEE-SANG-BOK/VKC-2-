'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'nextjs-toploader/app';
import { useParams, usePathname, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Home, Search, PenSquare, ShieldCheck, User } from 'lucide-react';
import { dispatchHomeReset } from '@/utils/homeReset';
import { useLoginPrompt } from '@/providers/LoginPromptProvider';

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
  const { openLoginPrompt } = useLoginPrompt();
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
    return labels.popular || '';
  }, [translations]);

  const latestLabel = useMemo(() => {
    const labels = (translations?.sidebar || {}) as Record<string, string>;
    return labels.latest || '';
  }, [translations]);

  const handleHomeFeedToggle = (next: 'popular' | 'latest') => {
    dispatchHomeReset();
    const nextParams = new URLSearchParams(searchParams?.toString());
    nextParams.set('c', next);
    nextParams.delete('page');
    const qs = nextParams.toString();
    router.push(qs ? `/${lang}?${qs}` : `/${lang}`);
  };

  const showHomeFeedToggle = isHomePath && homeFeed !== null;
  const [isFeedToggleReady, setIsFeedToggleReady] = useState(false);

  useEffect(() => {
    if (!showHomeFeedToggle) {
      setIsFeedToggleReady(false);
      return;
    }

    const raf = window.requestAnimationFrame(() => {
      setIsFeedToggleReady(true);
    });

    return () => {
      window.cancelAnimationFrame(raf);
    };
  }, [showHomeFeedToggle]);

  useEffect(() => {
    const root = document.documentElement;
    const baseOffset = 72;
    const feedToggleOffset = 128;
    root.style.setProperty('--vk-bottom-safe-offset', `${showHomeFeedToggle ? feedToggleOffset : baseOffset}px`);
    return () => {
      root.style.setProperty('--vk-bottom-safe-offset', `${baseOffset}px`);
    };
  }, [showHomeFeedToggle]);

  const navItems = useMemo(() => {
    const labels = (translations?.bottomNav || {}) as Record<string, string>;
    const labelHome = labels.home || '';
    const labelSearch = labels.search || '';
    const labelWrite = labels.write || '';
    const labelVerification = labels.verification || '';
    const labelProfile = labels.profile || '';
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
      openLoginPrompt();
      return;
    }
    if (href === `/${lang}`) {
      dispatchHomeReset();
      router.push(`/${lang}?c=${homeFeed || 'popular'}`);
      return;
    }
    router.push(href);
  };

  return (
    <>
      {showHomeFeedToggle ? (
        <div
          className={`vk-home-feed-toggle md:hidden pointer-events-none fixed inset-x-0 z-40 flex justify-center transition-all duration-200 ease-out ${
            isFeedToggleReady ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
          }`}
        >
          <div className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full border border-gray-200/70 dark:border-gray-700/60 bg-white/35 dark:bg-gray-900/30 backdrop-blur px-1.5 py-1.5 shadow-lg">
            <button
              type="button"
              onClick={() => handleHomeFeedToggle('popular')}
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-semibold transition duration-200 ease-out active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-900 ${
                homeFeed === 'popular'
                  ? 'bg-blue-600/35 text-white shadow-sm'
                  : 'text-gray-700 dark:text-gray-200 hover:bg-white/20 dark:hover:bg-gray-800/30'
              }`}
              aria-label={popularLabel}
              aria-pressed={homeFeed === 'popular'}
            >
              <span aria-hidden>🔥</span>
              <span>{popularLabel}</span>
            </button>
            <button
              type="button"
              onClick={() => handleHomeFeedToggle('latest')}
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-semibold transition duration-200 ease-out active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-900 ${
                homeFeed === 'latest'
                  ? 'bg-blue-600/35 text-white shadow-sm'
                  : 'text-gray-700 dark:text-gray-200 hover:bg-white/20 dark:hover:bg-gray-800/30'
              }`}
              aria-label={latestLabel}
              aria-pressed={homeFeed === 'latest'}
            >
              <span aria-hidden>🕒</span>
              <span>{latestLabel}</span>
            </button>
          </div>
        </div>
      ) : null}
      <nav className="md:hidden fixed inset-x-0 bottom-0 z-50 border-t border-gray-200/80 dark:border-gray-800/80 bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg shadow-lg">
        <div className="pb-[env(safe-area-inset-bottom,0px)]">
          <div className="grid grid-cols-5 h-14 px-2">
            {navItems.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;

              const baseButtonClass =
                'h-full flex flex-col items-center justify-center gap-1 rounded-xl px-2 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-900';

              const activeButtonClass = 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30';
              const inactiveButtonClass =
                'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/60';

              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => handleNavigate(item.href, item.requiresAuth)}
                  className={`${baseButtonClass} ${active ? activeButtonClass : inactiveButtonClass}`}
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
    </>
  );
}
