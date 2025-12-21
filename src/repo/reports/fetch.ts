import type { Report, CreateReportData, ApiResponse } from './types';
import { ApiError, getRetryAfterSeconds } from '@/lib/api/errors';
const API_BASE = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export async function reportPost(
  postId: string,
  data: CreateReportData
): Promise<ApiResponse<Report>> {
  const res = await fetch(`${API_BASE}/api/posts/${postId}/report`, {
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
      result.error || result.message || '게시글 신고에 실패했습니다.',
      res.status,
      result.code,
      getRetryAfterSeconds(res.headers)
    );
  }

  return result;
}

export async function reportComment(
  commentId: string,
  data: CreateReportData
): Promise<ApiResponse<Report>> {
  const res = await fetch(`${API_BASE}/api/comments/${commentId}/report`, {
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
      result.error || result.message || '댓글 신고에 실패했습니다.',
      res.status,
      result.code,
      getRetryAfterSeconds(res.headers)
    );
  }

  return result;
}

export async function reportAnswer(
  answerId: string,
  data: CreateReportData
): Promise<ApiResponse<Report>> {
  const res = await fetch(`${API_BASE}/api/answers/${answerId}/report`, {
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
      result.error || result.message || '답글 신고에 실패했습니다.',
      res.status,
      result.code,
      getRetryAfterSeconds(res.headers)
    );
  }

  return result;
}
