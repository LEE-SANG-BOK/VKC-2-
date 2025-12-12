import type {
  User,
  UserProfile,
  UpdateProfileRequest,
  PaginatedResponse,
  ApiResponse,
  UserFilters,
  UserPost,
  UserAnswer,
  UserComment,
  UserBookmark,
  AnswerFilters,
} from './types';

const API_BASE = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export async function fetchMyProfile(): Promise<ApiResponse<User>> {
  const res = await fetch(`${API_BASE}/api/users/me`, {
    cache: 'no-store',
    credentials: 'include',
  });

  if (!res.ok) {
    throw new Error('Failed to fetch profile');
  }

  return res.json();
}

export async function fetchUserProfile(userId: string): Promise<UserProfile> {
  const res = await fetch(`${API_BASE}/api/users/${userId}`, {
    cache: 'no-store',
    credentials: 'include',
  });

  if (!res.ok) {
    throw new Error('Failed to fetch user profile');
  }

  return res.json();
}

export async function fetchUserPosts(
  userId: string,
  filters: UserFilters = {}
): Promise<PaginatedResponse<UserPost>> {
  const params = new URLSearchParams();
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());
  if (filters.type) params.append('type', filters.type);

  const fetchOptions: RequestInit = {
    cache: 'no-store',
    credentials: 'include',
  };

  if (typeof window === 'undefined') {
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();
    if (cookieHeader) {
      fetchOptions.headers = {
        Cookie: cookieHeader,
      };
    }
  }

  const res = await fetch(`${API_BASE}/api/users/${userId}/posts?${params.toString()}`, fetchOptions);

  if (!res.ok) {
    throw new Error('Failed to fetch user posts');
  }

  return res.json();
}

export async function fetchUserAnswers(
  userId: string,
  filters: AnswerFilters = {}
): Promise<PaginatedResponse<UserAnswer>> {
  const params = new URLSearchParams();
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());
  if (filters.adoptedOnly) params.append('adoptedOnly', 'true');

  const fetchOptions: RequestInit = {
    cache: 'no-store',
    credentials: 'include',
  };

  if (typeof window === 'undefined') {
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();
    if (cookieHeader) {
      fetchOptions.headers = {
        Cookie: cookieHeader,
      };
    }
  }

  const res = await fetch(`${API_BASE}/api/users/${userId}/answers?${params.toString()}`, fetchOptions);

  if (!res.ok) {
    throw new Error('Failed to fetch user answers');
  }

  return res.json();
}

export async function fetchUserComments(
  userId: string,
  filters: Omit<UserFilters, 'type'> = {}
): Promise<PaginatedResponse<UserComment>> {
  const params = new URLSearchParams();
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());

  const fetchOptions: RequestInit = {
    cache: 'no-store',
    credentials: 'include',
  };

  if (typeof window === 'undefined') {
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();
    if (cookieHeader) {
      fetchOptions.headers = {
        Cookie: cookieHeader,
      };
    }
  }

  const res = await fetch(`${API_BASE}/api/users/${userId}/comments?${params.toString()}`, fetchOptions);

  if (!res.ok) {
    throw new Error('Failed to fetch user comments');
  }

  return res.json();
}

export async function fetchUserBookmarks(
  userId: string,
  filters: Omit<UserFilters, 'type'> = {}
): Promise<PaginatedResponse<UserBookmark>> {
  const params = new URLSearchParams();
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());

  const fetchOptions: RequestInit = {
    cache: 'no-store',
    credentials: 'include',
  };

  if (typeof window === 'undefined') {
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();
    if (cookieHeader) {
      fetchOptions.headers = {
        Cookie: cookieHeader,
      };
    }
  }

  const res = await fetch(`${API_BASE}/api/users/${userId}/bookmarks?${params.toString()}`, fetchOptions);

  if (!res.ok) {
    throw new Error('Failed to fetch user bookmarks');
  }

  return res.json();
}

export async function fetchFollowers(
  userId: string,
  filters: Omit<UserFilters, 'type'> = {}
): Promise<PaginatedResponse<User>> {
  const params = new URLSearchParams();
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());

  const res = await fetch(`${API_BASE}/api/users/${userId}/followers?${params.toString()}`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error('Failed to fetch followers');
  }

  return res.json();
}

export async function fetchFollowing(
  userId: string,
  filters: Omit<UserFilters, 'type'> = {}
): Promise<PaginatedResponse<User>> {
  const params = new URLSearchParams();
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());

  const res = await fetch(`${API_BASE}/api/users/${userId}/following?${params.toString()}`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error('Failed to fetch following');
  }

  return res.json();
}

export async function updateMyProfile(
  data: UpdateProfileRequest
): Promise<ApiResponse<User>> {
  const res = await fetch(`${API_BASE}/api/users/me`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || error.error || 'Failed to update profile');
  }

  return res.json();
}

export async function updateProfile(
  userId: string,
  data: UpdateProfileRequest
): Promise<ApiResponse<User>> {
  const res = await fetch(`${API_BASE}/api/users/${userId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || error.error || 'Failed to update profile');
  }

  return res.json();
}

export async function toggleFollow(
  userId: string
): Promise<ApiResponse<{ isFollowing: boolean }>> {
  const res = await fetch(`${API_BASE}/api/users/${userId}/follow`, {
    method: 'POST',
    credentials: 'include',
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to toggle follow');
  }

  return res.json();
}

export async function checkFollowStatus(
  userId: string
): Promise<{ isFollowing: boolean }> {
  const res = await fetch(`${API_BASE}/api/users/${userId}/follow/status`, {
    credentials: 'include',
  });

  if (!res.ok) {
    return { isFollowing: false };
  }

  const json = await res.json();
  return json.data || { isFollowing: false };
}

export async function fetchRecommendedUsers(
  filters: UserFilters = {}
): Promise<PaginatedResponse<User>> {
  const params = new URLSearchParams();
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());

  const res = await fetch(`${API_BASE}/api/users/recommended?${params}`, {
    cache: 'no-store',
    credentials: 'include',
  });

  if (!res.ok) {
    const fallbackPage = Number(filters.page || 1);
    const fallbackLimit = Number(filters.limit || 12);
    console.error('Failed to fetch recommended users');
    return {
      success: false,
      data: [],
      pagination: {
        page: fallbackPage,
        limit: fallbackLimit,
        total: 0,
        totalPages: 1,
      },
    };
  }

  return res.json();
}
