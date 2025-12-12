import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { userPublicColumns } from '@/lib/db/columns';
import { posts } from '@/lib/db/schema';
import { paginatedResponse, serverErrorResponse } from '@/lib/api/response';
import { sql, or, ilike, eq, desc, and } from 'drizzle-orm';

/**
 * GET /api/search/posts
 * 게시글 검색
 *
 * Query Params:
 * - q: string (required) - 검색어
 * - page: number (default: 1)
 * - limit: number (default: 20)
 * - type: 'question' | 'share' (optional) - 게시글 타입
 * - category: string (optional) - 카테고리
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const type = searchParams.get('type') as 'question' | 'share' | null;
    const category = searchParams.get('category');

    if (!query) {
      return serverErrorResponse('검색어를 입력해주세요.');
    }

    // 검색 조건 구성
    const conditions = [
      or(
        ilike(posts.title, `%${query}%`),
        ilike(posts.content, `%${query}%`)
      ),
    ];

    if (type) {
      conditions.push(eq(posts.type, type));
    }

    if (category && category !== 'all') {
      conditions.push(eq(posts.category, category));
    }

    // 전체 개수 조회
    const [countResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(posts)
      .where(conditions.length > 1 ? and(...conditions) : conditions[0]);

    const total = countResult?.count || 0;

    // 게시글 검색 (작성자 정보 포함)
    const postsResult = await db.query.posts.findMany({
      where: (posts, { or, ilike, eq, and }) => {
        const searchCondition = or(
          ilike(posts.title, `%${query}%`),
          ilike(posts.content, `%${query}%`)
        );

        if (type && category && category !== 'all') {
          return and(searchCondition, eq(posts.type, type), eq(posts.category, category));
        } else if (type) {
          return and(searchCondition, eq(posts.type, type));
        } else if (category && category !== 'all') {
          return and(searchCondition, eq(posts.category, category));
        }

        return searchCondition;
      },
      with: {
        author: {
          columns: userPublicColumns,
        },
      },
      orderBy: [desc(posts.createdAt)],
      limit,
      offset: (page - 1) * limit,
    });

    return paginatedResponse(postsResult, page, limit, total);
  } catch (error) {
    console.error('GET /api/search/posts error:', error);
    return serverErrorResponse();
  }
}
