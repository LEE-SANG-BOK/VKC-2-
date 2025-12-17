/**
 * Posts Repository Fetch Functions
 * 순수한 fetch 함수들 (React hooks 없음)
 */

import type {
  Post,
  PostListItem,
  PaginatedResponse,
  ApiResponse,
  PostInteractions,
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
  if (filters.cursor) params.append('cursor', filters.cursor);
  if (filters.parentCategory) params.append('parentCategory', filters.parentCategory);
  if (filters.category) params.append('category', filters.category);
  if (filters.type) params.append('type', filters.type);
  if (filters.search) params.append('search', filters.search);
  if (filters.sort) params.append('sort', filters.sort);
  if (filters.filter) params.append('filter', filters.filter);

  const needsAuth = Boolean(filters.filter) || Boolean(filters.search);
  const isServer = typeof window === 'undefined';

  const fetchOptions: RequestInit = needsAuth
    ? {
        cache: 'no-store',
        credentials: 'include',
      }
    : isServer
      ? {
          next: { revalidate: 60 },
        }
      : {
          credentials: 'omit',
        };

  if (needsAuth && isServer) {
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();
    if (cookieHeader) {
      fetchOptions.headers = {
        Cookie: cookieHeader,
      };
    }
  }

  const url = isServer
    ? `${API_BASE}/api/posts?${params.toString()}`
    : `/api/posts?${params.toString()}`;

  const res = await fetch(url, fetchOptions);

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

export async function fetchMyPostInteractions(postIds: string[]): Promise<ApiResponse<PostInteractions>> {
  const normalizedPostIds = Array.from(
    new Set(postIds.filter((value): value is string => typeof value === 'string').map((value) => value.trim()).filter(Boolean))
  ).slice(0, 100);

  if (normalizedPostIds.length === 0) {
    return {
      success: true,
      data: {
        likedPostIds: [],
        bookmarkedPostIds: [],
      },
    };
  }

  const url = typeof window === 'undefined' ? `${API_BASE}/api/users/me` : '/api/users/me';

  const fetchOptions: RequestInit = {
    method: 'POST',
    cache: 'no-store',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action: 'post_interactions', postIds: normalizedPostIds }),
  };

  if (typeof window === 'undefined') {
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();
    if (cookieHeader) {
      fetchOptions.headers = {
        ...(fetchOptions.headers || {}),
        Cookie: cookieHeader,
      };
    }
  }

  const res = await fetch(url, fetchOptions);
  if (!res.ok) {
    throw new Error('Failed to fetch post interactions');
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

  const url = typeof window === 'undefined'
    ? `${API_BASE}/api/posts/trending?${params.toString()}`
    : `/api/posts/trending?${params.toString()}`;

  const res = await fetch(url, {
    next: { revalidate: 300 },
    credentials: 'omit',
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
