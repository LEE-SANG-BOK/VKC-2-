import { useQuery } from '@tanstack/react-query';
import { adminFetch } from './fetch';

export const adminQueryKeys = {
  session: ['admin', 'session'] as const,
  dashboard: ['admin', 'dashboard'] as const,
  users: {
    all: ['admin', 'users'] as const,
    list: (params?: { page?: number; limit?: number; search?: string; status?: string }) =>
      ['admin', 'users', 'list', params] as const,
    detail: (id: string) => ['admin', 'users', id] as const,
    posts: (id: string, params?: { page?: number; limit?: number }) =>
      ['admin', 'users', id, 'posts', params] as const,
    comments: (id: string, params?: { page?: number; limit?: number }) =>
      ['admin', 'users', id, 'comments', params] as const,
    reportsReceived: (id: string, params?: { page?: number; limit?: number }) =>
      ['admin', 'users', id, 'reports-received', params] as const,
    reportsMade: (id: string, params?: { page?: number; limit?: number }) =>
      ['admin', 'users', id, 'reports-made', params] as const,
  },
  posts: {
    all: ['admin', 'posts'] as const,
    list: (params?: { page?: number; limit?: number; search?: string; type?: string; category?: string }) =>
      ['admin', 'posts', 'list', params] as const,
    detail: (id: string) => ['admin', 'posts', id] as const,
    comments: (id: string) => ['admin', 'posts', id, 'comments'] as const,
  },
  comments: {
    all: ['admin', 'comments'] as const,
    list: (params?: { page?: number; limit?: number; search?: string }) =>
      ['admin', 'comments', 'list', params] as const,
  },
  feedback: {
    all: ['admin', 'feedback'] as const,
    list: (params?: { page?: number; limit?: number; type?: 'feedback' | 'bug'; search?: string }) =>
      ['admin', 'feedback', 'list', params] as const,
  },
  reports: {
    all: ['admin', 'reports'] as const,
    list: (params?: { page?: number; limit?: number; status?: string; type?: string }) =>
      ['admin', 'reports', 'list', params] as const,
    detail: (id: string) => ['admin', 'reports', id] as const,
  },
  verifications: {
    all: ['admin', 'verifications'] as const,
    list: (params?: { page?: number; limit?: number; status?: string }) =>
      ['admin', 'verifications', 'list', params] as const,
    detail: (id: string) => ['admin', 'verifications', id] as const,
  },
  categories: {
    all: ['admin', 'categories'] as const,
    list: (params?: { search?: string; parentId?: string }) =>
      ['admin', 'categories', 'list', params] as const,
    detail: (id: string) => ['admin', 'categories', id] as const,
  },
  notifications: {
    all: ['admin', 'notifications'] as const,
    list: (params?: { page?: number; limit?: number; search?: string; type?: string; isRead?: string }) =>
      ['admin', 'notifications', 'list', params] as const,
    detail: (id: string) => ['admin', 'notifications', id] as const,
  },
  news: {
    all: ['admin', 'news'] as const,
    list: (params?: { page?: number; limit?: number; search?: string; language?: string }) =>
      ['admin', 'news', 'list', params] as const,
    detail: (id: string) => ['admin', 'news', id] as const,
  },
};

export function useAdminSession() {
  return useQuery({
    queryKey: adminQueryKeys.session,
    queryFn: adminFetch.auth.checkSession,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}

export function useDashboardStats() {
  return useQuery({
    queryKey: adminQueryKeys.dashboard,
    queryFn: adminFetch.dashboard.getStats,
    staleTime: 60 * 1000,
  });
}

export function useAdminUsers(params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}) {
  return useQuery({
    queryKey: adminQueryKeys.users.list(params),
    queryFn: () => adminFetch.users.getAll(params),
  });
}

export function useAdminUser(id: string) {
  return useQuery({
    queryKey: adminQueryKeys.users.detail(id),
    queryFn: () => adminFetch.users.getById(id),
    enabled: !!id,
  });
}

export function useAdminUserPosts(
  userId: string,
  params?: { page?: number; limit?: number }
) {
  return useQuery({
    queryKey: adminQueryKeys.users.posts(userId, params),
    queryFn: () => adminFetch.userDetail.getPosts(userId, params),
    enabled: !!userId,
  });
}

export function useAdminUserComments(
  userId: string,
  params?: { page?: number; limit?: number }
) {
  return useQuery({
    queryKey: adminQueryKeys.users.comments(userId, params),
    queryFn: () => adminFetch.userDetail.getComments(userId, params),
    enabled: !!userId,
  });
}

export function useAdminUserReportsReceived(
  userId: string,
  params?: { page?: number; limit?: number }
) {
  return useQuery({
    queryKey: adminQueryKeys.users.reportsReceived(userId, params),
    queryFn: () => adminFetch.userDetail.getReportsReceived(userId, params),
    enabled: !!userId,
  });
}

export function useAdminUserReportsMade(
  userId: string,
  params?: { page?: number; limit?: number }
) {
  return useQuery({
    queryKey: adminQueryKeys.users.reportsMade(userId, params),
    queryFn: () => adminFetch.userDetail.getReportsMade(userId, params),
    enabled: !!userId,
  });
}

export function useAdminPosts(params?: {
  page?: number;
  limit?: number;
  search?: string;
  type?: string;
  category?: string;
}) {
  return useQuery({
    queryKey: adminQueryKeys.posts.list(params),
    queryFn: () => adminFetch.posts.getAll(params),
  });
}

export function useAdminPost(id: string) {
  return useQuery({
    queryKey: adminQueryKeys.posts.detail(id),
    queryFn: () => adminFetch.posts.getById(id),
    enabled: !!id,
  });
}

export function useAdminPostComments(id: string) {
  return useQuery({
    queryKey: adminQueryKeys.posts.comments(id),
    queryFn: () => adminFetch.posts.getComments(id),
    enabled: !!id,
  });
}

export function useAdminComments(params?: {
  page?: number;
  limit?: number;
  search?: string;
}) {
  return useQuery({
    queryKey: adminQueryKeys.comments.list(params),
    queryFn: () => adminFetch.comments.getAll(params),
  });
}

export function useAdminFeedback(params?: {
  page?: number;
  limit?: number;
  type?: 'feedback' | 'bug';
  search?: string;
}) {
  return useQuery({
    queryKey: adminQueryKeys.feedback.list(params),
    queryFn: () => adminFetch.feedback.getAll(params),
  });
}

export function useAdminReports(params?: {
  page?: number;
  limit?: number;
  status?: string;
  type?: string;
}) {
  return useQuery({
    queryKey: adminQueryKeys.reports.list(params),
    queryFn: () => adminFetch.reports.getAll(params),
  });
}

export function useAdminReport(id: string) {
  return useQuery({
    queryKey: adminQueryKeys.reports.detail(id),
    queryFn: () => adminFetch.reports.getById(id),
    enabled: !!id,
  });
}

export function useAdminVerifications(params?: {
  page?: number;
  limit?: number;
  status?: string;
}) {
  return useQuery({
    queryKey: adminQueryKeys.verifications.list(params),
    queryFn: () => adminFetch.verifications.getAll(params),
  });
}

export function useAdminVerification(id: string) {
  return useQuery({
    queryKey: adminQueryKeys.verifications.detail(id),
    queryFn: () => adminFetch.verifications.getById(id),
    enabled: !!id,
  });
}

export function useAdminCategories(params?: { search?: string; parentId?: string }) {
  return useQuery({
    queryKey: adminQueryKeys.categories.list(params),
    queryFn: () => adminFetch.categories.getAll(params),
  });
}

export function useAdminCategory(id: string) {
  return useQuery({
    queryKey: adminQueryKeys.categories.detail(id),
    queryFn: () => adminFetch.categories.getById(id),
    enabled: !!id,
  });
}

export function useAdminNotifications(params?: {
  page?: number;
  limit?: number;
  search?: string;
  type?: string;
  isRead?: string;
}) {
  return useQuery({
    queryKey: adminQueryKeys.notifications.list(params),
    queryFn: () => adminFetch.notifications.getAll(params),
  });
}

export function useAdminNotification(id: string) {
  return useQuery({
    queryKey: adminQueryKeys.notifications.detail(id),
    queryFn: () => adminFetch.notifications.getById(id),
    enabled: !!id,
  });
}

export function useAdminNews(params?: {
  page?: number;
  limit?: number;
  search?: string;
  language?: string;
}) {
  return useQuery({
    queryKey: adminQueryKeys.news.list(params),
    queryFn: () => adminFetch.news.getAll(params),
  });
}

export function useAdminNewsItem(id: string) {
  return useQuery({
    queryKey: adminQueryKeys.news.detail(id),
    queryFn: () => adminFetch.news.getById(id),
    enabled: !!id,
  });
}
