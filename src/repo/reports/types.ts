export type ReportType = 'spam' | 'harassment' | 'inappropriate' | 'misinformation' | 'other';
export type ReportStatus = 'pending' | 'reviewed' | 'resolved' | 'dismissed';
export type ReportTargetType = 'post' | 'comment' | 'answer';

export interface Report {
  id: string;
  reporterId: string;
  postId: string | null;
  commentId: string | null;
  answerId: string | null;
  type: ReportType;
  status: ReportStatus;
  reason: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

export interface CreateReportData {
  type: ReportType;
  reason: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
