'use client';

import { useMutation } from '@tanstack/react-query';
import { submitFeedback } from './fetch';
import type { FeedbackPayload, FeedbackReceipt, ApiResponse } from './types';

export function useSubmitFeedback() {
  return useMutation<ApiResponse<FeedbackReceipt>, Error, FeedbackPayload>({
    mutationFn: (data) => submitFeedback(data),
  });
}
