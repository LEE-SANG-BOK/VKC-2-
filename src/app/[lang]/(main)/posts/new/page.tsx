import { Metadata } from 'next';
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import { getDictionary } from '@/i18n/get-dictionary';
import type { Locale } from '@/i18n/config';
import { fetchCategories } from '@/repo/categories/fetch';
import { queryKeys } from '@/repo/keys';
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

  return {
    title: t.title || '새 게시글 작성 - viet kconnect',
    description: t.description || '베트남 한인 커뮤니티에 새로운 게시글을 작성하세요.',
    robots: {
      index: false,
      follow: false,
    },
  };
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
