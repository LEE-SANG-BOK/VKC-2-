import type { HiddenTargetsResponse, HideTargetPayload, HiddenTargetType } from './types';

const API_BASE = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

const withCredentials = typeof window === 'undefined'
  ? { credentials: 'include' as const, headers: {} as Record<string, string> }
  : { credentials: 'include' as const };

async function fetchWithAuth(url: string, init?: RequestInit) {
  const options: RequestInit = {
    cache: 'no-store',
    ...withCredentials,
    ...init,
  };

  if (typeof window === 'undefined') {
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();
    if (cookieHeader) {
      options.headers = {
        ...(options.headers || {}),
        Cookie: cookieHeader,
      };
    }
  }

  const res = await fetch(url, options);
  if (!res.ok) {
    throw new Error('Request failed');
  }
  return res.json();
}

export async function fetchHiddenTargets(type?: HiddenTargetType): Promise<HiddenTargetsResponse> {
  const params = new URLSearchParams();
  if (type) params.append('type', type);
  const query = params.toString();
  const url = typeof window === 'undefined'
    ? `${API_BASE}/api/hides${query ? `?${query}` : ''}`
    : `/api/hides${query ? `?${query}` : ''}`;
  const result = await fetchWithAuth(url);
  return result.data;
}

export async function hideTarget(payload: HideTargetPayload): Promise<{ success: boolean }> {
  const url = typeof window === 'undefined' ? `${API_BASE}/api/hides` : '/api/hides';
  const result = await fetchWithAuth(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  return result.data;
}

export async function unhideTarget(payload: HideTargetPayload): Promise<{ success: boolean }> {
  const url = typeof window === 'undefined' ? `${API_BASE}/api/hides` : '/api/hides';
  const result = await fetchWithAuth(url, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  return result.data;
}
