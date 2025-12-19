'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../keys';
import { updateMyProfile, toggleFollow } from './fetch';
import type { UpdateProfileRequest, UserProfile } from './types';
import { logEvent } from '@/repo/events/mutation';

export function useUpdateMyProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateProfileRequest) => updateMyProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.me() });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
  });
}

export function useToggleFollow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => toggleFollow(userId),
    onMutate: async (userId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.users.all });

      const allQueriesData = queryClient.getQueriesData({ queryKey: queryKeys.users.all });

      queryClient.setQueriesData(
        { queryKey: queryKeys.users.all },
        (oldData: any) => {
          if (!oldData) return oldData;
          
          if (oldData?.pages) {
            return {
              ...oldData,
              pages: oldData.pages.map((page: any) => ({
                ...page,
                data: page.data?.map((user: any) => {
                  if (user.id === userId) {
                    return {
                      ...user,
                      isFollowing: !user.isFollowing,
                      stats: user.stats ? {
                        ...user.stats,
                        followers: user.isFollowing 
                          ? Math.max(0, (user.stats.followers || 0) - 1)
                          : (user.stats.followers || 0) + 1,
                      } : undefined,
                    };
                  }
                  return user;
                }) ?? [],
              })),
            };
          }
          
          if (oldData?.data && oldData.data.id === userId) {
            return {
              ...oldData,
              data: {
                ...oldData.data,
                isFollowing: !oldData.data.isFollowing,
                followers: oldData.data.isFollowing
                  ? Math.max(0, (oldData.data.followers || 0) - 1)
                  : (oldData.data.followers || 0) + 1,
              },
            };
          }
          
          return oldData;
        }
      );

      return { allQueriesData };
    },
    onError: (_, __, context) => {
      if (context?.allQueriesData) {
        context.allQueriesData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSuccess: (response, userId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.details() });
      queryClient.invalidateQueries({ queryKey: ['followStatus', userId] });
      if (response?.data?.isFollowing) {
        logEvent({
          eventType: 'follow',
          entityType: 'user',
          entityId: userId,
        });
      }
    },
  });
}
