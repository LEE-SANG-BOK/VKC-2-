'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../keys';
import { logout } from './fetch';

/**
 * 로그아웃
 */
export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      // 모든 캐시 무효화
      queryClient.clear();
    },
  });
}
