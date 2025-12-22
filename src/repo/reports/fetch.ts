import type { Report, CreateReportData, ApiResponse } from './types';
import { ApiError, getRetryAfterSeconds } from '@/lib/api/errors';
const API_BASE = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export async function reportPost(
  postId: string,
  data: CreateReportData
): Promise<ApiResponse<Report>> {
  const isServer = typeof window === 'undefined';
  const url = isServer ? `${API_BASE}/api/posts/${postId}/report` : `/api/posts/${postId}/report`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  const result = await res.json();
  
  if (!res.ok || !result.success) {
    throw new ApiError(
      result.error || result.message || '',
      res.status,
      result.code || 'REPORT_FAILED',
      getRetryAfterSeconds(res.headers)
    );
  }

  return result;
}

export async function reportComment(
  commentId: string,
  data: CreateReportData
): Promise<ApiResponse<Report>> {
  const isServer = typeof window === 'undefined';
  const url = isServer ? `${API_BASE}/api/comments/${commentId}/report` : `/api/comments/${commentId}/report`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  const result = await res.json();
  
  if (!res.ok || !result.success) {
    throw new ApiError(
      result.error || result.message || '',
      res.status,
      result.code || 'REPORT_FAILED',
      getRetryAfterSeconds(res.headers)
    );
  }

  return result;
}

export async function reportAnswer(
  answerId: string,
  data: CreateReportData
): Promise<ApiResponse<Report>> {
  const isServer = typeof window === 'undefined';
  const url = isServer ? `${API_BASE}/api/answers/${answerId}/report` : `/api/answers/${answerId}/report`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  const result = await res.json();
  
  if (!res.ok || !result.success) {
    throw new ApiError(
      result.error || result.message || '',
      res.status,
      result.code || 'REPORT_FAILED',
      getRetryAfterSeconds(res.headers)
    );
  }

  return result;
}
