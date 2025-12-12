import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { answers, reports } from '@/lib/db/schema';
import { successResponse, unauthorizedResponse, notFoundResponse, errorResponse, serverErrorResponse } from '@/lib/api/response';
import { getSession } from '@/lib/api/auth';
import { eq } from 'drizzle-orm';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/answers/[id]/report
 * 답글 신고
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

    const { id: answerId } = await context.params;
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

    const answer = await db.query.answers.findFirst({
      where: eq(answers.id, answerId),
    });

    if (!answer) {
      return notFoundResponse('답글을 찾을 수 없습니다.');
    }

    if (answer.authorId === user.id) {
      return errorResponse('본인의 답글은 신고할 수 없습니다.');
    }

    const existingReport = await db.query.reports.findFirst({
      where: (reports, { eq, and }) =>
        and(
          eq(reports.reporterId, user.id),
          eq(reports.answerId, answerId)
        ),
    });

    if (existingReport) {
      return errorResponse('이미 신고한 답글입니다.');
    }

    const [newReport] = await db
      .insert(reports)
      .values({
        reporterId: user.id,
        answerId,
        type,
        reason: finalReason,
        status: 'pending',
      })
      .returning();

    return successResponse(newReport, '신고가 접수되었습니다. 검토 후 조치하겠습니다.');
  } catch (error) {
    console.error('POST /api/answers/[id]/report error:', error);
    return serverErrorResponse();
  }
}
