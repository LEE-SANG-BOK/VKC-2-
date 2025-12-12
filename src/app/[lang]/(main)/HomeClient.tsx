'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import MainLayout from '@/components/templates/MainLayout';
import NewsSection from '@/components/organisms/NewsSection';
import AdminPostRail from '@/components/organisms/AdminPostRail';
import PostList from '@/components/organisms/PostList';
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

  const categoryParam = searchParams?.get('c') ?? null;
  const hasCategoryParam = categoryParam !== null;
  const initialCategory = categoryParam || 'popular';
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [resolvedCategory, setResolvedCategory] = useState<string>(initialCategory);

  useEffect(() => {
    if (isLoggedIn && me && me.onboardingCompleted === false) {
      router.push(`/${lang}/onboarding`);
    }
  }, [isLoggedIn, me, router, lang]);

  useEffect(() => {
    setSelectedCategory(initialCategory);
    setResolvedCategory(initialCategory);
  }, [initialCategory]);

  useEffect(() => {
    if (
      (selectedCategory === 'popular' || selectedCategory === 'all') &&
      !hasCategoryParam &&
      isLoggedIn &&
      me &&
      Array.isArray(me.interests) &&
      me.interests.length > 0
    ) {
      const subsById = new Map((mySubs || []).map((s) => [s.id, s.slug]));
      const targets = me.interests.filter((id) => subsById.has(id));
      const preferId = targets[0] || me.interests[0];
      const preferSlug = preferId ? subsById.get(preferId) : undefined;
      if (preferSlug) {
        setSelectedCategory(preferSlug);
        setResolvedCategory(preferSlug);
      }
    } else {
      setResolvedCategory(selectedCategory);
    }
  }, [hasCategoryParam, isLoggedIn, me, mySubs, selectedCategory]);

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setResolvedCategory(category);
    router.push(`/${lang}?c=${encodeURIComponent(category)}`);
  };

  return (
    <MainLayout
      selectedCategory={resolvedCategory}
      onCategoryChange={handleCategoryChange}
      rightRail={<AdminPostRail translations={dict} lang={lang} />}
      translations={dict}
    >
      <div className="flex flex-col gap-1 pt-1 pb-4 px-1 sm:px-0">
        <div className="space-y-1">
          <div className="lg:hidden">
            <NewsSection translations={dict} lang={lang} />
          </div>
        </div>
        <PostList selectedCategory={resolvedCategory} translations={dict} />
      </div>

    </MainLayout>
  );
}
