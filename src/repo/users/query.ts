'use client';

import { useQuery, useInfiniteQuery, type UseQueryOptions, type UseInfiniteQueryOptions } from '@tanstack/react-query';
import { queryKeys } from '../keys';
import {
  fetchMyProfile,
  fetchUserProfile,
  fetchUserPosts,
  fetchUserAnswers,
  fetchUserComments,
  fetchUserBookmarks,
  fetchFollowers,
  fetchFollowing,
  checkFollowStatus,
  fetchRecommendedUsers,
} from './fetch';
import type {
  UserProfile,
  UserFilters,
  AnswerFilters,
  PaginatedResponse,
  UserPost,
  UserAnswer,
  UserComment,
  UserBookmark,
  User,
} from './types';

export function useMyProfile(
  options?: Omit<UseQueryOptions<User>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.users.me(),
    queryFn: async () => {
      const res = await fetchMyProfile();
      return res.data;
    },
    staleTime: 1000 * 60 * 5,
    ...options,
  });
}

export function useUserProfile(
  userId: string,
  options?: Omit<UseQueryOptions<UserProfile>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.users.detail(userId),
    queryFn: () => fetchUserProfile(userId),
    enabled: !!userId,
    ...options,
  });
}

export function useFollowStatus(
  userId: string,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: ['followStatus', userId],
    queryFn: () => checkFollowStatus(userId),
    enabled: !!userId && enabled,
  });
}

export function useUserPosts(
  userId: string,
  filters: UserFilters = {},
  options?: Omit<UseQueryOptions<PaginatedResponse<UserPost>>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.users.posts(userId, filters),
    queryFn: () => fetchUserPosts(userId, filters),
    enabled: !!userId,
    ...options,
  });
}

export function useUserAnswers(
  userId: string,
  filters: AnswerFilters = {},
  options?: Omit<UseQueryOptions<PaginatedResponse<UserAnswer>>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.users.answers(userId, filters),
    queryFn: () => fetchUserAnswers(userId, filters),
    enabled: !!userId,
    ...options,
  });
}

export function useUserComments(
  userId: string,
  filters: Omit<UserFilters, 'type'> = {},
  options?: Omit<UseQueryOptions<PaginatedResponse<UserComment>>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.users.comments(userId, filters),
    queryFn: () => fetchUserComments(userId, filters),
    enabled: !!userId,
    ...options,
  });
}

export function useUserBookmarks(
  userId: string,
  filters: Omit<UserFilters, 'type'> = {},
  options?: Omit<UseQueryOptions<PaginatedResponse<UserBookmark>>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.users.bookmarks(userId, filters),
    queryFn: () => fetchUserBookmarks(userId, filters),
    enabled: !!userId,
    ...options,
  });
}

export function useInfiniteFollowers(
  userId: string,
  filters: Omit<UserFilters, 'page' | 'limit' | 'type' | 'cursor'> = {},
  options?: Record<string, unknown>
) {
  type PageParam = { page: number; cursor?: string | null };

  return useInfiniteQuery({
    queryKey: queryKeys.users.followers(userId, filters),
    queryFn: ({ pageParam = { page: 1 } as PageParam }) =>
      fetchFollowers(userId, {
        ...filters,
        page: pageParam.page,
        cursor: pageParam.cursor || undefined,
        limit: 20,
      }),
    getNextPageParam: (lastPage: PaginatedResponse<User>) => {
      const nextCursor = lastPage.meta?.nextCursor;
      if (nextCursor) {
        return { page: lastPage.pagination.page + 1, cursor: nextCursor } satisfies PageParam;
      }
      const { page, totalPages } = lastPage.pagination;
      return page < totalPages ? ({ page: page + 1 } satisfies PageParam) : undefined;
    },
    initialPageParam: { page: 1 } satisfies PageParam,
    enabled: !!userId,
    ...options,
  });
}

export function useInfiniteFollowing(
  userId: string,
  filters: Omit<UserFilters, 'page' | 'limit' | 'type' | 'cursor'> = {},
  options?: Record<string, unknown>
) {
  type PageParam = { page: number; cursor?: string | null };

  return useInfiniteQuery({
    queryKey: queryKeys.users.following(userId, filters),
    queryFn: ({ pageParam = { page: 1 } as PageParam }) =>
      fetchFollowing(userId, {
        ...filters,
        page: pageParam.page,
        cursor: pageParam.cursor || undefined,
        limit: 20,
      }),
    getNextPageParam: (lastPage: PaginatedResponse<User>) => {
      const nextCursor = lastPage.meta?.nextCursor;
      if (nextCursor) {
        return { page: lastPage.pagination.page + 1, cursor: nextCursor } satisfies PageParam;
      }
      const { page, totalPages } = lastPage.pagination;
      return page < totalPages ? ({ page: page + 1 } satisfies PageParam) : undefined;
    },
    initialPageParam: { page: 1 } satisfies PageParam,
    enabled: !!userId,
    ...options,
  });
}

export function useInfiniteUserPosts(
  userId: string,
  options?: Record<string, unknown>
) {
  type PageParam = { page: number; cursor?: string | null };

  return useInfiniteQuery({
    queryKey: queryKeys.users.posts(userId, {}),
    queryFn: ({ pageParam = { page: 1 } as PageParam }) =>
      fetchUserPosts(userId, {
        page: pageParam.page,
        cursor: pageParam.cursor || undefined,
        limit: 20,
      }),
    getNextPageParam: (lastPage: PaginatedResponse<UserPost>) => {
      const nextCursor = lastPage.meta?.nextCursor;
      if (nextCursor) {
        return { page: lastPage.pagination.page + 1, cursor: nextCursor } satisfies PageParam;
      }
      const { page, totalPages } = lastPage.pagination;
      return page < totalPages ? ({ page: page + 1 } satisfies PageParam) : undefined;
    },
    initialPageParam: { page: 1 } satisfies PageParam,
    enabled: !!userId,
    ...options,
  });
}

export function useInfiniteUserBookmarks(
  userId: string,
  options?: Record<string, unknown>
) {
  type PageParam = { page: number; cursor?: string | null };

  return useInfiniteQuery({
    queryKey: queryKeys.users.bookmarks(userId, {}),
    queryFn: ({ pageParam = { page: 1 } as PageParam }) =>
      fetchUserBookmarks(userId, {
        page: pageParam.page,
        cursor: pageParam.cursor || undefined,
        limit: 20,
      }),
    getNextPageParam: (lastPage: PaginatedResponse<UserBookmark>) => {
      const nextCursor = lastPage.meta?.nextCursor;
      if (nextCursor) {
        return { page: lastPage.pagination.page + 1, cursor: nextCursor } satisfies PageParam;
      }
      const { page, totalPages } = lastPage.pagination;
      return page < totalPages ? ({ page: page + 1 } satisfies PageParam) : undefined;
    },
    initialPageParam: { page: 1 } satisfies PageParam,
    enabled: !!userId,
    ...options,
  });
}

export function useRecommendedUsers(
  options?: Omit<UseQueryOptions<PaginatedResponse<User>>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.users.recommended(),
    queryFn: () => fetchRecommendedUsers({ page: 1, limit: 12 }),
    staleTime: 1000 * 60 * 5,
    ...options,
  });
}

export function useInfiniteUserAnswers(
  userId: string,
  filters: Omit<AnswerFilters, 'page' | 'limit'> = {},
  options?: Record<string, unknown>
) {
  type PageParam = { page: number; cursor?: string | null };

  return useInfiniteQuery({
    queryKey: queryKeys.users.answers(userId, filters),
    queryFn: ({ pageParam = { page: 1 } as PageParam }) =>
      fetchUserAnswers(userId, {
        ...filters,
        page: pageParam.page,
        cursor: pageParam.cursor || undefined,
        limit: 20,
      }),
    getNextPageParam: (lastPage: PaginatedResponse<UserAnswer>) => {
      const nextCursor = lastPage.meta?.nextCursor;
      if (nextCursor) {
        return { page: lastPage.pagination.page + 1, cursor: nextCursor } satisfies PageParam;
      }
      const { page, totalPages } = lastPage.pagination;
      return page < totalPages ? ({ page: page + 1 } satisfies PageParam) : undefined;
    },
    initialPageParam: { page: 1 } satisfies PageParam,
    enabled: !!userId,
    ...options,
  });
}

export function useInfiniteUserComments(
  userId: string,
  options?: Record<string, unknown>
) {
  type PageParam = { page: number; cursor?: string | null };

  return useInfiniteQuery({
    queryKey: queryKeys.users.comments(userId, {}),
    queryFn: ({ pageParam = { page: 1 } as PageParam }) =>
      fetchUserComments(userId, {
        page: pageParam.page,
        cursor: pageParam.cursor || undefined,
        limit: 20,
      }),
    getNextPageParam: (lastPage: PaginatedResponse<UserComment>) => {
      const nextCursor = lastPage.meta?.nextCursor;
      if (nextCursor) {
        return { page: lastPage.pagination.page + 1, cursor: nextCursor } satisfies PageParam;
      }
      const { page, totalPages } = lastPage.pagination;
      return page < totalPages ? ({ page: page + 1 } satisfies PageParam) : undefined;
    },
    initialPageParam: { page: 1 } satisfies PageParam,
    enabled: !!userId,
    ...options,
  });
}

export function useInfiniteRecommendedUsers(
  options?: Omit<UseInfiniteQueryOptions<PaginatedResponse<User>>, 'queryKey' | 'queryFn' | 'initialPageParam' | 'getNextPageParam'>
) {
  return useInfiniteQuery({
    queryKey: queryKeys.users.recommended(),
    queryFn: async ({ pageParam = 1 }) => {
      const page = pageParam as number;
      return fetchRecommendedUsers({
        page,
        limit: 6,
      });
    },
    getNextPageParam: (lastPage) => {
      const pagination = lastPage?.pagination;
      if (!pagination) return undefined;
      const { page, totalPages } = pagination;
      return page < totalPages ? page + 1 : undefined;
    },
    initialPageParam: 1,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 1,
    ...options,
  });
}
