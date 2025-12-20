'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../keys';
import {
  createPost,
  updatePost,
  deletePost,
  togglePostLike,
  togglePostBookmark,
  incrementPostView,
} from './fetch';
import { logEvent } from '@/repo/events/mutation';
import type {
  CreatePostRequest,
  UpdatePostRequest,
  Post,
  ApiResponse,
} from './types';

/**
 * 게시글 작성
 */
export function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePostRequest) => createPost(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      if (response?.success && response.data?.id) {
        logEvent({
          eventType: 'post',
          entityType: 'post',
          entityId: response.data.id,
        });
      }
    },
  });
}

/**
 * 게시글 수정
 */
export function useUpdatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePostRequest }) =>
      updatePost(id, data),
    onSuccess: (response, variables) => {
      if (response.success && response.data) {
        queryClient.invalidateQueries({ queryKey: queryKeys.posts.detail(variables.id) });
        queryClient.invalidateQueries({ queryKey: queryKeys.posts.lists() });
        queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      }
    },
  });
}

/**
 * 게시글 삭제
 */
export function useDeletePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deletePost(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: queryKeys.posts.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
  });
}

/**
 * 게시글 좋아요 토글
 */
export function useTogglePostLike() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postId: string) => togglePostLike(postId),
    onSuccess: (response, postId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.detail(postId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      queryClient.refetchQueries({ queryKey: queryKeys.posts.all, type: 'all' });
      queryClient.refetchQueries({ queryKey: queryKeys.users.all, type: 'all' });
      if (response?.data?.isLiked) {
        logEvent({
          eventType: 'like',
          entityType: 'post',
          entityId: postId,
        });
      }
    },
    onMutate: async (postId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.posts.all });
      await queryClient.cancelQueries({ queryKey: queryKeys.users.all });

      const allQueriesData = queryClient.getQueriesData({ queryKey: queryKeys.posts.all });
      const allUserQueriesData = queryClient.getQueriesData({ queryKey: queryKeys.users.all });

      queryClient.setQueriesData(
        { queryKey: queryKeys.posts.all },
        (oldData: any) => {
          if (!oldData) return oldData;
          if (oldData?.pages) {
            return {
              ...oldData,
              pages: oldData.pages.map((page: any) => ({
                ...page,
                data: page.data?.map((post: any) => {
                  if (post.id === postId) {
                    const newIsLiked = !post.isLiked;
                    return {
                      ...post,
                      isLiked: newIsLiked,
                      likes: newIsLiked ? (post.likes ?? 0) + 1 : Math.max(0, (post.likes ?? 0) - 1),
                      likesCount: newIsLiked ? (post.likesCount ?? 0) + 1 : Math.max(0, (post.likesCount ?? 0) - 1),
                    };
                  }
                  return post;
                }) ?? [],
              })),
            };
          }
          if (oldData?.data) {
            if (oldData.data.id === postId) {
              const newIsLiked = !oldData.data.isLiked;
              return {
                ...oldData,
                data: {
                  ...oldData.data,
                  isLiked: newIsLiked,
                  likes: newIsLiked ? (oldData.data.likes ?? 0) + 1 : Math.max(0, (oldData.data.likes ?? 0) - 1),
                  likesCount: newIsLiked ? (oldData.data.likesCount ?? 0) + 1 : Math.max(0, (oldData.data.likesCount ?? 0) - 1),
                },
              };
            }
          }
          return oldData;
        }
      );

      queryClient.setQueriesData(
        { queryKey: queryKeys.users.all },
        (oldData: any) => {
          if (!oldData) return oldData;
          if (oldData?.pages) {
            return {
              ...oldData,
              pages: oldData.pages.map((page: any) => ({
                ...page,
                data: page.data?.map((item: any) => {
                  if (item.id === postId) {
                    const newIsLiked = !item.isLiked;
                    return {
                      ...item,
                      isLiked: newIsLiked,
                      likes: newIsLiked ? (item.likes ?? 0) + 1 : Math.max(0, (item.likes ?? 0) - 1),
                      likesCount: newIsLiked ? (item.likesCount ?? 0) + 1 : Math.max(0, (item.likesCount ?? 0) - 1),
                    };
                  }
                  return item;
                }) ?? [],
              })),
            };
          }
          return oldData;
        }
      );

      return { allQueriesData, allUserQueriesData };
    },
    onError: (_, __, context) => {
      if (context?.allQueriesData) {
        context.allQueriesData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      if (context?.allUserQueriesData) {
        context.allUserQueriesData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
  });
}

/**
 * 게시글 북마크 토글
 */
export function useTogglePostBookmark() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postId: string) => togglePostBookmark(postId),
    onSuccess: (response, postId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.detail(postId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      queryClient.refetchQueries({ queryKey: queryKeys.posts.all, type: 'all' });
      queryClient.refetchQueries({ queryKey: queryKeys.users.all, type: 'all' });
      if (response?.data?.isBookmarked) {
        logEvent({
          eventType: 'bookmark',
          entityType: 'post',
          entityId: postId,
        });
      }
    },
    onMutate: async (postId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.posts.all });
      await queryClient.cancelQueries({ queryKey: queryKeys.users.all });

      const allQueriesData = queryClient.getQueriesData({ queryKey: queryKeys.posts.all });
      const allUserQueriesData = queryClient.getQueriesData({ queryKey: queryKeys.users.all });

      queryClient.setQueriesData(
        { queryKey: queryKeys.posts.all },
        (oldData: any) => {
          if (!oldData) return oldData;
          if (oldData?.pages) {
            return {
              ...oldData,
              pages: oldData.pages.map((page: any) => ({
                ...page,
                data: page.data?.map((post: any) => {
                  if (post.id === postId) {
                    return {
                      ...post,
                      isBookmarked: !post.isBookmarked,
                    };
                  }
                  return post;
                }) ?? [],
              })),
            };
          }
          if (oldData?.data) {
            if (oldData.data.id === postId) {
              return {
                ...oldData,
                data: {
                  ...oldData.data,
                  isBookmarked: !oldData.data.isBookmarked,
                },
              };
            }
          }
          return oldData;
        }
      );

      queryClient.setQueriesData(
        { queryKey: queryKeys.users.all },
        (oldData: any) => {
          if (!oldData) return oldData;
          if (oldData?.pages) {
            return {
              ...oldData,
              pages: oldData.pages.map((page: any) => ({
                ...page,
                data: page.data?.map((item: any) => {
                  if (item.id === postId) {
                    return {
                      ...item,
                      isBookmarked: !item.isBookmarked,
                    };
                  }
                  return item;
                }) ?? [],
              })),
            };
          }
          return oldData;
        }
      );

      return { allQueriesData, allUserQueriesData };
    },
    onError: (_, __, context) => {
      if (context?.allQueriesData) {
        context.allQueriesData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      if (context?.allUserQueriesData) {
        context.allUserQueriesData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
  });
}

/**
 * 게시글 조회수 증가
 */
export function useIncrementPostView() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postId: string) => incrementPostView(postId),
    onSuccess: (response, postId) => {
      // 조회수 업데이트
      const previousPost = queryClient.getQueryData<ApiResponse<Post>>(
        queryKeys.posts.detail(postId)
      );

      if (previousPost?.data) {
        queryClient.setQueryData<ApiResponse<Post>>(queryKeys.posts.detail(postId), {
          ...previousPost,
          data: {
            ...previousPost.data,
            views: response.data.views,
          },
        });
      }
    },
  });
}
