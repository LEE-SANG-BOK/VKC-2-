import { NextRequest } from 'next/server';
import { getQueryClient } from '@/lib/db';
import { setPublicSWR, successResponse, errorResponse, serverErrorResponse } from '@/lib/api/response';

type KeywordSource = 'tag' | 'category' | 'subcategory';
type RawKeywordRow = { value?: unknown; count?: unknown };

const sourcePriority: Record<KeywordSource, number> = {
  tag: 0,
  category: 1,
  subcategory: 2,
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawQuery = searchParams.get('q') || '';
    const query = rawQuery.trim();
    const limitCandidate = parseInt(searchParams.get('limit') || '10', 10) || 10;
    const limit = Math.min(20, Math.max(1, limitCandidate));

    if (query.length > 80) {
      return errorResponse('검색어가 너무 깁니다.', 'SEARCH_QUERY_TOO_LONG');
    }

    const hasQuery = query.length > 0;
    const fetchLimit = Math.min(60, Math.max(limit * 4, limit));
    const likeQuery = `%${query}%`;

    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - (hasQuery ? 180 : 30));
    const dateFromIso = dateFrom.toISOString();

    const client = getQueryClient();
    const tagRows = hasQuery
      ? await client`
          SELECT
            tag as value,
            COUNT(*)::int as count
          FROM
            posts,
            unnest(posts.tags) as tag
          WHERE
            tag ILIKE ${likeQuery}
          GROUP BY
            tag
          ORDER BY
            count DESC,
            tag ASC
          LIMIT ${fetchLimit}
        `
      : await client`
          SELECT
            tag as value,
            COUNT(*)::int as count
          FROM
            posts,
            unnest(posts.tags) as tag
          WHERE
            posts.created_at >= ${dateFromIso}
          GROUP BY
            tag
          ORDER BY
            count DESC,
            tag ASC
          LIMIT ${fetchLimit}
        `;

    const categoryRows = hasQuery
      ? await client`
          SELECT
            category as value,
            COUNT(*)::int as count
          FROM
            posts
          WHERE
            category IS NOT NULL
            AND category ILIKE ${likeQuery}
          GROUP BY
            category
          ORDER BY
            count DESC,
            category ASC
          LIMIT ${fetchLimit}
        `
      : await client`
          SELECT
            category as value,
            COUNT(*)::int as count
          FROM
            posts
          WHERE
            category IS NOT NULL
            AND posts.created_at >= ${dateFromIso}
          GROUP BY
            category
          ORDER BY
            count DESC,
            category ASC
          LIMIT ${fetchLimit}
        `;

    const subcategoryRows = hasQuery
      ? await client`
          SELECT
            subcategory as value,
            COUNT(*)::int as count
          FROM
            posts
          WHERE
            subcategory IS NOT NULL
            AND subcategory ILIKE ${likeQuery}
          GROUP BY
            subcategory
          ORDER BY
            count DESC,
            subcategory ASC
          LIMIT ${fetchLimit}
        `
      : await client`
          SELECT
            subcategory as value,
            COUNT(*)::int as count
          FROM
            posts
          WHERE
            subcategory IS NOT NULL
            AND posts.created_at >= ${dateFromIso}
          GROUP BY
            subcategory
          ORDER BY
            count DESC,
            subcategory ASC
          LIMIT ${fetchLimit}
        `;

    const normalizeRows = (rows: Iterable<Record<string, unknown>>, source: KeywordSource) =>
      Array.from(rows)
        .map((row) => {
          const { value, count } = row as RawKeywordRow;
          return {
            value: String(value || '').trim(),
            count: Number(count) || 0,
            source,
          };
        })
        .filter((item) => item.value.length > 0);

    const candidates = [
      ...normalizeRows(tagRows as unknown as Iterable<Record<string, unknown>>, 'tag'),
      ...normalizeRows(categoryRows as unknown as Iterable<Record<string, unknown>>, 'category'),
      ...normalizeRows(subcategoryRows as unknown as Iterable<Record<string, unknown>>, 'subcategory'),
    ];

    const keywordMap = new Map<string, { value: string; count: number; source: KeywordSource }>();

    candidates.forEach((candidate) => {
      const key = candidate.value.toLowerCase();
      const existing = keywordMap.get(key);
      if (!existing) {
        keywordMap.set(key, candidate);
        return;
      }
      if (candidate.count > existing.count) {
        keywordMap.set(key, candidate);
        return;
      }
      if (candidate.count === existing.count && sourcePriority[candidate.source] < sourcePriority[existing.source]) {
        keywordMap.set(key, candidate);
      }
    });

    const keywords = Array.from(keywordMap.values())
      .sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count;
        if (sourcePriority[a.source] !== sourcePriority[b.source]) {
          return sourcePriority[a.source] - sourcePriority[b.source];
        }
        return a.value.localeCompare(b.value);
      })
      .slice(0, limit);

    const response = successResponse({
      keywords,
      query: query || undefined,
    });
    setPublicSWR(response, hasQuery ? 120 : 600, hasQuery ? 600 : 3600);
    return response;
  } catch (error) {
    console.error('GET /api/search/keywords error:', error);
    return serverErrorResponse();
  }
}
