import { Metadata } from 'next';
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import { getDictionary } from '@/i18n/get-dictionary';
import { i18n, type Locale } from '@/i18n/config';
import { fetchPosts } from '@/repo/posts/fetch';
import { fetchCategories } from '@/repo/categories/fetch';
import { queryKeys } from '@/repo/keys';
import SearchClient from './SearchClient';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{
    lang: Locale;
  }>;
  searchParams: Promise<{
    q?: string;
    c?: string;
    sc?: string;
    page?: string;
  }>;
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { lang } = await params;
  const { q: query } = await searchParams;
  const dict = await getDictionary(lang);
  const t = (dict?.metadata?.search || {}) as Record<string, string>;

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://vietkconnect.com';
  const currentUrl = query 
    ? `${baseUrl}/${lang}/search?q=${encodeURIComponent(query)}`
    : `${baseUrl}/${lang}/search`;

  const title = query
    ? t.titleWithQuery?.replace('{query}', query) || `${query} 검색 결과 - viet kconnect`
    : t.titleDefault || '검색 - viet kconnect';
  
  const description = query
    ? t.descriptionWithQuery?.replace('{query}', query) || `"${query}"에 대한 검색 결과를 확인하세요.`
    : t.descriptionDefault || '베트남 한인 커뮤니티에서 궁금한 내용을 검색해보세요.';

  const alternateLanguages: Record<string, string> = {};
  i18n.locales.forEach((locale) => {
    alternateLanguages[locale] = query
      ? `${baseUrl}/${locale}/search?q=${encodeURIComponent(query)}`
      : `${baseUrl}/${locale}/search`;
  });

  return {
    title,
    description,
    robots: {
      index: query ? false : true,
      follow: true,
      googleBot: {
        index: query ? false : true,
        follow: true,
        'max-snippet': -1,
      },
    },
    alternates: {
      canonical: currentUrl,
      languages: alternateLanguages,
    },
    openGraph: {
      type: 'website',
      title,
      description,
      url: currentUrl,
      siteName: t.siteName || 'viet kconnect',
      locale: lang,
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
  };
}

export default async function SearchPage({ params, searchParams }: PageProps) {
  const { lang } = await params;
  const { q: query, c: parentCategory, sc: childCategory, page } = await searchParams;
  const dict = await getDictionary(lang);
  const currentPage = parseInt(page || '1');

  const queryClient = new QueryClient();

  const filters = {
    search: query || undefined,
    parentCategory: parentCategory !== 'all' ? parentCategory : undefined,
    category: childCategory || undefined,
    page: currentPage,
    limit: 20,
  };

  await Promise.all([
    query
      ? queryClient.prefetchQuery({
          queryKey: queryKeys.posts.list(filters),
          queryFn: () => fetchPosts(filters),
        })
      : Promise.resolve(),
    queryClient.prefetchQuery({
      queryKey: queryKeys.categories.all,
      queryFn: fetchCategories,
    }),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <SearchClient 
        translations={dict} 
        lang={lang}
        initialQuery={query || ''}
        initialParentCategory={parentCategory || 'all'}
        initialChildCategory={childCategory || ''}
        initialPage={currentPage}
      />
    </HydrationBoundary>
  );
}
