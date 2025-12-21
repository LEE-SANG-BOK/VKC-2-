import { Metadata } from 'next';
import { getDictionary } from '@/i18n/get-dictionary';
import type { Locale } from '@/i18n/config';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { buildKeywords, flattenKeywords } from '@/lib/seo/keywords';
import FeedbackClient from './FeedbackClient';

interface PageProps {
  params: Promise<{
    lang: Locale;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lang } = await params;
  const dict = await getDictionary(lang);
  const meta = (dict?.metadata as Record<string, unknown>) || {};
  const t = (meta.feedback || {}) as Record<string, string>;

  const title = t.title || '';
  const description = t.description || '';
  const keywords = flattenKeywords(buildKeywords({ title, content: description }));

  return buildPageMetadata({
    locale: lang,
    path: '/feedback',
    title,
    description,
    siteName: (meta?.home as Record<string, string>)?.siteName,
    keywords,
  });
}

export default async function FeedbackPage({ params }: PageProps) {
  const { lang } = await params;
  const dict = await getDictionary(lang);

  return <FeedbackClient translations={dict} lang={lang} />;
}
