import { useMutation, useQueryClient } from '@tanstack/react-query';
import { reportPost, reportComment, reportAnswer } from './fetch';
import type { CreateReportData } from './types';
import { logEvent } from '@/repo/events/mutation';
import { queryKeys } from '@/repo/keys';
import type { HiddenTargetsResponse } from '@/repo/hides/types';

const addHiddenId = (prev: HiddenTargetsResponse | undefined, targetId: string) => {
  const ids = prev?.ids ?? [];
  if (ids.includes(targetId)) {
    return prev ?? { ids };
  }
  return { ids: [...ids, targetId] };
};

export function useReportPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ postId, data }: { postId: string; data: CreateReportData }) =>
      reportPost(postId, data),
    onSuccess: (_, { postId, data }) => {
      queryClient.setQueryData(
        queryKeys.hides.list('post'),
        (prev: HiddenTargetsResponse | undefined) => addHiddenId(prev, postId)
      );
      logEvent({
        eventType: 'report',
        entityType: 'post',
        entityId: postId,
        metadata: { reportType: data.type },
      });
    },
  });
}

export function useReportComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ commentId, data }: { commentId: string; data: CreateReportData }) =>
      reportComment(commentId, data),
    onSuccess: (_, { commentId, data }) => {
      queryClient.setQueryData(
        queryKeys.hides.list('comment'),
        (prev: HiddenTargetsResponse | undefined) => addHiddenId(prev, commentId)
      );
      logEvent({
        eventType: 'report',
        entityType: 'comment',
        entityId: commentId,
        metadata: { reportType: data.type },
      });
    },
  });
}

export function useReportAnswer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ answerId, data }: { answerId: string; data: CreateReportData }) =>
      reportAnswer(answerId, data),
    onSuccess: (_, { answerId, data }) => {
      queryClient.setQueryData(
        queryKeys.hides.list('answer'),
        (prev: HiddenTargetsResponse | undefined) => addHiddenId(prev, answerId)
      );
      logEvent({
        eventType: 'report',
        entityType: 'answer',
        entityId: answerId,
        metadata: { reportType: data.type },
      });
    },
  });
}
