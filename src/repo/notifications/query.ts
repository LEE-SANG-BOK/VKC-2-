import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { queryKeys } from '@/repo/keys';
import { fetchNotifications, fetchUnreadCount } from './fetch';
import type { NotificationFilters } from './types';

export function useNotifications(filters: NotificationFilters = {}, options: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: queryKeys.notifications.list(filters),
    queryFn: () => fetchNotifications(filters),
    ...options,
  });
}

export function useInfiniteNotifications(filters: Omit<NotificationFilters, 'page'> = {}) {
  return useInfiniteQuery({
    queryKey: queryKeys.notifications.infinite(filters),
    queryFn: ({ pageParam = 1 }) => fetchNotifications({ ...filters, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.pagination;
      return page < totalPages ? page + 1 : undefined;
    },
  });
}

export function useUnreadNotificationCount(enabled: boolean = true) {
  return useQuery({
    queryKey: [...queryKeys.notifications.all, 'unread-count'],
    queryFn: fetchUnreadCount,
    refetchInterval: 1000,
    enabled,
  });
}
