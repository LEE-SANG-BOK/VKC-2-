export interface Author {
  id: string;
  name?: string;
  displayName?: string;
  image?: string;
  isVerified?: boolean;
   isExpert?: boolean;
}

export interface Comment {
  id: string;
  answerId: string;
  postId?: string;
  parentId?: string;
  authorId: string;
  content: string;
  likes: number;
  createdAt: string;
  updatedAt: string;
  author: Author;
  replies?: Comment[];
}

export type AnswerReviewStatus = 'pending' | 'approved' | 'rejected';

export interface Answer {
  id: string;
  postId: string;
  authorId: string;
  content: string;
  likes: number;
  isAdopted: boolean;
  isOfficial?: boolean;
  reviewStatus?: AnswerReviewStatus;
  createdAt: string;
  updatedAt: string;
  author: Author;
  comments?: Comment[];
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface CreateAnswerRequest {
  content: string;
}

export interface UpdateAnswerRequest {
  content: string;
}

export interface CreateCommentRequest {
  content: string;
  parentId?: string;
}
