import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { posts } from '@/lib/db/schema';
import { successResponse, serverErrorResponse } from '@/lib/api/response';
import { desc, sql } from 'drizzle-orm';

/**
 * GET /api/posts/trending
 * 인기 게시글 조회
 *
 * Query Params:
 * - limit: number (default: 10) - 개수
 * - period: 'day' | 'week' | 'month' (default: 'week') - 기간
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const period = searchParams.get('period') || 'week';

    // 기간별 날짜 계산
    let daysAgo = 7; // week
    if (period === 'day') daysAgo = 1;
    else if (period === 'month') daysAgo = 30;

    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - daysAgo);

    // 인기 게시글 조회 (조회수 + 좋아요 수 기준)
    const trendingPosts = await db.query.posts.findMany({
      where: (posts, { gte }) => gte(posts.createdAt, dateFrom),
      with: {
        author: true,
      },
      orderBy: [
        // 인기도 점수 = 좋아요 * 2 + 조회수
        desc(sql`${posts.likes} * 2 + ${posts.views}`),
      ],
      limit,
    });

    const sorted = [...trendingPosts].sort((a, b) => {
      const trustA = (a.author as any)?.trustScore || 0;
      const trustB = (b.author as any)?.trustScore || 0;
      const scoreA = (a.likes || 0) * 2 + (a.views || 0) + trustA * 2;
      const scoreB = (b.likes || 0) * 2 + (b.views || 0) + trustB * 2;
      return scoreB - scoreA;
    });

    return successResponse(sorted);
  } catch (error) {
    console.error('GET /api/posts/trending error:', error);
    return serverErrorResponse();
  }
}
