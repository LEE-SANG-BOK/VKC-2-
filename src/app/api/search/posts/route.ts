import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { posts } from '@/lib/db/schema';
import { paginatedResponse, errorResponse, serverErrorResponse } from '@/lib/api/response';
import { sql, eq, desc, and, SQL } from 'drizzle-orm';

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
    const query = (searchParams.get('q') || '').trim();
    const page = Math.max(1, parseInt(searchParams.get('page') || '1') || 1);
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20') || 20));
    const type = searchParams.get('type') as 'question' | 'share' | null;
    const category = searchParams.get('category');

    if (!query) {
      return errorResponse('검색어를 입력해주세요.', 'SEARCH_QUERY_REQUIRED');
    }

    const tokenizeSearch = (input: string) => {
      const normalized = input
        .toLowerCase()
        .replace(/[^\p{L}\p{N}]+/gu, ' ')
        .trim();
      if (!normalized) return [];
      const tokens = normalized.split(/\s+/).filter(Boolean);
      return Array.from(new Set(tokens)).slice(0, 8);
    };

    const searchTokens = tokenizeSearch(query);
    const hasSearchTokens = searchTokens.length > 0;
    const tokenToLike = (token: string) => `%${token}%`;

    const tokenConditions = hasSearchTokens
      ? searchTokens.map((token) =>
          sql`(${posts.title} ILIKE ${tokenToLike(token)} OR ${posts.content} ILIKE ${tokenToLike(token)})`
        )
      : [];

    const overlapScore = hasSearchTokens
      ? searchTokens.reduce<SQL<number>>((acc, token) => {
        const hit = sql<number>`CASE WHEN (${posts.title} ILIKE ${tokenToLike(token)} OR ${posts.content} ILIKE ${tokenToLike(token)}) THEN 1 ELSE 0 END`;
        return sql<number>`(${acc}) + ${hit}`;
      }, sql<number>`0`)
      : sql<number>`0`;

    const fallbackSearchClause = sql`(${posts.title} ILIKE ${tokenToLike(query)} OR ${posts.content} ILIKE ${tokenToLike(query)})`;
    const searchClause =
      tokenConditions.length > 0
        ? tokenConditions
            .slice(1)
            .reduce((acc, condition) => sql`(${acc} OR ${condition})`, tokenConditions[0])
        : fallbackSearchClause;

    const conditions: SQL[] = [searchClause];

    if (type) {
      conditions.push(eq(posts.type, type));
    }

    if (category && category !== 'all') {
      conditions.push(eq(posts.category, category));
    }

    const whereClause = conditions.length > 1 ? (and(...conditions) as SQL) : conditions[0];

    const [countResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(posts)
      .where(whereClause);
    const totalMatches = countResult?.count || 0;

    let postsResult = await db
      .select({
        id: posts.id,
        title: posts.title,
      })
      .from(posts)
      .where(whereClause)
      .orderBy(desc(overlapScore), desc(posts.createdAt), desc(posts.id))
      .limit(limit)
      .offset((page - 1) * limit);

    let responseTotal = totalMatches;
    let fallbackApplied = false;
    const meta: Record<string, unknown> = {
      query,
      tokens: searchTokens,
      totalMatches,
    };

    if (totalMatches === 0 && hasSearchTokens) {
      const fallbackFilters: SQL[] = [];
      if (type) fallbackFilters.push(eq(posts.type, type) as SQL);
      if (category && category !== 'all') fallbackFilters.push(eq(posts.category, category) as SQL);

      const fallbackWhereClause =
        fallbackFilters.length > 1
          ? (and(...fallbackFilters) as SQL)
          : fallbackFilters[0];

      const fallbackCountQuery = fallbackWhereClause
        ? db
            .select({ count: sql<number>`count(*)::int` })
            .from(posts)
            .where(fallbackWhereClause)
        : db.select({ count: sql<number>`count(*)::int` }).from(posts);
      const [fallbackCountResult] = await fallbackCountQuery;
      const fallbackTotalCount = fallbackCountResult?.count || 0;

      if (fallbackTotalCount > 0) {
        const fallbackPosts = await db
          .select({
            id: posts.id,
            title: posts.title,
          })
          .from(posts)
          .where(fallbackWhereClause)
          .orderBy(desc(posts.views), desc(posts.likes), desc(posts.createdAt), desc(posts.id))
          .limit(limit)
          .offset((page - 1) * limit);

        if (fallbackPosts.length > 0) {
          postsResult = fallbackPosts;
          responseTotal = fallbackTotalCount;
          fallbackApplied = true;
          meta.fallbackFilters = {
            type: type || null,
            category: category && category !== 'all' ? category : null,
          };
        }
      }
    }

    meta.isFallback = fallbackApplied;
    if (fallbackApplied) {
      meta.reason = 'popular';
    }

    const response = paginatedResponse(postsResult, page, limit, responseTotal, meta);
    response.headers.set('Cache-Control', 'no-store');
    return response;
  } catch (error) {
    console.error('GET /api/search/posts error:', error);
    return serverErrorResponse();
  }
}
