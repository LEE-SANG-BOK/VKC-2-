'use client';

import { useRef, useEffect } from 'react';
import { useRouter } from 'nextjs-toploader/app';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { Bell, CheckCircle, MessageCircle, MessageSquare, Award, UserPlus, Settings } from 'lucide-react';
import { useNotifications } from '@/repo/notifications/query';
import { useMarkAsRead } from '@/repo/notifications/mutation';
import { useSession } from 'next-auth/react';
interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  translations?: Record<string, string>;
}

interface NotificationItem {
  id: string;
  type: 'answer' | 'comment' | 'reply' | 'adoption' | 'like' | 'follow';
  title: string;
  message: string;
  postTitle: string;
  postId: string;
  author: {
    name: string;
    avatar: string;
  };
  createdAt: string;
  isRead: boolean;
}

export default function NotificationModal({ isOpen, onClose, translations = {} }: NotificationModalProps) {
  const router = useRouter();
  const params = useParams();
  const locale = params.lang as string || 'ko';
  const modalRef = useRef<HTMLDivElement>(null);
  const { data: session } = useSession();
  const user = session?.user;

  const t = translations;

  const { data, isLoading, isError, refetch } = useNotifications(
    { limit: 5 },
    {
      enabled: !!user?.id && isOpen,
      retry: 2,
      retryDelay: (attempt: number) => Math.min(2000, 1000 * 2 ** attempt),
    }
  );
  const markAsRead = useMarkAsRead();

  const notifications = (data?.data || []) as unknown as NotificationItem[];
  
  const formatTimeAgo = (dateString: string) => {
    if (!dateString) return t.justNow || '방금 전';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return t.justNow || '방금 전';
    
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return t.justNow || '방금 전';
    if (minutes < 60) return `${minutes}${t.minutesAgo || '분 전'}`;
    if (hours < 24) return `${hours}${t.hoursAgo || '시간 전'}`;
    return `${days}${t.daysAgo || '일 전'}`;
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleNotificationClick = async (notification: NotificationItem) => {
    if (!notification.isRead) {
      await markAsRead.mutateAsync(notification.id);
    }

    onClose();

    if (notification.type === 'follow') {
      return;
    }

    if (notification.postId) {
      router.push(`/${locale}/posts/${notification.postId}`);
    }
  };

  const handleViewAll = () => {
    onClose();
    router.push(`/${locale}/notifications`);
  };

  const handleSettings = () => {
    onClose();
    router.push(`/${locale}/profile/edit`);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'answer':
        return <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400" />;
      case 'comment':
        return <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />;
      case 'reply':
        return <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 dark:text-purple-400" />;
      case 'adoption':
        return <Award className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 dark:text-amber-400" />;
      case 'follow':
        return <UserPlus className="w-4 h-4 sm:w-5 sm:h-5 text-pink-600 dark:text-pink-400" />;
      default:
        return <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-400" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={modalRef}
      className="fixed sm:absolute top-16 sm:top-full left-1/2 sm:left-auto right-auto sm:right-0 -translate-x-1/2 sm:translate-x-0 mt-2 w-[calc(100vw-1.5rem)] sm:w-[400px] max-w-[420px] bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 sm:px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">
          {t.title || '알림'}
        </h3>
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={handleSettings}
            className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title={t.settings || '알림 설정'}
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={handleViewAll}
            className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors whitespace-nowrap"
          >
            {t.viewAll || '전체 보기'}
          </button>
        </div>
      </div>

      {/* Notification List */}
      <div className="max-h-96 overflow-y-auto">
        {!user ? (
          <div className="text-center py-8 space-y-2">
            <Bell className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">{t.loginRequired || '로그인이 필요합니다.'}</p>
            <button
              onClick={() => router.push(`/${locale}/login`)}
              className="mt-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
            >
              {t.login || '로그인'}
            </button>
          </div>
        ) : isLoading ? (
          <div className="flex justify-center py-8">
            <div className="h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : isError ? (
          <div className="text-center py-8 space-y-2">
            <Bell className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t.loadError || '알림을 불러오는 데 실패했습니다.'}
            </p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
            >
              {t.retry || '다시 시도'}
            </button>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-8">
            <Bell className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t.noNotifications || '알림이 없습니다'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`p-3 sm:p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors ${
                  !notification.isRead ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                }`}
              >
                <div className="flex gap-2 sm:gap-3">
                  {/* Icon */}
                  <div className="flex-shrink-0">
                    <div className="p-1.5 sm:p-2 bg-gray-100 dark:bg-gray-700 rounded-full">
                      {getNotificationIcon(notification.type)}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                      <Image
                        src={notification.author.avatar}
                        alt={notification.author.name}
                        width={16}
                        height={16}
                        className="w-4 h-4 sm:w-5 sm:h-5 rounded-full flex-shrink-0"
                      />
                      <span className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {notification.author.name}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-1">
                      {notification.message}
                    </p>
                    {notification.postTitle && (
                      <p className="text-xs text-gray-500 dark:text-gray-500 line-clamp-1 mb-1">
                        {notification.postTitle}
                      </p>
                    )}
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {notification.createdAt}
                    </span>
                  </div>

                  {/* Unread Indicator */}
                  {!notification.isRead && (
                    <div className="flex-shrink-0 self-start mt-1">
                      <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
