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
    key: 'badge' | 'userType' | 'visaType' | 'koreanLevel' | 'interest' | 'status' | string;
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

export interface RecommendedUserStats {
  followers: number;
  following: number;
  posts: number;
}

export interface RecommendedUser {
  id: string;
  displayName?: string | null;
  email?: string | null;
  image?: string | null;
  avatar?: string | null;
  bio?: string | null;
  isFollowing?: boolean;
  isVerified: boolean;
  isExpert: boolean;
  badgeType?: string | null;
  status?: string | null;
  userType?: string | null;
  visaType?: string | null;
  interests?: string[] | null;
  koreanLevel?: string | null;
  recommendationMeta?: User['recommendationMeta'];
  stats?: RecommendedUserStats;
}

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

export interface UserScore {
  userId: string;
  score: number;
  trustScore: number;
  helpfulAnswers: number;
  adoptionRate: number;
  level: number;
  levelProgress: number;
  nextLevelScore: number;
  rank?: number | null;
  badges: {
    isVerified: boolean;
    isExpert: boolean;
    badgeType?: string | null;
  };
}

export interface UserLeaderboardEntry {
  id: string;
  name?: string | null;
  displayName?: string | null;
  avatar?: string | null;
  image?: string | null;
  isVerified: boolean;
  isExpert: boolean;
  badgeType?: string | null;
  score: number;
  temperature: number;
  helpfulAnswers: number;
  adoptionRate: number;
  weeklyAnswers: number;
  rank: number;
}

export type AnswerReviewStatus = 'pending' | 'approved' | 'rejected';

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
  certifiedResponderCount?: number;
  otherResponderCount?: number;
  officialAnswerCount?: number;
  reviewedAnswerCount?: number;
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
  isOfficial?: boolean;
  reviewStatus?: AnswerReviewStatus;
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
