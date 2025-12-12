export type NotificationType = 'answer' | 'comment' | 'reply' | 'adoption' | 'like' | 'follow';

export interface NotificationSender {
  id: string;
  name: string | null;
  displayName: string | null;
  image: string | null;
  isVerified: boolean;
}

export interface NotificationPost {
  id: string;
  title: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  postId: string | null;
  answerId: string | null;
  commentId: string | null;
  senderId: string | null;
  content: string;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
  sender: NotificationSender | null;
  post: NotificationPost | null;
}

export interface NotificationFilters {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
  type?: NotificationType;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface UnreadCountResponse {
  count: number;
}
