/**
 * Categories Repository Types
 * 카테고리 관련 타입 정의
 */

export interface Category {
  id: string;
  name: string;
  slug: string;
  order: number;
  children?: SubCategory[];
}

export interface SubCategory {
  id: string;
  name: string;
  slug: string;
  order: number;
}

export interface SubscribedCategory {
  id: string;
  name: string;
  slug: string;
  order: number;
}

export type NotificationChannel = 'in_app' | 'email' | 'push';
export type NotificationFrequency = 'instant' | 'daily' | 'weekly' | 'off';

export interface SubscriptionNotificationSetting {
  id: string;
  categoryId: string;
  notificationChannel: NotificationChannel;
  notificationFrequency: NotificationFrequency;
  category: {
    id: string;
    name: string;
    slug: string;
    parentId?: string | null;
    order: number;
  } | null;
}

export interface SubscriptionNotificationUpdate {
  categoryId: string;
  notificationChannel?: NotificationChannel;
  notificationFrequency?: NotificationFrequency;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface SubscriptionResponse {
  isSubscribed: boolean;
}
