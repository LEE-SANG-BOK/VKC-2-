import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { posts, reports } from '@/lib/db/schema';
import { successResponse, unauthorizedResponse, notFoundResponse, errorResponse, serverErrorResponse } from '@/lib/api/response';
import { getSession } from '@/lib/api/auth';
import { eq } from 'drizzle-orm';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/posts/[id]/report
 * 게시글 신고
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

    const { id: postId } = await context.params;
    const body = await request.json();
    const { type, reason } = body;

    // 검증
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

    // 게시글 존재 여부 확인
    const post = await db.query.posts.findFirst({
      where: eq(posts.id, postId),
    });

    if (!post) {
      return notFoundResponse('게시글을 찾을 수 없습니다.');
    }

    // 본인 게시글 신고 불가
    if (post.authorId === user.id) {
      return errorResponse('본인의 게시글은 신고할 수 없습니다.');
    }

    // 중복 신고 확인 (같은 사용자가 같은 게시글을 이미 신고했는지)
    const existingReport = await db.query.reports.findFirst({
      where: (reports, { eq, and }) =>
        and(
          eq(reports.reporterId, user.id),
          eq(reports.postId, postId)
        ),
    });

    if (existingReport) {
      return errorResponse('이미 신고한 게시글입니다.');
    }

    // 신고 생성
    const [newReport] = await db
      .insert(reports)
      .values({
        reporterId: user.id,
        postId,
        type,
        reason: finalReason,
        status: 'pending',
      })
      .returning();

    return successResponse(newReport, '신고가 접수되었습니다. 검토 후 조치하겠습니다.');
  } catch (error) {
    console.error('POST /api/posts/[id]/report error:', error);
    return serverErrorResponse();
  }
}
