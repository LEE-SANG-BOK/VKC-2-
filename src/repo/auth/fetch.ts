/**
 * Auth Repository Fetch Functions
 * 순수한 fetch 함수들 (React hooks 없음)
 */

import type { Session, ApiResponse } from './types';
const API_BASE = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

/**
 * 현재 세션 조회
 */
export async function fetchSession(): Promise<ApiResponse<Session>> {
  const res = await fetch(`${API_BASE}/api/auth/session`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error('Failed to fetch session');
  }

  return res.json();
}

/**
 * 로그아웃
 */
export async function logout(): Promise<ApiResponse<null>> {
  const res = await fetch(`${API_BASE}/api/auth/logout`, {
    method: 'POST',
  });

  if (!res.ok) {
    throw new Error('Failed to logout');
  }

  return res.json();
}
