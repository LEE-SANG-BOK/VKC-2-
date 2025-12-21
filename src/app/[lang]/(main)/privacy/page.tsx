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
  const title = meta.privacy?.title || meta.home?.siteName || 'viet kconnect';
  const description = meta.privacy?.description || meta.home?.description || '';
  const keywords = flattenKeywords(buildKeywords({ title, content: description }));

  return buildPageMetadata({
    locale: lang,
    path: '/privacy',
    title,
    description,
    siteName: (meta?.home as Record<string, string>)?.siteName,
    keywords,
    robots: {
      index: true,
      follow: true,
    },
  });
}

export default async function PrivacyPage({ params }: PageProps) {
  const { lang } = await params;
  const dict = await getDictionary(lang);
  const t = ((dict as any)?.staticPages?.privacy || {}) as Record<string, string>;

  return (
    <MainLayout hideSidebar hideSearch translations={dict}>
      <div className="mx-auto max-w-3xl py-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t.heading}
        </h1>
        <div className="mt-4 space-y-3 text-sm text-gray-700 dark:text-gray-200 leading-relaxed">
          <p>
            {t.body1}
          </p>
          <p>
            {t.body2}
          </p>
        </div>
      </div>
    </MainLayout>
  );
}
