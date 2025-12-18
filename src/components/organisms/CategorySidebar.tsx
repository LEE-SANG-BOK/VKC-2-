'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'nextjs-toploader/app';
import { useParams } from 'next/navigation';
import { TrendingUp, Users, MessageCircle, Share2, ShieldCheck, Sparkles, HeartHandshake } from 'lucide-react';
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
  const locale = params.lang as string || 'ko';
  const { data: session } = useSession();
  const user = session?.user;
  const { data: apiCategories } = useCategories();
  const { data: mySubs } = useMySubscriptions(!!user);
  const { mutate: toggleSubscription } = useToggleSubscription();
  const { openLoginPrompt } = useLoginPrompt();
  const containerRef = useRef<HTMLElement | null>(null);

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
    popular:
      t.popularTooltip ||
      (locale === 'vi'
        ? 'Xem bài viết đang được quan tâm nhất.'
        : locale === 'en'
          ? 'See the most popular posts right now.'
          : '지금 가장 많이 보는 글을 모아서 보여줘요.'),
    latest:
      t.latestTooltip ||
      (locale === 'vi'
        ? 'Xem bài mới nhất theo thời gian.'
        : locale === 'en'
          ? 'Browse the newest posts by time.'
          : '최신 글을 시간순으로 보여줘요.'),
    following:
      t.followingTooltip ||
      (locale === 'vi'
        ? 'Chỉ xem bài từ người bạn đang theo dõi.'
        : locale === 'en'
          ? 'See posts from people you follow.'
          : '팔로우한 사람들의 글만 모아볼 수 있어요.'),
    subscribed:
      t.subscribedTooltip ||
      (locale === 'vi'
        ? 'Xem bài theo danh mục bạn đã đăng ký.'
        : locale === 'en'
          ? 'See posts from categories you follow.'
          : '구독한 카테고리 글만 모아볼 수 있어요.'),
  };

  const menuCategories = [
    { id: 'popular', icon: TrendingUp, count: 0 },
    { id: 'latest', icon: Sparkles, count: 0 },
    { id: 'following', icon: Users, count: 0 },
    { id: 'subscribed', icon: HeartHandshake, count: 0 },
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
        const msg = res?.isSubscribed
          ? (t.subscribedToast ||
              (locale === 'vi' ? 'Đã theo dõi.' : locale === 'en' ? 'Subscribed.' : '구독되었습니다.'))
          : (t.unsubscribedToast ||
              (locale === 'vi' ? 'Đã hủy theo dõi.' : locale === 'en' ? 'Unsubscribed.' : '구독이 해제되었습니다.'));
        toast.success(msg);
      },
      onError: () => {
        toast.error(
          t.subscribeError ||
            (locale === 'vi' ? 'Lỗi khi theo dõi.' : locale === 'en' ? 'Failed to subscribe.' : '구독 처리 중 오류가 발생했습니다.')
        );
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
        w-[320px] flex flex-col
        bg-transparent
        overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300
        scrollbar-track-transparent hover:scrollbar-thumb-gray-400
        transition-transform duration-300 z-40
        lg:translate-x-0
        top-[var(--vk-header-height)] h-[calc(100vh-var(--vk-header-height))]
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
        ${isMobileVariant ? '' : 'sticky'}
        ${isMobileVariant ? '' : 'left-0'}
        ${isMobileVariant ? '' : 'lg:top-[var(--vk-header-height)]'}
        ${isMobileVariant ? 'flex' : ''}
        ${isMobileVariant ? '' : 'translate-x-0'}
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
              {t.menu || '메뉴'}
            </h3>
          </div>
          {menuCategories.map((category) => (
            <CategoryItem
              key={category.id}
              id={category.id}
              name={t[category.id] || category.id}
              description={showInlineDescriptions ? tooltipSummary(menuTooltips[category.id]) : undefined}
              icon={category.icon}
              count={category.count}
              isActive={selectedCategory === category.id}
              onClick={handleCategoryClick}
              tooltip={undefined}
            />
          ))}
        </div>

        {/* Divider */}
        <div className="border-b border-gray-200/40 dark:border-gray-700/40" />

        {/* Create Post Section - Each action separated and emphasized */}
        <div className="py-2 space-y-2">
          {(() => {
            const askQuestionTooltipText =
              t.askQuestionTooltip ||
              (locale === 'vi'
                ? 'Đặt câu hỏi về visa/việc làm/cuộc sống\nCộng đồng & người dùng xác minh sẽ hỗ trợ\nGhi rõ tình huống, loại visa, và thời hạn'
                : locale === 'en'
                  ? 'Ask about visa, jobs, or life in Korea\nCommunity & verified users can help\nInclude your situation, visa type, and timeline'
                  : '비자·취업·생활 질문을 올리면\n커뮤니티와 인증 사용자가 함께 도와줘요\n상황/비자타입/기간을 같이 적어주세요');
            const sharePostTooltipText =
              t.sharePostTooltip ||
              (locale === 'vi'
                ? 'Chia sẻ kinh nghiệm, link chính thức, hoặc thông báo\nGiúp người khác tiết kiệm thời gian\nNhớ ghi nguồn và ngày đăng'
                : locale === 'en'
                  ? 'Share experience, official links, or notices\nHelp others save time\nAdd source and date for trust'
                  : '경험담/공식링크/공지 등을 공유하면\n다른 사람의 시간을 절약해줘요\n출처·날짜를 함께 남겨주세요');
            const verificationTooltipText =
              t.verificationRequestTooltip ||
              (locale === 'vi'
                ? 'Xác minh hồ sơ để hiển thị huy hiệu\nTăng độ tin cậy và ưu tiên hiển thị\nGửi yêu cầu và chờ xét duyệt'
                : locale === 'en'
                  ? 'Apply to get a verified badge\nBoost trust and visibility\nSubmit a request and wait for review'
                  : '인증을 받으면 프로필에 인증 마크가 표시돼요\n신뢰도/노출 가중치가 올라갑니다\n신청 후 검토를 기다려주세요');

            const askQuestionDescription = isMobileVariant || showInlineDescriptions ? tooltipSummary(askQuestionTooltipText) : undefined;
            const sharePostDescription = isMobileVariant || showInlineDescriptions ? tooltipSummary(sharePostTooltipText) : undefined;
            const verificationDescription = isMobileVariant || showInlineDescriptions ? tooltipSummary(verificationTooltipText) : undefined;

            return (
              <>
          <CategoryItem
            id="ask-question"
            name={t.askQuestion || '질문하기'}
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
            name={t.sharePost || (locale === 'vi' ? 'Chia sẻ' : locale === 'en' ? 'Share' : '공유하기')}
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
            name={t.verificationRequest || (locale === 'vi' ? 'Xác minh' : locale === 'en' ? 'Verify' : '인증하기')}
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
            {t.categories || (locale === 'vi' ? 'Danh mục' : locale === 'en' ? 'Categories' : '카테고리')}
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
                        <div key={child.slug} className="flex items-center gap-2 pr-3 py-1 min-w-0">
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
                              className={`shrink-0 whitespace-nowrap text-[11px] min-w-[84px] px-3 py-1.5 rounded-full transition-colors ${
                                subscribed
                                  ? 'border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 bg-transparent hover:bg-gray-50 dark:hover:bg-gray-800'
                                  : 'border border-transparent bg-blue-600 text-white shadow-sm hover:bg-blue-700'
                              }`}
                            >
                              {subscribed
                                ? (t.subscribedLabel || t.subscribed || '구독 중')
                                : (t.subscribe || '구독')}
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
            {t.mySubscriptions || '내 구독'}
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
                    className="shrink-0 whitespace-nowrap text-[11px] min-w-[84px] px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 bg-transparent hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    {t.subscribedLabel || t.subscribed || '구독 중'}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
              {t.noSubscriptions || '구독 중인 카테고리가 없습니다.'}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
