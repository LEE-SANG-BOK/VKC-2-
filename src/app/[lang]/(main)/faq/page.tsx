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
  const title = meta.faq?.title || meta.home?.siteName || 'viet kconnect';
  const description = meta.faq?.description || meta.home?.description || '';
  const keywords = flattenKeywords(buildKeywords({ title, content: description }));

  return buildPageMetadata({
    locale: lang,
    path: '/faq',
    title,
    description,
    siteName: (meta?.home as Record<string, string>)?.siteName,
    keywords,
  });
}

export default async function FaqPage({ params }: PageProps) {
  const { lang } = await params;
  const dict = await getDictionary(lang);
  const t = ((dict as any)?.staticPages?.faq || {}) as Record<string, string>;

  const items = [
    {
      question: t.q1,
      answer: t.a1,
    },
    {
      question: t.q2,
      answer: t.a2,
    },
    {
      question: t.q3,
      answer: t.a3,
    },
  ];

  return (
    <MainLayout hideSidebar hideSearch translations={dict}>
      <div className="mx-auto max-w-3xl py-8 space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t.heading}</h1>
          <p className="text-sm text-gray-600 dark:text-gray-300">{t.intro}</p>
        </div>
        <div className="space-y-4">
          {items.map((item, index) => (
            <div key={`${item.question}-${index}`} className="rounded-2xl border border-gray-200/60 dark:border-gray-800/60 bg-white dark:bg-gray-900 p-5 space-y-2">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">{item.question}</h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">{item.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}
