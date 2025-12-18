'use client';

import { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'nextjs-toploader/app';
import { useParams } from 'next/navigation';
import { User, FileText, Users, Bookmark, Settings, LogOut } from 'lucide-react';
import Avatar from '@/components/atoms/Avatar';

const ProfileModal = dynamic(() => import('@/components/molecules/modals/ProfileModal'), { ssr: false });
const MyPostsModal = dynamic(() => import('@/components/molecules/modals/MyPostsModal'), { ssr: false });
const FollowingModal = dynamic(() => import('@/components/molecules/modals/FollowingModal'), { ssr: false });
const BookmarksModal = dynamic(() => import('@/components/molecules/modals/BookmarksModal'), { ssr: false });
const SettingsModal = dynamic(() => import('@/components/molecules/modals/SettingsModal'), { ssr: false });

interface UserProfileProps {
  name: string;
  avatar?: string;
  isLoggedIn: boolean;
  userId?: string;
  onLogout: () => void;
  translations?: Record<string, string>;
}

type ModalType = 'profile' | 'myPosts' | 'following' | 'bookmarks' | 'settings' | null;

export default function UserProfile({ name, avatar, isLoggedIn, userId, onLogout, translations = {} }: UserProfileProps) {
  const router = useRouter();
  const params = useParams();
  const locale = params.lang as string || 'ko';
  const [isOpen, setIsOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const t = translations;

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
      label: t.profile || '프로필',
      onClick: () => {
        setIsOpen(false);
        router.push(`/${locale}/profile/${userId || 'me'}`);
      },
    },
    {
      icon: <FileText className="w-5 h-5 text-gray-500" />,
      label: t.myPosts || '내 게시글',
      onClick: () => openModal('myPosts'),
    },
    {
      icon: <Users className="w-5 h-5 text-gray-500" />,
      label: t.followingFeed || '팔로잉 피드',
      onClick: () => openModal('following'),
    },
    {
      icon: <Bookmark className="w-5 h-5 text-gray-500" />,
      label: t.bookmarks || '북마크',
      onClick: () => openModal('bookmarks'),
    },
    {
      icon: <Settings className="w-5 h-5 text-gray-500" />,
      label: t.settings || '설정',
      onClick: () => openModal('settings'),
    },
  ];

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-1.5 p-1.5 hover:bg-gradient-to-br hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-900/20 dark:hover:to-purple-900/20 rounded-lg transition-all duration-300 group"
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
              {t.askQuestion || '나도 질문하기'}
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
                onLogout();
              }}
              className="w-full flex items-center gap-4 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <LogOut className="w-5 h-5 text-gray-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t.logout || '로그아웃'}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {activeModal === 'profile' ? (
        <ProfileModal isOpen onClose={closeModal} translations={t} />
      ) : null}
      {activeModal === 'myPosts' ? (
        <MyPostsModal isOpen onClose={closeModal} translations={t} />
      ) : null}
      {activeModal === 'following' ? (
        <FollowingModal isOpen onClose={closeModal} translations={t} />
      ) : null}
      {activeModal === 'bookmarks' ? (
        <BookmarksModal isOpen onClose={closeModal} translations={t} />
      ) : null}
      {activeModal === 'settings' ? (
        <SettingsModal isOpen onClose={closeModal} translations={t} />
      ) : null}
    </div>
  );
}
