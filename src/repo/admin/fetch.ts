import {
  AdminUser,
  AdminPost,
  AdminComment,
  AdminReport,
  AdminReportDetail,
  AdminVerification,
  AdminCategory,
  AdminNotification,
  AdminNews,
  DashboardStats,
  AdminLoginCredentials,
  AdminSession,
  AdminUserPost,
  AdminUserComment,
  AdminUserReport,
} from './types';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || '';
const ADMIN_API_BASE = process.env.NEXT_PUBLIC_ADMIN_API_BASE || '';

// Ensure API calls work both on client and server (SSR, admin subdomain)
const BASE_URL =
  (typeof window === 'undefined'
    ? ADMIN_API_BASE || APP_URL || 'http://localhost:3000'
    : '') + '/api/admin';

async function fetchWithCredentials<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
}

export const adminFetch = {
  auth: {
    login: (credentials: AdminLoginCredentials) =>
      fetchWithCredentials<{ success: boolean; message: string }>(
        `${BASE_URL}/auth`,
        {
          method: 'POST',
          body: JSON.stringify(credentials),
        }
      ),

    checkSession: () =>
      fetchWithCredentials<{ admin: AdminSession }>(`${BASE_URL}/auth`),

    logout: () =>
      fetchWithCredentials<{ success: boolean }>(
        `${BASE_URL}/auth`,
        { method: 'DELETE' }
      ),
  },

  dashboard: {
    getStats: () =>
      fetchWithCredentials<DashboardStats>(`${BASE_URL}/dashboard`),
  },

  users: {
    getAll: (params?: {
      page?: number;
      limit?: number;
      search?: string;
      status?: string;
    }) => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set('page', String(params.page));
      if (params?.limit) searchParams.set('limit', String(params.limit));
      if (params?.search) searchParams.set('search', params.search);
      if (params?.status) searchParams.set('status', params.status);

      return fetchWithCredentials<{
        users: AdminUser[];
        pagination: { page: number; limit: number; total: number; totalPages: number };
      }>(`${BASE_URL}/users?${searchParams}`);
    },

    getById: (id: string) =>
      fetchWithCredentials<{ user: AdminUser }>(`${BASE_URL}/users/${id}`),

    updateStatus: (id: string, status: string, suspendDays?: number) =>
      fetchWithCredentials<{ user: AdminUser }>(
        `${BASE_URL}/users/${id}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ status, suspendDays }),
        }
      ),

    delete: (id: string) =>
      fetchWithCredentials<{ success: boolean }>(
        `${BASE_URL}/users/${id}`,
        { method: 'DELETE' }
      ),
  },

  posts: {
    getAll: (params?: {
      page?: number;
      limit?: number;
      search?: string;
      type?: string;
      category?: string;
    }) => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set('page', String(params.page));
      if (params?.limit) searchParams.set('limit', String(params.limit));
      if (params?.search) searchParams.set('search', params.search);
      if (params?.type) searchParams.set('type', params.type);
      if (params?.category) searchParams.set('category', params.category);

      return fetchWithCredentials<{
        posts: AdminPost[];
        pagination: { page: number; limit: number; total: number; totalPages: number };
      }>(`${BASE_URL}/posts?${searchParams}`);
    },

    getById: (id: string) =>
      fetchWithCredentials<{ post: AdminPost }>(`${BASE_URL}/posts/${id}`),

    getComments: (id: string) =>
      fetchWithCredentials<{ comments: AdminComment[]; answers: AdminComment[] }>(
        `${BASE_URL}/posts/${id}/comments`
      ),

    delete: (id: string) =>
      fetchWithCredentials<{ success: boolean }>(
        `${BASE_URL}/posts/${id}`,
        { method: 'DELETE' }
      ),
  },

  comments: {
    getAll: (params?: {
      page?: number;
      limit?: number;
      search?: string;
    }) => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set('page', String(params.page));
      if (params?.limit) searchParams.set('limit', String(params.limit));
      if (params?.search) searchParams.set('search', params.search);

      return fetchWithCredentials<{
        comments: AdminComment[];
        pagination: { page: number; limit: number; total: number; totalPages: number };
      }>(`${BASE_URL}/comments?${searchParams}`);
    },

    delete: (id: string) =>
      fetchWithCredentials<{ success: boolean }>(
        `${BASE_URL}/comments/${id}`,
        { method: 'DELETE' }
      ),
  },

  reports: {
    getAll: (params?: {
      page?: number;
      limit?: number;
      status?: string;
      type?: string;
    }) => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set('page', String(params.page));
      if (params?.limit) searchParams.set('limit', String(params.limit));
      if (params?.status) searchParams.set('status', params.status);
      if (params?.type) searchParams.set('type', params.type);

      return fetchWithCredentials<{
        reports: AdminReport[];
        pagination: { page: number; limit: number; total: number; totalPages: number };
      }>(`${BASE_URL}/reports?${searchParams}`);
    },

    getById: (id: string) =>
      fetchWithCredentials<{ report: AdminReportDetail }>(`${BASE_URL}/reports/${id}`),

    updateStatus: (
      id: string,
      data: { status: string; reviewNote?: string; deleteTarget?: boolean }
    ) =>
      fetchWithCredentials<{ report: AdminReport }>(
        `${BASE_URL}/reports/${id}`,
        {
          method: 'PATCH',
          body: JSON.stringify(data),
        }
      ),
  },

  verifications: {
    getAll: (params?: {
      page?: number;
      limit?: number;
      status?: string;
    }) => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set('page', String(params.page));
      if (params?.limit) searchParams.set('limit', String(params.limit));
      if (params?.status) searchParams.set('status', params.status);

      return fetchWithCredentials<{
        verifications: AdminVerification[];
        pagination: { page: number; limit: number; total: number; totalPages: number };
      }>(`${BASE_URL}/verifications?${searchParams}`);
    },

    getById: (id: string) =>
      fetchWithCredentials<{ verification: AdminVerification }>(
        `${BASE_URL}/verifications/${id}`
      ),

    updateStatus: (
      id: string,
      data: {
        status: string;
        reason?: string;
        verifiedProfileSummary?: string | null;
        verifiedProfileKeywords?: string[] | null;
      }
    ) =>
      fetchWithCredentials<{ verification: AdminVerification }>(
        `${BASE_URL}/verifications/${id}`,
        {
          method: 'PATCH',
          body: JSON.stringify(data),
        }
      ),
  },

  categories: {
    getAll: (params?: { search?: string; parentId?: string }) => {
      const searchParams = new URLSearchParams();
      if (params?.search) searchParams.set('search', params.search);
      if (params?.parentId) searchParams.set('parentId', params.parentId);

      return fetchWithCredentials<{ categories: AdminCategory[] }>(
        `${BASE_URL}/categories?${searchParams}`
      );
    },

    getById: (id: string) =>
      fetchWithCredentials<{ category: AdminCategory }>(
        `${BASE_URL}/categories/${id}`
      ),

    create: (data: {
      name: string;
      slug: string;
      parentId?: string;
      order?: number;
      isActive?: boolean;
    }) =>
      fetchWithCredentials<{ category: AdminCategory }>(
        `${BASE_URL}/categories`,
        {
          method: 'POST',
          body: JSON.stringify(data),
        }
      ),

    update: (
      id: string,
      data: {
        name?: string;
        slug?: string;
        parentId?: string | null;
        order?: number;
        isActive?: boolean;
      }
    ) =>
      fetchWithCredentials<{ category: AdminCategory }>(
        `${BASE_URL}/categories/${id}`,
        {
          method: 'PATCH',
          body: JSON.stringify(data),
        }
      ),

    delete: (id: string) =>
      fetchWithCredentials<{ success: boolean }>(
        `${BASE_URL}/categories/${id}`,
        { method: 'DELETE' }
      ),
  },

  notifications: {
    getAll: (params?: {
      page?: number;
      limit?: number;
      search?: string;
      type?: string;
      isRead?: string;
    }) => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set('page', String(params.page));
      if (params?.limit) searchParams.set('limit', String(params.limit));
      if (params?.search) searchParams.set('search', params.search);
      if (params?.type) searchParams.set('type', params.type);
      if (params?.isRead) searchParams.set('isRead', params.isRead);

      return fetchWithCredentials<{
        notifications: AdminNotification[];
        pagination: { page: number; limit: number; total: number; totalPages: number };
      }>(`${BASE_URL}/notifications?${searchParams}`);
    },

    getById: (id: string) =>
      fetchWithCredentials<{ notification: AdminNotification }>(
        `${BASE_URL}/notifications/${id}`
      ),

    create: (data: {
      userId?: string;
      userIds?: string[];
      type: string;
      content: string;
      postId?: string;
    }) =>
      fetchWithCredentials<{ notification?: AdminNotification; success?: boolean; message?: string }>(
        `${BASE_URL}/notifications`,
        {
          method: 'POST',
          body: JSON.stringify(data),
        }
      ),

    delete: (id: string) =>
      fetchWithCredentials<{ success: boolean }>(
        `${BASE_URL}/notifications/${id}`,
        { method: 'DELETE' }
      ),
  },

  userDetail: {
    getPosts: (userId: string, params?: { page?: number; limit?: number }) => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set('page', String(params.page));
      if (params?.limit) searchParams.set('limit', String(params.limit));

      return fetchWithCredentials<{
        posts: AdminUserPost[];
        pagination: { page: number; limit: number; total: number; totalPages: number };
      }>(`${BASE_URL}/users/${userId}/posts?${searchParams}`);
    },

    getComments: (userId: string, params?: { page?: number; limit?: number }) => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set('page', String(params.page));
      if (params?.limit) searchParams.set('limit', String(params.limit));

      return fetchWithCredentials<{
        comments: AdminUserComment[];
        pagination: { page: number; limit: number; total: number; totalPages: number };
      }>(`${BASE_URL}/users/${userId}/comments?${searchParams}`);
    },

    getReportsReceived: (userId: string, params?: { page?: number; limit?: number }) => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set('page', String(params.page));
      if (params?.limit) searchParams.set('limit', String(params.limit));

      return fetchWithCredentials<{
        reports: AdminUserReport[];
        pagination: { page: number; limit: number; total: number; totalPages: number };
      }>(`${BASE_URL}/users/${userId}/reports-received?${searchParams}`);
    },

    getReportsMade: (userId: string, params?: { page?: number; limit?: number }) => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set('page', String(params.page));
      if (params?.limit) searchParams.set('limit', String(params.limit));

      return fetchWithCredentials<{
        reports: AdminUserReport[];
        pagination: { page: number; limit: number; total: number; totalPages: number };
      }>(`${BASE_URL}/users/${userId}/reports-made?${searchParams}`);
    },
  },

  news: {
    getAll: (params?: { page?: number; limit?: number; search?: string; language?: string }) => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set('page', String(params.page));
      if (params?.limit) searchParams.set('limit', String(params.limit));
      if (params?.search) searchParams.set('search', params.search);
      if (params?.language) searchParams.set('language', params.language);

      return fetchWithCredentials<{
        news: AdminNews[];
        pagination: { page: number; limit: number; total: number; totalPages: number };
      }>(`${BASE_URL}/news?${searchParams}`);
    },

    getById: (id: string) =>
      fetchWithCredentials<{ news: AdminNews }>(`${BASE_URL}/news/${id}`),

    create: (data: {
      title: string;
      category: string;
      content: string;
      language?: string;
      imageUrl?: string;
      linkUrl?: string;
      isActive?: boolean;
      order?: number;
    }) =>
      fetchWithCredentials<{ news: AdminNews }>(`${BASE_URL}/news`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (
      id: string,
      data: {
        title?: string;
        category?: string;
        content?: string;
        language?: string;
        imageUrl?: string | null;
        linkUrl?: string | null;
        isActive?: boolean;
        order?: number;
      }
    ) =>
      fetchWithCredentials<{ news: AdminNews }>(`${BASE_URL}/news/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),

    delete: (id: string) =>
      fetchWithCredentials<{ success: boolean }>(`${BASE_URL}/news/${id}`, {
        method: 'DELETE',
      }),
  },
};
