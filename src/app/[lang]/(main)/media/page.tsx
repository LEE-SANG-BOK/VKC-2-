import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import ShortFormPlaylist from '@/components/organisms/ShortFormPlaylist';
import CardNewsShowcase from '@/components/organisms/CardNewsShowcase';
import MainLayout from '@/components/templates/MainLayout';
import { getDictionary } from '@/i18n/get-dictionary';
import type { Locale } from '@/i18n/config';
import MediaClient from './MediaClient';
import { queryKeys } from '@/repo/keys';
import { fetchNews } from '@/repo/news/fetch';

export const dynamic = 'force-dynamic';

type PageProps = {
  params: Promise<{ lang: Locale }>;
};

export default async function MediaPage({ params }: PageProps) {
  const { lang } = await params;
  const dict = await getDictionary(lang);
  const tMedia = (dict.media || {}) as Record<string, string>;
  const tNews = (dict.news || {}) as Record<string, string>;
  const pageTitle = tMedia.title || '';
  const pageDescription = tMedia.description || '';
  const featuredLabel = tNews.title || '';
  const cardnewsLabel = tMedia.cardNewsTab || '';
  const shortsLabel = tMedia.shortsTab || '';

  const queryClient = new QueryClient();
  try {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.news.byLang(lang),
      queryFn: () => fetchNews(lang),
    });
  } catch {
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <MainLayout selectedCategory="media" translations={dict}>
        <div className="flex flex-col gap-4 pt-2 pb-6">
          <section className="rounded-2xl border border-gray-200/60 dark:border-gray-800/60 bg-white dark:bg-gray-900 shadow-sm p-4 md:p-5">
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">{pageTitle}</h1>
            <p className="mt-2 text-sm md:text-base text-gray-600 dark:text-gray-300">{pageDescription}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <a
                href="#featured"
                className="inline-flex items-center rounded-full border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              >
                {featuredLabel}
              </a>
              <a
                href="#cardnews"
                className="inline-flex items-center rounded-full border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              >
                {cardnewsLabel}
              </a>
              <a
                href="#shorts"
                className="inline-flex items-center rounded-full border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              >
                {shortsLabel}
              </a>
            </div>
          </section>
          <MediaClient translations={dict} lang={lang} />
          <ShortFormPlaylist translations={dict} lang={lang} />
          <CardNewsShowcase translations={dict} lang={lang} />
        </div>
      </MainLayout>
    </HydrationBoundary>
  );
}
