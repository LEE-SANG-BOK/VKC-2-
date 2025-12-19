'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toggleCategorySubscription, updateSubscriptionSettings } from './fetch';
import type { SubscriptionNotificationUpdate } from './types';
import { queryKeys } from '../keys';

export function useToggleSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (categoryId: string) => toggleCategorySubscription(categoryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.subscriptions() });
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.subscriptionSettings() });
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.lists() });
    },
  });
}

export function useUpdateSubscriptionSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updates: SubscriptionNotificationUpdate[] | SubscriptionNotificationUpdate) =>
      updateSubscriptionSettings(updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.subscriptionSettings() });
    },
  });
}
