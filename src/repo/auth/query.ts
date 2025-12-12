'use client';

import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { queryKeys } from '../keys';
import { fetchSession } from './fetch';
import type { Session, ApiResponse } from './types';

/**
 * 현재 세션 조회
 */
export function useSession(
  options?: Omit<UseQueryOptions<ApiResponse<Session>>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.auth.session(),
    queryFn: fetchSession,
    retry: false,
    ...options,
  });
}
