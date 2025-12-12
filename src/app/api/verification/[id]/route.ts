import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { userPublicColumns } from '@/lib/db/columns';
import { verificationRequests } from '@/lib/db/schema';
import { successResponse, unauthorizedResponse, notFoundResponse, forbiddenResponse, serverErrorResponse } from '@/lib/api/response';
import { getSession, isOwner } from '@/lib/api/auth';
import { eq } from 'drizzle-orm';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/verification/[id]
 * 인증 요청 상세 조회
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const user = await getSession(request);
    if (!user) {
      return unauthorizedResponse();
    }

    const { id } = await context.params;

    // 인증 요청 조회
    const verificationRequest = await db.query.verificationRequests.findFirst({
      where: eq(verificationRequests.id, id),
      with: {
        user: {
          columns: userPublicColumns,
        },
        reviewer: {
          columns: userPublicColumns,
        },
      },
    });

    if (!verificationRequest) {
      return notFoundResponse('인증 요청을 찾을 수 없습니다.');
    }

    // 본인의 요청만 조회 가능 (관리자는 추후 구현)
    if (!isOwner(user.id, verificationRequest.userId)) {
      return forbiddenResponse('인증 요청을 조회할 권한이 없습니다.');
    }

    return successResponse(verificationRequest);
  } catch (error) {
    console.error('GET /api/verification/[id] error:', error);
    return serverErrorResponse();
  }
}
