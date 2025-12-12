export interface Author {
  id: string;
  name?: string;
  displayName?: string;
  image?: string;
  isVerified?: boolean;
}

export interface Comment {
  id: string;
  postId?: string;
  answerId?: string;
  parentId?: string;
  authorId: string;
  content: string;
  likes: number;
  createdAt: string;
  updatedAt: string;
  author: Author;
  replies?: Comment[];
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface CreateCommentRequest {
  content: string;
  parentId?: string;
}

export interface UpdateCommentRequest {
  content: string;
}
