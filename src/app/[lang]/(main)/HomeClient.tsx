'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import MainLayout from '@/components/templates/MainLayout';
import AdminPostRail from '@/components/organisms/AdminPostRail';
import NewsSection from '@/components/organisms/NewsSection';
import PostList from '@/components/organisms/PostList';
import type { Locale } from '@/i18n/config';
import { useMyProfile } from '@/repo/users/query';
import { useMySubscriptions } from '@/repo/categories/query';
import Link from 'next/link';

interface HomeClientProps {
  dict: any;
  lang: Locale;
}

export default function HomeClient({ dict, lang }: HomeClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();
  const isLoggedIn = status === 'authenticated';
  const { data: me } = useMyProfile({ enabled: isLoggedIn });
  const { data: mySubs } = useMySubscriptions(isLoggedIn);
  const tNews = (dict?.news || {}) as Record<string, string>;
  const featuredTitle = tNews.title || '';
  const featuredMoreLabel = tNews.moreLabel || '';
  const appName = dict?.common?.appName || 'VietHub';
  const appDescription = dict?.common?.appDescription || '';
  const homeHeading = appDescription ? `${appName} - ${appDescription}` : appName;

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
      <div className="flex flex-col gap-1 pb-4">
        <h1 className="sr-only">{homeHeading}</h1>
        <div className="lg:hidden">
          <div className="rounded-2xl border border-gray-200/60 dark:border-gray-800/60 bg-white dark:bg-gray-900 shadow-sm px-3 py-3 sm:px-4 sm:py-4 mb-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">{featuredTitle}</h2>
              {featuredMoreLabel ? (
                <Link
                  href={`/${lang}/media#featured`}
                  className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline shrink-0"
                >
                  {featuredMoreLabel}
                </Link>
              ) : null}
            </div>
            <div className="mt-2">
              <NewsSection translations={dict as any} lang={lang} />
            </div>
          </div>
        </div>
        <PostList selectedCategory={resolvedCategory} translations={dict} />
      </div>

    </MainLayout>
  );
}
