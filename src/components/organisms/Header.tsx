'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'nextjs-toploader/app';
import { useParams } from 'next/navigation';
import { Bell, Menu, X } from 'lucide-react';
import Logo from '@/components/atoms/Logo';
import Button from '@/components/atoms/Button';
import UserProfile from '@/components/molecules/user/UserProfile';
import LanguageSwitcher from '@/components/atoms/LanguageSwitcher';
import { useSession, signOut } from 'next-auth/react';
import { useUnreadNotificationCount } from '@/repo/notifications/query';
import type { Locale } from '@/i18n/config';

const NotificationModal = dynamic(() => import('@/components/molecules/modals/NotificationModal'), { ssr: false });

function HeaderSearchFallback() {
  return (
    <div className="flex items-center gap-1.5 bg-white dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-700 px-3 py-1.5 w-full shadow-sm animate-pulse">
      <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-700" />
      <div className="w-px h-4 bg-gray-200 dark:bg-gray-700" />
      <div className="h-4 flex-1 rounded bg-gray-200 dark:bg-gray-700" />
      <div className="h-8 w-16 rounded-full bg-gray-200 dark:bg-gray-700" />
    </div>
  );
}

const HeaderSearch = dynamic(() => import('@/components/molecules/search/HeaderSearch'), {
  ssr: false,
  loading: () => <HeaderSearchFallback />,
});

interface HeaderProps {
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (value: boolean) => void;
  showBackButton?: boolean;
  rightActions?: React.ReactNode;
  hideSearch?: boolean;
  translations: any;
}

export default function Header({ isMobileMenuOpen, setIsMobileMenuOpen, showBackButton, rightActions, hideSearch, translations }: HeaderProps) {
  const t = translations?.header || {};
  const tTooltip = translations?.tooltips || {};
  const tSearch = translations?.search || {};
  const params = useParams();
  const router = useRouter();
  const locale = (params.lang as Locale) || 'ko';
  const { data: session, status } = useSession();
  const user = session?.user;
  const logout = () => signOut();
  const [isScrolled, setIsScrolled] = useState(false);
  const { data: unreadCountData } = useUnreadNotificationCount(!!user);
  const unreadCount = unreadCountData?.data?.count ?? 0;
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [shouldRenderSearch, setShouldRenderSearch] = useState(false);
  const brandIntroLabel = tTooltip.brandIntro || '';
  const goBackLabel = tSearch.goBack || '';
  const sidebarToggleLabel = tTooltip.sidebarToggle || '';
  const notificationsLabel = tTooltip.notifications || '';
  const loginLabel = t.login || '';
  const signupLabel = (t.signup || '').trim();
  const userNameFallback = t.user || '';

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 8);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (hideSearch) return;

    const media = window.matchMedia('(min-width: 1024px)');
    const handleChange = () => setShouldRenderSearch(media.matches);
    handleChange();
    media.addEventListener('change', handleChange);
    return () => media.removeEventListener('change', handleChange);
  }, [hideSearch]);

  return (
    <header
      className={`w-full backdrop-blur-md sticky top-0 z-50 transition-all duration-300
        ${isScrolled
          ? 'bg-white/95 dark:bg-gray-900/95 border-b border-gray-200 dark:border-gray-800 shadow-md'
          : 'bg-white/90 dark:bg-gray-900/90 border-b border-gray-200/50 dark:border-gray-800/50 shadow-sm'
        }
        text-gray-900 dark:text-white`}
    >
      <div className="mx-auto grid w-full max-w-[1680px] h-[var(--vk-header-height)] grid-cols-[auto_minmax(0,1fr)_auto] lg:grid-cols-[320px_minmax(0,1fr)_320px] 2xl:grid-cols-[320px_minmax(0,960px)_320px] 2xl:justify-center items-center gap-2 px-2 sm:px-3 lg:px-4">
        <div className="flex items-center gap-1.5 sm:gap-3 min-w-0 justify-self-start">
          {showBackButton && (
            <button
              onClick={() => router.back()}
              className="shrink-0 inline-flex h-11 items-center gap-1.5 px-2.5 sm:h-9 sm:px-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-300 text-gray-600 dark:text-gray-400 whitespace-nowrap"
              aria-label={goBackLabel}
            >
              <span aria-hidden className="text-lg sm:text-base">←</span>
              <span className="hidden sm:inline min-w-0 max-w-[88px] truncate text-sm font-medium">{goBackLabel}</span>
            </button>
          )}
          {!showBackButton && (
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden inline-flex h-11 w-11 sm:h-9 sm:w-9 items-center justify-center rounded-xl border-2 border-blue-300/90 dark:border-blue-900/60 bg-white/70 dark:bg-gray-900/40 hover:bg-gradient-to-br hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-900/20 dark:hover:to-purple-900/20 transition-all duration-300 group"
              aria-label={sidebarToggleLabel}
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5 sm:h-5 sm:w-5 text-gray-600 dark:text-gray-400" />
              ) : (
                <Menu className="h-5 w-5 sm:h-5 sm:w-5 text-gray-600 dark:text-gray-400" />
              )}
            </button>
          )}
          <div className="flex items-center gap-2 min-w-0">
            <div className="scale-90 sm:scale-100 origin-left">
              <div aria-label={brandIntroLabel}>
                <Logo translations={translations} />
              </div>
            </div>
            <span
              className={`inline-block max-w-[96px] sm:max-w-[160px] text-[9px] sm:text-[11px] text-gray-500 dark:text-gray-400 leading-tight line-clamp-2 ${showBackButton ? 'hidden sm:inline-block' : ''}`}
            >
              {brandIntroLabel}
            </span>
          </div>
        </div>

        {!hideSearch && (
          <div className="hidden lg:flex justify-center items-center justify-self-center w-full">
            {shouldRenderSearch ? (
              <HeaderSearch locale={locale} translations={translations} />
            ) : (
              <HeaderSearchFallback />
            )}
          </div>
        )}

        <div className="flex items-center space-x-1 sm:space-x-2 justify-self-end">
          {rightActions || (
            <>
              <LanguageSwitcher />

              {user && (
                <div className="relative">
                  <button
                    onClick={() => setIsNotificationModalOpen(!isNotificationModalOpen)}
                    className="relative inline-flex h-11 w-11 sm:h-9 sm:w-9 items-center justify-center hover:bg-gradient-to-br hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-900/20 dark:hover:to-purple-900/20 rounded-lg transition-all duration-300 group"
                    aria-label={notificationsLabel}
                  >
                    <Bell className="h-4 w-4 text-gray-600 dark:text-gray-400 group-hover:text-red-600 dark:group-hover:text-amber-400 transition-colors" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 bg-gradient-to-br from-red-500 to-amber-500 rounded-full flex items-center justify-center text-[8px] font-bold text-white shadow-lg">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                  {isNotificationModalOpen ? (
                    <NotificationModal
                      isOpen
                      onClose={() => setIsNotificationModalOpen(false)}
                      translations={translations?.notifications as Record<string, string>}
                    />
                  ) : null}
                </div>
              )}

              {status === 'loading' ? (
                <div className="flex items-center space-x-1 sm:space-x-1.5">
                  <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
                </div>
              ) : user ? (
                <div className="flex items-center space-x-1 sm:space-x-1.5">
                  <UserProfile
                    name={user.name || userNameFallback}
                    avatar={user.image || undefined}
                    isLoggedIn={true}
                    userId={user.id}
                    onLogout={logout}
                    translations={translations?.userMenu as Record<string, string>}
                  />
                </div>
              ) : (
                <div className="flex items-center space-x-1 sm:space-x-1.5">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => router.push(`/${locale}/login`)}
                    className="text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-1.5"
                  >
                    {loginLabel}
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    className="hidden xs:block text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-1.5"
                    onClick={() => router.push(`/${locale}/signup`)}
                  >
                    {signupLabel}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
}
