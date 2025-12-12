/**
 * Auth Repository Types
 * 인증 관련 타입 정의
 */

export interface SessionUser {
  id: string;
  email: string;
  name?: string;
  image?: string;
}

export interface Session {
  user: SessionUser;
  expires: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
