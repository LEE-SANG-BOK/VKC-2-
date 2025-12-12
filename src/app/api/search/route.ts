import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { userPublicColumns } from '@/lib/db/columns';
import { posts, users } from '@/lib/db/schema';
import { successResponse, serverErrorResponse } from '@/lib/api/response';
import { sql, or, ilike, desc } from 'drizzle-orm';

/**
 * GET /api/search
 * 통합 검색 (게시글 + 사용자)
 *
 * Query Params:
 * - q: string (required) - 검색어
 * - limit: number (default: 20) - 결과 개수
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!query) {
      return serverErrorResponse('검색어를 입력해주세요.');
    }

    // 게시글 검색
    const postsResult = await db.query.posts.findMany({
      where: or(
        ilike(posts.title, `%${query}%`),
        ilike(posts.content, `%${query}%`)
      ),
      with: {
        author: {
          columns: userPublicColumns,
        },
      },
      orderBy: [desc(posts.createdAt)],
      limit: Math.min(limit, 10), // 게시글은 최대 10개
    });

    // 사용자 검색
    const usersResult = await db.query.users.findMany({
      where: or(
        ilike(users.displayName, `%${query}%`),
        ilike(users.email, `%${query}%`),
        ilike(users.bio, `%${query}%`)
      ),
      columns: userPublicColumns,
      orderBy: [desc(users.createdAt)],
      limit: Math.min(limit, 10), // 사용자는 최대 10개
    });

    return successResponse({
      posts: postsResult,
      users: usersResult,
      total: {
        posts: postsResult.length,
        users: usersResult.length,
      },
    });
  } catch (error) {
    console.error('GET /api/search error:', error);
    return serverErrorResponse();
  }
}
