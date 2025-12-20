import { Metadata } from 'next';
import { getDictionary } from '@/i18n/get-dictionary';
import type { Locale } from '@/i18n/config';
import MainLayout from '@/components/templates/MainLayout';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { buildKeywords, flattenKeywords } from '@/lib/seo/keywords';
import SubscriptionsClient from './SubscriptionsClient';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{
    lang: Locale;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lang } = await params;
  const dict = await getDictionary(lang);
  const t = (dict?.subscription || {}) as Record<string, string>;

  const title = t.title || 'Subscription settings';
  const description = t.description || 'Manage the categories and topics you follow.';
  const meta = (dict?.metadata as Record<string, unknown>) || {};
  const keywords = flattenKeywords(buildKeywords({ title, content: description }));

  return buildPageMetadata({
    locale: lang,
    path: '/subscriptions',
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

export default async function SubscriptionsPage({ params }: PageProps) {
  const { lang } = await params;
  const dict = await getDictionary(lang);

  return (
    <MainLayout hideSidebar translations={dict}>
      <SubscriptionsClient lang={lang} translations={dict} />
    </MainLayout>
  );
}
