import type { Metadata } from 'next';
import MainLayout from '@/components/templates/MainLayout';
import { getDictionary } from '@/i18n/get-dictionary';
import { type Locale } from '@/i18n/config';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { buildKeywords, flattenKeywords } from '@/lib/seo/keywords';

type PageProps = {
  params: Promise<{ lang: Locale }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lang } = await params;
  const dict = await getDictionary(lang);
  const meta = dict.metadata as Record<string, any>;
  const title = meta.about?.title || meta.home?.siteName || 'viet kconnect';
  const description = meta.about?.description || meta.home?.description || '';
  const keywords = flattenKeywords(buildKeywords({ title, content: description }));

  return buildPageMetadata({
    locale: lang,
    path: '/about',
    title,
    description,
    siteName: (meta?.home as Record<string, string>)?.siteName,
    keywords,
  });
}

export default async function AboutPage({ params }: PageProps) {
  const { lang } = await params;
  const dict = await getDictionary(lang);
  const t = ((dict as any)?.staticPages?.about || {}) as Record<string, string>;

  return (
    <MainLayout hideSidebar hideSearch translations={dict}>
      <div className="mx-auto max-w-3xl py-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t.heading}
        </h1>
        <p className="mt-4 text-base text-gray-700 dark:text-gray-200 leading-relaxed">
          {t.body}
        </p>
      </div>
    </MainLayout>
  );
}
