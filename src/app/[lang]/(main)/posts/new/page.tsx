import { Metadata } from 'next';
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import { getDictionary } from '@/i18n/get-dictionary';
import type { Locale } from '@/i18n/config';
import { fetchCategories } from '@/repo/categories/fetch';
import { queryKeys } from '@/repo/keys';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { buildKeywords, flattenKeywords } from '@/lib/seo/keywords';
import NewPostClient from './NewPostClient';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{
    lang: Locale;
  }>;
  searchParams: Promise<{
    type?: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lang } = await params;
  const dict = await getDictionary(lang);
  const t = (dict?.metadata?.newPost || {}) as Record<string, string>;

  const meta = (dict?.metadata as Record<string, unknown>) || {};
  const title = t.title || '';
  const description = t.description || '';
  const keywords = flattenKeywords(buildKeywords({ title, content: description }));

  return buildPageMetadata({
    locale: lang,
    path: '/posts/new',
    title,
    description,
    siteName: (meta?.home as Record<string, string>)?.siteName,
    keywords,
    robots: {
      index: false,
      follow: false,
    },
  });
}

export default async function NewPostPage({ params }: PageProps) {
  const { lang } = await params;
  const dict = await getDictionary(lang);

  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: queryKeys.categories.all,
    queryFn: fetchCategories,
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <NewPostClient translations={dict} lang={lang} />
    </HydrationBoundary>
  );
}
