/**
 * Categories Repository Fetch Functions
 * 순수한 fetch 함수들 (React hooks 없음)
 */

import type { Category, SubscribedCategory, ApiResponse, SubscriptionResponse } from './types';
const API_BASE = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

const withCredentials = typeof window === 'undefined'
  ? { credentials: 'include' as const, headers: {} as Record<string, string> }
  : { credentials: 'include' as const };

async function fetchWithAuth(url: string, init?: RequestInit) {
  const options: RequestInit = {
    cache: 'no-store',
    ...withCredentials,
    ...init,
  };

  // SSR 쿠키 전달
  if (typeof window === 'undefined') {
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();
    if (cookieHeader) {
      options.headers = {
        ...(options.headers || {}),
        Cookie: cookieHeader,
      };
    }
  }

  const res = await fetch(url, options);
  if (!res.ok) {
    throw new Error('Request failed');
  }
  return res.json();
}

/**
 * 카테고리 목록 조회 (2단계 구조) - Client-side
 */
export async function fetchCategories(): Promise<Category[]> {
  const url = typeof window === 'undefined' ? `${API_BASE}/api/categories` : '/api/categories';
  const res = await fetch(url, {
    next: { revalidate: 300 },
  });
  if (!res.ok) {
    throw new Error('Failed to fetch categories');
  }
  const result: ApiResponse<Category[]> = await res.json();
  return result.data;
}

/**
 * 내 구독 카테고리 목록 조회
 */
export async function fetchMySubscriptions(): Promise<SubscribedCategory[]> {
  const result: ApiResponse<SubscribedCategory[]> = await fetchWithAuth(
    `${API_BASE}/api/users/me/subscriptions`
  );
  return result.data;
}

/**
 * 카테고리 구독 토글
 */
export async function toggleCategorySubscription(categoryId: string): Promise<SubscriptionResponse> {
  const result: ApiResponse<SubscriptionResponse> = await fetchWithAuth(
    `${API_BASE}/api/categories/${categoryId}/subscribe`,
    { method: 'POST' }
  );
  return result.data;
}
