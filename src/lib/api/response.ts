import { NextResponse } from 'next/server';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  code?: string;
}

export interface PaginatedResponse<T = any> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  meta?: Record<string, unknown>;
}

export const CACHE_CONTROL = {
  NO_STORE: 'no-store',
  PRIVATE_NO_STORE: 'private, no-store',
  publicSWR: (sMaxAgeSeconds: number, staleWhileRevalidateSeconds: number) =>
    `public, s-maxage=${sMaxAgeSeconds}, stale-while-revalidate=${staleWhileRevalidateSeconds}`,
} as const;

export const setCacheControl = <T extends NextResponse<any>>(response: T, value: string): T => {
  response.headers.set('Cache-Control', value);
  return response;
};

export const setNoStore = <T extends NextResponse<any>>(response: T): T =>
  setCacheControl(response, CACHE_CONTROL.NO_STORE);

export const setPrivateNoStore = <T extends NextResponse<any>>(response: T): T =>
  setCacheControl(response, CACHE_CONTROL.PRIVATE_NO_STORE);

export const setPublicSWR = <T extends NextResponse<any>>(
  response: T,
  sMaxAgeSeconds: number,
  staleWhileRevalidateSeconds: number
): T => setCacheControl(response, CACHE_CONTROL.publicSWR(sMaxAgeSeconds, staleWhileRevalidateSeconds));

/**
 * 성공 응답
 */
export function successResponse<T>(data: T, message?: string): NextResponse<ApiResponse<T>> {
  return NextResponse.json({
    success: true,
    data,
    message,
  });
}

/**
 * 에러 응답
 */
export function errorResponse(error: string, code?: string, status = 400): NextResponse<ApiResponse> {
  const response = NextResponse.json(
    {
      success: false,
      error,
      code,
    },
    { status }
  );

  setNoStore(response);
  return response;
}

export function rateLimitResponse(
  message = '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
  code = 'RATE_LIMITED',
  retryAfterSeconds?: number
): NextResponse<ApiResponse> {
  const response = NextResponse.json(
    {
      success: false,
      error: message,
      code,
    },
    { status: 429 }
  );

  setNoStore(response);
  if (retryAfterSeconds) {
    response.headers.set('Retry-After', String(retryAfterSeconds));
  }
  return response;
}

/**
 * 페이지네이션 응답
 */
export function paginatedResponse<T>(
  data: T[],
  page: number,
  limit: number,
  total: number,
  meta?: Record<string, unknown>
): NextResponse<PaginatedResponse<T>> {
  return NextResponse.json({
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    ...(meta ? { meta } : {}),
  });
}

/**
 * 인증 에러
 */
export function unauthorizedResponse(message = '인증이 필요합니다.'): NextResponse<ApiResponse> {
  return errorResponse(message, 'UNAUTHORIZED', 401);
}

/**
 * 권한 없음 에러
 */
export function forbiddenResponse(message = '권한이 없습니다.'): NextResponse<ApiResponse> {
  return errorResponse(message, 'FORBIDDEN', 403);
}

/**
 * 찾을 수 없음 에러
 */
export function notFoundResponse(message = '요청한 리소스를 찾을 수 없습니다.'): NextResponse<ApiResponse> {
  return errorResponse(message, 'NOT_FOUND', 404);
}

/**
 * 서버 에러
 */
export function serverErrorResponse(message = '서버 오류가 발생했습니다.'): NextResponse<ApiResponse> {
  return errorResponse(message, 'SERVER_ERROR', 500);
}
