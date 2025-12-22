import { Metadata } from 'next';
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import { getDictionary } from '@/i18n/get-dictionary';
import { type Locale } from '@/i18n/config';
import { fetchPosts } from '@/repo/posts/fetch';
import { fetchCategories } from '@/repo/categories/fetch';
import { queryKeys } from '@/repo/keys';
import SearchClient from './SearchClient';
import { buildKeywords, flattenKeywords } from '@/lib/seo/keywords';
import { buildPageMetadata } from '@/lib/seo/metadata';

export const dynamic = 'force-dynamic';

const MIN_SEARCH_QUERY_LENGTH = 2;

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

  const encodedQuery = query ? encodeURIComponent(query) : '';
  const currentPath = encodedQuery ? `/search?q=${encodedQuery}` : '/search';

  const title = query
    ? (t.titleWithQuery || t.titleDefault || '').replace('{query}', query)
    : t.titleDefault || '';
  
  const description = query
    ? (t.descriptionWithQuery || t.descriptionDefault || '').replace('{query}', query)
    : t.descriptionDefault || '';
  const keywordResult = buildKeywords({ title: query || '' });
  const keywords = flattenKeywords(keywordResult, 8);

  return buildPageMetadata({
    locale: lang,
    path: currentPath,
    title,
    description,
    siteName: t.siteName || 'viet kconnect',
    keywords: keywords.length ? keywords : undefined,
    twitterCard: 'summary',
    robots: {
      index: query ? false : true,
      follow: true,
      googleBot: {
        index: query ? false : true,
        follow: true,
        'max-snippet': -1,
      },
    },
  });
}

export default async function SearchPage({ params, searchParams }: PageProps) {
  const { lang } = await params;
  const { q: query, c: parentCategory, sc: childCategory, page } = await searchParams;
  const dict = await getDictionary(lang);
  const currentPage = parseInt(page || '1');
  const normalizedQuery = (query || '').trim();
  const shouldPrefetchPosts = normalizedQuery.length >= MIN_SEARCH_QUERY_LENGTH;

  const queryClient = new QueryClient();

  const filters = {
    search: normalizedQuery || undefined,
    parentCategory: parentCategory !== 'all' ? parentCategory : undefined,
    category: childCategory || undefined,
    page: currentPage,
    limit: 20,
  };

  await Promise.all([
    shouldPrefetchPosts
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
        initialQuery={normalizedQuery}
        initialParentCategory={parentCategory || 'all'}
        initialChildCategory={childCategory || ''}
        initialPage={currentPage}
      />
    </HydrationBoundary>
  );
}
