'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/repo/keys';
import { fetchHiddenTargets } from './fetch';
import type { HiddenTargetType } from './types';

export function useHiddenTargets(type: HiddenTargetType, enabled = true) {
  const query = useQuery({
    queryKey: queryKeys.hides.list(type),
    queryFn: () => fetchHiddenTargets(type),
    enabled,
    staleTime: 60_000,
    gcTime: 5 * 60 * 1000,
  });

  const ids = query.data?.ids ?? [];
  const idSet = useMemo(() => new Set(ids), [ids]);

  return {
    ...query,
    ids,
    idSet,
  };
}
