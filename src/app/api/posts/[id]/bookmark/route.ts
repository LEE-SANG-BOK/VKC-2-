import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { posts, bookmarks } from '@/lib/db/schema';
import { successResponse, notFoundResponse, unauthorizedResponse, serverErrorResponse, rateLimitResponse } from '@/lib/api/response';
import { getSession } from '@/lib/api/auth';
import { eq, and } from 'drizzle-orm';
import { isE2ETestMode } from '@/lib/e2e/mode';
import { getE2ERequestState } from '@/lib/e2e/request';
import { togglePostBookmark as toggleE2EPostBookmark } from '@/lib/e2e/actions';
import { checkInMemoryRateLimit } from '@/lib/api/rateLimit';

interface RouteContext {
  params: Promise<{ id: string }>;
}

const bookmarkRateLimitWindowMs = 60_000;
const bookmarkRateLimitMax = 40;
const bookmarkRateLimitE2EWindowMs = 10_000;
const bookmarkRateLimitE2EMax = 5;

/**
 * POST /api/posts/[id]/bookmark
 * 북마크 토글
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    if (isE2ETestMode()) {
      const { id: postId } = await context.params;
      const { store, namespace, userId } = getE2ERequestState(request);
      if (!userId) return unauthorizedResponse();
      const alreadyBookmarked = store.bookmarksByUserId.get(userId)?.has(postId) === true;
      if (!alreadyBookmarked) {
        const rateLimit = checkInMemoryRateLimit({
          key: `${namespace}:${userId}:post-bookmark`,
          windowMs: bookmarkRateLimitE2EWindowMs,
          max: bookmarkRateLimitE2EMax,
        });
        if (!rateLimit.allowed) {
          return rateLimitResponse(
            '북마크 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
            'BOOKMARK_RATE_LIMITED',
            rateLimit.retryAfterSeconds
          );
        }
      }
      const result = toggleE2EPostBookmark(store, userId, postId);
      if (!result) {
        return notFoundResponse('게시글을 찾을 수 없습니다.');
      }
      return successResponse({ isBookmarked: result.isBookmarked });
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
      const rateLimit = checkInMemoryRateLimit({
        key: `${user.id}:post-bookmark`,
        windowMs: bookmarkRateLimitWindowMs,
        max: bookmarkRateLimitMax,
      });
      if (!rateLimit.allowed) {
        return rateLimitResponse(
          '북마크 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
          'BOOKMARK_RATE_LIMITED',
          rateLimit.retryAfterSeconds
        );
      }

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
    if (isE2ETestMode()) {
      const { id: postId } = await context.params;
      const { store, userId } = getE2ERequestState(request);
      if (!userId) {
        return successResponse({ isBookmarked: false });
      }
      const bookmarked = store.bookmarksByUserId.get(userId)?.has(postId) === true;
      return successResponse({ isBookmarked: bookmarked });
    }

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
