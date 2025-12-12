import type { Answer, ApiResponse, CreateAnswerRequest, UpdateAnswerRequest, CreateCommentRequest, Comment } from './types';
import { AccountRestrictedError } from '@/lib/api/errors';

const API_BASE = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export async function fetchAnswers(postId: string): Promise<ApiResponse<Answer[]>> {
  const res = await fetch(`${API_BASE}/api/posts/${postId}/answers`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error('Failed to fetch answers');
  }

  return res.json();
}

export async function createAnswer(postId: string, data: CreateAnswerRequest): Promise<ApiResponse<Answer>> {
  const res = await fetch(`${API_BASE}/api/posts/${postId}/answers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json();
    if (res.status === 403) {
      throw new AccountRestrictedError(error.error || 'Account restricted');
    }
    throw new Error(error.error || 'Failed to create answer');
  }

  return res.json();
}

export async function updateAnswer(id: string, data: UpdateAnswerRequest): Promise<ApiResponse<Answer>> {
  const res = await fetch(`${API_BASE}/api/answers/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to update answer');
  }

  return res.json();
}

export async function deleteAnswer(id: string): Promise<ApiResponse<null>> {
  const res = await fetch(`${API_BASE}/api/answers/${id}`, {
    method: 'DELETE',
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to delete answer');
  }

  return res.json();
}

export async function toggleAnswerLike(answerId: string): Promise<ApiResponse<{ isLiked: boolean; isHelpful: boolean }>> {
  const res = await fetch(`${API_BASE}/api/answers/${answerId}/like`, {
    method: 'POST',
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to toggle like');
  }

  return res.json();
}

export async function adoptAnswer(answerId: string): Promise<ApiResponse<Answer>> {
  const res = await fetch(`${API_BASE}/api/answers/${answerId}/adopt`, {
    method: 'POST',
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to adopt answer');
  }

  return res.json();
}

export async function unadoptAnswer(answerId: string): Promise<ApiResponse<null>> {
  const res = await fetch(`${API_BASE}/api/answers/${answerId}/adopt`, {
    method: 'DELETE',
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to unadopt answer');
  }

  return res.json();
}

export async function fetchAnswerComments(answerId: string): Promise<ApiResponse<Comment[]>> {
  const res = await fetch(`${API_BASE}/api/answers/${answerId}/comments`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error('Failed to fetch comments');
  }

  return res.json();
}

export async function createAnswerComment(answerId: string, data: CreateCommentRequest): Promise<ApiResponse<Comment>> {
  const res = await fetch(`${API_BASE}/api/answers/${answerId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json();
    if (res.status === 403) {
      throw new AccountRestrictedError(error.error || 'Account restricted');
    }
    throw new Error(error.error || 'Failed to create comment');
  }

  return res.json();
}
