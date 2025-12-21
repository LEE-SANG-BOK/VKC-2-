
import { db } from '@/lib/db';
import { news } from '@/lib/db/schema';
import { desc, eq, asc, and, or, isNull, lte, gte } from 'drizzle-orm';
import { setPublicSWR, successResponse, serverErrorResponse } from '@/lib/api/response';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const lang = searchParams.get('lang') || 'vi';

    const now = new Date();
    const newsItems = await db
      .select()
      .from(news)
      .where(
        and(
          eq(news.isActive, true),
          or(isNull(news.startAt), lte(news.startAt, now)),
          or(isNull(news.endAt), gte(news.endAt, now))
        )
      )
      .orderBy(asc(news.order), desc(news.createdAt));

    // 언어 우선순위: 현재 언어 → vi → 나머지
    const preferred = newsItems.filter((item) => item.language === lang);
    const fallbackVi = newsItems.filter((item) => item.language === 'vi' && item.language !== lang);
    const others = newsItems.filter(
      (item) => item.language !== lang && item.language !== 'vi'
    );

    const merged = [...preferred, ...fallbackVi, ...others];

    const response = successResponse(merged);
    setPublicSWR(response, 300, 600);
    return response;
  } catch (error) {
    console.error('Failed to fetch news:', error);
    return serverErrorResponse('Failed to fetch news');
  }
}
