import type { Comment, ApiResponse, CreateCommentRequest, UpdateCommentRequest } from './types';
import { ApiError, AccountRestrictedError } from '@/lib/api/errors';

const API_BASE = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export async function fetchPostComments(postId: string): Promise<ApiResponse<Comment[]>> {
  const res = await fetch(`${API_BASE}/api/posts/${postId}/comments`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error('Failed to fetch comments');
  }

  return res.json();
}

export async function createPostComment(postId: string, data: CreateCommentRequest): Promise<ApiResponse<Comment>> {
  const res = await fetch(`${API_BASE}/api/posts/${postId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    if (res.status === 403) {
      throw new AccountRestrictedError(error.error || 'Account restricted');
    }
    throw new ApiError(error.error || 'Failed to create comment', res.status, error.code);
  }

  return res.json();
}

export async function updateComment(id: string, data: UpdateCommentRequest): Promise<ApiResponse<Comment>> {
  const res = await fetch(`${API_BASE}/api/comments/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to update comment');
  }

  return res.json();
}

export async function deleteComment(id: string): Promise<ApiResponse<null>> {
  const res = await fetch(`${API_BASE}/api/comments/${id}`, {
    method: 'DELETE',
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to delete comment');
  }

  return res.json();
}

export async function toggleCommentLike(commentId: string): Promise<ApiResponse<{ isLiked: boolean; likesCount: number }>> {
  const res = await fetch(`${API_BASE}/api/comments/${commentId}/like`, {
    method: 'POST',
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to toggle like');
  }

  return res.json();
}
