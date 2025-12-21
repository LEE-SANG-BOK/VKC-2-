'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'nextjs-toploader/app';
import { useParams, usePathname } from 'next/navigation';
import { TrendingUp, Users, MessageCircle, Share2, ShieldCheck, Sparkles, HeartHandshake, Bug, Trophy } from 'lucide-react';
import { LEGACY_CATEGORIES, getCategoryName, CATEGORY_GROUPS } from '@/lib/constants/categories';
import CategoryItem from '@/components/molecules/categories/CategoryItem';
import Tooltip from '@/components/atoms/Tooltip';
import { useSession } from 'next-auth/react';
import { useCategories, useMySubscriptions } from '@/repo/categories/query';
import { useToggleSubscription } from '@/repo/categories/mutation';
import { toast } from 'sonner';
import { onHomeReset } from '@/utils/homeReset';
import { useLoginPrompt } from '@/providers/LoginPromptProvider';

interface ApiCategory {
  id: string;
  name: string;
  slug: string;
  order?: number;
}

interface CategorySidebarProps {
  variant?: 'desktop' | 'mobile';
  setIsMobileMenuOpen: (value: boolean) => void;
  selectedCategory?: string;
  onCategoryChange?: (category: string) => void;
  translations: Record<string, unknown>;
}

export default function CategorySidebar({
  variant = 'desktop',
  setIsMobileMenuOpen,
  selectedCategory = 'all',
  onCategoryChange,
  translations,
}: CategorySidebarProps) {
  const t = (translations?.sidebar || {}) as Record<string, string>;
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const locale = params.lang as string || 'ko';
  const { data: session } = useSession();
  const user = session?.user;
  const { data: apiCategories } = useCategories();
  const { data: mySubs } = useMySubscriptions(!!user);
  const { mutate: toggleSubscription } = useToggleSubscription();
  const { openLoginPrompt } = useLoginPrompt();
  const containerRef = useRef<HTMLElement | null>(null);

  const menuTitleLabel = t.menu || '';
  const askQuestionLabel = t.askQuestion || '';
  const sharePostLabel = t.sharePost || '';
  const verificationRequestLabel = t.verificationRequest || '';
  const subscribeLabel = t.subscribe || '';
  const subscribedLabel = t.subscribedLabel || t.subscribed || '';
  const categoriesLabel = t.categories || '';
  const mySubscriptionsLabel = t.mySubscriptions || '';
  const noSubscriptionsLabel = t.noSubscriptions || '';
  const subscribedToastLabel = t.subscribedToast || '';
  const unsubscribedToastLabel = t.unsubscribedToast || '';
  const subscribeErrorLabel = t.subscribeError || '';
  const askQuestionTooltipText = t.askQuestionTooltip || '';
  const sharePostTooltipText = t.sharePostTooltip || '';
  const verificationTooltipText = t.verificationRequestTooltip || '';

  useEffect(() => onHomeReset(() => {
    containerRef.current?.scrollTo({ top: 0, behavior: 'auto' });
  }), []);

  const tooltipSummary = (value?: string) => {
    const trimmed = value?.trim();
    if (!trimmed) return undefined;
    const parts = trimmed.split(/\n+/).map((line) => line.trim()).filter(Boolean);
    return parts[1] || parts[0];
  };

  const menuTooltips: Record<string, string | undefined> = {
    popular: t.popularTooltip,
    latest: t.latestTooltip,
    following: t.followingTooltip,
    subscribed: t.subscribedTooltip,
    leaderboard: t.leaderboardTooltip,
    feedback: t.feedbackTooltip,
  };

  const leaderboardBaseLabel = t.leaderboard || '';
  const leaderboardLabel = leaderboardBaseLabel.includes('Event')
    ? leaderboardBaseLabel
    : locale === 'vi' || locale === 'en'
      ? `${leaderboardBaseLabel} (Event)`
      : `${leaderboardBaseLabel}(Event)`;
  const feedbackLabel = t.feedback || '';

  const menuCategories = [
    { id: 'popular', icon: TrendingUp, count: 0 },
    { id: 'latest', icon: Sparkles, count: 0 },
    { id: 'following', icon: Users, count: 0 },
    { id: 'subscribed', icon: HeartHandshake, count: 0 },
    { id: 'leaderboard', icon: Trophy, count: 0, label: leaderboardLabel },
    // { id: 'media', icon: Film, count: 0 }, // 미디어 전용 페이지 (숨김 상태)
  ];

  const apiBySlug = useMemo(() => {
    const map = new Map<string, ApiCategory>();
    (apiCategories || []).forEach((cat: any) => {
      if (cat?.slug) map.set(cat.slug, cat);
      (cat?.children || []).forEach((child: any) => {
        if (child?.slug) map.set(child.slug, child);
      });
    });
    return map;
  }, [apiCategories]);

  const topicSlugs = useMemo(() => {
    return new Set(Object.values(CATEGORY_GROUPS).flatMap((group) => group.slugs as readonly string[]));
  }, []);

  const subscribedIds = useMemo(() => new Set((mySubs || []).map((s) => s.id)), [mySubs]);
  const topicSubscriptions = useMemo(() => {
    return (mySubs || []).filter((cat) => topicSlugs.has(cat.slug));
  }, [mySubs, topicSlugs]);
  const isLeaderboardRoute = pathname === `/${locale}/leaderboard`;
  const activeCategory = isLeaderboardRoute ? 'leaderboard' : selectedCategory;

  const groupOptions = useMemo(() => {
    return Object.entries(CATEGORY_GROUPS).map(([slug, group]) => {
      const majorLegacy = LEGACY_CATEGORIES.find((c) => c.slug === slug);
      const majorLabel = majorLegacy ? getCategoryName(majorLegacy, locale) : slug;
      const children = (group.slugs as readonly string[])
        .map((childSlug) => LEGACY_CATEGORIES.find((c) => c.slug === childSlug))
        .filter(Boolean) as typeof LEGACY_CATEGORIES;
      return {
        slug,
        label: `${group.emoji} ${majorLabel}`,
        children,
      };
    });
  }, [locale]);

  const getTranslatedCategoryName = (cat: { slug: string; name: string }): string => {
    const legacyCategory = LEGACY_CATEGORIES.find((lc) => lc.slug === cat.slug);
    if (legacyCategory) return getCategoryName(legacyCategory, locale);
    return cat.name;
  };

  const handleSubscribe = (categoryId: string) => {
    if (!user) {
      openLoginPrompt();
      setIsMobileMenuOpen(false);
      return;
    }
    toggleSubscription(categoryId, {
      onSuccess: (res) => {
        const msg = res?.isSubscribed ? subscribedToastLabel : unsubscribedToastLabel;
        toast.success(msg);
      },
      onError: () => {
        toast.error(subscribeErrorLabel);
      },
    });
  };

  const handleCategoryClick = (categoryId: string) => {
    // 로그인 필요한 메뉴
    const authRequiredMenus = ['ask-question', 'share-post', 'verification-request', 'following', 'subscribed', 'my-posts'];
    if (authRequiredMenus.includes(categoryId) && !user) {
      openLoginPrompt();
      setIsMobileMenuOpen(false);
      return;
    }

    // "질문하기" 버튼 클릭 시 새 페이지로 이동
    if (categoryId === 'ask-question') {
      router.push(`/${locale}/posts/new?type=question`);
      setIsMobileMenuOpen(false);
      return;
    }

    // "공유하기" 버튼 클릭 시 새 페이지로 이동
    if (categoryId === 'share-post') {
      router.push(`/${locale}/posts/new?type=share`);
      setIsMobileMenuOpen(false);
      return;
    }

    // "인증 신청" 버튼 클릭 시 새 페이지로 이동
    if (categoryId === 'verification-request') {
      router.push(`/${locale}/verification/request`);
      setIsMobileMenuOpen(false);
      return;
    }

    if (categoryId === 'feedback') {
      router.push(`/${locale}/feedback`);
      setIsMobileMenuOpen(false);
      return;
    }

    if (categoryId === 'leaderboard') {
      router.push(`/${locale}/leaderboard`);
      setIsMobileMenuOpen(false);
      return;
    }

    if (onCategoryChange) {
      onCategoryChange(categoryId);
    }
    setIsMobileMenuOpen(false);

  };

  const isMobileVariant = variant === 'mobile';
  const showInlineDescriptions = variant === 'desktop';

  const containerClass = isMobileVariant
    ? `
        h-full w-full flex flex-col
        bg-white dark:bg-gray-900
        overflow-y-auto overflow-x-hidden
        pt-0
      `
    : `
        w-[320px] h-full flex flex-col
        bg-transparent
        overflow-y-auto overscroll-contain scrollbar-thin scrollbar-thumb-gray-300
        scrollbar-track-transparent hover:scrollbar-thumb-gray-400
        z-40
        pt-0
      `;

  return (
    <>
      {/* ... (Modal and Overlay remain same) */}

      {/* Sidebar */}
      <aside
        ref={containerRef}
        className={`
        ${isMobileVariant ? '' : 'hidden lg:flex'}
        ${isMobileVariant ? '' : 'h-full'}
        ${isMobileVariant ? 'flex' : ''}
        ${containerClass}
        ${isMobileVariant ? '' : 'px-0'}
      `}>

        {/* Menu Section */}
        <div
          className={
            isMobileVariant
              ? 'mt-4 mx-3 rounded-xl border border-gray-200/70 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-800/30 py-4'
              : 'py-4 border-b border-gray-200/40 dark:border-gray-700/40'
          }
        >
          <div className={isMobileVariant ? 'flex items-center justify-between px-4 pb-2' : ''}>
            <h3
              className={`${isMobileVariant ? '' : 'px-4 pb-2 '}text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider`}
            >
              {menuTitleLabel}
            </h3>
          </div>
          {menuCategories.map((category) => {
            const label = (category as { label?: string }).label || t[category.id] || category.id;
            const description = showInlineDescriptions ? tooltipSummary(menuTooltips[category.id]) : undefined;
            return (
              <CategoryItem
                key={category.id}
                id={category.id}
                name={label}
                description={description}
                icon={category.icon}
                count={category.count}
                isActive={activeCategory === category.id}
                onClick={handleCategoryClick}
                className={(category as { className?: string }).className}
              />
            );
          })}
          <div className="px-4 pt-2 flex justify-end">
            <Tooltip content={menuTooltips.feedback} position="left" touchBehavior="longPress">
              <button
                type="button"
                aria-label={feedbackLabel}
                onClick={() => handleCategoryClick('feedback')}
                className="flex h-11 w-11 sm:h-9 sm:w-9 items-center justify-center rounded-full border border-gray-200/70 dark:border-gray-700 bg-white/60 dark:bg-gray-900/40 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <span aria-hidden className="text-base leading-none">💬</span>
              </button>
            </Tooltip>
          </div>
        </div>

        {/* Divider */}
        <div className="border-b border-gray-200/40 dark:border-gray-700/40" />

        {/* Create Post Section - Each action separated and emphasized */}
        <div className="py-2 space-y-2">
          {(() => {
            const askQuestionDescription = isMobileVariant || showInlineDescriptions ? tooltipSummary(askQuestionTooltipText) : undefined;
            const sharePostDescription = isMobileVariant || showInlineDescriptions ? tooltipSummary(sharePostTooltipText) : undefined;
            const verificationDescription = isMobileVariant || showInlineDescriptions ? tooltipSummary(verificationTooltipText) : undefined;

            return (
              <>
          <CategoryItem
            id="ask-question"
            name={askQuestionLabel}
            description={askQuestionDescription}
            icon={MessageCircle}
            count={0}
            isActive={false}
            onClick={handleCategoryClick}
            tooltip={undefined}
            className="border-l-4 border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 text-orange-600 dark:text-orange-400 font-semibold hover:scale-[1.02] transition-all duration-200 w-full"
          />
          <CategoryItem
            id="share-post"
            name={sharePostLabel}
            description={sharePostDescription}
            icon={Share2}
            count={0}
            isActive={false}
            onClick={handleCategoryClick}
            tooltip={undefined}
            className="border-l-4 border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 text-green-600 dark:text-green-400 font-semibold hover:scale-[1.02] transition-all duration-200 w-full"
          />
          <CategoryItem
            id="verification-request"
            name={verificationRequestLabel}
            description={verificationDescription}
            icon={ShieldCheck}
            count={0}
            isActive={selectedCategory === 'verification-request'}
            onClick={handleCategoryClick}
            tooltip={undefined}
            className="border-l-4 border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 text-purple-600 dark:text-purple-400 font-semibold hover:scale-[1.02] transition-all duration-200 w-full"
          />
              </>
            );
          })()}
        </div>

        <div className="py-3 space-y-3 border-b border-gray-200/40 dark:border-gray-700/40 border-t border-gray-200/40 dark:border-gray-700/40 mt-2">
          <h3 className="px-4 pb-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            {categoriesLabel}
          </h3>
          <div className="space-y-1">
            {groupOptions.map((group) => (
                <div key={group.slug} className="space-y-1">
                <div className="flex items-center gap-2 pr-3 py-1 min-w-0">
                  <CategoryItem
                    id={group.slug}
                    name={group.label}
                    icon={undefined}
                    count={0}
                    isActive={selectedCategory === group.slug}
                    onClick={handleCategoryClick}
                    className="!py-2 font-semibold flex-1"
                  />
                </div>
                {group.children.length > 0 && (
                  <div className="space-y-1 pl-4">
                    {group.children.map((child) => {
                      const apiChild = apiBySlug.get(child.slug);
                      const subscribed = apiChild ? subscribedIds.has(apiChild.id) : false;
                      return (
                        <div key={child.slug} className="flex items-center gap-2 pr-4 py-1 min-w-0">
                          <CategoryItem
                            id={child.slug}
                            name={getCategoryName(child, locale)}
                            icon={undefined}
                            count={0}
                            isActive={selectedCategory === child.slug}
                            onClick={handleCategoryClick}
                            className="!px-2 !py-2 flex-1 text-sm"
                          />
                          {apiChild ? (
                          <button
                            onClick={() => handleSubscribe(apiChild.id)}
                            className={`shrink-0 whitespace-nowrap text-[11px] min-h-[32px] min-w-[84px] sm:min-w-[96px] px-2.5 sm:px-3 py-1.5 rounded-full transition-colors ${
                              subscribed
                                ? 'border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 bg-transparent hover:bg-gray-50 dark:hover:bg-gray-800'
                                : 'border border-transparent bg-blue-600 text-white shadow-sm hover:bg-blue-700'
                            }`}
                          >
                            <span className="block leading-none">
                              {subscribed
                                ? subscribedLabel
                                : subscribeLabel}
                            </span>
                          </button>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="py-3 pb-16 space-y-3">
          <h3 className="px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            {mySubscriptionsLabel}
          </h3>
          {topicSubscriptions.length > 0 ? (
            <div className="space-y-1">
              {topicSubscriptions.map((cat) => (
                <div key={cat.id} className="flex items-center gap-2 pr-3 pl-0 py-1.5 min-w-0">
                  <CategoryItem
                    id={cat.slug}
                    name={getTranslatedCategoryName(cat)}
                    icon={undefined}
                    count={0}
                    isActive={selectedCategory === cat.slug}
                    onClick={handleCategoryClick}
                    className="!px-1.5 !py-2 flex-1"
                  />
                  <button
                    onClick={() => handleSubscribe(cat.id)}
                    className="shrink-0 whitespace-nowrap text-[11px] min-h-[32px] min-w-[84px] sm:min-w-[96px] px-2.5 sm:px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 bg-transparent hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <span className="block leading-none">
                      {subscribedLabel}
                    </span>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
              {noSubscriptionsLabel}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
