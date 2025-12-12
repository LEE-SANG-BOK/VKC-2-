'use client';

import { useMemo } from 'react';
import { Check, Bell, BellOff, Sparkles } from 'lucide-react';
import { useCategories, useMySubscriptions } from '@/repo/categories/query';
import { useToggleSubscription } from '@/repo/categories/mutation';
import { useSession } from 'next-auth/react';
import { useParams } from 'next/navigation';
import { CATEGORY_GROUPS, LEGACY_CATEGORIES, getCategoryName } from '@/lib/constants/categories';

interface CategorySubscriptionProps {
  onClose?: () => void;
  translations: Record<string, unknown>;
  onToggle?: (categoryId: string, nextState: boolean) => void;
}

export default function CategorySubscription({ translations, onToggle }: CategorySubscriptionProps) {
  const t = (translations?.subscription || {}) as Record<string, string>;
  const params = useParams();
  const locale = (params?.lang as string) || 'ko';
  const { data: session } = useSession();
  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const { data: subscriptions, isLoading: subscriptionsLoading } = useMySubscriptions(!!session?.user);
  const toggleSubscription = useToggleSubscription();

  const isLoading = categoriesLoading || subscriptionsLoading;
  const subscribedIds = new Set(subscriptions?.map(s => s.id) || []);

  const allowedSlugs = useMemo(() => {
    const parents = Object.keys(CATEGORY_GROUPS);
    const children = Object.values(CATEGORY_GROUPS).flatMap((g) => g.slugs as readonly string[]);
    return new Set([...parents, ...children]);
  }, []);

  const filteredCategories = useMemo(() => {
    return (categories || []).filter((cat: any) => allowedSlugs.has(cat.slug));
  }, [categories, allowedSlugs]);

  const handleToggle = (categoryId: string) => {
    if (!session?.user) return;
    const nextState = !subscribedIds.has(categoryId);
    toggleSubscription.mutate(categoryId, {
      onSuccess: () => {
        onToggle?.(categoryId, nextState);
      },
    });
  };

  const mapCategoryName = (category: any) => {
    const legacy = LEGACY_CATEGORIES.find((c) => c.id === category.id || c.slug === category.slug);
    if (legacy) {
      return getCategoryName(legacy, locale);
    }
    // API에서 name_vi/name_en 지원 시 사용
    if (locale === 'vi' && category.name_vi) return category.name_vi;
    if (locale === 'en' && category.name_en) return category.name_en;
    return category.name;
  };

  const fallbackTitle = locale === 'vi' ? 'Đăng ký danh mục' : locale === 'en' ? 'Follow categories' : '카테고리 구독';
  const fallbackDesc =
    locale === 'vi'
      ? 'Chọn danh mục bạn muốn theo dõi để nhận bài viết liên quan.'
      : locale === 'en'
        ? 'Select categories to see only related posts.'
        : '관심있는 카테고리를 선택하세요';
  const subscribedCountLabel = (count: number) => {
    if (t.subscribedCount) return t.subscribedCount.replace('{count}', String(count));
    if (locale === 'vi') return `Bạn đã đăng ký ${count} danh mục.`;
    if (locale === 'en') return `You follow ${count} categories.`;
    return `${count}개 구독 중`;
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-gray-800 dark:via-gray-800 dark:to-gray-900 border border-amber-200/60 dark:border-amber-800/30">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-200/30 to-orange-200/30 dark:from-amber-600/10 dark:to-orange-600/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-yellow-200/30 to-amber-200/30 dark:from-yellow-600/10 dark:to-amber-600/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
      
      <div className="relative p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/25">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              {t.title || fallbackTitle}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t.description || fallbackDesc}
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="h-8 w-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {filteredCategories.map((category) => {
              const isSubscribed = subscribedIds.has(category.id);
              return (
                <button
                  key={category.id}
                  onClick={() => handleToggle(category.id)}
                  disabled={toggleSubscription.isPending}
                  className={`group relative flex items-center gap-2 px-4 py-2.5 rounded-full font-medium text-sm transition-all duration-300 ${
                    isSubscribed
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30 hover:shadow-amber-500/40 hover:scale-105'
                      : 'bg-white/80 dark:bg-gray-700/80 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600 hover:border-amber-400 dark:hover:border-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:scale-105'
                  }`}
                >
                  {isSubscribed ? (
                    <Bell className="w-4 h-4" />
                  ) : (
                    <BellOff className="w-4 h-4 opacity-50 group-hover:opacity-100" />
                  )}
                  <span>{mapCategoryName(category)}</span>
                  {isSubscribed && (
                    <Check className="w-4 h-4" />
                  )}
                </button>
              );
            })}
          </div>
        )}

        {subscriptions && subscriptions.length > 0 && (
          <div className="mt-4 pt-4 border-t border-amber-200/50 dark:border-gray-700/50">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-1">
                {subscriptions.slice(0, 3).map((sub, i) => (
                  <div
                    key={sub.id}
                    className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-[10px] font-bold text-white border-2 border-white dark:border-gray-800"
                    style={{ zIndex: 3 - i }}
                  >
                    {sub.name.charAt(0)}
                  </div>
                ))}
                {subscriptions.length > 3 && (
                  <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-[10px] font-medium text-gray-600 dark:text-gray-300 border-2 border-white dark:border-gray-800">
                    +{subscriptions.length - 3}
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {subscribedCountLabel(subscriptions.length)}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
