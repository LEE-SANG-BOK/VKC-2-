'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/repo/keys';
import { hideTarget, unhideTarget } from './fetch';
import type { HiddenTargetsResponse, HideTargetPayload } from './types';

const addHiddenId = (prev: HiddenTargetsResponse | undefined, targetId: string) => {
  const ids = prev?.ids ?? [];
  if (ids.includes(targetId)) {
    return prev ?? { ids };
  }
  return { ids: [...ids, targetId] };
};

const removeHiddenId = (prev: HiddenTargetsResponse | undefined, targetId: string) => {
  if (!prev) {
    return { ids: [] };
  }
  return { ids: prev.ids.filter((id) => id !== targetId) };
};

export function useHideTarget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: HideTargetPayload) => hideTarget(payload),
    onSuccess: (_, { targetType, targetId }) => {
      queryClient.setQueryData(
        queryKeys.hides.list(targetType),
        (prev: HiddenTargetsResponse | undefined) => addHiddenId(prev, targetId)
      );
    },
  });
}

export function useUnhideTarget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: HideTargetPayload) => unhideTarget(payload),
    onSuccess: (_, { targetType, targetId }) => {
      queryClient.setQueryData(
        queryKeys.hides.list(targetType),
        (prev: HiddenTargetsResponse | undefined) => removeHiddenId(prev, targetId)
      );
    },
  });
}
