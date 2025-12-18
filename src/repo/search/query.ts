import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { queryKeys } from '@/repo/keys';
import { fetchSearchExamples } from './fetch';
import type { ApiResponse, SearchExamplesResponse } from './types';

export function useSearchExamples(
  params: { limit?: number; period?: 'day' | 'week' | 'month' } = {},
  options?: Omit<UseQueryOptions<ApiResponse<SearchExamplesResponse>>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.search.examples(params),
    queryFn: ({ signal }) => fetchSearchExamples(params, { signal }),
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    ...options,
  });
}
