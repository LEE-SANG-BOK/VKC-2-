'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'nextjs-toploader/app';
import { useParams, usePathname } from 'next/navigation';
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
  const params = useParams();
  const { data: session } = useSession();
  const user = session?.user;
  const { openLoginPrompt } = useLoginPrompt();
  const lang = (params?.lang as string) || 'ko';
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const maxViewportHeightRef = useRef(0);
  const isEditingFocusRef = useRef(false);
  const navRef = useRef<HTMLElement | null>(null);
  const baseOffsetRef = useRef(84);

  useEffect(() => {
    const root = document.documentElement;
    const navVisibleQuery = window.matchMedia('(max-width: 767px)');
    root.style.setProperty('--vk-bottom-safe-offset', `${navVisibleQuery.matches ? baseOffsetRef.current : 0}px`);
    root.style.setProperty('--vk-keyboard-offset', '0px');

    const viewport = window.visualViewport;
    let detachMediaListener: (() => void) | null = null;

    const measureBaseOffset = () => {
      const navEl = navRef.current;
      if (!navEl || !navVisibleQuery.matches) return;
      const rect = navEl.getBoundingClientRect();
      if (!rect.height || rect.height < 40) return;
      const measured = Math.round(rect.height) + 12;
      baseOffsetRef.current = Math.min(180, Math.max(72, measured));
    };

    const updateKeyboardState = () => {
      measureBaseOffset();
      const viewportHeight = viewport?.height ?? maxViewportHeightRef.current;
      if (viewportHeight) {
        maxViewportHeightRef.current = Math.max(maxViewportHeightRef.current, viewportHeight);
      }

      const heightDiff = viewportHeight ? Math.max(0, maxViewportHeightRef.current - viewportHeight) : 0;
      const keyboardOpen = heightDiff > 150 || isEditingFocusRef.current;
      setIsKeyboardOpen(keyboardOpen);
      root.style.setProperty('--vk-keyboard-offset', keyboardOpen ? `${Math.round(heightDiff)}px` : '0px');
      const safeOffset = navVisibleQuery.matches ? (keyboardOpen ? 24 : baseOffsetRef.current) : 0;
      root.style.setProperty('--vk-bottom-safe-offset', `${safeOffset}px`);
    };

    const isEditable = (element: HTMLElement | null) => {
      if (!element) return false;
      const candidate = element.closest('input,textarea,[contenteditable="true"],[contenteditable=""],[contenteditable="plaintext-only"]');
      const target = (candidate ?? element) as HTMLElement | null;
      if (!target) return false;
      if (target instanceof HTMLTextAreaElement) return true;
      if (target instanceof HTMLInputElement) {
        const nonTextTypes = new Set([
          'button',
          'checkbox',
          'color',
          'date',
          'datetime-local',
          'file',
          'hidden',
          'image',
          'month',
          'radio',
          'range',
          'reset',
          'submit',
          'time',
          'week',
        ]);
        return !nonTextTypes.has(target.type);
      }
      return target.isContentEditable;
    };

    const refreshFocusState = () => {
      const active = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      const shouldHide = isEditable(active);
      if (shouldHide === isEditingFocusRef.current) return;
      isEditingFocusRef.current = shouldHide;
      updateKeyboardState();
    };

    const onFocusChange = () => {
      queueMicrotask(refreshFocusState);
    };

    updateKeyboardState();
    refreshFocusState();

    document.addEventListener('focusin', onFocusChange);
    document.addEventListener('focusout', onFocusChange);

    if (viewport) {
      viewport.addEventListener('resize', updateKeyboardState);
      viewport.addEventListener('scroll', updateKeyboardState);
    }
    if (typeof navVisibleQuery.addEventListener === 'function') {
      navVisibleQuery.addEventListener('change', updateKeyboardState);
      detachMediaListener = () => navVisibleQuery.removeEventListener('change', updateKeyboardState);
    } else {
      navVisibleQuery.addListener(updateKeyboardState);
      detachMediaListener = () => navVisibleQuery.removeListener(updateKeyboardState);
    }

    return () => {
      document.removeEventListener('focusin', onFocusChange);
      document.removeEventListener('focusout', onFocusChange);

      if (viewport) {
        viewport.removeEventListener('resize', updateKeyboardState);
        viewport.removeEventListener('scroll', updateKeyboardState);
      }
      detachMediaListener?.();
      root.style.setProperty('--vk-bottom-safe-offset', '0px');
      root.style.setProperty('--vk-keyboard-offset', '0px');
    };
  }, []);

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
      router.push(`/${lang}`);
      return;
    }
    router.push(href);
  };

  return (
    <>
      <nav
        ref={navRef}
        className={`md:hidden fixed inset-x-0 bottom-0 z-50 border-t border-gray-200/80 dark:border-gray-800/80 bg-white dark:bg-gray-900 shadow-lg ${
          isKeyboardOpen ? 'hidden' : ''
        }`}
        data-testid="bottom-navigation"
      >
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
