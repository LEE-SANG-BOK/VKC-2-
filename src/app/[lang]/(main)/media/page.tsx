import ShortFormPlaylist from '@/components/organisms/ShortFormPlaylist';
import RelatedMediaSlider from '@/components/organisms/RelatedMediaSlider';
import CardNewsShowcase from '@/components/organisms/CardNewsShowcase';
import MainLayout from '@/components/templates/MainLayout';
import { getDictionary } from '@/i18n/get-dictionary';

export const dynamic = 'force-dynamic';

type PageProps = {
  params: Promise<{ lang: string }>;
};

export default async function MediaPage({ params }: PageProps) {
  const { lang } = await params;
  const dict = await getDictionary((lang || 'ko') as 'ko' | 'en' | 'vi');

  return (
    <MainLayout selectedCategory="media" translations={dict}>
      <div className="flex flex-col gap-4 pt-2 pb-6">
        <ShortFormPlaylist />
        <RelatedMediaSlider />
        <CardNewsShowcase />
      </div>
    </MainLayout>
  );
}
