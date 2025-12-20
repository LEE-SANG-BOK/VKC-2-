'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'nextjs-toploader/app';
import { useParams, usePathname } from 'next/navigation';
import { TrendingUp, Users, MessageCircle, Share2, ShieldCheck, Sparkles, HeartHandshake, Bug, Trophy } from 'lucide-react';
import { LEGACY_CATEGORIES, getCategoryName, CATEGORY_GROUPS } from '@/lib/constants/categories';
import CategoryItem from '@/components/molecules/categories/CategoryItem';
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

  const labelFallbacks = useMemo(() => {
    if (locale === 'en') {
      return {
        menu: 'Menu',
        popular: 'Popular',
        latest: 'Latest',
        following: 'Following',
        subscribed: 'Subscribed',
        askQuestion: 'Ask a question',
        sharePost: 'Share',
        verificationRequest: 'Verify',
        subscribe: 'Subscribe',
        subscribedLabel: 'Subscribed',
      };
    }
    if (locale === 'vi') {
      return {
        menu: 'Menu',
        popular: 'Phổ biến',
        latest: 'Mới nhất',
        following: 'Đang theo dõi',
        subscribed: 'Đã theo dõi',
        askQuestion: 'Đặt câu hỏi',
        sharePost: 'Chia sẻ',
        verificationRequest: 'Xác minh',
        subscribe: 'Theo dõi',
        subscribedLabel: 'Đang theo dõi',
      };
    }
    return {
      menu: '메뉴',
      popular: '인기',
      latest: '최신',
      following: '팔로잉',
      subscribed: '구독',
      askQuestion: '질문하기',
      sharePost: '공유하기',
      verificationRequest: '인증하기',
      subscribe: '구독',
      subscribedLabel: '구독 중',
    };
  }, [locale]);
  const menuLabelFallbacks: Record<string, string> = {
    popular: labelFallbacks.popular,
    latest: labelFallbacks.latest,
    following: labelFallbacks.following,
    subscribed: labelFallbacks.subscribed,
  };
  const tooltipFallbacks = useMemo(() => {
    if (locale === 'en') {
      return {
        popular: 'See the most popular posts right now.',
        latest: 'Browse the newest posts by time.',
        following: 'See posts from people you follow.',
        subscribed: 'See posts from categories you follow.',
        leaderboard: 'See top contributors based on trust and helpful answers.',
        feedback: 'Send feedback or report a bug.',
      };
    }
    if (locale === 'vi') {
      return {
        popular: 'Xem bài viết đang được quan tâm nhất.',
        latest: 'Xem bài mới nhất theo thời gian.',
        following: 'Chỉ xem bài từ người bạn đang theo dõi.',
        subscribed: 'Xem bài theo danh mục bạn đã đăng ký.',
        leaderboard: 'Xem top người đóng góp dựa trên độ tin cậy và câu trả lời hữu ích.',
        feedback: 'Gửi phản hồi hoặc báo lỗi cho đội ngũ.',
      };
    }
    return {
      popular: '지금 가장 많이 보는 글을 모아서 보여줘요.',
      latest: '최신 글을 시간순으로 보여줘요.',
      following: '팔로우한 사람들의 글만 모아볼 수 있어요.',
      subscribed: '구독한 카테고리 글만 모아볼 수 있어요.',
      leaderboard: '신뢰/도움 점수 기준 상위 기여자를 확인하세요.',
      feedback: '피드백이나 버그를 제보할 수 있어요.',
    };
  }, [locale]);
  const ctaTooltipFallbacks = useMemo(() => {
    if (locale === 'en') {
      return {
        askQuestion:
          'Ask about visa, jobs, or life in Korea\nCommunity & verified users can help\nInclude your situation, visa type, and timeline',
        sharePost:
          'Share experience, official links, or notices\nHelp others save time\nAdd source and date for trust',
        verificationRequest:
          'Apply to get a verified badge\nBoost trust and visibility\nSubmit a request and wait for review',
      };
    }
    if (locale === 'vi') {
      return {
        askQuestion:
          'Đặt câu hỏi về visa/việc làm/cuộc sống\nCộng đồng & người dùng xác minh sẽ hỗ trợ\nGhi rõ tình huống, loại visa, và thời hạn',
        sharePost:
          'Chia sẻ kinh nghiệm, link chính thức, hoặc thông báo\nGiúp người khác tiết kiệm thời gian\nNhớ ghi nguồn và ngày đăng',
        verificationRequest:
          'Xác minh hồ sơ để hiển thị huy hiệu\nTăng độ tin cậy và ưu tiên hiển thị\nGửi yêu cầu và chờ xét duyệt',
      };
    }
    return {
      askQuestion: '비자·취업·생활 질문을 올리면\n커뮤니티와 인증 사용자가 함께 도와줘요\n상황/비자타입/기간을 같이 적어주세요',
      sharePost: '내 경험과 지식을 모두와 함께 공유해봅시다.',
      verificationRequest: '인증을 받으면 프로필에 인증 마크가 표시돼요\n신뢰도/노출 가중치가 올라갑니다\n신청 후 검토를 기다려주세요',
    };
  }, [locale]);
  const toastFallbacks = useMemo(() => {
    if (locale === 'en') {
      return {
        subscribed: 'Subscribed.',
        unsubscribed: 'Unsubscribed.',
        subscribeError: 'Failed to subscribe.',
      };
    }
    if (locale === 'vi') {
      return {
        subscribed: 'Đã theo dõi.',
        unsubscribed: 'Đã hủy theo dõi.',
        subscribeError: 'Lỗi khi theo dõi.',
      };
    }
    return {
      subscribed: '구독되었습니다.',
      unsubscribed: '구독이 해제되었습니다.',
      subscribeError: '구독 처리 중 오류가 발생했습니다.',
    };
  }, [locale]);
  const sectionFallbacks = useMemo(() => {
    if (locale === 'en') {
      return {
        categories: 'Categories',
        mySubscriptions: 'My Subscriptions',
        noSubscriptions: 'No subscriptions yet.',
      };
    }
    if (locale === 'vi') {
      return {
        categories: 'Danh mục',
        mySubscriptions: 'Theo dõi của tôi',
        noSubscriptions: 'Chưa có danh mục theo dõi.',
      };
    }
    return {
      categories: '카테고리',
      mySubscriptions: '내 구독',
      noSubscriptions: '구독 중인 카테고리가 없습니다.',
    };
  }, [locale]);
  const menuTitleLabel = t.menu || labelFallbacks.menu;
  const askQuestionLabel = t.askQuestion || labelFallbacks.askQuestion;
  const sharePostLabel = t.sharePost || labelFallbacks.sharePost;
  const verificationRequestLabel = t.verificationRequest || labelFallbacks.verificationRequest;
  const subscribeLabel = t.subscribe || labelFallbacks.subscribe;
  const subscribedLabel = t.subscribedLabel || t.subscribed || labelFallbacks.subscribedLabel;
  const categoriesLabel = t.categories || sectionFallbacks.categories;
  const mySubscriptionsLabel = t.mySubscriptions || sectionFallbacks.mySubscriptions;
  const noSubscriptionsLabel = t.noSubscriptions || sectionFallbacks.noSubscriptions;
  const subscribedToastLabel = t.subscribedToast || toastFallbacks.subscribed;
  const unsubscribedToastLabel = t.unsubscribedToast || toastFallbacks.unsubscribed;
  const subscribeErrorLabel = t.subscribeError || toastFallbacks.subscribeError;
  const askQuestionTooltipText = t.askQuestionTooltip || ctaTooltipFallbacks.askQuestion;
  const sharePostTooltipText = t.sharePostTooltip || ctaTooltipFallbacks.sharePost;
  const verificationTooltipText = t.verificationRequestTooltip || ctaTooltipFallbacks.verificationRequest;

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
    popular: t.popularTooltip || tooltipFallbacks.popular,
    latest: t.latestTooltip || tooltipFallbacks.latest,
    following: t.followingTooltip || tooltipFallbacks.following,
    subscribed: t.subscribedTooltip || tooltipFallbacks.subscribed,
    leaderboard: t.leaderboardTooltip || tooltipFallbacks.leaderboard,
    feedback: t.feedbackTooltip || tooltipFallbacks.feedback,
  };

  const leaderboardLabel =
    t.leaderboard ||
    (locale === 'vi'
      ? 'Top người đóng góp'
      : locale === 'en'
        ? 'Top Contributors'
        : '상위 기여자');
  const feedbackLabel = 'Feedback';

  const menuCategories = [
    { id: 'popular', icon: TrendingUp, count: 0 },
    { id: 'latest', icon: Sparkles, count: 0 },
    { id: 'following', icon: Users, count: 0 },
    { id: 'subscribed', icon: HeartHandshake, count: 0 },
    { id: 'leaderboard', icon: Trophy, count: 0, label: leaderboardLabel },
    {
      id: 'feedback',
      icon: undefined,
      count: 0,
      label: feedbackLabel,
      className: 'mx-4 my-1 justify-center gap-0 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100 dark:border-blue-800/60 dark:bg-blue-900/20 dark:text-blue-100 dark:hover:bg-blue-900/40',
    },
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
            const isFeedback = category.id === 'feedback';
            const label = (category as { label?: string }).label || t[category.id] || menuLabelFallbacks[category.id] || category.id;
            const description = isFeedback ? undefined : showInlineDescriptions ? tooltipSummary(menuTooltips[category.id]) : undefined;
            const tooltip = isFeedback ? menuTooltips[category.id] : undefined;
            const ariaLabel = isFeedback ? feedbackLabel : undefined;
            const labelClassName = isFeedback ? 'text-center w-full' : undefined;
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
                tooltip={tooltip}
                ariaLabel={ariaLabel}
                labelClassName={labelClassName}
                className={(category as { className?: string }).className}
              />
            );
          })}
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
