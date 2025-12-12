import { getDictionary } from '@/i18n/get-dictionary';
import type { Locale } from '@/i18n/config';
import ProfileEditClient from './ProfileEditClient';

interface PageProps {
  params: Promise<{
    lang: string;
  }>;
}

export default async function ProfileEditPage({ params }: PageProps) {
  const { lang } = await params;
  const translations = await getDictionary(lang as Locale);

  return <ProfileEditClient lang={lang} translations={translations} />;
}
