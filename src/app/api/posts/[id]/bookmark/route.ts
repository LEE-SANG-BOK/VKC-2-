import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { posts, bookmarks } from '@/lib/db/schema';
import { successResponse, notFoundResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/api/response';
import { getSession } from '@/lib/api/auth';
import { eq, and } from 'drizzle-orm';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/posts/[id]/bookmark
 * 북마크 토글
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
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

    // 기존 북마크 확인
    const existingBookmark = await db.query.bookmarks.findFirst({
      where: and(
        eq(bookmarks.userId, user.id),
        eq(bookmarks.postId, postId)
      ),
    });

    if (existingBookmark) {
      // 북마크 취소
      await db.delete(bookmarks).where(eq(bookmarks.id, existingBookmark.id));

      return successResponse({ isBookmarked: false }, '북마크를 취소했습니다.');
    } else {
      // 북마크 추가
      await db.insert(bookmarks).values({
        userId: user.id,
        postId,
      });

      return successResponse({ isBookmarked: true }, '북마크에 추가했습니다.');
    }
  } catch (error) {
    console.error('POST /api/posts/[id]/bookmark error:', error);
    return serverErrorResponse();
  }
}

/**
 * GET /api/posts/[id]/bookmark
 * 북마크 상태 조회
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const user = await getSession(request);

    if (!user) {
      return successResponse({ isBookmarked: false });
    }

    const { id: postId } = await context.params;

    // 북마크 확인
    const bookmark = await db.query.bookmarks.findFirst({
      where: and(
        eq(bookmarks.userId, user.id),
        eq(bookmarks.postId, postId)
      ),
    });

    return successResponse({ isBookmarked: !!bookmark });
  } catch (error) {
    console.error('GET /api/posts/[id]/bookmark error:', error);
    return serverErrorResponse();
  }
}
