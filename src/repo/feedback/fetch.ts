import type { FeedbackPayload, FeedbackReceipt, ApiResponse } from './types';
import { ApiError, getRetryAfterSeconds } from '@/lib/api/errors';
import { apiUrl } from '@/repo/apiBase';

type FetchOptions = {
  signal?: AbortSignal;
};

export async function submitFeedback(
  data: FeedbackPayload,
  options?: FetchOptions
): Promise<ApiResponse<FeedbackReceipt>> {
  const url = apiUrl('/api/feedback');

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
      error.error || error.message || '',
      res.status,
      error.code || 'FEEDBACK_FAILED',
      getRetryAfterSeconds(res.headers)
    );
  }

  return res.json();
}
