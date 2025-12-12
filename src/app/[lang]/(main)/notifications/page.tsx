import { Metadata } from 'next';
import { Suspense } from 'react';
import { getDictionary } from '@/i18n/get-dictionary';
import type { Locale } from '@/i18n/config';
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

  return {
    title: t.title || '알림 - viet kconnect',
    description: t.description || '새로운 알림을 확인하세요.',
    robots: {
      index: false,
      follow: false,
    },
  };
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
