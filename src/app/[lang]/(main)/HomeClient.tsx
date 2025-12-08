'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import MainLayout from '@/components/templates/MainLayout';
import NewsSection from '@/components/organisms/NewsSection';
import { useMyProfile } from '@/repo/users/query';
import { useMySubscriptions } from '@/repo/categories/query';

interface HomeClientProps {
  dict: any;
  lang: string;
}

export default function HomeClient({ dict, lang }: HomeClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const isLoggedIn = status === 'authenticated';
  const { data: me } = useMyProfile({ enabled: isLoggedIn });
  const { data: mySubs } = useMySubscriptions(isLoggedIn);

  const initialCategory = searchParams?.get('c') || 'popular';
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);

  useEffect(() => {
    if (isLoggedIn && me && me.onboardingCompleted === false) {
      router.push(`/${lang}/onboarding`);
    }
  }, [isLoggedIn, me, router, lang]);

  useEffect(() => {
    if (
      (selectedCategory === 'popular' || selectedCategory === 'all') &&
      isLoggedIn &&
      me &&
      Array.isArray(me.interests) &&
      me.interests.length > 0
    ) {
      const subs = mySubs?.map((s) => s.id) || [];
      const targets = me.interests.filter((id) => subs.includes(id));
      const prefer = targets[0] || me.interests[0];
      if (prefer) {
        setSelectedCategory(prefer);
      }
    }
  }, [isLoggedIn, me, mySubs, selectedCategory]);

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
  };

  return (
    <MainLayout
      selectedCategory={selectedCategory}
      onCategoryChange={handleCategoryChange}
      translations={dict}
    >
      <div className="flex flex-col gap-3 pt-3 pb-6">
        <div className="px-4 md:px-6 space-y-3">
          <NewsSection translations={dict} lang={lang} />
        </div>
      </div>

    </MainLayout>
  );
}
