import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { contentReports, posts, answers, comments } from '@/lib/db/schema';
import { successResponse, unauthorizedResponse, errorResponse, notFoundResponse, serverErrorResponse } from '@/lib/api/response';
import { getSession } from '@/lib/api/auth';
import { and, eq } from 'drizzle-orm';
import { isE2ETestMode } from '@/lib/e2e/mode';

type TargetType = 'post' | 'answer' | 'comment';

const targetTypeSet = new Set<TargetType>(['post', 'answer', 'comment']);

const parseTargetType = (value: string | null | undefined): TargetType | null => {
  if (!value) return null;
  if (!targetTypeSet.has(value as TargetType)) return null;
  return value as TargetType;
};

export async function GET(request: NextRequest) {
  try {
    const user = await getSession(request);
    if (!user) {
      return unauthorizedResponse();
    }

    if (isE2ETestMode()) {
      return successResponse({ ids: [] });
    }

    const typeParam = request.nextUrl.searchParams.get('type');
    const targetType = parseTargetType(typeParam);
    if (typeParam && !targetType) {
      return errorResponse('올바르지 않은 대상입니다.', 'HIDE_INVALID_TARGET_TYPE');
    }

    const rows = await db
      .select({ targetId: contentReports.targetId, targetType: contentReports.targetType })
      .from(contentReports)
      .where(
        targetType
          ? and(eq(contentReports.reporterId, user.id), eq(contentReports.targetType, targetType))
          : eq(contentReports.reporterId, user.id)
      );

    const ids = rows.map((row) => row.targetId);

    return successResponse({ ids });
  } catch (error) {
    console.error('GET /api/hides error:', error);
    return serverErrorResponse();
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSession(request);
    if (!user) {
      return unauthorizedResponse();
    }

    if (isE2ETestMode()) {
      return successResponse({ success: true });
    }

    const body = await request.json();
    const targetType = parseTargetType(body?.targetType);
    const targetId = typeof body?.targetId === 'string' ? body.targetId : '';

    if (!targetType || !targetId) {
      return errorResponse('필수 필드가 누락되었습니다.', 'HIDE_REQUIRED_FIELDS');
    }

    let exists = false;
    if (targetType === 'post') {
      const post = await db.query.posts.findFirst({ where: eq(posts.id, targetId) });
      exists = Boolean(post);
    } else if (targetType === 'answer') {
      const answer = await db.query.answers.findFirst({ where: eq(answers.id, targetId) });
      exists = Boolean(answer);
    } else if (targetType === 'comment') {
      const comment = await db.query.comments.findFirst({ where: eq(comments.id, targetId) });
      exists = Boolean(comment);
    }

    if (!exists) {
      return notFoundResponse('대상을 찾을 수 없습니다.');
    }

    await db
      .insert(contentReports)
      .values({
        reporterId: user.id,
        targetType,
        targetId,
        type: 'other',
        reason: 'hidden_by_user',
        status: 'dismissed',
      })
      .onConflictDoNothing();

    return successResponse({ success: true });
  } catch (error) {
    console.error('POST /api/hides error:', error);
    return serverErrorResponse();
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getSession(request);
    if (!user) {
      return unauthorizedResponse();
    }

    if (isE2ETestMode()) {
      return successResponse({ success: true });
    }

    const body = await request.json();
    const targetType = parseTargetType(body?.targetType);
    const targetId = typeof body?.targetId === 'string' ? body.targetId : '';

    if (!targetType || !targetId) {
      return errorResponse('필수 필드가 누락되었습니다.', 'HIDE_REQUIRED_FIELDS');
    }

    await db.delete(contentReports).where(
      and(
        eq(contentReports.reporterId, user.id),
        eq(contentReports.targetType, targetType),
        eq(contentReports.targetId, targetId)
      )
    );

    return successResponse({ success: true });
  } catch (error) {
    console.error('DELETE /api/hides error:', error);
    return serverErrorResponse();
  }
}
