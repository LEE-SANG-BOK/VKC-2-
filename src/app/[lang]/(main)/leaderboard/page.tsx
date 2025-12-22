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

  const meta = (dict?.metadata || {}) as Record<string, unknown>;
  const t = (meta.leaderboard || {}) as Record<string, string>;
  const title = t.title || (meta?.home as Record<string, string>)?.title || '';
  const description = t.description || (meta?.home as Record<string, string>)?.description || '';

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
    siteName: (meta?.home as Record<string, string>)?.siteName,
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

  const tLeaderboard = (dict?.leaderboard || {}) as Record<string, string>;
  const eventCopy = {
    title: tLeaderboard.eventTitle || '',
    description: tLeaderboard.eventDescription || '',
  };

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <MainLayout
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
