import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/repo/keys';
import { fetchVerificationHistory, fetchVerificationDetail } from './fetch';
import type { VerificationFilters } from './types';

export function useVerificationHistory(filters: VerificationFilters = {}) {
  return useQuery({
    queryKey: queryKeys.verification.history(filters),
    queryFn: () => fetchVerificationHistory(filters),
  });
}

export function useVerificationDetail(id: string) {
  return useQuery({
    queryKey: queryKeys.verification.detail(id),
    queryFn: () => fetchVerificationDetail(id),
    enabled: !!id,
  });
}
