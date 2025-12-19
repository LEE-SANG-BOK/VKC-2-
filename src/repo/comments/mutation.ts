'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../keys';
import { createPostComment, updateComment, deleteComment, toggleCommentLike } from './fetch';
import type { CreateCommentRequest, UpdateCommentRequest } from './types';
import { logEvent } from '@/repo/events/mutation';

export function useCreatePostComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ postId, data }: { postId: string; data: CreateCommentRequest }) =>
      createPostComment(postId, data),
    onSuccess: (response, { postId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.comments.list(postId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.detail(postId) });
      if (response?.data?.id) {
        logEvent({
          eventType: 'comment',
          entityType: 'comment',
          entityId: response.data.id,
          metadata: { postId },
        });
      }
    },
  });
}

export function useUpdateComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data, postId }: { id: string; data: UpdateCommentRequest; postId?: string }) =>
      updateComment(id, data),
    onSuccess: (_, { postId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.comments.all });
      if (postId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.posts.detail(postId) });
      }
    },
  });
}

export function useDeleteComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, postId }: { id: string; postId?: string }) => deleteComment(id),
    onSuccess: (_, { postId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.comments.all });
      if (postId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.posts.detail(postId) });
      }
    },
  });
}

export function useToggleCommentLike() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ commentId, postId }: { commentId: string; postId?: string }) => toggleCommentLike(commentId),
    onSuccess: (response, { commentId, postId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.comments.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      if (postId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.posts.detail(postId) });
      }
      queryClient.refetchQueries({ queryKey: queryKeys.comments.all, type: 'all' });
      queryClient.refetchQueries({ queryKey: queryKeys.posts.all, type: 'all' });
      queryClient.refetchQueries({ queryKey: queryKeys.users.all, type: 'all' });
      if (response?.data?.isLiked) {
        logEvent({
          eventType: 'like',
          entityType: 'comment',
          entityId: commentId,
          metadata: { postId: postId || null },
        });
      }
    },
    onMutate: async ({ commentId, postId }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.comments.all });
      await queryClient.cancelQueries({ queryKey: queryKeys.posts.all });
      await queryClient.cancelQueries({ queryKey: queryKeys.users.all });

      const allCommentsData = queryClient.getQueriesData({ queryKey: queryKeys.comments.all });
      const allPostsData = queryClient.getQueriesData({ queryKey: queryKeys.posts.all });
      const allUsersData = queryClient.getQueriesData({ queryKey: queryKeys.users.all });

      queryClient.setQueriesData(
        { queryKey: queryKeys.comments.all },
        (oldData: any) => {
          if (!oldData) return oldData;
          if (oldData?.pages) {
            return {
              ...oldData,
              pages: oldData.pages.map((page: any) => ({
                ...page,
                data: page.data?.map((comment: any) => {
                  if (comment.id === commentId) {
                    const newIsLiked = !comment.isLiked;
                    return {
                      ...comment,
                      isLiked: newIsLiked,
                      likes: newIsLiked ? (comment.likes ?? 0) + 1 : Math.max(0, (comment.likes ?? 0) - 1),
                    };
                  }
                  return comment;
                }) ?? [],
              })),
            };
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
                  if (item.id === commentId) {
                    const newIsLiked = !item.isLiked;
                    return {
                      ...item,
                      isLiked: newIsLiked,
                      likes: newIsLiked ? (item.likes ?? 0) + 1 : Math.max(0, (item.likes ?? 0) - 1),
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

      return { allCommentsData, allPostsData, allUsersData, postId };
    },
    onError: (_, __, context) => {
      if (context?.allCommentsData) {
        context.allCommentsData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      if (context?.allPostsData) {
        context.allPostsData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      if (context?.allUsersData) {
        context.allUsersData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
  });
}
