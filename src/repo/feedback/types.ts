export type FeedbackType = 'feedback' | 'bug';

export interface FeedbackPayload {
  type: FeedbackType;
  title: string;
  description: string;
  steps?: string;
  email?: string;
  pageUrl?: string;
  userAgent?: string;
}

export interface FeedbackReceipt {
  receivedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
