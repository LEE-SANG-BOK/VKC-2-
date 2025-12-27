import type { ApiResponse, SearchExamplesResponse, SearchKeywordsResponse } from './types';
import { apiUrl } from '@/repo/apiBase';

export async function fetchSearchExamples(
  params: { limit?: number; period?: 'day' | 'week' | 'month' } = {},
  options?: { signal?: AbortSignal }
): Promise<ApiResponse<SearchExamplesResponse>> {
  const searchParams = new URLSearchParams();
  if (params.limit) searchParams.set('limit', String(params.limit));
  if (params.period) searchParams.set('period', params.period);

  const query = searchParams.toString();
  const res = await fetch(apiUrl(`/api/search/examples${query ? `?${query}` : ''}`), {
    cache: 'no-store',
    credentials: 'omit',
    signal: options?.signal,
  });

  if (!res.ok) {
    throw new Error('Failed to fetch search examples');
  }

  return res.json();
}

export async function fetchSearchKeywords(
  params: { q?: string; limit?: number } = {},
  options?: { signal?: AbortSignal }
): Promise<ApiResponse<SearchKeywordsResponse>> {
  const searchParams = new URLSearchParams();
  if (params.q) searchParams.set('q', params.q.trim());
  if (params.limit) searchParams.set('limit', String(params.limit));

  const query = searchParams.toString();
  const res = await fetch(apiUrl(`/api/search/keywords${query ? `?${query}` : ''}`), {
    cache: 'no-store',
    credentials: 'omit',
    signal: options?.signal,
  });

  if (!res.ok) {
    throw new Error('Failed to fetch search keywords');
  }

  return res.json();
}
