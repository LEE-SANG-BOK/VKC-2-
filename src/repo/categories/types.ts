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

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface SubscriptionResponse {
  isSubscribed: boolean;
}
