import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { successResponse, serverErrorResponse } from '@/lib/api/response';
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
    const query = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!query) {
      return serverErrorResponse('검색어를 입력해주세요.');
    }

    // 태그 검색 (JSONB 배열에서 검색)
    // PostgreSQL의 jsonb_array_elements_text를 사용하여 태그 배열을 평면화하고 검색
    const tagsResult = await db.execute(sql`
      SELECT
        tag,
        COUNT(*) as count
      FROM
        posts,
        jsonb_array_elements_text(tags) as tag
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

    return successResponse({
      tags,
      total: tags.length,
    });
  } catch (error) {
    console.error('GET /api/search/tags error:', error);
    return serverErrorResponse();
  }
}
