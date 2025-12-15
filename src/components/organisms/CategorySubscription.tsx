'use client';

import { useMemo, useState } from 'react';
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
  const [bulkGroup, setBulkGroup] = useState<string | null>(null);

  const isLoading = categoriesLoading || subscriptionsLoading;

  const allowedSlugs = useMemo(() => {
    const children = Object.values(CATEGORY_GROUPS).flatMap((g) => g.slugs as readonly string[]);
    return new Set(children);
  }, []);

  const topicSubscriptions = useMemo(() => {
    return (subscriptions || []).filter((sub) => allowedSlugs.has(sub.slug));
  }, [allowedSlugs, subscriptions]);

  const subscribedIds = useMemo(() => {
    return new Set(topicSubscriptions.map((sub) => sub.id));
  }, [topicSubscriptions]);

  const filteredCategories = useMemo(() => {
    const flattened: any[] = [];
    (categories || []).forEach((parent: any) => {
      if (allowedSlugs.has(parent.slug)) {
        flattened.push(parent);
      }
      (parent?.children || []).forEach((child: any) => {
        if (allowedSlugs.has(child.slug)) {
          flattened.push(child);
        }
      });
    });
    return flattened;
  }, [categories, allowedSlugs]);

  const categoryBySlug = useMemo(() => {
    const map = new Map<string, any>();
    (categories || []).forEach((parent: any) => {
      if (parent?.slug) map.set(parent.slug, parent);
      (parent?.children || []).forEach((child: any) => {
        if (child?.slug) map.set(child.slug, child);
      });
    });
    return map;
  }, [categories]);

  const handleToggle = (categoryId: string) => {
    if (!session?.user) return;
    const nextState = !subscribedIds.has(categoryId);
    toggleSubscription.mutate(categoryId, {
      onSuccess: () => {
        onToggle?.(categoryId, nextState);
      },
    });
  };

  const groupButtonLabel = (state: 'all' | 'partial' | 'none') => {
    if (t.groupSubscribeAll && state === 'none') return t.groupSubscribeAll;
    if (t.groupSubscribeRest && state === 'partial') return t.groupSubscribeRest;
    if (t.groupUnsubscribeAll && state === 'all') return t.groupUnsubscribeAll;

    if (locale === 'vi') {
      if (state === 'all') return 'Hủy tất cả';
      if (state === 'partial') return 'Theo dõi phần còn lại';
      return 'Theo dõi tất cả';
    }
    if (locale === 'en') {
      if (state === 'all') return 'Unfollow all';
      if (state === 'partial') return 'Follow the rest';
      return 'Follow all';
    }
    if (state === 'all') return '전체 해제';
    if (state === 'partial') return '나머지 구독';
    return '전체 구독';
  };

  const handleGroupToggle = async (groupSlug: string, slugs: readonly string[]) => {
    if (!session?.user) return;
    if (bulkGroup) return;

    const ids = slugs
      .map((slug) => categoryBySlug.get(slug)?.id)
      .filter(Boolean) as string[];
    if (ids.length === 0) return;

    const subscribedCount = ids.filter((id) => subscribedIds.has(id)).length;
    const isAllSubscribed = subscribedCount === ids.length;
    const targetIds = isAllSubscribed ? ids.filter((id) => subscribedIds.has(id)) : ids.filter((id) => !subscribedIds.has(id));
    if (targetIds.length === 0) return;

    setBulkGroup(groupSlug);
    try {
      for (const id of targetIds) {
        await toggleSubscription.mutateAsync(id);
        onToggle?.(id, !isAllSubscribed);
      }
    } finally {
      setBulkGroup(null);
    }
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
    <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
      <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-gradient-to-br from-blue-200/25 to-indigo-200/25 dark:from-blue-600/10 dark:to-indigo-600/10 blur-2xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 h-24 w-24 rounded-full bg-gradient-to-tr from-sky-200/25 to-blue-200/25 dark:from-sky-600/10 dark:to-blue-600/10 blur-2xl translate-y-1/2 -translate-x-1/2" />

      <div className="relative p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/20">
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
            <div className="h-8 w-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(CATEGORY_GROUPS).map(([groupSlug, group]) => {
              const label = locale === 'vi' ? group.label_vi : locale === 'en' ? group.label_en : group.label;
              const slugs = group.slugs as readonly string[];
              const ids = slugs
                .map((slug) => categoryBySlug.get(slug)?.id)
                .filter(Boolean) as string[];
              const subscribedCount = ids.filter((id) => subscribedIds.has(id)).length;
              const state: 'all' | 'partial' | 'none' =
                ids.length > 0 && subscribedCount === ids.length ? 'all' : subscribedCount > 0 ? 'partial' : 'none';
              const disabled = toggleSubscription.isPending || bulkGroup !== null || ids.length === 0;
              return (
                <div
                  key={groupSlug}
                  className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-gray-900/20 p-4"
                >
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {group.emoji} {label}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {t.groupCountLabel
                          ? t.groupCountLabel
                              .replace('{selected}', String(subscribedCount))
                              .replace('{total}', String(ids.length || slugs.length))
                          : locale === 'vi'
                            ? `Đã chọn ${subscribedCount}/${ids.length || slugs.length}`
                            : locale === 'en'
                              ? `${subscribedCount}/${ids.length || slugs.length} selected`
                              : `${subscribedCount}/${ids.length || slugs.length} 선택됨`}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleGroupToggle(groupSlug, slugs)}
                      disabled={disabled}
                      className={`shrink-0 inline-flex items-center justify-center rounded-full px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                        state === 'all'
                          ? 'border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 bg-white/60 dark:bg-gray-900/40 hover:bg-gray-50 dark:hover:bg-gray-800'
                          : 'border border-transparent bg-blue-600 text-white shadow-sm hover:bg-blue-700'
                      }`}
                    >
                      {bulkGroup === groupSlug
                        ? (t.applyingLabel || (locale === 'vi' ? 'Đang áp dụng...' : locale === 'en' ? 'Applying...' : '적용 중...'))
                        : groupButtonLabel(state)}
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {slugs
                      .map((slug) => categoryBySlug.get(slug))
                      .filter(Boolean)
                      .map((category) => {
                        const isSubscribed = subscribedIds.has(category.id);
                        return (
                          <button
                            key={category.id}
                            type="button"
                            onClick={() => handleToggle(category.id)}
                            disabled={toggleSubscription.isPending || bulkGroup !== null}
                            className={`group relative flex items-center gap-2 px-4 py-2.5 rounded-full font-medium text-sm transition-all duration-200 ${
                              isSubscribed
                                ? 'border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:border-blue-800/50 dark:bg-blue-900/20 dark:text-blue-100 dark:hover:bg-blue-900/30'
                                : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:border-blue-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700/60 dark:hover:border-blue-700/60'
                            }`}
                          >
                            {isSubscribed ? (
                              <Bell className="w-4 h-4" />
                            ) : (
                              <BellOff className="w-4 h-4 opacity-60 group-hover:opacity-100" />
                            )}
                            <span>{mapCategoryName(category)}</span>
                            {isSubscribed ? <Check className="w-4 h-4" /> : null}
                          </button>
                        );
                      })}
                  </div>
                </div>
              );
            })}

            {filteredCategories.length === 0 ? (
              <div className="text-center text-sm text-gray-500 dark:text-gray-400 py-6">
                {t.noCategories || (locale === 'vi' ? 'Không có danh mục.' : locale === 'en' ? 'No categories available.' : '표시할 카테고리가 없습니다.')}
              </div>
            ) : null}
          </div>
        )}

        {topicSubscriptions.length > 0 ? (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-1">
                {topicSubscriptions.slice(0, 3).map((sub, i) => (
                  <div
                    key={sub.id}
                    className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-[10px] font-bold text-white border-2 border-white dark:border-gray-800"
                    style={{ zIndex: 3 - i }}
                  >
                    {sub.name.charAt(0)}
                  </div>
                ))}
                {topicSubscriptions.length > 3 ? (
                  <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-[10px] font-medium text-gray-600 dark:text-gray-300 border-2 border-white dark:border-gray-800">
                    +{topicSubscriptions.length - 3}
                  </div>
                ) : null}
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {subscribedCountLabel(topicSubscriptions.length)}
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
