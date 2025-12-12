import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { userPublicColumns } from '@/lib/db/columns';
import { users } from '@/lib/db/schema';
import { paginatedResponse, serverErrorResponse } from '@/lib/api/response';
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
    const query = searchParams.get('q');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!query) {
      return serverErrorResponse('검색어를 입력해주세요.');
    }

    // 전체 개수 조회
    const [countResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(
        or(
          ilike(users.displayName, `%${query}%`),
          ilike(users.email, `%${query}%`),
          ilike(users.bio, `%${query}%`)
        )
      );

    const total = countResult?.count || 0;

    // 사용자 검색
    const usersResult = await db.query.users.findMany({
      where: (users, { or, ilike }) =>
        or(
          ilike(users.displayName, `%${query}%`),
          ilike(users.email, `%${query}%`),
          ilike(users.bio, `%${query}%`)
        ),
      columns: userPublicColumns,
      orderBy: [desc(users.createdAt)],
      limit,
      offset: (page - 1) * limit,
    });

    return paginatedResponse(usersResult, page, limit, total);
  } catch (error) {
    console.error('GET /api/search/users error:', error);
    return serverErrorResponse();
  }
}
