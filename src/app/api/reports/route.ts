import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { contentReports, posts, answers, comments } from '@/lib/db/schema';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse, serverErrorResponse } from '@/lib/api/response';
import { getSession } from '@/lib/api/auth';
import { and, eq, gte, sql } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const user = await getSession(request);
    if (!user) {
      return unauthorizedResponse();
    }

    const body = await request.json();
    const { targetType, targetId, type, reason } = body as {
      targetType: 'post' | 'answer' | 'comment';
      targetId: string;
      type: 'spam' | 'harassment' | 'inappropriate' | 'misinformation' | 'other';
      reason: string;
    };

    if (!targetType || !targetId || !type || !reason) {
      return errorResponse('필수 필드가 누락되었습니다.');
    }

    // 단순 레이트리밋: 최근 1시간 5건 초과시 제한
    const since = new Date(Date.now() - 60 * 60 * 1000);
    const [recentCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(contentReports)
      .where(and(eq(contentReports.reporterId, user.id), gte(contentReports.createdAt, since)));
    if ((recentCount?.count || 0) >= 5) {
      return errorResponse('신고 한도를 초과했습니다. 잠시 후 다시 시도하세요.');
    }

    let exists = null;
    if (targetType === 'post') {
      exists = await db.query.posts.findFirst({ where: eq(posts.id, targetId) });
    } else if (targetType === 'answer') {
      exists = await db.query.answers.findFirst({ where: eq(answers.id, targetId) });
    } else if (targetType === 'comment') {
      exists = await db.query.comments.findFirst({ where: eq(comments.id, targetId) });
    }

    if (!exists) {
      return notFoundResponse('대상을 찾을 수 없습니다.');
    }

    const dup = await db.query.contentReports.findFirst({
      where: and(
        eq(contentReports.reporterId, user.id),
        eq(contentReports.targetType, targetType),
        eq(contentReports.targetId, targetId)
      ),
    });

    if (dup) {
      return successResponse(dup, '이미 신고한 항목입니다.');
    }

    const [report] = await db
      .insert(contentReports)
      .values({
        reporterId: user.id,
        targetType,
        targetId,
        type,
        reason,
      })
      .returning();

    return successResponse(report, '신고가 접수되었습니다.');
  } catch (error) {
    console.error('POST /api/reports error:', error);
    return serverErrorResponse();
  }
}
