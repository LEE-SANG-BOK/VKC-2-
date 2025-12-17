import { Suspense } from 'react';
import { getDictionary } from '@/i18n/get-dictionary';
import VerificationRequestClient from './VerificationRequestClient';

type PageProps = {
  params: Promise<{ lang: string }>;
};

export default async function VerificationRequestPage({ params }: PageProps) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang as 'ko' | 'en' | 'vi');

  return (
    <Suspense fallback={<div className="min-h-[300px]" />}>
      <VerificationRequestClient translations={dictionary} lang={lang} />
    </Suspense>
  );
}
