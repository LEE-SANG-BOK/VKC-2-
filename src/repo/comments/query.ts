'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../keys';
import { fetchPostComments } from './fetch';

export function usePostComments(postId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.comments.list(postId),
    queryFn: () => fetchPostComments(postId),
    enabled: options?.enabled !== false && !!postId,
  });
}
