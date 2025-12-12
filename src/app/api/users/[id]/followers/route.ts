import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { follows, users } from '@/lib/db/schema';
import { paginatedResponse, notFoundResponse, serverErrorResponse } from '@/lib/api/response';
import { eq, desc, sql } from 'drizzle-orm';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/users/[id]/followers
 * 팔로워 목록 조회
 *
 * Query Params:
 * - page: number (default: 1)
 * - limit: number (default: 20)
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // 사용자 존재 여부 확인
    const user = await db.query.users.findFirst({
      where: eq(users.id, id),
    });

    if (!user) {
      return notFoundResponse('사용자를 찾을 수 없습니다.');
    }

    // 전체 팔로워 수 조회
    const [countResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(follows)
      .where(eq(follows.followingId, id));

    const total = countResult?.count || 0;

    // 팔로워 목록 조회 (팔로우한 사람들)
    const followersList = await db.query.follows.findMany({
      where: eq(follows.followingId, id),
      with: {
        follower: true, // 팔로워 정보
      },
      orderBy: [desc(follows.createdAt)],
      limit,
      offset: (page - 1) * limit,
    });

    // follower 정보만 추출
    const followers = followersList.map((f) => ({
      ...f.follower,
      followedAt: f.createdAt,
    }));

    return paginatedResponse(followers, page, limit, total);
  } catch (error) {
    console.error('GET /api/users/[id]/followers error:', error);
    return serverErrorResponse();
  }
}
