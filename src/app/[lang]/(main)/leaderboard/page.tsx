import { Metadata } from 'next';
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import { getDictionary } from '@/i18n/get-dictionary';
import type { Locale } from '@/i18n/config';
import MainLayout from '@/components/templates/MainLayout';
import { queryKeys } from '@/repo/keys';
import { fetchUserLeaderboard } from '@/repo/users/fetch';
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

  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    'https://vietkconnect.com';

  const buildUrl = (locale: string) => {
    const url = new URL(`${baseUrl}/${locale}/leaderboard`);
    if (currentPage > 1) {
      url.searchParams.set('page', String(currentPage));
    }
    if (currentLimit !== defaultLimit) {
      url.searchParams.set('limit', String(currentLimit));
    }
    return url.toString();
  };

  const currentUrl = buildUrl(lang);

  return {
    title,
    description,
    alternates: {
      canonical: currentUrl,
      languages: {
        ko: buildUrl('ko'),
        en: buildUrl('en'),
        vi: buildUrl('vi'),
      },
    },
    openGraph: {
      type: 'website',
      title,
      description,
      url: currentUrl,
      siteName: (meta?.home as Record<string, string>)?.siteName || 'viet kconnect',
      locale: lang,
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-snippet': -1,
      },
    },
  };
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

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <MainLayout hideSidebar translations={dict}>
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
