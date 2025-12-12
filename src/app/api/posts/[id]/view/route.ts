import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { posts, postViews } from '@/lib/db/schema';
import { successResponse, notFoundResponse, serverErrorResponse } from '@/lib/api/response';
import { getSession } from '@/lib/api/auth';
import { eq, and, gt, sql } from 'drizzle-orm';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/posts/[id]/view
 * 조회수 증가
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id: postId } = await context.params;

    // 게시글 존재 여부 확인
    const post = await db.query.posts.findFirst({
      where: eq(posts.id, postId),
    });

    if (!post) {
      return notFoundResponse('게시글을 찾을 수 없습니다.');
    }

    const user = await getSession(request);
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // 중복 조회 방지: 같은 사용자 또는 같은 IP에서 24시간 내 조회한 경우 카운트하지 않음
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const recentView = await db.query.postViews.findFirst({
      where: and(
        eq(postViews.postId, postId),
        user
          ? eq(postViews.userId, user.id)
          : eq(postViews.ipAddress, ipAddress),
        gt(postViews.createdAt, oneDayAgo)
      ),
    });

    if (recentView) {
      // 이미 조회한 기록이 있으면 카운트하지 않음
      return successResponse({ views: post.views }, '이미 조회한 게시글입니다.');
    }

    // 조회 기록 추가
    await db.insert(postViews).values({
      postId,
      userId: user?.id || null,
      ipAddress,
      userAgent,
    });

    // 조회수 증가
    const [updatedPost] = await db
      .update(posts)
      .set({ views: sql`${posts.views} + 1` })
      .where(eq(posts.id, postId))
      .returning();

    return successResponse({ views: updatedPost.views }, '조회수가 증가했습니다.');
  } catch (error) {
    console.error('POST /api/posts/[id]/view error:', error);
    return serverErrorResponse();
  }
}
