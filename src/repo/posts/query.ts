'use client';

import { useQuery, useInfiniteQuery, type UseQueryOptions } from '@tanstack/react-query';
import { queryKeys } from '../keys';
import {
  fetchPosts,
  fetchPost,
  fetchTrendingPosts,
} from './fetch';
import type {
  Post,
  PaginatedResponse,
  ApiResponse,
  PostFilters,
} from './types';

/**
 * 게시글 목록 조회 (무한 스크롤)
 */
export function useInfinitePosts(
  filters: Omit<PostFilters, 'page' | 'limit'> = {},
  options?: any
) {
  return useInfiniteQuery({
    queryKey: queryKeys.posts.infinite(filters),
    queryFn: ({ pageParam = 1 }) =>
      fetchPosts({
        ...filters,
        page: pageParam as number,
        limit: 20,
      }),
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.pagination;
      return page < totalPages ? page + 1 : undefined;
    },
    initialPageParam: 1,
    ...options,
  });
}

/**
 * 게시글 목록 조회 (일반 페이지네이션)
 */
export function usePosts(
  filters: PostFilters = {},
  options?: Omit<UseQueryOptions<PaginatedResponse<Post>>, 'queryKey' | 'queryFn'>
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
