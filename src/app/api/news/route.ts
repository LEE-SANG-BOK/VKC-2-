
import { db } from '@/lib/db';
import { news } from '@/lib/db/schema';
import { desc, eq, asc, and, or, isNull, lte, gte } from 'drizzle-orm';
import { setPublicSWR, successResponse, serverErrorResponse } from '@/lib/api/response';
import { isE2ETestMode } from '@/lib/e2e/mode';

export async function GET(request: Request) {
  try {
    if (isE2ETestMode()) {
      const now = new Date('2025-01-01T00:00:00.000Z').toISOString();
      const items = [
        {
          id: 'e2e-news-1',
          title: 'E2E 추천 콘텐츠: 비자 신청 체크리스트',
          category: '비자',
          language: 'ko',
          type: 'post',
          content: '비자 신청 전에 준비해야 할 서류를 빠르게 확인해보세요.',
          imageUrl: '/brand-logo.png',
          linkUrl: null,
          isActive: true,
          order: 1,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 'e2e-news-2',
          title: 'E2E 추천 콘텐츠: 취업 서류 준비 팁',
          category: '취업',
          language: 'ko',
          type: 'post',
          content: '이력서/포트폴리오 준비에서 자주 빠지는 항목을 정리했습니다.',
          imageUrl: '/brand-logo.png',
          linkUrl: null,
          isActive: true,
          order: 2,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 'e2e-news-3',
          title: 'E2E 추천 콘텐츠: 한국 생활 필수 앱',
          category: '생활',
          language: 'ko',
          type: 'post',
          content: '정착 초기에 도움이 되는 앱/서비스를 모았습니다.',
          imageUrl: '/brand-logo.png',
          linkUrl: null,
          isActive: true,
          order: 3,
          createdAt: now,
          updatedAt: now,
        },
      ];

      const response = successResponse(items);
      setPublicSWR(response, 300, 600);
      return response;
    }

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
