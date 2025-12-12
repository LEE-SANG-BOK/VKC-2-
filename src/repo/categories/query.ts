/**
 * Categories Repository Query Hooks
 * React Query hooks for categories
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchCategories, fetchMySubscriptions } from './fetch';
import { queryKeys } from '../keys';

/**
 * 카테고리 목록 조회 hook
 */
export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories.all,
    queryFn: fetchCategories,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * 내 구독 카테고리 목록 조회 hook
 */
export function useMySubscriptions(enabled = true) {
  return useQuery({
    queryKey: queryKeys.categories.subscriptions(),
    queryFn: fetchMySubscriptions,
    enabled,
    staleTime: 1000 * 60 * 5,
  });
}
