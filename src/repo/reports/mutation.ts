import { useMutation } from '@tanstack/react-query';
import { reportPost, reportComment, reportAnswer } from './fetch';
import type { CreateReportData } from './types';
import { logEvent } from '@/repo/events/mutation';

export function useReportPost() {
  return useMutation({
    mutationFn: ({ postId, data }: { postId: string; data: CreateReportData }) =>
      reportPost(postId, data),
    onSuccess: (_, { postId, data }) => {
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
  return useMutation({
    mutationFn: ({ commentId, data }: { commentId: string; data: CreateReportData }) =>
      reportComment(commentId, data),
    onSuccess: (_, { commentId, data }) => {
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
  return useMutation({
    mutationFn: ({ answerId, data }: { answerId: string; data: CreateReportData }) =>
      reportAnswer(answerId, data),
    onSuccess: (_, { answerId, data }) => {
      logEvent({
        eventType: 'report',
        entityType: 'answer',
        entityId: answerId,
        metadata: { reportType: data.type },
      });
    },
  });
}
