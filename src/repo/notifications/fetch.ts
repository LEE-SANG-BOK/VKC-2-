import type {
  Notification,
  NotificationFilters,
  PaginatedResponse,
  ApiResponse,
  UnreadCountResponse,
} from './types';
import { apiUrl } from '@/repo/apiBase';

export async function fetchNotifications(
  filters: NotificationFilters = {}
): Promise<PaginatedResponse<Notification>> {
  const params = new URLSearchParams();
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());
  if (filters.unreadOnly) params.append('unreadOnly', 'true');
  if (filters.type) params.append('type', filters.type);

  const query = params.toString();
  const res = await fetch(apiUrl(`/api/notifications${query ? `?${query}` : ''}`), {
    cache: 'no-store',
    credentials: 'include',
  });

  if (!res.ok) {
    throw new Error('Failed to fetch notifications');
  }

  return res.json();
}

export async function fetchUnreadCount(): Promise<ApiResponse<UnreadCountResponse>> {
  const res = await fetch(apiUrl('/api/notifications/unread-count'), {
    cache: 'no-store',
    credentials: 'include',
  });

  if (!res.ok) {
    throw new Error('Failed to fetch unread count');
  }

  return res.json();
}

export async function markAsRead(notificationId: string): Promise<ApiResponse<Notification>> {
  const res = await fetch(apiUrl(`/api/notifications/${notificationId}/read`), {
    method: 'PUT',
    credentials: 'include',
  });

  if (!res.ok) {
    throw new Error('Failed to mark notification as read');
  }

  return res.json();
}

export async function markAllAsRead(): Promise<ApiResponse<{ updated: number }>> {
  const res = await fetch(apiUrl('/api/notifications/read-all'), {
    method: 'PUT',
    credentials: 'include',
  });

  if (!res.ok) {
    throw new Error('Failed to mark all notifications as read');
  }

  return res.json();
}

export async function deleteNotification(notificationId: string): Promise<ApiResponse<null>> {
  const res = await fetch(apiUrl(`/api/notifications/${notificationId}`), {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!res.ok) {
    throw new Error('Failed to delete notification');
  }

  return res.json();
}
