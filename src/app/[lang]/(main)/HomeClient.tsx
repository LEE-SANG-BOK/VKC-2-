'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Info } from 'lucide-react';
import MainLayout from '@/components/templates/MainLayout';
import NewsSection from '@/components/organisms/NewsSection';
import AdminPostRail from '@/components/organisms/AdminPostRail';
import PostList from '@/components/organisms/PostList';
import NoticeBanner from '@/components/organisms/NoticeBanner';
import { useMyProfile } from '@/repo/users/query';
import { useMySubscriptions } from '@/repo/categories/query';

interface HomeClientProps {
  dict: any;
  lang: string;
}

export default function HomeClient({ dict, lang }: HomeClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();
  const isLoggedIn = status === 'authenticated';
  const { data: me } = useMyProfile({ enabled: isLoggedIn });
  const { data: mySubs } = useMySubscriptions(isLoggedIn);

  const categoryParam = searchParams?.get('c') ?? null;
  const hasCategoryParam = categoryParam !== null;
  const initialCategory = categoryParam || 'popular';
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [resolvedCategory, setResolvedCategory] = useState<string>(initialCategory);
  const [showNewUserTip, setShowNewUserTip] = useState(false);

  const tipCopy = useMemo(() => {
    if (lang === 'en') {
      return {
        title: 'Quick tip for new members',
        body: 'Tap the category filters at the top to follow topics and personalize your feed.',
        action: 'Got it',
      };
    }
    if (lang === 'vi') {
      return {
        title: 'Mẹo nhanh cho người mới',
        body: 'Chạm vào bộ lọc danh mục ở trên để theo dõi chủ đề và cá nhân hóa bảng tin.',
        action: 'Đã hiểu',
      };
    }
    return {
      title: '신규 유저 빠른 팁',
      body: '상단 카테고리 버튼을 눌러 관심 주제를 구독하면 피드가 맞춤화돼요.',
      action: '확인',
    };
  }, [lang]);
  const tipStorageKey = useMemo(() => (me?.id ? `vk:home-tip:v1:${me.id}` : null), [me?.id]);

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
    if (!isLoggedIn || !tipStorageKey || me?.onboardingCompleted === false) return;
    try {
      const stored = localStorage.getItem(tipStorageKey);
      if (stored === '1') return;
      setShowNewUserTip(true);
    } catch {
      setShowNewUserTip(true);
    }
  }, [isLoggedIn, me?.onboardingCompleted, tipStorageKey]);

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

  const handleDismissTip = () => {
    if (tipStorageKey) {
      try {
        localStorage.setItem(tipStorageKey, '1');
      } catch {}
    }
    setShowNewUserTip(false);
  };

  return (
    <MainLayout
      selectedCategory={resolvedCategory}
      onCategoryChange={handleCategoryChange}
      rightRail={<AdminPostRail translations={dict} lang={lang} />}
      translations={dict}
    >
      <div className="flex flex-col gap-1 pb-4">
        <NoticeBanner translations={dict} lang={lang} />
        {showNewUserTip && (
          <div className="rounded-2xl border border-blue-200/70 bg-blue-50/70 px-4 py-3 shadow-sm dark:border-blue-900/50 dark:bg-blue-950/40">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-white">
                  <Info className="h-4 w-4" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">{tipCopy.title}</p>
                  <p className="text-xs text-blue-900/80 dark:text-blue-100/80">{tipCopy.body}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleDismissTip}
                className="rounded-full border border-blue-200 bg-white px-3 py-1 text-xs font-semibold text-blue-700 shadow-sm hover:bg-blue-100 dark:border-blue-900 dark:bg-blue-950/60 dark:text-blue-200"
                aria-label={tipCopy.action}
              >
                {tipCopy.action}
              </button>
            </div>
          </div>
        )}
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
