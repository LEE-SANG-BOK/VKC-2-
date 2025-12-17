'use client';

import { useMemo } from 'react';
import { useQuery, useInfiniteQuery, type InfiniteData, type UseQueryOptions } from '@tanstack/react-query';
import { queryKeys } from '../keys';
import {
  fetchPosts,
  fetchPost,
  fetchMyPostInteractions,
  fetchTrendingPosts,
} from './fetch';
import type {
  Post,
  PostListItem,
  PostInteractions,
  PaginatedResponse,
  ApiResponse,
  PostFilters,
} from './types';

export function useMyPostInteractions(
  postIds: string[],
  options?: Omit<UseQueryOptions<ApiResponse<PostInteractions>>, 'queryKey' | 'queryFn'>
) {
  const normalizedPostIds = useMemo(() => {
    return Array.from(
      new Set(postIds.filter((value): value is string => typeof value === 'string').map((value) => value.trim()).filter(Boolean))
    ).slice(0, 100);
  }, [postIds]);

  const enabled = (options?.enabled ?? true) && normalizedPostIds.length > 0;

  return useQuery({
    queryKey: queryKeys.posts.interactions(normalizedPostIds),
    queryFn: () => fetchMyPostInteractions(normalizedPostIds),
    enabled,
    staleTime: 1000 * 10,
    ...options,
  });
}

/**
 * 게시글 목록 조회 (무한 스크롤)
 */
export function useInfinitePosts(
  filters: Omit<PostFilters, 'page' | 'limit' | 'cursor'> = {},
  options?: any
) {
  const resolvedInitialPage = Math.max(
    1,
    Math.floor(Number(options?.initialPage ?? 1) || 1)
  );
  const resolvedOptions = options ? { ...options } : {};
  if (resolvedOptions.initialPage !== undefined) {
    delete resolvedOptions.initialPage;
  }

  type PageParam = { page: number; cursor?: string | null };

  return useInfiniteQuery<
    PaginatedResponse<PostListItem>,
    Error,
    InfiniteData<PaginatedResponse<PostListItem>>,
    ReturnType<typeof queryKeys.posts.infinite>,
    PageParam
  >({
    queryKey: queryKeys.posts.infinite(filters, resolvedInitialPage),
    queryFn: ({ pageParam = { page: resolvedInitialPage } as PageParam }) =>
      fetchPosts({
        ...filters,
        page: pageParam.page,
        cursor: pageParam.cursor || undefined,
        limit: 20,
      }),
    getNextPageParam: (lastPage) => {
      const nextCursor = lastPage.meta?.nextCursor;
      if (nextCursor) {
        return { page: lastPage.pagination.page + 1, cursor: nextCursor } satisfies PageParam;
      }
      const { page, totalPages } = lastPage.pagination;
      return page < totalPages ? ({ page: page + 1 } satisfies PageParam) : undefined;
    },
    initialPageParam: { page: resolvedInitialPage } satisfies PageParam,
    ...resolvedOptions,
  });
}

/**
 * 게시글 목록 조회 (일반 페이지네이션)
 */
export function usePosts(
  filters: PostFilters = {},
  options?: Omit<UseQueryOptions<PaginatedResponse<PostListItem>>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.posts.list(filters),
    queryFn: () => fetchPosts(filters),
    ...options,
  });
}

/**
 * 게시글 상세 조회
 */
export function usePost(
  id: string,
  options?: Omit<UseQueryOptions<ApiResponse<Post>>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.posts.detail(id),
    queryFn: () => fetchPost(id),
    enabled: !!id,
    ...options,
  });
}



/**
 * 인기 게시글 조회
 */
export function useTrendingPosts(
  period: 'day' | 'week' | 'month' = 'week',
  limit: number = 10,
  options?: Omit<UseQueryOptions<ApiResponse<Post[]>>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.posts.trending(period),
    queryFn: () => fetchTrendingPosts(period, limit),
    ...options,
  });
}
