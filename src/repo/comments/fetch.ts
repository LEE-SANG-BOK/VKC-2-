import type { Comment, ApiResponse, CreateCommentRequest, UpdateCommentRequest } from './types';
import { ApiError, AccountRestrictedError, getRetryAfterSeconds } from '@/lib/api/errors';
import { apiUrl } from '@/repo/apiBase';

export async function fetchPostComments(postId: string): Promise<ApiResponse<Comment[]>> {
  const res = await fetch(apiUrl(`/api/posts/${postId}/comments`), {
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error('Failed to fetch comments');
  }

  return res.json();
}

export async function createPostComment(postId: string, data: CreateCommentRequest): Promise<ApiResponse<Comment>> {
  const res = await fetch(apiUrl(`/api/posts/${postId}/comments`), {
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

export async function updateComment(id: string, data: UpdateCommentRequest): Promise<ApiResponse<Comment>> {
  const res = await fetch(apiUrl(`/api/comments/${id}`), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new ApiError(
      error.error || 'Failed to update comment',
      res.status,
      error.code,
      getRetryAfterSeconds(res.headers)
    );
  }

  return res.json();
}

export async function deleteComment(id: string): Promise<ApiResponse<null>> {
  const res = await fetch(apiUrl(`/api/comments/${id}`), {
    method: 'DELETE',
  });

  if (!res.ok) {
    const error = await res.json();
    throw new ApiError(
      error.error || 'Failed to delete comment',
      res.status,
      error.code,
      getRetryAfterSeconds(res.headers)
    );
  }

  return res.json();
}

export async function toggleCommentLike(commentId: string): Promise<ApiResponse<{ isLiked: boolean; likesCount: number }>> {
  const res = await fetch(apiUrl(`/api/comments/${commentId}/like`), {
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
