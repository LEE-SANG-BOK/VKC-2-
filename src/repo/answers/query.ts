'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../keys';
import { fetchAnswers, fetchAnswerComments } from './fetch';

export function useAnswers(postId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.answers.list(postId),
    queryFn: () => fetchAnswers(postId),
    enabled: options?.enabled !== false && !!postId,
  });
}

export function useAnswerComments(answerId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: [...queryKeys.answers.list(answerId), 'comments'],
    queryFn: () => fetchAnswerComments(answerId),
    enabled: options?.enabled !== false && !!answerId,
  });
}
