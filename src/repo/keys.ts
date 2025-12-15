/**
 * Tanstack Query Keys
 * 모든 쿼리 키를 중앙에서 관리
 */

export const queryKeys = {
  // Auth
  auth: {
    all: ['auth'] as const,
    session: () => [...queryKeys.auth.all, 'session'] as const,
  },

  // Posts
  posts: {
    all: ['posts'] as const,
    lists: () => [...queryKeys.posts.all, 'list'] as const,
    list: (filters: {
      page?: number;
      limit?: number;
      parentCategory?: string;
      category?: string;
      type?: 'question' | 'share';
      search?: string;
      sort?: 'popular' | 'latest';
      filter?: 'following' | 'following-users' | 'my-posts';
    }) => [...queryKeys.posts.lists(), filters] as const,
    infinite: (filters: {
      parentCategory?: string;
      category?: string;
      type?: 'question' | 'share';
      search?: string;
      sort?: 'popular' | 'latest';
      filter?: 'following' | 'following-users' | 'my-posts';
    }, page: number = 1) => [...queryKeys.posts.lists(), 'infinite', filters, page] as const,
    details: () => [...queryKeys.posts.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.posts.details(), id] as const,
    trending: (period: 'day' | 'week' | 'month' = 'week') =>
      [...queryKeys.posts.all, 'trending', period] as const,
  },

  // Comments
  comments: {
    all: ['comments'] as const,
    lists: () => [...queryKeys.comments.all, 'list'] as const,
    list: (postId: string) => [...queryKeys.comments.lists(), postId] as const,
    infinite: (postId: string) => [...queryKeys.comments.lists(), 'infinite', postId] as const,
  },

  // Answers
  answers: {
    all: ['answers'] as const,
    lists: () => [...queryKeys.answers.all, 'list'] as const,
    list: (postId: string) => [...queryKeys.answers.lists(), postId] as const,
    infinite: (postId: string) => [...queryKeys.answers.lists(), 'infinite', postId] as const,
  },

  // Users
  users: {
    all: ['users'] as const,
    details: () => [...queryKeys.users.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.users.details(), id] as const,
    me: () => [...queryKeys.users.all, 'me'] as const,
    posts: (userId: string, filters?: { page?: number; limit?: number; type?: string }) =>
      [...queryKeys.users.detail(userId), 'posts', filters] as const,
    answers: (userId: string, filters?: { page?: number; limit?: number; adoptedOnly?: boolean }) =>
      [...queryKeys.users.detail(userId), 'answers', filters] as const,
    comments: (userId: string, filters?: { page?: number; limit?: number }) =>
      [...queryKeys.users.detail(userId), 'comments', filters] as const,
    bookmarks: (userId: string, filters?: { page?: number; limit?: number }) =>
      [...queryKeys.users.detail(userId), 'bookmarks', filters] as const,
    followers: (userId: string, filters?: { page?: number; limit?: number }) =>
      [...queryKeys.users.detail(userId), 'followers', filters] as const,
    following: (userId: string, filters?: { page?: number; limit?: number }) =>
      [...queryKeys.users.detail(userId), 'following', filters] as const,
    recommended: () => [...queryKeys.users.all, 'recommended'] as const,
  },

  // Notifications
  notifications: {
    all: ['notifications'] as const,
    lists: () => [...queryKeys.notifications.all, 'list'] as const,
    list: (filters?: { page?: number; limit?: number; unreadOnly?: boolean }) =>
      [...queryKeys.notifications.lists(), filters] as const,
    infinite: (filters?: { unreadOnly?: boolean }) =>
      [...queryKeys.notifications.lists(), 'infinite', filters] as const,
  },

  // Search
  search: {
    all: ['search'] as const,
    global: (query: string) => [...queryKeys.search.all, 'global', query] as const,
    posts: (query: string, filters?: { type?: string; category?: string }) =>
      [...queryKeys.search.all, 'posts', query, filters] as const,
    users: (query: string) => [...queryKeys.search.all, 'users', query] as const,
    tags: (query: string) => [...queryKeys.search.all, 'tags', query] as const,
  },

  // Verification
  verification: {
    all: ['verification'] as const,
    history: (filters?: { page?: number; limit?: number; status?: string }) =>
      [...queryKeys.verification.all, 'history', filters] as const,
    detail: (id: string) => [...queryKeys.verification.all, 'detail', id] as const,
  },

  // Categories
  categories: {
    all: ['categories'] as const,
    subscriptions: () => ['categories', 'subscriptions'] as const,
  },

  // News
  news: {
    all: ['news'] as const,
    byLang: (lang?: string) => [...queryKeys.news.all, lang || 'vi'] as const,
  },
} as const;
