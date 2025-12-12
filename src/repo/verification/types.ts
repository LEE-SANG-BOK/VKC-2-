export type VerificationStatus = 'pending' | 'approved' | 'rejected';

export type VerificationType = 'student' | 'worker' | 'expert' | 'business' | 'other';

export interface VerificationReviewer {
  id: string;
  name: string | null;
  displayName: string | null;
  image: string | null;
}

export interface VerificationRequest {
  id: string;
  userId: string;
  type: string;
  visaType?: string | null;
  universityName?: string | null;
  universityEmail?: string | null;
  industry?: string | null;
  companyName?: string | null;
  jobTitle?: string | null;
  extraInfo?: string | null;
  documentUrls: string[] | null;
  status: VerificationStatus;
  reason: string | null;
  submittedAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
  reviewer?: VerificationReviewer | null;
}

export interface VerificationFilters {
  page?: number;
  limit?: number;
  status?: VerificationStatus;
}

export interface CreateVerificationRequest {
  type: VerificationType;
  documents: string[];
  description?: string;
  visaType?: string;
  universityName?: string;
  universityEmail?: string;
  industry?: string;
  companyName?: string;
  jobTitle?: string;
  extraInfo?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
