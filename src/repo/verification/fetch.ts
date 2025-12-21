import type {
  VerificationRequest,
  VerificationFilters,
  CreateVerificationRequest,
  PaginatedResponse,
  ApiResponse,
} from './types';
import { ApiError, getRetryAfterSeconds } from '@/lib/api/errors';
const API_BASE = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export async function fetchVerificationHistory(
  filters: VerificationFilters = {}
): Promise<PaginatedResponse<VerificationRequest>> {
  const params = new URLSearchParams();
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());
  if (filters.status) params.append('status', filters.status);

  const res = await fetch(`${API_BASE}/api/verification/history?${params.toString()}`, {
    cache: 'no-store',
    credentials: 'include',
  });

  if (!res.ok) {
    throw new Error('Failed to fetch verification history');
  }

  return res.json();
}

export async function fetchVerificationDetail(
  id: string
): Promise<ApiResponse<VerificationRequest>> {
  const res = await fetch(`${API_BASE}/api/verification/${id}`, {
    cache: 'no-store',
    credentials: 'include',
  });

  if (!res.ok) {
    throw new Error('Failed to fetch verification detail');
  }

  return res.json();
}

export async function createVerificationRequest(
  data: CreateVerificationRequest
): Promise<ApiResponse<VerificationRequest>> {
  const res = await fetch(`${API_BASE}/api/verification/request`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({} as any));
    throw new ApiError(
      error?.error || error?.message || 'Failed to create verification request',
      res.status,
      error?.code,
      getRetryAfterSeconds(res.headers)
    );
  }

  return res.json();
}
