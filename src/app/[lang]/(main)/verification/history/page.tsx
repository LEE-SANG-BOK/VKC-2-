import { getDictionary } from '@/i18n/get-dictionary';
import type { Locale } from '@/i18n/config';
import VerificationHistoryClient from './VerificationHistoryClient';

interface PageProps {
  params: Promise<{
    lang: Locale;
  }>;
}

export default async function VerificationHistoryPage({ params }: PageProps) {
  const { lang } = await params;
  const dict = await getDictionary(lang);

  return <VerificationHistoryClient translations={dict} lang={lang} />;
}
