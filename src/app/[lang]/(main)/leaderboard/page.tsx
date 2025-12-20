import { Metadata } from 'next';
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import { getDictionary } from '@/i18n/get-dictionary';
import type { Locale } from '@/i18n/config';
import MainLayout from '@/components/templates/MainLayout';
import { queryKeys } from '@/repo/keys';
import { fetchUserLeaderboard } from '@/repo/users/fetch';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { buildKeywords, flattenKeywords } from '@/lib/seo/keywords';
import LeaderboardClient from './LeaderboardClient';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{
    lang: Locale;
  }>;
  searchParams: Promise<{
    page?: string;
    limit?: string;
  }>;
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { lang } = await params;
  const { page, limit } = await searchParams;
  const dict = await getDictionary(lang);

  const currentPage = Math.max(1, parseInt(page || '1', 10) || 1);
  const defaultLimit = 10;
  const parsedLimit = parseInt(limit || String(defaultLimit), 10) || defaultLimit;
  const currentLimit = Math.min(20, Math.max(1, parsedLimit));

  const fallback =
    lang === 'en'
      ? {
          title: 'Community Leaderboard - viet kconnect',
          description: 'Discover the most trusted and helpful community members.',
        }
      : lang === 'vi'
        ? {
            title: 'Bảng xếp hạng cộng đồng - viet kconnect',
            description: 'Khám phá những thành viên đáng tin và hữu ích nhất trong cộng đồng.',
          }
        : {
            title: '커뮤니티 랭킹 - viet kconnect',
            description: '신뢰도와 기여도가 높은 커뮤니티 멤버를 확인하세요.',
          };

  const meta = (dict?.metadata || {}) as Record<string, unknown>;
  const t = (meta.leaderboard || {}) as Record<string, string>;
  const title = t.title || fallback.title;
  const description = t.description || fallback.description;

  const search = new URLSearchParams();
  if (currentPage > 1) {
    search.set('page', String(currentPage));
  }
  if (currentLimit !== defaultLimit) {
    search.set('limit', String(currentLimit));
  }
  const searchString = search.toString();
  const currentPath = `/leaderboard${searchString ? `?${searchString}` : ''}`;

  const keywordResult = buildKeywords({ title, content: description });
  const keywords = flattenKeywords(keywordResult);

  return buildPageMetadata({
    locale: lang,
    path: currentPath,
    title,
    description,
    siteName: (meta?.home as Record<string, string>)?.siteName || 'viet kconnect',
    keywords,
    twitterCard: 'summary',
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-snippet': -1,
      },
    },
  });
}

export default async function LeaderboardPage({ params, searchParams }: PageProps) {
  const { lang } = await params;
  const { page, limit } = await searchParams;
  const dict = await getDictionary(lang);

  const currentPage = Math.max(1, parseInt(page || '1', 10) || 1);
  const defaultLimit = 10;
  const parsedLimit = parseInt(limit || String(defaultLimit), 10) || defaultLimit;
  const currentLimit = Math.min(20, Math.max(1, parsedLimit));

  const queryClient = new QueryClient();

  try {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.users.leaderboard({ page: currentPage, limit: currentLimit }),
      queryFn: () => fetchUserLeaderboard({ page: currentPage, limit: currentLimit }),
    });
  } catch {
  }

  const eventCopy =
    lang === 'en'
      ? { title: 'Event', description: 'Coming soon' }
      : lang === 'vi'
        ? { title: 'Event', description: 'Sắp ra mắt' }
        : { title: 'Event', description: '준비중' };

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <MainLayout
        hideSidebar
        rightRail={
          <div className="sticky top-[var(--vk-header-height)] py-6">
            <section className="rounded-2xl border border-gray-200/60 dark:border-gray-800/60 bg-white dark:bg-gray-900 shadow-sm p-4">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                {eventCopy.title}
              </h2>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                {eventCopy.description}
              </p>
            </section>
          </div>
        }
        translations={dict}
      >
        <LeaderboardClient
          lang={lang}
          translations={dict}
          initialPage={currentPage}
          initialLimit={currentLimit}
        />
      </MainLayout>
    </HydrationBoundary>
  );
}
