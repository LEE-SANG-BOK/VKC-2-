import type { ReactNode } from 'react';
import type { Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import BottomNavigation from '@/components/organisms/BottomNavigation';

type LayoutProps = {
  children: ReactNode;
  params: Promise<{ lang: string }>;
};

export default async function MainGroupLayout({ children, params }: LayoutProps) {
  const { lang } = await params;
  const translations = await getDictionary((lang || 'vi') as Locale);

  return (
    <div className="vk-safe-bottom">
      {children}
      <BottomNavigation translations={translations} />
    </div>
  );
}
