import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { successResponse, errorResponse, serverErrorResponse } from '@/lib/api/response';
import { sql } from 'drizzle-orm';

/**
 * GET /api/search/tags
 * 태그 검색
 *
 * Query Params:
 * - q: string (required) - 검색어
 * - limit: number (default: 20)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim() || '';
    const limit = Math.min(20, Math.max(1, parseInt(searchParams.get('limit') || '20', 10) || 20));

    if (!query) {
      return errorResponse('검색어를 입력해주세요.', 'SEARCH_QUERY_REQUIRED');
    }

    if (query.length > 80) {
      return errorResponse('검색어가 너무 깁니다.', 'SEARCH_QUERY_TOO_LONG');
    }

    // 태그 검색 (text[] 배열에서 검색)
    // PostgreSQL의 unnest를 사용하여 태그 배열을 평면화하고 검색
    const tagsResult = await db.execute(sql`
      SELECT
        tag,
        COUNT(*)::int as count
      FROM
        posts,
        unnest(posts.tags) as tag
      WHERE
        tag ILIKE ${`%${query}%`}
      GROUP BY
        tag
      ORDER BY
        count DESC,
        tag ASC
      LIMIT ${limit}
    `);

    // 결과를 정리
    const tags = (Array.from(tagsResult) as Array<{ tag: string; count: string }>).map((row) => ({
      tag: row.tag,
      count: parseInt(row.count),
    }));

    const response = successResponse({
      tags,
      total: tags.length,
    });
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    return response;
  } catch (error) {
    console.error('GET /api/search/tags error:', error);
    return serverErrorResponse();
  }
}
