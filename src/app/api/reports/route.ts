import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { reports, posts, answers, comments, contentReports } from '@/lib/db/schema';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse, serverErrorResponse, rateLimitResponse } from '@/lib/api/response';
import { getSession } from '@/lib/api/auth';
import { checkRateLimit } from '@/lib/api/rateLimit';
import { and, eq } from 'drizzle-orm';

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

    const validTypes = ['spam', 'harassment', 'inappropriate', 'misinformation', 'other'] as const;
    if (!validTypes.includes(type)) {
      return errorResponse('올바르지 않은 신고 유형입니다.');
    }

    if (type === 'other' && reason.trim().length < 10) {
      return errorResponse('기타 신고 시 사유를 10자 이상 입력해주세요.');
    }

    const trimmedReason = reason.trim();
    const finalReason = type === 'other' ? trimmedReason : type;

    let exists: { authorId: string } | null = null;
    if (targetType === 'post') {
      const post = await db.query.posts.findFirst({ where: eq(posts.id, targetId) });
      exists = post ? { authorId: post.authorId } : null;
    } else if (targetType === 'answer') {
      const answer = await db.query.answers.findFirst({ where: eq(answers.id, targetId) });
      exists = answer ? { authorId: answer.authorId } : null;
    } else if (targetType === 'comment') {
      const comment = await db.query.comments.findFirst({ where: eq(comments.id, targetId) });
      exists = comment ? { authorId: comment.authorId } : null;
    }

    if (!exists) {
      return notFoundResponse('대상을 찾을 수 없습니다.');
    }

    if (exists.authorId === user.id) {
      return errorResponse('본인의 콘텐츠는 신고할 수 없습니다.');
    }

    const dup =
      targetType === 'post'
        ? await db.query.reports.findFirst({
            where: and(eq(reports.reporterId, user.id), eq(reports.postId, targetId)),
          })
        : targetType === 'answer'
          ? await db.query.reports.findFirst({
              where: and(eq(reports.reporterId, user.id), eq(reports.answerId, targetId)),
            })
          : await db.query.reports.findFirst({
              where: and(eq(reports.reporterId, user.id), eq(reports.commentId, targetId)),
            });

    if (dup) {
      await db
        .insert(contentReports)
        .values({
          reporterId: user.id,
          targetType,
          targetId,
          type,
          reason: finalReason,
          status: 'pending',
        })
        .onConflictDoNothing();
      return successResponse(dup, '이미 신고한 항목입니다.');
    }

    const [report] = await db
      .insert(reports)
      .values(
        targetType === 'post'
          ? {
              reporterId: user.id,
              postId: targetId,
              type,
              reason: finalReason,
              status: 'pending',
            }
          : targetType === 'answer'
            ? {
                reporterId: user.id,
                answerId: targetId,
                type,
                reason: finalReason,
                status: 'pending',
              }
            : {
                reporterId: user.id,
                commentId: targetId,
                type,
                reason: finalReason,
                status: 'pending',
              }
      )
      .returning();

    await db
      .insert(contentReports)
      .values({
        reporterId: user.id,
        targetType,
        targetId,
        type,
        reason: finalReason,
        status: 'pending',
      })
      .onConflictDoNothing();

    return successResponse(report, '신고가 접수되었습니다.');
  } catch (error) {
    console.error('POST /api/reports error:', error);
    return serverErrorResponse();
  }
}
