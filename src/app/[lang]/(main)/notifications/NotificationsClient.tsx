'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'nextjs-toploader/app';
import Image from 'next/image';
import { Bell, CheckCircle, MessageCircle, MessageSquare, Award, Settings, UserPlus, CheckCheck, Trash2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { DEFAULT_BLUR_DATA_URL } from '@/lib/constants/images';
import Header from '@/components/organisms/Header';
import Button from '@/components/atoms/Button';
import { useNotifications } from '@/repo/notifications/query';
import { useMarkAsRead, useMarkAllAsRead, useDeleteNotification } from '@/repo/notifications/mutation';

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

interface NotificationsClientProps {
  locale: string;
  translations: Record<string, unknown>;
}

export default function NotificationsClient({ locale, translations }: NotificationsClientProps) {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [filter, setFilter] = useState<'all' | 'answer' | 'comment' | 'reply' | 'adoption' | 'follow'>('all');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const t = (translations?.notifications || {}) as Record<string, string>;
  const copy = useMemo(() => {
    return {
      title: t.title || '',
      subtitle: t.subtitle || '',
      unreadCount: t.unreadCount || '',
      markAllRead: t.markAllRead || '',
      settings: t.settings || '',
      noNotifications: t.noNotifications || '',
      noNotificationsDesc: t.noNotificationsDesc || '',
      noFilteredNotifications: t.noFilteredNotifications || '',
      viewAll: t.viewAll || '',
      post: t.post || '',
      tipTitle: t.tipTitle || '',
      tip1: t.tip1 || '',
      tip2: t.tip2 || '',
      tip3: t.tip3 || '',
      tip4: t.tip4 || '',
      filters: {
        all: t.all || '',
        answer: t.answer || '',
        comment: t.comment || '',
        reply: t.reply || '',
        adoption: t.adoption || '',
        follow: t.follow || '',
      },
    };
  }, [t]);

  const { data, isLoading, refetch } = useNotifications(
    { limit: 50 },
    {
      enabled: status === 'authenticated',
      retry: 1,
      retryDelay: (attempt: number) => Math.min(10_000, 1000 * 2 ** attempt),
      staleTime: 10_000,
      refetchOnWindowFocus: false,
    }
  );
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();
  const deleteNotification = useDeleteNotification();

  const notifications = (data?.data || []) as unknown as NotificationItem[];

  const handleGoToSettings = () => {
    router.push(`/${locale}/profile/edit`);
  };

  const handleNotificationClick = async (notification: NotificationItem) => {
    if (!notification.isRead) {
      await markAsRead.mutateAsync(notification.id);
    }
    
    if (notification.type === 'follow') {
      return;
    }
    
    if (notification.postId) {
      router.push(`/${locale}/posts/${notification.postId}`);
    }
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead.mutateAsync();
    refetch();
  };

  const handleDeleteNotification = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    await deleteNotification.mutateAsync(notificationId);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'answer':
        return <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />;
      case 'comment':
        return <MessageCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
      case 'reply':
        return <MessageSquare className="w-5 h-5 text-purple-600 dark:text-purple-400" />;
      case 'adoption':
        return <Award className="w-5 h-5 text-amber-600 dark:text-amber-400" />;
      case 'follow':
        return <UserPlus className="w-5 h-5 text-pink-600 dark:text-pink-400" />;
      default:
        return <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />;
    }
  };

  const getFilterLabel = (type: string) => {
    return copy.filters[type as keyof typeof copy.filters] || type;
  };

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(`/${locale}/login`);
    }
  }, [status, router, locale]);

  const filteredNotifications = filter === 'all'
    ? notifications
    : notifications.filter(n => n.type === filter);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        showBackButton={true}
        hideSearch={true}
        translations={translations}
      />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200/50 dark:border-gray-700/50 p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-r from-red-600 to-amber-500 rounded-lg">
                  <Bell className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{copy.title}</h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {unreadCount > 0
                      ? copy.unreadCount.replace('{count}', unreadCount.toString())
                      : copy.subtitle}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button
                    variant="secondary"
                    onClick={handleMarkAllAsRead}
                    className="flex items-center gap-2 border border-gray-300"
                    disabled={markAllAsRead.isPending}
                  >
                    <CheckCheck className="w-4 h-4" />
                    <span className="text-sm font-medium hidden sm:inline">{copy.markAllRead}</span>
                  </Button>
                )}
                <button
                  onClick={handleGoToSettings}
                  className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  <span className="text-sm font-medium hidden sm:inline">{copy.settings}</span>
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200/50 dark:border-gray-700/50 p-4 mb-6">
            <div className="flex flex-wrap gap-2">
              {(['all', 'answer', 'comment', 'reply', 'adoption', 'follow'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setFilter(type)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === type
                      ? 'bg-gradient-to-r from-red-600 to-amber-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {getFilterLabel(type)}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200/50 dark:border-gray-700/50">
            {isLoading ? (
              <div className="flex justify-center py-16">
                <div className="h-8 w-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="text-center py-16">
                <Bell className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {copy.noNotifications}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                  {filter === 'all'
                    ? copy.noNotificationsDesc
                    : copy.noFilteredNotifications.replace('{filter}', getFilterLabel(filter))}
                </p>
                {filter !== 'all' && (
                  <button
                    onClick={() => setFilter('all')}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-amber-500 text-white font-semibold rounded-lg hover:from-red-700 hover:to-amber-600 transition-all duration-300"
                  >
                    {copy.viewAll}
                  </button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer ${
                      !notification.isRead ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex gap-4">
                      <div className="flex-shrink-0">
                        <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full">
                          {getNotificationIcon(notification.type)}
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div className="flex items-center gap-2">
                            <Image
                              src={notification.author.avatar}
                              alt={notification.author.name}
                              width={24}
                              height={24}
                              sizes="24px"
                              className="w-6 h-6 rounded-full"
                              placeholder="blur"
                              blurDataURL={DEFAULT_BLUR_DATA_URL}
                            />
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">
                              {notification.author.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                              {notification.createdAt}
                            </span>
                            <button
                              onClick={(e) => handleDeleteNotification(e, notification.id)}
                              className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                          {notification.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {notification.message}
                        </p>
                        {notification.postTitle && (
                          <p className="text-xs text-gray-500 dark:text-gray-500 truncate">
                            {copy.post}: {notification.postTitle}
                          </p>
                        )}
                      </div>

                      {!notification.isRead && (
                        <div className="flex-shrink-0">
                          <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {filteredNotifications.length === 0 && !isLoading && (
            <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
              <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-3">
                💡 {copy.tipTitle}
              </h3>
              <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-2">
                <li>• {copy.tip1}</li>
                <li>• {copy.tip2}</li>
                <li>• {copy.tip3}</li>
                <li>• {copy.tip4}</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
