
import { db } from '@/lib/db';
import { news } from '@/lib/db/schema';
import { desc, eq, asc } from 'drizzle-orm';
import { successResponse, serverErrorResponse } from '@/lib/api/response';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const lang = searchParams.get('lang') || 'vi';

    const newsItems = await db
      .select()
      .from(news)
      .where(eq(news.isActive, true))
      .orderBy(asc(news.order), desc(news.createdAt));

    // 언어 우선순위: 현재 언어 → vi → 나머지
    const preferred = newsItems.filter((item) => item.language === lang);
    const fallbackVi = newsItems.filter((item) => item.language === 'vi' && item.language !== lang);
    const others = newsItems.filter(
      (item) => item.language !== lang && item.language !== 'vi'
    );

    const merged = [...preferred, ...fallbackVi, ...others];

    return successResponse(merged);
  } catch (error) {
    console.error('Failed to fetch news:', error);
    return serverErrorResponse('Failed to fetch news');
  }
}
