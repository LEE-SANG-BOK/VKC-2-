export interface AdminUser {
  id: string;
  name: string | null;
  email: string;
  displayName: string | null;
  image: string | null;
  bio: string | null;
  phone: string | null;
  isVerified: boolean;
  isProfileComplete: boolean;
  status: string | null;
  suspendedUntil: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    posts: number;
    answers: number;
    comments: number;
  };
}

export interface AdminPost {
  id: string;
  type: 'question' | 'share';
  title: string;
  content: string;
  category: string;
  subcategory: string | null;
  tags: string[] | null;
  views: number;
  likes: number;
  isResolved: boolean;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    name: string | null;
    displayName: string | null;
    email: string;
    image: string | null;
  } | null;
  _count?: {
    answers: number;
    comments: number;
  };
}

export interface AdminComment {
  id: string;
  content: string;
  likes: number;
  postId: string | null;
  answerId: string | null;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    name: string | null;
    displayName: string | null;
    email: string;
    image: string | null;
  } | null;
  post?: {
    id: string;
    title: string;
  } | null;
}

export interface AdminFeedback {
  id: string;
  type: 'feedback' | 'bug';
  title: string;
  description: string;
  steps: string | null;
  pageUrl: string | null;
  contactEmail: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  } | null;
}

export type ReportAction = 'none' | 'warn' | 'hide' | 'blind' | 'delete';

export interface AdminReport {
  id: string;
  type: 'spam' | 'harassment' | 'inappropriate' | 'misinformation' | 'other';
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  action: ReportAction;
  reason: string;
  postId: string | null;
  answerId: string | null;
  commentId: string | null;
  reviewNote: string | null;
  createdAt: string;
  updatedAt: string;
  reporter: {
    id: string;
    name: string | null;
    displayName: string | null;
    email: string;
    image: string | null;
  } | null;
  post?: {
    id: string;
    title: string;
  } | null;
  answer?: {
    id: string;
    content: string;
  } | null;
  comment?: {
    id: string;
    content: string;
  } | null;
}

export interface AdminVerification {
  id: string;
  type: string;
  status: 'pending' | 'approved' | 'rejected';
  documentUrls: string[] | null;
  reason: string | null;
  visaType?: string | null;
  universityName?: string | null;
  universityEmail?: string | null;
  industry?: string | null;
  companyName?: string | null;
  jobTitle?: string | null;
  extraInfo?: string | null;
  submittedAt: string;
  reviewedAt: string | null;
  user: {
    id: string;
    name: string | null;
    displayName: string | null;
    email: string;
    image: string | null;
  } | null;
}

export interface AdminCategory {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  children?: AdminCategory[];
}

export interface AdminNotification {
  id: string;
  userId: string;
  type: 'answer' | 'comment' | 'reply' | 'adoption' | 'like' | 'follow';
  postId: string | null;
  answerId: string | null;
  commentId: string | null;
  senderId: string | null;
  content: string;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    displayName: string | null;
    email: string;
    image: string | null;
  } | null;
}

export interface DashboardStats {
  totalUsers: number;
  totalPosts: number;
  totalComments: number;
  totalAnswers: number;
  pendingReports: number;
  pendingVerifications: number;
  mau: number;
  wau: number;
  dau: number;
  newUsersThisMonth: number;
  chartData: {
    date: string;
    posts: number;
    users: number;
    comments: number;
  }[];
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AdminLoginCredentials {
  username: string;
  password: string;
}

export interface AdminSession {
  username: string;
  role: 'admin';
}

export interface AdminUserPost {
  id: string;
  title: string;
  content: string;
  type: 'question' | 'share';
  category: string;
  views: number;
  likesCount: number;
  commentsCount: number;
  isResolved: boolean;
  createdAt: string;
}

export interface AdminUserComment {
  id: string;
  content: string;
  likesCount: number;
  postId: string | null;
  post: {
    id: string;
    title: string;
  } | null;
  createdAt: string;
}

export interface AdminUserReport {
  id: string;
  type: 'spam' | 'harassment' | 'inappropriate' | 'misinformation' | 'other';
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  action: ReportAction;
  reason: string;
  postId: string | null;
  commentId: string | null;
  answerId: string | null;
  targetTitle: string;
  targetType: string;
  createdAt: string;
  reporter?: {
    id: string;
    name: string | null;
    displayName: string | null;
    email: string;
  } | null;
}

export interface AdminUserDetail extends AdminUser {
  gender: string | null;
  ageGroup: string | null;
  nationality: string | null;
  emailNotifications: boolean;
  pushNotifications: boolean;
}

export interface ReportedUser {
  id: string;
  name: string | null;
  displayName: string | null;
  email: string;
  image: string | null;
  status: string | null;
  suspendedUntil: string | null;
  isVerified: boolean;
  createdAt: string;
  stats: {
    postsCount: number;
    reportsReceivedCount: number;
  } | null;
}

export interface ReportTargetContent {
  type: 'post' | 'answer' | 'comment';
  id: string;
  content?: string;
  title?: string;
  authorId: string;
  postId?: string;
  createdAt: string;
}

export interface AdminReportDetail {
  id: string;
  type: 'spam' | 'harassment' | 'inappropriate' | 'misinformation' | 'other';
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  action: ReportAction;
  reason: string;
  postId: string | null;
  answerId: string | null;
  commentId: string | null;
  reviewNote: string | null;
  createdAt: string;
  updatedAt: string;
  reporter: {
    id: string;
    name: string | null;
    displayName: string | null;
    email: string;
    image: string | null;
  } | null;
  reportedUser: ReportedUser | null;
  targetContent: ReportTargetContent | null;
  linkedPostId: string | null;
}

export interface AdminNews {
  id: string;
  title: string;
  category: string;
  type: 'post' | 'cardnews' | 'shorts';
  content: string;
  language?: string;
  imageUrl: string | null;
  linkUrl: string | null;
  isActive: boolean;
  order: number;
  startAt?: string | null;
  endAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  totalUsers: number;
  totalPosts: number;
  totalComments: number;
  totalAnswers: number;
  pendingReports: number;
  pendingVerifications: number;
  overdueReports?: number;
  overdueVerifications?: number;
  dau: number;
  wau: number;
  mau: number;
  newUsersThisMonth: number;
  chartData: Array<{
    date: string;
    posts: number;
    users: number;
    comments: number;
  }>;
}
