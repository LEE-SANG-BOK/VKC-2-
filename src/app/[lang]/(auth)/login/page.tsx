import type { Metadata } from 'next';
import type { Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { buildPageMetadata } from '@/lib/seo/metadata';
import LoginClient from './LoginClient';

interface PageProps {
  params: Promise<{
    lang: Locale;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lang } = await params;
  const dict = await getDictionary(lang);

  const t = (dict?.login || {}) as Record<string, string>;
  const meta = (dict?.metadata as Record<string, unknown>) || {};
  const siteName = (meta?.home as Record<string, string> | undefined)?.siteName;

  const title = `${t.title || 'Login'} - ${siteName || 'viet kconnect'}`;
  const description = t.welcome || '';

  return buildPageMetadata({
    locale: lang,
    path: '/login',
    title,
    description,
    siteName,
    robots: {
      index: false,
      follow: false,
      googleBot: {
        index: false,
        follow: false,
      },
    },
  });
}

export default async function LoginPage({ params }: PageProps) {
  const { lang } = await params;
  const dict = await getDictionary(lang);

  return <LoginClient lang={lang} translations={dict} />;
}
