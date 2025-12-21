import type { Metadata } from 'next';
import type { Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { buildPageMetadata } from '@/lib/seo/metadata';
import SignupClient from './SignupClient';

interface PageProps {
  params: Promise<{
    lang: Locale;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lang } = await params;
  const dict = await getDictionary(lang);

  const t = (dict?.signup || {}) as Record<string, string>;
  const meta = (dict?.metadata as Record<string, unknown>) || {};
  const siteName = (meta?.home as Record<string, string> | undefined)?.siteName;

  const title = `${t.title || 'Signup'} - ${siteName || 'viet kconnect'}`;
  const description = t.welcome || '';

  return buildPageMetadata({
    locale: lang,
    path: '/signup',
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

export default async function SignupPage({ params }: PageProps) {
  const { lang } = await params;
  const dict = await getDictionary(lang);

  return <SignupClient lang={lang} translations={dict} />;
}

