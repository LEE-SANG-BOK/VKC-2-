import { Metadata } from 'next';
import { Suspense } from 'react';
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import { getDictionary } from '@/i18n/get-dictionary';
import type { Locale } from '@/i18n/config';
import HomeClient from './HomeClient';
import OnboardingClient from './onboarding/OnboardingClient';
import { fetchPosts } from '@/repo/posts/fetch';
import { fetchCategories } from '@/repo/categories/fetch';
import { queryKeys } from '@/repo/keys';
import { fetchNews } from '@/repo/news/fetch';
import { CATEGORY_GROUPS } from '@/lib/constants/categories';
import { SITE_URL } from '@/lib/siteUrl';

export const revalidate = 60;
const categoryParents = Object.keys(CATEGORY_GROUPS);
const categoryChildren = new Set(
  Object.values(CATEGORY_GROUPS).flatMap((group) => group.slugs as readonly string[])
);

interface PageProps {
  params: Promise<{
    lang: Locale;
  }>;
  searchParams: Promise<{
    c?: string;
    sc?: string;
    page?: string;
  }>;
}

// 메타데이터 생성
export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { lang } = await params;
  const { c: category, sc, page } = await searchParams;

  const dict = await getDictionary(lang);
  const metadata = dict.metadata;
  const sidebar = dict.sidebar;
  const categoryFallbacks = {
    ko: {
      title: '{category} - viet kconnect',
      description: '{category} 카테고리의 질문과 답변을 확인하세요.',
    },
    en: {
      title: '{category} - viet kconnect',
      description: 'Explore questions and answers in {category}.',
    },
    vi: {
      title: '{category} - viet kconnect',
      description: 'Khám phá câu hỏi và câu trả lời trong {category}.',
    },
  };
  const categoryFallback = categoryFallbacks[lang] ?? categoryFallbacks.ko;

  const baseUrl = SITE_URL;
  const currentPage = Math.max(1, parseInt(page || '1') || 1);

  const buildUrl = (locale: string) => {
    const url = new URL(`${baseUrl}/${locale}`);
    if (category && category !== 'all') {
      url.searchParams.set('c', category);
    }
    if (category === 'subscribed' && sc && sc !== 'all') {
      const isValidSubscribed = categoryParents.includes(sc) || categoryChildren.has(sc);
      if (isValidSubscribed) {
        url.searchParams.set('sc', sc);
      }
    }
    if (currentPage > 1) {
      url.searchParams.set('page', String(currentPage));
    }
    return url.toString();
  };

  const currentUrl = buildUrl(lang);

  let title = metadata.home.title;
  let description = metadata.home.description;

  // 카테고리별 메타데이터
  if (category && category !== 'all') {
    const categoryName = sidebar[category as keyof typeof sidebar] || category;
    title = (metadata.category?.title || categoryFallback.title).replace('{category}', categoryName);
    description = (metadata.category?.description || categoryFallback.description)
      .replace('{category}', categoryName);
  }

  return {
    title,
    description,

    // Canonical URL
    alternates: {
      canonical: currentUrl,
      languages: {
        ko: buildUrl('ko'),
        en: buildUrl('en'),
        vi: buildUrl('vi'),
      },
    },

    // Open Graph
    openGraph: {
      type: 'website',
      title,
      description,
      url: currentUrl,
      siteName: metadata.home.siteName,
      locale: lang,
    },

    // Twitter Card
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },

    // Robots
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },

    // Additional metadata
    keywords: [
      metadata.keywords.vietnam,
      metadata.keywords.korean,
      metadata.keywords.community,
      metadata.keywords.qa,
      metadata.keywords.question,
      metadata.keywords.answer,
      category || ''
    ].filter(Boolean),
  };
}

// 홈 페이지 서버 컴포넌트 - SSR with Hydration
export default async function Home({ params, searchParams }: PageProps) {
  const { lang } = await params;
  const { c: category, sc, page } = await searchParams;
  const currentPage = Math.max(1, parseInt(page || '1') || 1);

  // 번역 로드
  const dict = await getDictionary(lang);

  // 서버에서 QueryClient 생성
  const queryClient = new QueryClient();

  // URL 카테고리에 따른 필터 결정
  const urlCategory = category || 'popular';
  const isMenuCategory = ['popular', 'latest', 'following', 'subscribed', 'my-posts'].includes(urlCategory);
  const subscribedKey = sc && sc !== 'all' && (categoryParents.includes(sc) || categoryChildren.has(sc)) ? sc : null;
  const subscribedParent = subscribedKey && categoryParents.includes(subscribedKey) ? subscribedKey : undefined;
  const subscribedCategory = subscribedKey && categoryChildren.has(subscribedKey) ? subscribedKey : undefined;

  const getFilter = () => {
    if (urlCategory === 'following') return 'following-users';
    if (urlCategory === 'subscribed') return subscribedKey ? undefined : 'following';
    if (urlCategory === 'my-posts') return 'my-posts';
    return undefined;
  };

  const filters = {
    parentCategory: urlCategory === 'subscribed' ? subscribedParent : isMenuCategory ? undefined : urlCategory,
    category: urlCategory === 'subscribed' ? subscribedCategory : undefined,
    sort: (urlCategory === 'popular' || urlCategory === 'subscribed' ? 'popular' : 'latest') as 'popular' | 'latest',
    filter: getFilter() as 'following-users' | 'following' | 'my-posts' | undefined,
  };

  try {
    // 게시글 목록 prefetch (무한스크롤용)
    await queryClient.prefetchInfiniteQuery({
      queryKey: queryKeys.posts.infinite(filters, currentPage),
      queryFn: ({ pageParam = { page: currentPage } }) =>
        fetchPosts({
          ...filters,
          page: (pageParam as { page: number; cursor?: string | null }).page,
          cursor: (pageParam as { page: number; cursor?: string | null }).cursor || undefined,
          limit: 20,
        }),
      initialPageParam: { page: currentPage },
    });

    // 뉴스 prefetch
    await queryClient.prefetchQuery({
      queryKey: queryKeys.news.byLang(lang),
      queryFn: () => fetchNews(lang),
    });

    // 카테고리 prefetch
    await queryClient.prefetchQuery({
      queryKey: queryKeys.categories.all,
      queryFn: fetchCategories,
    });
  } catch (error) {
    console.error('Failed to prefetch data:', error);
  }

  // 온보딩 페이지는 별도 라우트에서 제공 예정; 기본 홈은 피드 렌더링
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<div className="min-h-screen bg-gray-50 dark:bg-gray-900" />}>
        <HomeClient dict={dict} lang={lang} />
      </Suspense>
    </HydrationBoundary>
  );
}
