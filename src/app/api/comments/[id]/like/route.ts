import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { comments, likes } from '@/lib/db/schema';
import { successResponse, notFoundResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/api/response';
import { getSession } from '@/lib/api/auth';
import { eq, and, sql } from 'drizzle-orm';
import { isE2ETestMode } from '@/lib/e2e/mode';
import { getE2ERequestState } from '@/lib/e2e/request';
import { toggleCommentLike } from '@/lib/e2e/actions';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/comments/[id]/like
 * 댓글 좋아요 토글
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const user = await getSession(request);

    if (!user) {
      return unauthorizedResponse();
    }

    const { id: commentId } = await context.params;

    if (isE2ETestMode()) {
      const { store } = getE2ERequestState(request);
      const result = toggleCommentLike(store, user.id, commentId);
      if (!result) {
        return notFoundResponse('댓글을 찾을 수 없습니다.');
      }

      const payload = { isLiked: result.isLiked, likesCount: result.likes };
      return successResponse(payload, result.isLiked ? '좋아요를 눌렀습니다.' : '좋아요를 취소했습니다.');
    }

    // 댓글 존재 여부 확인
    const comment = await db.query.comments.findFirst({
      where: eq(comments.id, commentId),
    });

    if (!comment) {
      return notFoundResponse('댓글을 찾을 수 없습니다.');
    }

    // 기존 좋아요 확인
    const existingLike = await db.query.likes.findFirst({
      where: and(
        eq(likes.userId, user.id),
        eq(likes.commentId, commentId)
      ),
    });

    if (existingLike) {
      // 좋아요 취소
      await db.delete(likes).where(eq(likes.id, existingLike.id));

      // 댓글 좋아요 수 감소
      const [updatedComment] = await db
        .update(comments)
        .set({ likes: sql`${comments.likes} - 1` })
        .where(eq(comments.id, commentId))
        .returning({ likes: comments.likes });

      return successResponse({ isLiked: false, likesCount: updatedComment?.likes ?? 0 }, '좋아요를 취소했습니다.');
    } else {
      // 좋아요 추가
      await db.insert(likes).values({
        userId: user.id,
        commentId,
      });

      // 댓글 좋아요 수 증가
      const [updatedComment] = await db
        .update(comments)
        .set({ likes: sql`${comments.likes} + 1` })
        .where(eq(comments.id, commentId))
        .returning({ likes: comments.likes });

      return successResponse({ isLiked: true, likesCount: updatedComment?.likes ?? 0 }, '좋아요를 눌렀습니다.');
    }
  } catch (error) {
    console.error('POST /api/comments/[id]/like error:', error);
    return serverErrorResponse();
  }
}
