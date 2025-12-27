import type { Answer, ApiResponse, CreateAnswerRequest, UpdateAnswerRequest, CreateCommentRequest, Comment } from './types';
import { ApiError, AccountRestrictedError, getRetryAfterSeconds } from '@/lib/api/errors';
const API_BASE = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

const resolveServerApiBase = () => {
  if (process.env.E2E_TEST_MODE === '1' || process.env.E2E_TEST_MODE === 'true') {
    const port = process.env.PORT || '3000';
    return `http://localhost:${port}`;
  }
  return API_BASE;
};

export async function fetchAnswers(postId: string): Promise<ApiResponse<Answer[]>> {
  const url = typeof window === 'undefined' ? `${resolveServerApiBase()}/api/posts/${postId}/answers` : `/api/posts/${postId}/answers`;
  const res = await fetch(url, {
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error('Failed to fetch answers');
  }

  return res.json();
}

export async function createAnswer(postId: string, data: CreateAnswerRequest): Promise<ApiResponse<Answer>> {
  const url = typeof window === 'undefined' ? `${resolveServerApiBase()}/api/posts/${postId}/answers` : `/api/posts/${postId}/answers`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    if (res.status === 403 && error.code === 'ACCOUNT_RESTRICTED') {
      throw new AccountRestrictedError(error.error || '');
    }
    throw new ApiError(
      error.error || 'Failed to create answer',
      res.status,
      error.code,
      getRetryAfterSeconds(res.headers)
    );
  }

  return res.json();
}

export async function updateAnswer(id: string, data: UpdateAnswerRequest): Promise<ApiResponse<Answer>> {
  const url = typeof window === 'undefined' ? `${resolveServerApiBase()}/api/answers/${id}` : `/api/answers/${id}`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new ApiError(
      error.error || 'Failed to update answer',
      res.status,
      error.code,
      getRetryAfterSeconds(res.headers)
    );
  }

  return res.json();
}

export async function deleteAnswer(id: string): Promise<ApiResponse<null>> {
  const url = typeof window === 'undefined' ? `${resolveServerApiBase()}/api/answers/${id}` : `/api/answers/${id}`;
  const res = await fetch(url, {
    method: 'DELETE',
  });

  if (!res.ok) {
    const error = await res.json();
    throw new ApiError(
      error.error || 'Failed to delete answer',
      res.status,
      error.code,
      getRetryAfterSeconds(res.headers)
    );
  }

  return res.json();
}

export async function toggleAnswerLike(answerId: string): Promise<ApiResponse<{ isLiked: boolean; isHelpful: boolean }>> {
  const url = typeof window === 'undefined' ? `${resolveServerApiBase()}/api/answers/${answerId}/like` : `/api/answers/${answerId}/like`;
  const res = await fetch(url, {
    method: 'POST',
  });

  if (!res.ok) {
    const error = await res.json();
    throw new ApiError(
      error.error || 'Failed to toggle like',
      res.status,
      error.code,
      getRetryAfterSeconds(res.headers)
    );
  }

  return res.json();
}

export async function adoptAnswer(answerId: string): Promise<ApiResponse<Answer>> {
  const url = typeof window === 'undefined' ? `${resolveServerApiBase()}/api/answers/${answerId}/adopt` : `/api/answers/${answerId}/adopt`;
  const res = await fetch(url, {
    method: 'POST',
  });

  if (!res.ok) {
    const error = await res.json();
    throw new ApiError(
      error.error || 'Failed to adopt answer',
      res.status,
      error.code,
      getRetryAfterSeconds(res.headers)
    );
  }

  return res.json();
}

export async function unadoptAnswer(answerId: string): Promise<ApiResponse<null>> {
  const url = typeof window === 'undefined' ? `${resolveServerApiBase()}/api/answers/${answerId}/adopt` : `/api/answers/${answerId}/adopt`;
  const res = await fetch(url, {
    method: 'DELETE',
  });

  if (!res.ok) {
    const error = await res.json();
    throw new ApiError(
      error.error || 'Failed to unadopt answer',
      res.status,
      error.code,
      getRetryAfterSeconds(res.headers)
    );
  }

  return res.json();
}

export async function fetchAnswerComments(answerId: string): Promise<ApiResponse<Comment[]>> {
  const url = typeof window === 'undefined' ? `${resolveServerApiBase()}/api/answers/${answerId}/comments` : `/api/answers/${answerId}/comments`;
  const res = await fetch(url, {
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error('Failed to fetch comments');
  }

  return res.json();
}

export async function createAnswerComment(answerId: string, data: CreateCommentRequest): Promise<ApiResponse<Comment>> {
  const url = typeof window === 'undefined' ? `${resolveServerApiBase()}/api/answers/${answerId}/comments` : `/api/answers/${answerId}/comments`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    if (res.status === 403 && error.code === 'ACCOUNT_RESTRICTED') {
      throw new AccountRestrictedError(error.error || '');
    }
    throw new ApiError(
      error.error || 'Failed to create comment',
      res.status,
      error.code,
      getRetryAfterSeconds(res.headers)
    );
  }

  return res.json();
}
