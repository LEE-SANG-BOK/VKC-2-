/**
 * Posts Repository Fetch Functions
 * 순수한 fetch 함수들 (React hooks 없음)
 */

import type {
  Post,
  PostListItem,
  PaginatedResponse,
  ApiResponse,
  CreatePostRequest,
  UpdatePostRequest,
  PostFilters,
} from './types';
import { ApiError, AccountRestrictedError } from '@/lib/api/errors';

const API_BASE = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

/**
 * 게시글 목록 조회
 */
export async function fetchPosts(filters: PostFilters = {}): Promise<PaginatedResponse<PostListItem>> {
  const params = new URLSearchParams();
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());
  if (filters.parentCategory) params.append('parentCategory', filters.parentCategory);
  if (filters.category) params.append('category', filters.category);
  if (filters.type) params.append('type', filters.type);
  if (filters.search) params.append('search', filters.search);
  if (filters.sort) params.append('sort', filters.sort);
  if (filters.filter) params.append('filter', filters.filter);

  const fetchOptions: RequestInit = {
    cache: 'no-store',
    credentials: 'include',
  };

  if (typeof window === 'undefined') {
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();
    if (cookieHeader) {
      fetchOptions.headers = {
        Cookie: cookieHeader,
      };
    }
  }

  const res = await fetch(`${API_BASE}/api/posts?${params.toString()}`, fetchOptions);

  if (!res.ok) {
    throw new Error('Failed to fetch posts');
  }

  return res.json();
}

/**
 * 게시글 상세 조회
 */
export async function fetchPost(id: string): Promise<ApiResponse<Post>> {
  const fetchOptions: RequestInit = {
    cache: 'no-store',
    credentials: 'include',
  };

  if (typeof window === 'undefined') {
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();
    if (cookieHeader) {
      fetchOptions.headers = {
        Cookie: cookieHeader,
      };
    }
  }

  const res = await fetch(`${API_BASE}/api/posts/${id}`, fetchOptions);

  if (!res.ok) {
    if (res.status === 404) {
      return { success: false, data: null as unknown as Post, message: 'Not found' };
    }
    const error = await res.json().catch(() => ({}));
    return {
      success: false,
      data: null as unknown as Post,
      message: error?.error || 'Failed to fetch post',
    };
  }

  return res.json();
}

/**
 * 인기 게시글 조회
 */
export async function fetchTrendingPosts(
  period: 'day' | 'week' | 'month' = 'week',
  limit: number = 10
): Promise<ApiResponse<Post[]>> {
  const params = new URLSearchParams({
    period,
    limit: limit.toString(),
  });

  const res = await fetch(`${API_BASE}/api/posts/trending?${params.toString()}`, {
    next: { revalidate: 300 },
    credentials: 'include',
  });

  if (!res.ok) {
    throw new Error('Failed to fetch trending posts');
  }

  return res.json();
}

/**
 * 게시글 작성
 */
export async function createPost(data: CreatePostRequest): Promise<ApiResponse<Post>> {
  const res = await fetch(`${API_BASE}/api/posts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    if (res.status === 403) {
      throw new AccountRestrictedError(error.error || 'Account restricted');
    }
    throw new ApiError(error.error || error.message || 'Failed to create post', res.status, error.code);
  }

  return res.json();
}

/**
 * 게시글 수정
 */
export async function updatePost(id: string, data: UpdatePostRequest): Promise<ApiResponse<Post>> {
  const res = await fetch(`${API_BASE}/api/posts/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to update post');
  }

  return res.json();
}

/**
 * 게시글 삭제
 */
export async function deletePost(id: string): Promise<ApiResponse<null>> {
  const res = await fetch(`${API_BASE}/api/posts/${id}`, {
    method: 'DELETE',
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to delete post');
  }

  return res.json();
}

/**
 * 게시글 좋아요 토글
 */
export async function togglePostLike(postId: string): Promise<ApiResponse<{ isLiked: boolean }>> {
  const res = await fetch(`${API_BASE}/api/posts/${postId}/like`, {
    method: 'POST',
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to toggle like');
  }

  return res.json();
}

/**
 * 게시글 북마크 토글
 */
export async function togglePostBookmark(
  postId: string
): Promise<ApiResponse<{ isBookmarked: boolean }>> {
  const res = await fetch(`${API_BASE}/api/posts/${postId}/bookmark`, {
    method: 'POST',
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to toggle bookmark');
  }

  return res.json();
}

/**
 * 게시글 조회수 증가 (클라이언트 전용)
 */
export async function incrementPostView(postId: string): Promise<ApiResponse<{ views: number }>> {
  const res = await fetch(`/api/posts/${postId}/view`, {
    method: 'POST',
    credentials: 'include',
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to increment view');
  }

  return res.json();
}
