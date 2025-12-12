import type { Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import OnboardingClient from './OnboardingClient';

interface PageProps {
  params: Promise<{
    lang: Locale;
  }>;
}

export default async function OnboardingPage({ params }: PageProps) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);

  return <OnboardingClient lang={lang} translations={dictionary} />;
}
