export interface User {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  email: string;
  phone?: string | null;
  bio: string;
  joinedAt: string;
  isVerified: boolean;
  isExpert?: boolean;
  badgeType?: string | null;
  verifiedProfileSummary?: string | null;
  verifiedProfileKeywords?: string[] | null;
  gender?: string | null;
  ageGroup?: string | null;
  nationality?: string | null;
  status?: string | null;
  userType?: string | null;
  visaType?: string | null;
  interests?: string[] | null;
  preferredLanguage?: string | null;
  koreanLevel?: string | null;
  onboardingCompleted?: boolean | null;
  isProfileComplete?: boolean | null;
  isFollowing?: boolean;
  recommendationMeta?: Array<{
    key: 'badge' | 'adoptionRate' | 'interestMatchRate' | string;
    value: string | number;
  }>;
  stats: {
    followers: number;
    following: number;
    posts: number;
    accepted: number;
    comments: number;
    bookmarks: number;
  };
}

export type UserProfile = User;

export interface UpdateProfileRequest {
  name?: string;
  displayName?: string;
  bio?: string;
  phone?: string;
  gender?: string;
  ageGroup?: string;
  nationality?: string;
  status?: string;
  image?: string;
  notifyAnswers?: boolean;
  notifyComments?: boolean;
  notifyReplies?: boolean;
  notifyAdoptions?: boolean;
  notifyFollows?: boolean;
  userType?: string;
  visaType?: string | null;
  interests?: string[];
  preferredLanguage?: string;
  koreanLevel?: string | null;
}

export interface PostCardData {
  id: string;
  type: 'question' | 'share' | 'answer' | 'comment';
  title: string;
  content: string;
  excerpt: string;
  category: string;
  subcategory?: string;
  tags: string[];
  views: number;
  likes: number;
  answersCount?: number;
  postCommentsCount?: number;
  commentsCount?: number;
  isResolved?: boolean;
  createdAt: string;
  publishedAt: string;
  thumbnail?: string;
  thumbnails?: string[];
  imageCount?: number;
  author: {
    id: string;
    name: string;
    avatar: string;
    isVerified: boolean;
    isExpert?: boolean;
    badgeType?: string | null;
    followers: number;
    isFollowing?: boolean;
  };
  stats: {
    likes: number;
    comments: number;
    shares: number;
  };
  isLiked: boolean;
  isBookmarked: boolean;
  isQuestion: boolean;
  isAdopted: boolean;
  post?: {
    id: string;
    title: string;
  };
  bookmarkedAt?: string;
}

export type UserPost = PostCardData;
export type UserAnswer = PostCardData;
export type UserComment = PostCardData;
export type UserBookmark = PostCardData;

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

export interface UserFilters {
  page?: number;
  limit?: number;
  type?: string;
  cursor?: string;
}

export interface AnswerFilters {
  page?: number;
  limit?: number;
  adoptedOnly?: boolean;
  cursor?: string;
}
