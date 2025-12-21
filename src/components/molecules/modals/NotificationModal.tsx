'use client';

import { useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'nextjs-toploader/app';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { Bell, CheckCircle, MessageCircle, MessageSquare, Award, UserPlus, Settings } from 'lucide-react';
import { DEFAULT_BLUR_DATA_URL } from '@/lib/constants/images';
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
  const resolvedLocale = (['ko', 'en', 'vi'] as const).includes(locale as 'ko' | 'en' | 'vi') ? (locale as 'ko' | 'en' | 'vi') : 'ko';
  const modalRef = useRef<HTMLDivElement>(null);
  const { data: session } = useSession();
  const user = session?.user;

  const t = translations;
  const modalFallbacks = useMemo(() => {
    const fallbackByLocale = {
      ko: {
        title: '알림',
        settings: '알림 설정',
        viewAll: '전체 알림 보기',
        loginRequired: '로그인이 필요합니다.',
        login: '로그인',
        loadError: '알림을 불러오는 데 실패했습니다.',
        retry: '다시 시도',
        noNotifications: '알림이 없습니다',
        justNow: '방금 전',
        minutesAgo: '분 전',
        hoursAgo: '시간 전',
        daysAgo: '일 전',
      },
      en: {
        title: 'Notifications',
        settings: 'Notification settings',
        viewAll: 'View All Notifications',
        loginRequired: 'Please log in to continue.',
        login: 'Log in',
        loadError: 'Failed to load notifications.',
        retry: 'Retry',
        noNotifications: 'No notifications',
        justNow: 'just now',
        minutesAgo: ' minutes ago',
        hoursAgo: ' hours ago',
        daysAgo: ' days ago',
      },
      vi: {
        title: 'Thông báo',
        settings: 'Cài đặt thông báo',
        viewAll: 'Xem tất cả thông báo',
        loginRequired: 'Vui lòng đăng nhập để tiếp tục.',
        login: 'Đăng nhập',
        loadError: 'Không thể tải thông báo.',
        retry: 'Thử lại',
        noNotifications: 'Không có thông báo',
        justNow: 'vừa xong',
        minutesAgo: ' phút trước',
        hoursAgo: ' giờ trước',
        daysAgo: ' ngày trước',
      },
    } as const;

    return fallbackByLocale[resolvedLocale] || fallbackByLocale.ko;
  }, [resolvedLocale]);
  const modalLabels = {
    title: t.title || modalFallbacks.title,
    settings: t.settings || modalFallbacks.settings,
    viewAll: t.viewAll || modalFallbacks.viewAll,
    loginRequired: t.loginRequired || modalFallbacks.loginRequired,
    login: t.login || modalFallbacks.login,
    loadError: t.loadError || modalFallbacks.loadError,
    retry: t.retry || modalFallbacks.retry,
    noNotifications: t.noNotifications || modalFallbacks.noNotifications,
    justNow: t.justNow || modalFallbacks.justNow,
    minutesAgo: t.minutesAgo || modalFallbacks.minutesAgo,
    hoursAgo: t.hoursAgo || modalFallbacks.hoursAgo,
    daysAgo: t.daysAgo || modalFallbacks.daysAgo,
  };

  const { data, isLoading, isError, refetch } = useNotifications(
    { limit: 5 },
    {
      enabled: !!user?.id && isOpen,
      retry: 2,
      retryDelay: (attempt: number) => Math.min(2000, 1000 * 2 ** attempt),
      staleTime: 60_000,
      gcTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    }
  );
  const markAsRead = useMarkAsRead();

  const notifications = (data?.data || []) as unknown as NotificationItem[];
  
  const formatTimeAgo = (dateString: string) => {
    if (!dateString) return modalLabels.justNow;
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return modalLabels.justNow;
    
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return modalLabels.justNow;
    if (minutes < 60) return `${minutes}${modalLabels.minutesAgo}`;
    if (hours < 24) return `${hours}${modalLabels.hoursAgo}`;
    return `${days}${modalLabels.daysAgo}`;
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
          {modalLabels.title}
        </h3>
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={handleSettings}
            className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title={modalLabels.settings}
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={handleViewAll}
            className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors whitespace-nowrap"
          >
            {modalLabels.viewAll}
          </button>
        </div>
      </div>

      {/* Notification List */}
      <div className="max-h-96 overflow-y-auto">
        {!user ? (
          <div className="text-center py-8 space-y-2">
            <Bell className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">{modalLabels.loginRequired}</p>
            <button
              onClick={() => router.push(`/${locale}/login`)}
              className="mt-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
            >
              {modalLabels.login}
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
              {modalLabels.loadError}
            </p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
            >
              {modalLabels.retry}
            </button>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-8">
            <Bell className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {modalLabels.noNotifications}
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
                        sizes="20px"
                        className="w-4 h-4 sm:w-5 sm:h-5 rounded-full flex-shrink-0"
                        placeholder="blur"
                        blurDataURL={DEFAULT_BLUR_DATA_URL}
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
