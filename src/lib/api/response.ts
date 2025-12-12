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
}

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
  return NextResponse.json(
    {
      success: false,
      error,
      code,
    },
    { status }
  );
}

/**
 * 페이지네이션 응답
 */
export function paginatedResponse<T>(
  data: T[],
  page: number,
  limit: number,
  total: number
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
