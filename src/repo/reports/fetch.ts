import type { Report, CreateReportData, ApiResponse } from './types';
import { ApiError, getRetryAfterSeconds } from '@/lib/api/errors';
import { apiUrl } from '@/repo/apiBase';

export async function reportPost(
  postId: string,
  data: CreateReportData
): Promise<ApiResponse<Report>> {
  const url = apiUrl(`/api/posts/${postId}/report`);
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
  const url = apiUrl(`/api/comments/${commentId}/report`);
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
  const url = apiUrl(`/api/answers/${answerId}/report`);
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
