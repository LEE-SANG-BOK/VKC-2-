import type { FeedbackPayload, FeedbackReceipt, ApiResponse } from './types';
import { ApiError, getRetryAfterSeconds } from '@/lib/api/errors';

const API_BASE = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

type FetchOptions = {
  signal?: AbortSignal;
};

export async function submitFeedback(
  data: FeedbackPayload,
  options?: FetchOptions
): Promise<ApiResponse<FeedbackReceipt>> {
  const isServer = typeof window === 'undefined';
  const url = isServer ? `${API_BASE}/api/feedback` : '/api/feedback';

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    signal: options?.signal,
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new ApiError(
      error.error || error.message || '피드백 제출에 실패했습니다.',
      res.status,
      error.code,
      getRetryAfterSeconds(res.headers)
    );
  }

  return res.json();
}
