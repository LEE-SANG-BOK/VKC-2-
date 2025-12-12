'use client';

import { useMemo } from 'react';
import { useRouter } from 'nextjs-toploader/app';
import { useParams } from 'next/navigation';
import { TrendingUp, Users, MessageCircle, Share2, ShieldCheck, Sparkles, HeartHandshake, Scale, Briefcase, Home, CreditCard } from 'lucide-react';
import { LEGACY_CATEGORIES, getCategoryName, CATEGORY_GROUPS } from '@/lib/constants/categories';
import CategoryItem from '../molecules/CategoryItem';
import { useSession } from 'next-auth/react';
import { useCategories, useMySubscriptions } from '@/repo/categories/query';
import { useToggleSubscription } from '@/repo/categories/mutation';
import { toast } from 'sonner';
import Tooltip from '@/components/atoms/Tooltip';

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

  const menuCategories = [
    { id: 'popular', icon: TrendingUp, count: 0 },
    { id: 'latest', icon: Sparkles, count: 0 },
    { id: 'following', icon: Users, count: 0 },
    { id: 'subscribed', icon: HeartHandshake, count: 0 },
    // { id: 'media', icon: Film, count: 0 }, // 미디어 전용 페이지 (숨김 상태)
  ];

  const apiBySlug = useMemo(() => {
    const map = new Map<string, ApiCategory>();
    (apiCategories || []).forEach((cat) => {
      if (cat?.slug) map.set(cat.slug, cat);
    });
    return map;
  }, [apiCategories]);

  const subscribedIds = useMemo(() => new Set((mySubs || []).map((s) => s.id)), [mySubs]);

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
      router.push(`/${locale}/login`);
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
      router.push(`/${locale}/login`);
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

  const containerClass = isMobileVariant
    ? `
        h-full w-full flex flex-col
        bg-white dark:bg-gray-900
        overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300
        scrollbar-track-transparent hover:scrollbar-thumb-gray-400
        pt-0
      `
    : `
        w-64 flex flex-col
        bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700
        overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300
        scrollbar-track-transparent hover:scrollbar-thumb-gray-400
        transition-transform duration-300 z-40
        lg:translate-x-0
        top-[57px] h-[calc(100vh-57px)]
        pt-0
      `;

  return (
    <>
      {/* ... (Modal and Overlay remain same) */}

      {/* Sidebar */}
      <aside
        className={`
        ${isMobileVariant ? '' : 'hidden lg:flex'}
        ${isMobileVariant ? '' : 'sticky'}
        ${isMobileVariant ? '' : 'left-0'}
        ${isMobileVariant ? '' : 'lg:top-[57px]'}
        ${isMobileVariant ? 'flex' : ''}
        ${isMobileVariant ? '' : 'translate-x-0'}
        ${containerClass}
        ${isMobileVariant ? '' : 'px-0'}
      `}>

        {/* Menu Section */}
        <div className="py-4 border-b border-gray-200/40 dark:border-gray-700/40">
          <h3 className="px-4 pb-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            {t.menu || '메뉴'}
          </h3>
          {menuCategories.map((category) => (
            <CategoryItem
              key={category.id}
              id={category.id}
              name={t[category.id] || category.id}
              icon={category.icon}
              count={category.count}
              isActive={selectedCategory === category.id}
              onClick={handleCategoryClick}
            />
          ))}
        </div>

        {/* Divider */}
        <div className="border-b border-gray-200/40 dark:border-gray-700/40" />

        {/* Create Post Section - Each action separated and emphasized */}
        <div className="py-2 space-y-2">
          <CategoryItem
            id="ask-question"
            name={t.askQuestion || '질문하기'}
            icon={MessageCircle}
            count={0}
            isActive={false}
            onClick={handleCategoryClick}
            tooltip={t.askQuestionTooltip || '커뮤니티에 질문을 올려보세요'}
            tooltipPosition="right"
            className="border-l-4 border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 text-orange-600 dark:text-orange-400 font-semibold hover:scale-[1.02] transition-all duration-200 w-full"
          />
          <CategoryItem
            id="share-post"
            name={t.sharePost || '게시글 공유'}
            icon={Share2}
            count={0}
            isActive={false}
            onClick={handleCategoryClick}
            tooltip={t.sharePostTooltip || '유용한 정보를 공유해주세요'}
            tooltipPosition="right"
            className="border-l-4 border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 text-green-600 dark:text-green-400 font-semibold hover:scale-[1.02] transition-all duration-200 w-full"
          />
          <CategoryItem
            id="verification-request"
            name={t.verificationRequest || '인증 요청'}
            icon={ShieldCheck}
            count={0}
            isActive={selectedCategory === 'verification-request'}
            onClick={handleCategoryClick}
            tooltip={t.verificationRequestTooltip || '전문가 인증을 신청하세요'}
            tooltipPosition="right"
            className="border-l-4 border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 text-purple-600 dark:text-purple-400 font-semibold hover:scale-[1.02] transition-all duration-200 w-full"
          />
        </div>

        <div className="py-3 space-y-3 border-b border-gray-200/40 dark:border-gray-700/40 border-t border-gray-200/40 dark:border-gray-700/40 mt-2">
          <h3 className="px-4 pb-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            {t.categories || (locale === 'vi' ? 'Danh mục' : locale === 'en' ? 'Categories' : '카테고리')}
          </h3>
          <div className="space-y-1">
            {groupOptions.map((group) => (
              <div key={group.slug} className="space-y-1">
                <CategoryItem
                  id={group.slug}
                  name={group.label}
                  icon={undefined}
                  count={0}
                  isActive={selectedCategory === group.slug}
                  onClick={handleCategoryClick}
                  className="!py-2 font-semibold"
                />
                {group.children.length > 0 && (
                  <div className="space-y-1 pl-4">
                    {group.children.map((child) => {
                      const apiChild = apiBySlug.get(child.slug);
                      const subscribed = apiChild ? subscribedIds.has(apiChild.id) : false;
                      return (
                        <div key={child.slug} className="flex items-center justify-between pr-2 py-1 gap-2">
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
                              className={`text-[11px] min-w-[84px] px-3 py-1.5 rounded-full border transition-colors ${
                                subscribed
                                  ? 'border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20'
                                  : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-amber-400 dark:hover:border-amber-500 hover:text-amber-600 dark:hover:text-amber-400'
                              }`}
                            >
                              {subscribed ? (t.subscribed || '구독중') : `+ ${t.subscribe || '구독'}`}
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
          {mySubs && mySubs.length > 0 ? (
            <div className="space-y-1">
              {mySubs.map((cat) => (
                <div key={cat.id} className="flex items-center justify-between pr-2 pl-0 py-1.5 gap-2">
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
                    className="text-[11px] min-w-[84px] px-3 py-1.5 rounded-full border border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 transition-colors"
                  >
                    {t.subscribed || '구독중'}
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
