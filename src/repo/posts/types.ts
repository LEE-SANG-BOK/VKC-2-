/**
 * Posts Repository Types
 */

export interface Post {
  id: string;
  authorId: string;
  type: 'question' | 'share';
  title: string;
  content: string;
  category: string;
  subcategory?: string;
  tags: string[];
  views: number;
  likes: number;
  isResolved: boolean;
  adoptedAnswerId?: string;
  thumbnail?: string | null;
  thumbnails?: string[];
  imageCount?: number;
  trustBadge?: 'verified' | 'community' | 'expert' | 'outdated';
  trustWeight?: number;
  createdAt: string;
  updatedAt: string;
  isLiked?: boolean;
  isBookmarked?: boolean;
  answersCount?: number;
  commentsCount?: number;
  stats?: {
    likes: number;
    comments: number;
    shares: number;
  };
  author: {
    id: string;
    displayName?: string | null;
    name?: string | null;
    image?: string | null;
    avatar?: string;
    isVerified: boolean;
    isExpert?: boolean;
    badgeType?: string | null;
  };
}

export interface PostListItem {
  id: string;
  authorId: string;
  type: 'question' | 'share';
  title: string;
  excerpt: string;
  content?: string;
  category: string;
  subcategory?: string | null;
  tags: string[];
  views: number;
  likes: number;
  likesCount?: number;
  isResolved: boolean;
  adoptedAnswerId?: string | null;
  thumbnail?: string | null;
  thumbnails?: string[];
  imageCount?: number;
  trustBadge?: 'verified' | 'community' | 'expert' | 'outdated';
  trustWeight?: number;
  createdAt: string;
  updatedAt: string;
  isLiked?: boolean;
  isBookmarked?: boolean;
  answersCount?: number;
  postCommentsCount?: number;
  commentsCount?: number;
  certifiedResponderCount?: number;
  otherResponderCount?: number;
  author?: {
    id: string;
    displayName?: string | null;
    name?: string | null;
    image?: string | null;
    avatar?: string;
    isVerified: boolean;
    isExpert?: boolean;
    badgeType?: string | null;
  } | null;
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
  meta?: {
    isFallback?: boolean;
    reason?: string;
    query?: string | null;
    tokens?: string[];
    nextCursor?: string | null;
    hasMore?: boolean;
    paginationMode?: 'offset' | 'cursor';
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface CreatePostRequest {
  type: 'question' | 'share';
  title: string;
  content: string;
  category: string;
  subcategory?: string;
  tags?: string[];
}

export interface UpdatePostRequest {
  title?: string;
  content?: string;
  category?: string;
  subcategory?: string;
  tags?: string[];
}

export interface PostFilters {
  page?: number;
  limit?: number;
  cursor?: string;
  parentCategory?: string;
  category?: string;
  type?: 'question' | 'share';
  search?: string;
  sort?: 'popular' | 'latest';
  filter?: 'following' | 'following-users' | 'my-posts';
}

export interface InfinitePostsResponse {
  data: PostListItem[];
  nextPage: number | null;
  hasMore: boolean;
}
