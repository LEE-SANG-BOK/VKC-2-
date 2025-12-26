import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { posts } from '@/lib/db/schema';
import { setPublicSWR, successResponse, errorResponse, serverErrorResponse } from '@/lib/api/response';
import { and, desc, eq, gte, sql } from 'drizzle-orm';
import { isE2ETestMode } from '@/lib/e2e/mode';

const PERIOD_DAYS = {
  day: 1,
  week: 7,
  month: 30,
} as const;

const resolvePeriod = (raw: string | null) => {
  if (raw === 'day' || raw === 'week' || raw === 'month') return raw;
  return 'week';
};

export async function GET(request: NextRequest) {
  try {
    if (isE2ETestMode()) {
      const response = successResponse({
        examples: [
          { id: 'e2e-example-1', title: 'E-7 비자 변경 서류' },
          { id: 'e2e-example-2', title: 'TOPIK 6급 공부 팁' },
        ],
      });
      setPublicSWR(response, 600, 3600);
      return response;
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(10, Math.max(1, parseInt(searchParams.get('limit') || '8', 10) || 8));
    const period = resolvePeriod(searchParams.get('period'));

    const daysAgo = PERIOD_DAYS[period];
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - daysAgo);

    const fetchLimit = Math.min(100, limit * 5);

    const selectExampleRows = (from?: Date) =>
      db
        .select({
          id: posts.id,
          title: posts.title,
        })
        .from(posts)
        .where(
          and(
            eq(posts.type, 'question'),
            from ? gte(posts.createdAt, from) : sql`true`
          )
        )
        .orderBy(
          desc(sql`${posts.likes} * 2 + ${posts.views}`),
          desc(posts.createdAt),
          desc(posts.id)
        )
        .limit(fetchLimit);

    const [recentRows, allRows] = await Promise.all([
      selectExampleRows(dateFrom),
      selectExampleRows(),
    ]);

    const seen = new Set<string>();
    const examples: Array<{ id: string; title: string }> = [];

    const addRow = (row: { id: string; title: string }) => {
      const title = row.title?.trim();
      if (!title) return;
      const key = title.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      examples.push({ id: row.id, title });
    };

    recentRows.forEach(addRow);
    if (examples.length < limit) {
      allRows.forEach(addRow);
    }

    const trimmed = examples.slice(0, limit);
    if (trimmed.length === 0) {
      return errorResponse('검색 예시를 생성할 수 없습니다.', 'SEARCH_EXAMPLES_EMPTY', 404);
    }

    const response = successResponse({
      examples: trimmed,
    });
    setPublicSWR(response, 600, 3600);
    return response;
  } catch (error) {
    console.error('GET /api/search/examples error:', error);
    return serverErrorResponse();
  }
}
