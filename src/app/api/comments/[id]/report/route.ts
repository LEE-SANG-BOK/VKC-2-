import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { comments, reports, contentReports } from '@/lib/db/schema';
import { successResponse, unauthorizedResponse, notFoundResponse, errorResponse, serverErrorResponse, rateLimitResponse } from '@/lib/api/response';
import { getSession } from '@/lib/api/auth';
import { checkRateLimit } from '@/lib/api/rateLimit';
import { eq } from 'drizzle-orm';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/comments/[id]/report
 * 댓글/대댓글 신고
 *
 * Body:
 * - type: 'spam' | 'harassment' | 'inappropriate' | 'misinformation' | 'other'
 * - reason: string (required) - 신고 사유
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const user = await getSession(request);
    if (!user) {
      return unauthorizedResponse();
    }

    const rateLimit = await checkRateLimit({
      table: reports,
      userColumn: reports.reporterId,
      createdAtColumn: reports.createdAt,
      userId: user.id,
      windowMs: 60 * 60 * 1000,
      max: 5,
    });
    if (!rateLimit.allowed) {
      return rateLimitResponse(
        '신고 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
        'REPORT_RATE_LIMITED',
        rateLimit.retryAfterSeconds
      );
    }

    const { id: commentId } = await context.params;
    const body = await request.json();
    const { type, reason } = body;

    if (!type) {
      return errorResponse('신고 유형을 선택해주세요.');
    }

    const validTypes = ['spam', 'harassment', 'inappropriate', 'misinformation', 'other'];
    if (!validTypes.includes(type)) {
      return errorResponse('올바르지 않은 신고 유형입니다.');
    }

    if (type === 'other' && (!reason || reason.length < 10)) {
      return errorResponse('기타 신고 시 사유를 10자 이상 입력해주세요.');
    }

    const finalReason = type === 'other' ? reason : type;

    const comment = await db.query.comments.findFirst({
      where: eq(comments.id, commentId),
    });

    if (!comment) {
      return notFoundResponse('댓글을 찾을 수 없습니다.');
    }

    if (comment.authorId === user.id) {
      return errorResponse('본인의 댓글은 신고할 수 없습니다.');
    }

    const existingReport = await db.query.reports.findFirst({
      where: (reports, { eq, and }) =>
        and(
          eq(reports.reporterId, user.id),
          eq(reports.commentId, commentId)
        ),
    });

    if (existingReport) {
      return errorResponse('이미 신고한 댓글입니다.');
    }

    const [newReport] = await db
      .insert(reports)
      .values({
        reporterId: user.id,
        commentId,
        type,
        reason: finalReason,
        status: 'pending',
      })
      .returning();

    await db
      .insert(contentReports)
      .values({
        reporterId: user.id,
        targetType: 'comment',
        targetId: commentId,
        type,
        reason: finalReason,
        status: 'pending',
      })
      .onConflictDoNothing();

    return successResponse(newReport, '신고가 접수되었습니다. 검토 후 조치하겠습니다.');
  } catch (error) {
    console.error('POST /api/comments/[id]/report error:', error);
    return serverErrorResponse();
  }
}
