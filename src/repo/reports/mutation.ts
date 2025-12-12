import { useMutation } from '@tanstack/react-query';
import { reportPost, reportComment, reportAnswer } from './fetch';
import type { CreateReportData } from './types';

export function useReportPost() {
  return useMutation({
    mutationFn: ({ postId, data }: { postId: string; data: CreateReportData }) =>
      reportPost(postId, data),
  });
}

export function useReportComment() {
  return useMutation({
    mutationFn: ({ commentId, data }: { commentId: string; data: CreateReportData }) =>
      reportComment(commentId, data),
  });
}

export function useReportAnswer() {
  return useMutation({
    mutationFn: ({ answerId, data }: { answerId: string; data: CreateReportData }) =>
      reportAnswer(answerId, data),
  });
}
