import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { verificationRequests } from '@/lib/db/schema';
import { paginatedResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/api/response';
import { getSession } from '@/lib/api/auth';
import { isE2ETestMode } from '@/lib/e2e/mode';
import { eq, desc, sql } from 'drizzle-orm';

/**
 * GET /api/verification/history
 * 내 인증 요청 이력 조회
 *
 * Query Params:
 * - page: number (default: 1)
 * - limit: number (default: 20)
 * - status?: 'pending' | 'approved' | 'rejected' (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getSession(request);
    if (!user) {
      return unauthorizedResponse();
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status') as 'pending' | 'approved' | 'rejected' | null;

    if (isE2ETestMode()) {
      return paginatedResponse([], page, limit, 0);
    }

    // 조건 설정
    const conditions = [eq(verificationRequests.userId, user.id)];
    if (status) {
      conditions.push(eq(verificationRequests.status, status));
    }

    // 전체 개수 조회
    const [countResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(verificationRequests)
      .where(conditions.length > 1 ? sql`${conditions[0]} AND ${conditions[1]}` : conditions[0]);

    const total = countResult?.count || 0;

    // 인증 요청 이력 조회
    const requests = await db.query.verificationRequests.findMany({
      where: (verificationRequests, { eq, and }) =>
        status
          ? and(eq(verificationRequests.userId, user.id), eq(verificationRequests.status, status))
          : eq(verificationRequests.userId, user.id),
      with: {
        reviewer: true, // 검토자 정보 (승인/거부한 경우)
      },
      orderBy: [desc(verificationRequests.submittedAt)],
      limit,
      offset: (page - 1) * limit,
    });

    return paginatedResponse(requests, page, limit, total);
  } catch (error) {
    console.error('GET /api/verification/history error:', error);
    return serverErrorResponse();
  }
}
