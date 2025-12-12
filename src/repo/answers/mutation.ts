'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../keys';
import {
  createAnswer,
  updateAnswer,
  deleteAnswer,
  toggleAnswerLike,
  adoptAnswer,
  unadoptAnswer,
  createAnswerComment,
} from './fetch';
import type { CreateAnswerRequest, UpdateAnswerRequest, CreateCommentRequest } from './types';

export function useCreateAnswer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ postId, data }: { postId: string; data: CreateAnswerRequest }) =>
      createAnswer(postId, data),
    onSuccess: (_, { postId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.answers.list(postId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.detail(postId) });
    },
  });
}

export function useUpdateAnswer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data, postId }: { id: string; data: UpdateAnswerRequest; postId?: string }) =>
      updateAnswer(id, data),
    onSuccess: (_, { postId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.answers.all });
      if (postId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.posts.detail(postId) });
      }
    },
  });
}

export function useDeleteAnswer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, postId }: { id: string; postId?: string }) => deleteAnswer(id),
    onSuccess: (_, { postId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.answers.all });
      if (postId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.posts.detail(postId) });
      }
    },
  });
}

export function useToggleAnswerLike() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ answerId, postId }: { answerId: string; postId?: string }) => toggleAnswerLike(answerId),
    onSuccess: (_, { postId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.answers.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      if (postId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.posts.detail(postId) });
      }
      queryClient.refetchQueries({ queryKey: queryKeys.answers.all, type: 'all' });
      queryClient.refetchQueries({ queryKey: queryKeys.posts.all, type: 'all' });
      queryClient.refetchQueries({ queryKey: queryKeys.users.all, type: 'all' });
    },
    onMutate: async ({ answerId, postId }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.answers.all });
      await queryClient.cancelQueries({ queryKey: queryKeys.posts.all });
      await queryClient.cancelQueries({ queryKey: queryKeys.users.all });

      const allAnswersData = queryClient.getQueriesData({ queryKey: queryKeys.answers.all });
      const allPostsData = queryClient.getQueriesData({ queryKey: queryKeys.posts.all });
      const allUsersData = queryClient.getQueriesData({ queryKey: queryKeys.users.all });

      queryClient.setQueriesData(
        { queryKey: queryKeys.answers.all },
        (oldData: any) => {
          if (!oldData) return oldData;
          if (oldData?.pages) {
            return {
              ...oldData,
              pages: oldData.pages.map((page: any) => ({
                ...page,
                data: page.data?.map((answer: any) => {
                  if (answer.id === answerId) {
                    const newIsLiked = !answer.isLiked;
                    return {
                      ...answer,
                      isLiked: newIsLiked,
                      isHelpful: newIsLiked,
                      likes: newIsLiked ? (answer.likes ?? 0) + 1 : Math.max(0, (answer.likes ?? 0) - 1),
                      helpful: newIsLiked ? (answer.helpful ?? 0) + 1 : Math.max(0, (answer.helpful ?? 0) - 1),
                    };
                  }
                  return answer;
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
                  if (item.id === answerId) {
                    const newIsLiked = !item.isLiked;
                    return {
                      ...item,
                      isLiked: newIsLiked,
                      isHelpful: newIsLiked,
                      likes: newIsLiked ? (item.likes ?? 0) + 1 : Math.max(0, (item.likes ?? 0) - 1),
                      helpful: newIsLiked ? (item.helpful ?? 0) + 1 : Math.max(0, (item.helpful ?? 0) - 1),
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

      return { allAnswersData, allPostsData, allUsersData, postId };
    },
    onError: (_, __, context) => {
      if (context?.allAnswersData) {
        context.allAnswersData.forEach(([queryKey, data]) => {
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

export function useAdoptAnswer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ answerId, postId }: { answerId: string; postId?: string }) => adoptAnswer(answerId),
    onSuccess: (_, { postId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.answers.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.all });
      if (postId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.posts.detail(postId) });
      }
    },
  });
}

export function useUnadoptAnswer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ answerId, postId }: { answerId: string; postId?: string }) => unadoptAnswer(answerId),
    onSuccess: (_, { postId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.answers.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.all });
      if (postId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.posts.detail(postId) });
      }
    },
  });
}

export function useCreateAnswerComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ answerId, data, postId }: { answerId: string; data: CreateCommentRequest; postId?: string }) =>
      createAnswerComment(answerId, data),
    onSuccess: (_, { answerId, postId }) => {
      queryClient.invalidateQueries({ queryKey: [...queryKeys.answers.list(answerId), 'comments'] });
      if (postId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.posts.detail(postId) });
      }
    },
  });
}
