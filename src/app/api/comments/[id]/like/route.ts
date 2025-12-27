import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { comments, likes } from '@/lib/db/schema';
import { successResponse, notFoundResponse, unauthorizedResponse, serverErrorResponse, rateLimitResponse } from '@/lib/api/response';
import { getSession } from '@/lib/api/auth';
import { eq, and, sql } from 'drizzle-orm';
import { isE2ETestMode } from '@/lib/e2e/mode';
import { getE2ERequestState } from '@/lib/e2e/request';
import { toggleCommentLike } from '@/lib/e2e/actions';
import { checkInMemoryRateLimit } from '@/lib/api/rateLimit';

interface RouteContext {
  params: Promise<{ id: string }>;
}

const commentLikeRateLimitWindowMs = 60_000;
const commentLikeRateLimitMax = 60;
const commentLikeRateLimitE2EWindowMs = 10_000;
const commentLikeRateLimitE2EMax = 5;

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
      const { store, namespace } = getE2ERequestState(request);
      const alreadyLiked = store.commentLikesByUserId.get(user.id)?.has(commentId) === true;
      if (!alreadyLiked) {
        const rateLimit = checkInMemoryRateLimit({
          key: `${namespace}:${user.id}:comment-like`,
          windowMs: commentLikeRateLimitE2EWindowMs,
          max: commentLikeRateLimitE2EMax,
        });
        if (!rateLimit.allowed) {
          return rateLimitResponse(
            '좋아요 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
            'COMMENT_LIKE_RATE_LIMITED',
            rateLimit.retryAfterSeconds
          );
        }
      }
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
      const rateLimit = checkInMemoryRateLimit({
        key: `${user.id}:comment-like`,
        windowMs: commentLikeRateLimitWindowMs,
        max: commentLikeRateLimitMax,
      });
      if (!rateLimit.allowed) {
        return rateLimitResponse(
          '좋아요 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
          'COMMENT_LIKE_RATE_LIMITED',
          rateLimit.retryAfterSeconds
        );
      }

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
