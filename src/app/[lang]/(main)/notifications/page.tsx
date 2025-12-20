import { Metadata } from 'next';
import { Suspense } from 'react';
import { getDictionary } from '@/i18n/get-dictionary';
import type { Locale } from '@/i18n/config';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { buildKeywords, flattenKeywords } from '@/lib/seo/keywords';
import NotificationsClient from './NotificationsClient';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{
    lang: Locale;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lang } = await params;
  const dict = await getDictionary(lang);
  const t = (dict?.metadata?.notifications || {}) as Record<string, string>;
  const fallback = (() => {
    if (lang === 'en') {
      return {
        title: 'Notifications - viet kconnect',
        description: 'Check your latest notifications.',
      };
    }
    if (lang === 'vi') {
      return {
        title: 'Thông báo - viet kconnect',
        description: 'Xem các thông báo mới nhất của bạn.',
      };
    }
    return {
      title: '알림 - viet kconnect',
      description: '새로운 알림을 확인하세요.',
    };
  })();

  const meta = (dict?.metadata as Record<string, unknown>) || {};
  const title = t.title || fallback.title;
  const description = t.description || fallback.description;
  const keywords = flattenKeywords(buildKeywords({ title, content: description }));

  return buildPageMetadata({
    locale: lang,
    path: '/notifications',
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

export default async function NotificationsPage({ params }: PageProps) {
  const { lang } = await params;
  const translations = await getDictionary(lang);

  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 dark:bg-gray-900" />}>
      <NotificationsClient locale={lang} translations={translations} />
    </Suspense>
  );
}
