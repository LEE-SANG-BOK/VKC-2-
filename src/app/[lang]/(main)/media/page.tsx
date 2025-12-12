import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import ShortFormPlaylist from '@/components/organisms/ShortFormPlaylist';
import RelatedMediaSlider from '@/components/organisms/RelatedMediaSlider';
import CardNewsShowcase from '@/components/organisms/CardNewsShowcase';
import MainLayout from '@/components/templates/MainLayout';
import { getDictionary } from '@/i18n/get-dictionary';
import MediaClient from './MediaClient';
import { queryKeys } from '@/repo/keys';
import { fetchNews } from '@/repo/news/fetch';

export const dynamic = 'force-dynamic';

type PageProps = {
  params: Promise<{ lang: string }>;
};

export default async function MediaPage({ params }: PageProps) {
  const { lang } = await params;
  const dict = await getDictionary((lang || 'vi') as 'ko' | 'en' | 'vi');

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
          <MediaClient translations={dict} lang={lang || 'vi'} />
          <ShortFormPlaylist />
          <RelatedMediaSlider />
          <CardNewsShowcase />
        </div>
      </MainLayout>
    </HydrationBoundary>
  );
}
