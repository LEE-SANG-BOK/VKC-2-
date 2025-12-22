'use client';

import { useState, useRef, useEffect, createContext, useContext } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';
import dynamic from 'next/dynamic';
import { createPortal } from 'react-dom';
import { useRouter } from 'nextjs-toploader/app';
import { useParams } from 'next/navigation';
import { User, FileText, Users, Bookmark, Settings, LogOut } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import Avatar from '@/components/atoms/Avatar';

const ModalLoadingContext = createContext<(() => void) | null>(null);

const LOADING_TITLE_BY_LOCALE = {
  ko: '로딩 중...',
  en: 'Loading...',
  vi: 'Đang tải...',
} as const;

function ModalLoadingFallback({ maxWidth }: { maxWidth: string }) {
  const params = useParams();
  const locale = params.lang as string || 'ko';
  const onClose = useContext(ModalLoadingContext);
  const title = LOADING_TITLE_BY_LOCALE[locale as keyof typeof LOADING_TITLE_BY_LOCALE] || LOADING_TITLE_BY_LOCALE.ko;

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose?.();
      }
    }

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  const handleBackdropClick = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose?.();
    }
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className={`relative w-full ${maxWidth} max-h-[calc(100vh-2rem)] max-h-[calc(100dvh-2rem)] bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col`}
      >
        <div className="flex-shrink-0 flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
          <button
            type="button"
            onClick={() => onClose?.()}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <span className="text-lg leading-none">×</span>
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center py-10">
          <div className="h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    </div>
  , document.body);
}

const ProfileModal = dynamic(() => import('@/components/molecules/modals/ProfileModal'), {
  ssr: false,
  loading: () => <ModalLoadingFallback maxWidth="max-w-[500px]" />,
});
const MyPostsModal = dynamic(() => import('@/components/molecules/modals/MyPostsModal'), {
  ssr: false,
  loading: () => <ModalLoadingFallback maxWidth="max-w-2xl" />,
});
const FollowingModal = dynamic(() => import('@/components/molecules/modals/FollowingModal'), {
  ssr: false,
  loading: () => <ModalLoadingFallback maxWidth="max-w-2xl" />,
});
const BookmarksModal = dynamic(() => import('@/components/molecules/modals/BookmarksModal'), {
  ssr: false,
  loading: () => <ModalLoadingFallback maxWidth="max-w-[500px]" />,
});
const SettingsModal = dynamic(() => import('@/components/molecules/modals/SettingsModal'), {
  ssr: false,
  loading: () => <ModalLoadingFallback maxWidth="max-w-[500px]" />,
});

interface UserProfileProps {
  name: string;
  avatar?: string;
  isLoggedIn: boolean;
  userId?: string;
  onLogout: () => void;
  translations?: Record<string, unknown>;
}

type ModalType = 'profile' | 'myPosts' | 'following' | 'bookmarks' | 'settings' | null;

export default function UserProfile({ name, avatar, isLoggedIn, userId, onLogout, translations = {} }: UserProfileProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useParams();
  const locale = params.lang as string || 'ko';
  const [isOpen, setIsOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const menuLabels = {
    profile: ((translations?.userMenu as Record<string, string> | undefined)?.profile) || '',
    myPosts: ((translations?.userMenu as Record<string, string> | undefined)?.myPosts) || '',
    followingFeed: ((translations?.userMenu as Record<string, string> | undefined)?.followingFeed) || '',
    bookmarks: ((translations?.userMenu as Record<string, string> | undefined)?.bookmarks) || '',
    settings: ((translations?.userMenu as Record<string, string> | undefined)?.settings) || '',
    askQuestion: ((translations?.userMenu as Record<string, string> | undefined)?.askQuestion) || '',
    logout: ((translations?.userMenu as Record<string, string> | undefined)?.logout) || '',
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const openModal = (modal: ModalType) => {
    setIsOpen(false);
    setActiveModal(modal);
  };

  const closeModal = () => {
    setActiveModal(null);
  };

  if (!isLoggedIn) return null;

  const menuItems = [
    {
      icon: <User className="w-5 h-5 text-gray-500" />,
      label: menuLabels.profile,
      onClick: () => {
        setIsOpen(false);
        router.push(`/${locale}/profile/${userId || 'me'}`);
      },
    },
    {
      icon: <FileText className="w-5 h-5 text-gray-500" />,
      label: menuLabels.myPosts,
      onClick: () => openModal('myPosts'),
    },
    {
      icon: <Users className="w-5 h-5 text-gray-500" />,
      label: menuLabels.followingFeed,
      onClick: () => openModal('following'),
    },
    {
      icon: <Bookmark className="w-5 h-5 text-gray-500" />,
      label: menuLabels.bookmarks,
      onClick: () => openModal('bookmarks'),
    },
    {
      icon: <Settings className="w-5 h-5 text-gray-500" />,
      label: menuLabels.settings,
      onClick: () => openModal('settings'),
    },
  ];

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label={name}
        className="inline-flex h-11 items-center space-x-1.5 px-2 sm:h-9 sm:px-1.5 hover:bg-gradient-to-br hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-900/20 dark:hover:to-purple-900/20 rounded-lg transition-all duration-300 group"
      >
        <Avatar name={name} size="md" imageUrl={avatar} hoverHighlight />
        <span className="text-xs font-medium text-gray-700 dark:text-gray-300 hidden lg:block">
          {name}
        </span>
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-[300px] bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50">
          {/* Ask Question Button */}
          <div className="p-3">
            <button
              onClick={() => {
                setIsOpen(false);
                router.push(`/${locale}/posts/new?type=question`);
              }}
              className="w-full py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-full transition-colors"
            >
              {menuLabels.askQuestion}
            </button>
          </div>

          {/* Menu Items */}
          <div className="py-1">
            {menuItems.map((item, index) => (
              <button
                key={index}
                onClick={item.onClick}
                className="w-full flex items-center gap-4 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                {item.icon}
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {item.label}
                </span>
              </button>
            ))}
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200 dark:border-gray-700" />

          {/* Logout */}
          <div className="py-1">
            <button
              onClick={() => {
                setIsOpen(false);
                queryClient.clear();
                onLogout();
              }}
              className="w-full flex items-center gap-4 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <LogOut className="w-5 h-5 text-gray-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {menuLabels.logout}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {activeModal === 'profile' ? (
        <ModalLoadingContext.Provider value={closeModal}>
          <ProfileModal isOpen onClose={closeModal} translations={translations} />
        </ModalLoadingContext.Provider>
      ) : null}
      {activeModal === 'myPosts' ? (
        <ModalLoadingContext.Provider value={closeModal}>
          <MyPostsModal isOpen onClose={closeModal} translations={translations} />
        </ModalLoadingContext.Provider>
      ) : null}
      {activeModal === 'following' ? (
        <ModalLoadingContext.Provider value={closeModal}>
          <FollowingModal isOpen onClose={closeModal} translations={translations} />
        </ModalLoadingContext.Provider>
      ) : null}
      {activeModal === 'bookmarks' ? (
        <ModalLoadingContext.Provider value={closeModal}>
          <BookmarksModal isOpen onClose={closeModal} translations={translations} />
        </ModalLoadingContext.Provider>
      ) : null}
      {activeModal === 'settings' ? (
        <ModalLoadingContext.Provider value={closeModal}>
          <SettingsModal isOpen onClose={closeModal} translations={translations} />
        </ModalLoadingContext.Provider>
      ) : null}
    </div>
  );
}
