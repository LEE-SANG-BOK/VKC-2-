import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { userPublicColumns } from '@/lib/db/columns';
import { users } from '@/lib/db/schema';
import { paginatedResponse, errorResponse, serverErrorResponse } from '@/lib/api/response';
import { getSession } from '@/lib/api/auth';
import { getFollowingIdSet } from '@/lib/api/follow';
import { sql, or, ilike, desc } from 'drizzle-orm';

/**
 * GET /api/search/users
 * 사용자 검색
 *
 * Query Params:
 * - q: string (required) - 검색어
 * - page: number (default: 1)
 * - limit: number (default: 20)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = (searchParams.get('q') || '').trim();
    const pageCandidate = parseInt(searchParams.get('page') || '1', 10);
    const page = Math.min(100, Math.max(1, Number.isNaN(pageCandidate) ? 1 : pageCandidate));
    const limitCandidate = parseInt(searchParams.get('limit') || '20', 10);
    const limit = Math.min(50, Math.max(1, Number.isNaN(limitCandidate) ? 20 : limitCandidate));

    if (!query) {
      return errorResponse('검색어를 입력해주세요.', 'SEARCH_QUERY_REQUIRED');
    }

    if (query.length > 80) {
      return errorResponse('검색어가 너무 깁니다.', 'SEARCH_QUERY_TOO_LONG');
    }

    const currentUser = await getSession(request);

    // 전체 개수 조회
    const [countResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(
        or(
          ilike(users.name, `%${query}%`),
          ilike(users.displayName, `%${query}%`),
          ilike(users.bio, `%${query}%`)
        )
      );

    const total = countResult?.count || 0;

    // 사용자 검색
    const usersResult = await db.query.users.findMany({
      where: (users, { or, ilike }) =>
        or(
          ilike(users.name, `%${query}%`),
          ilike(users.displayName, `%${query}%`),
          ilike(users.bio, `%${query}%`)
        ),
      columns: userPublicColumns,
      orderBy: [desc(users.createdAt)],
      limit,
      offset: (page - 1) * limit,
    });

    const userIds = usersResult.map((user) => user.id);
    const followingIdSet = currentUser ? await getFollowingIdSet(currentUser.id, userIds) : new Set<string>();
    const decoratedUsers = usersResult.map((user) => ({
      ...user,
      isFollowing: currentUser ? followingIdSet.has(user.id) : false,
    }));

    const response = paginatedResponse(decoratedUsers, page, limit, total);
    response.headers.set(
      'Cache-Control',
      currentUser ? 'private, no-store' : 'public, s-maxage=120, stale-while-revalidate=600'
    );
    return response;
  } catch (error) {
    console.error('GET /api/search/users error:', error);
    return serverErrorResponse();
  }
}
