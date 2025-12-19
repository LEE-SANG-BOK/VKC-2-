'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'nextjs-toploader/app';
import Image from 'next/image';
import { Bell, CheckCircle, MessageCircle, MessageSquare, Award, Settings, UserPlus, CheckCheck, Trash2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
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
  const user = session?.user;

  const [filter, setFilter] = useState<'all' | 'answer' | 'comment' | 'reply' | 'adoption' | 'follow'>('all');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const t = (translations?.notifications || {}) as Record<string, string>;
  const copy = useMemo(() => {
    const isVi = locale === 'vi';
    const isEn = locale === 'en';
    const fallback = {
      title: isVi ? 'Thông báo' : isEn ? 'Notifications' : '알림',
      subtitle: isVi ? 'Kiểm tra cập nhật mới nhất' : isEn ? 'Check your latest updates' : '새로운 소식을 확인하세요',
      unreadCount: isVi ? '{count} thông báo chưa đọc' : isEn ? '{count} unread notifications' : '{count}개의 읽지 않은 알림',
      markAllRead: isVi ? 'Đánh dấu đã đọc' : isEn ? 'Mark all read' : '모두 읽음',
      settings: isVi ? 'Cài đặt' : isEn ? 'Settings' : '설정',
      noNotifications: isVi ? 'Không có thông báo' : isEn ? 'No notifications' : '알림이 없습니다',
      noNotificationsDesc: isVi
        ? 'Thông báo mới sẽ hiển thị ở đây'
        : isEn
          ? 'New notifications will appear here'
          : '새로운 알림이 오면 여기에 표시됩니다',
      noFilteredNotifications: isVi ? 'Không có thông báo {filter}' : isEn ? 'No {filter} notifications' : '{filter} 알림이 없습니다',
      viewAll: isVi ? 'Xem tất cả thông báo' : isEn ? 'View All Notifications' : '전체 알림 보기',
      post: isVi ? 'Bài viết' : isEn ? 'Post' : '게시글',
      tipTitle: isVi ? 'Mẹo thông báo' : isEn ? 'Notification Tips' : '알림 설정 팁',
      tip1: isVi
        ? 'Bạn có thể chọn nhận thông báo trong cài đặt hồ sơ'
        : isEn
          ? 'You can selectively receive notifications in profile settings'
          : '프로필 설정에서 원하는 알림만 선택적으로 받을 수 있습니다',
      tip2: isVi
        ? 'Bạn có thể quản lý riêng thông báo trả lời, bình luận, phản hồi và chấp nhận'
        : isEn
          ? 'Manage answer, comment, reply, and adoption notifications separately'
          : '답변, 댓글, 대댓글, 채택 알림을 각각 관리할 수 있습니다',
      tip3: isVi
        ? 'Tắt tất cả thông báo sẽ tạm dừng mọi thông báo'
        : isEn
          ? 'Turning off all notifications will pause all notifications temporarily'
          : '전체 알림을 끄면 모든 알림이 일시적으로 중단됩니다',
      tip4: isVi
        ? 'Kiểm tra cài đặt thông báo để không bỏ lỡ cập nhật quan trọng'
        : isEn
          ? 'Check your notification settings to not miss important updates'
          : '중요한 알림을 놓치지 않도록 알림 설정을 확인하세요',
      filters: {
        all: isVi ? 'Tất cả' : isEn ? 'All' : '전체',
        answer: isVi ? 'Câu trả lời' : isEn ? 'Answer' : '답변',
        comment: isVi ? 'Bình luận' : isEn ? 'Comment' : '댓글',
        reply: isVi ? 'Phản hồi' : isEn ? 'Reply' : '대댓글',
        adoption: isVi ? 'Chấp nhận' : isEn ? 'Adoption' : '채택',
        follow: isVi ? 'Theo dõi' : isEn ? 'Follow' : '팔로우',
      },
    };

    return {
      title: t.title || fallback.title,
      subtitle: t.subtitle || fallback.subtitle,
      unreadCount: t.unreadCount || fallback.unreadCount,
      markAllRead: t.markAllRead || fallback.markAllRead,
      settings: t.settings || fallback.settings,
      noNotifications: t.noNotifications || fallback.noNotifications,
      noNotificationsDesc: t.noNotificationsDesc || fallback.noNotificationsDesc,
      noFilteredNotifications: t.noFilteredNotifications || fallback.noFilteredNotifications,
      viewAll: t.viewAll || fallback.viewAll,
      post: t.post || fallback.post,
      tipTitle: t.tipTitle || fallback.tipTitle,
      tip1: t.tip1 || fallback.tip1,
      tip2: t.tip2 || fallback.tip2,
      tip3: t.tip3 || fallback.tip3,
      tip4: t.tip4 || fallback.tip4,
      filters: {
        all: t.all || fallback.filters.all,
        answer: t.answer || fallback.filters.answer,
        comment: t.comment || fallback.filters.comment,
        reply: t.reply || fallback.filters.reply,
        adoption: t.adoption || fallback.filters.adoption,
        follow: t.follow || fallback.filters.follow,
      },
    };
  }, [locale, t]);

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
                              className="w-6 h-6 rounded-full"
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
