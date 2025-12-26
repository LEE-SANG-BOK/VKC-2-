import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { posts, likes } from '@/lib/db/schema';
import { successResponse, notFoundResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/api/response';
import { getSession } from '@/lib/api/auth';
import { eq, and, sql } from 'drizzle-orm';
import { isE2ETestMode } from '@/lib/e2e/mode';
import { getE2ERequestState } from '@/lib/e2e/request';
import { togglePostLike as toggleE2EPostLike } from '@/lib/e2e/actions';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/posts/[id]/like
 * 게시글 좋아요 토글
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    if (isE2ETestMode()) {
      const { id: postId } = await context.params;
      const { store, userId } = getE2ERequestState(request);
      if (!userId) return unauthorizedResponse();
      const result = toggleE2EPostLike(store, userId, postId);
      if (!result) {
        return notFoundResponse('게시글을 찾을 수 없습니다.');
      }
      return successResponse({ isLiked: result.isLiked });
    }

    const user = await getSession(request);

    if (!user) {
      return unauthorizedResponse();
    }

    const { id: postId } = await context.params;

    // 게시글 존재 여부 확인
    const post = await db.query.posts.findFirst({
      where: eq(posts.id, postId),
    });

    if (!post) {
      return notFoundResponse('게시글을 찾을 수 없습니다.');
    }

    // 기존 좋아요 확인
    const existingLike = await db.query.likes.findFirst({
      where: and(
        eq(likes.userId, user.id),
        eq(likes.postId, postId)
      ),
    });

    if (existingLike) {
      // 좋아요 취소
      await db.delete(likes).where(eq(likes.id, existingLike.id));

      // 게시글 좋아요 수 감소
      await db
        .update(posts)
        .set({ likes: sql`${posts.likes} - 1` })
        .where(eq(posts.id, postId));

      return successResponse({ isLiked: false }, '좋아요를 취소했습니다.');
    } else {
      // 좋아요 추가
      await db.insert(likes).values({
        userId: user.id,
        postId,
      });

      // 게시글 좋아요 수 증가
      await db
        .update(posts)
        .set({ likes: sql`${posts.likes} + 1` })
        .where(eq(posts.id, postId));

      return successResponse({ isLiked: true }, '좋아요를 눌렀습니다.');
    }
  } catch (error) {
    console.error('POST /api/posts/[id]/like error:', error);
    return serverErrorResponse();
  }
}
