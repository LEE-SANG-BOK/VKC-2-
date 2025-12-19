import type { ApiResponse, SearchExamplesResponse, SearchKeywordsResponse } from './types';

const API_BASE = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export async function fetchSearchExamples(
  params: { limit?: number; period?: 'day' | 'week' | 'month' } = {},
  options?: { signal?: AbortSignal }
): Promise<ApiResponse<SearchExamplesResponse>> {
  const searchParams = new URLSearchParams();
  if (params.limit) searchParams.set('limit', String(params.limit));
  if (params.period) searchParams.set('period', params.period);

  const res = await fetch(`${API_BASE}/api/search/examples?${searchParams.toString()}`, {
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
  const res = await fetch(`${API_BASE}/api/search/keywords${query ? `?${query}` : ''}`, {
    cache: 'no-store',
    credentials: 'omit',
    signal: options?.signal,
  });

  if (!res.ok) {
    throw new Error('Failed to fetch search keywords');
  }

  return res.json();
}
