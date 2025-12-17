import type {
  Notification,
  NotificationFilters,
  PaginatedResponse,
  ApiResponse,
  UnreadCountResponse,
} from './types';
const API_BASE = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export async function fetchNotifications(
  filters: NotificationFilters = {}
): Promise<PaginatedResponse<Notification>> {
  const params = new URLSearchParams();
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());
  if (filters.unreadOnly) params.append('unreadOnly', 'true');
  if (filters.type) params.append('type', filters.type);

  const res = await fetch(`${API_BASE}/api/notifications?${params.toString()}`, {
    cache: 'no-store',
    credentials: 'include',
  });

  if (!res.ok) {
    throw new Error('Failed to fetch notifications');
  }

  return res.json();
}

export async function fetchUnreadCount(): Promise<ApiResponse<UnreadCountResponse>> {
  const res = await fetch(`${API_BASE}/api/notifications?unreadOnly=true&limit=1`, {
    cache: 'no-store',
    credentials: 'include',
  });

  if (!res.ok) {
    throw new Error('Failed to fetch unread count');
  }

  const data = await res.json();
  return {
    success: true,
    data: { count: data.pagination?.total || 0 },
  };
}

export async function markAsRead(notificationId: string): Promise<ApiResponse<Notification>> {
  const res = await fetch(`${API_BASE}/api/notifications/${notificationId}/read`, {
    method: 'PUT',
    credentials: 'include',
  });

  if (!res.ok) {
    throw new Error('Failed to mark notification as read');
  }

  return res.json();
}

export async function markAllAsRead(): Promise<ApiResponse<{ updated: number }>> {
  const res = await fetch(`${API_BASE}/api/notifications/read-all`, {
    method: 'PUT',
    credentials: 'include',
  });

  if (!res.ok) {
    throw new Error('Failed to mark all notifications as read');
  }

  return res.json();
}

export async function deleteNotification(notificationId: string): Promise<ApiResponse<null>> {
  const res = await fetch(`${API_BASE}/api/notifications/${notificationId}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!res.ok) {
    throw new Error('Failed to delete notification');
  }

  return res.json();
}
