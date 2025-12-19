import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { queryKeys } from '@/repo/keys';
import { fetchSearchExamples, fetchSearchKeywords } from './fetch';
import type { ApiResponse, SearchExamplesResponse, SearchKeywordsResponse } from './types';

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

export function useSearchKeywords(
  params: { q?: string; limit?: number } = {},
  options?: Omit<UseQueryOptions<ApiResponse<SearchKeywordsResponse>>, 'queryKey' | 'queryFn'>
) {
  const queryKey = queryKeys.search.keywords(params.q || '', { limit: params.limit });

  return useQuery({
    queryKey,
    queryFn: ({ signal }) => fetchSearchKeywords(params, { signal }),
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    ...options,
  });
}
