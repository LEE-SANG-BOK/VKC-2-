'use client';

import { useMemo } from 'react';
import { useRouter } from 'nextjs-toploader/app';
import { useParams } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import { TrendingUp, Users, MessageCircle, Share2, ShieldCheck, Sparkles, Code, Briefcase, Heart, Gamepad2, Book, Music, Film, Coffee, Home, CreditCard, Stethoscope, Scale, HeartHandshake } from 'lucide-react';
import { LEGACY_CATEGORIES, getCategoryName, CATEGORY_GROUPS } from '@/lib/constants/categories';
import CategoryItem from '../molecules/CategoryItem';
import { useSession } from 'next-auth/react';
import { useCategories } from '@/repo/categories/query';

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

  const menuCategories = [
    { id: 'popular', icon: TrendingUp, count: 0 },
    { id: 'latest', icon: Sparkles, count: 0 },
    { id: 'following', icon: Users, count: 0 },
    { id: 'subscribed', icon: HeartHandshake, count: 0 },
    { id: 'visa-roadmap', icon: ShieldCheck, count: 0 },
  ];

  const sourceCategories: ApiCategory[] = useMemo(() => {
    if (apiCategories && apiCategories.length > 0) return apiCategories;
    return LEGACY_CATEGORIES.map((cat) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      order: (cat as { order?: number }).order || 0,
    }));
  }, [apiCategories]);

  const groupedCategories = useMemo(() => {
    const bySlug = new Map(sourceCategories.map((cat) => [cat.slug, cat]));
    return Object.entries(CATEGORY_GROUPS)
      .map(([key, group]) => ({
        key,
        label: group.label,
        emoji: group.emoji,
        items: group.slugs
          .map((slug) => bySlug.get(slug))
          .filter(Boolean)
          .sort((a, b) => (a?.order || 0) - (b?.order || 0)) as ApiCategory[],
      }))
      .filter((g) => g.items.length > 0);
  }, [sourceCategories]);

  // Helper to get translated category name
  const getTranslatedCategoryName = (cat: ApiCategory): string => {
    const legacyCategory = LEGACY_CATEGORIES.find(lc => lc.id === cat.id || lc.slug === cat.slug);
    if (legacyCategory) {
      return getCategoryName(legacyCategory, locale);
    }
    return cat.name;
  };

  // 아이콘 매핑 (기본 아이콘들)
  const iconMap: Record<string, LucideIcon> = {
    tech: Code,
    business: Briefcase,
    lifestyle: Heart,
    gaming: Gamepad2,
    education: Book,
    music: Music,
    movie: Film,
    food: Coffee,
    'korean-language': Book,
    visa: ShieldCheck,
    employment: Briefcase,
    housing: Home,
    'daily-life': HeartHandshake,
    finance: CreditCard,
    healthcare: Stethoscope,
    legal: Scale,
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

    if (categoryId === 'visa-roadmap') {
      router.push(`/${locale}/guide/visa-roadmap`);
      return;
    }
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
        <div className="py-2 space-y-1">
          <CategoryItem
            id="ask-question"
            name={t.askQuestion || '질문하기'}
            icon={MessageCircle}
            count={0}
            isActive={false}
            onClick={handleCategoryClick}
            tooltip={t.askQuestionTooltip || '커뮤니티에 질문을 올려보세요'}
            tooltipPosition="right"
            className="border-l-4 border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 text-orange-600 dark:text-orange-400 font-semibold hover:scale-[1.02] transition-all duration-200"
          />
        </div>

        <div className="py-2 space-y-1">
          <CategoryItem
            id="share-post"
            name={t.sharePost || '게시글 공유'}
            icon={Share2}
            count={0}
            isActive={false}
            onClick={handleCategoryClick}
            tooltip={t.sharePostTooltip || '유용한 정보를 공유해주세요'}
            tooltipPosition="right"
            className="border-l-4 border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 text-green-600 dark:text-green-400 font-semibold hover:scale-[1.02] transition-all duration-200"
          />
        </div>

        <div className="py-2 space-y-1">
          <CategoryItem
            id="verification-request"
            name={t.verificationRequest || '인증 요청'}
            icon={ShieldCheck}
            count={0}
            isActive={selectedCategory === 'verification-request'}
            onClick={handleCategoryClick}
            tooltip={t.verificationRequestTooltip || '전문가 인증을 신청하세요'}
            tooltipPosition="right"
            className="border-l-4 border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 text-purple-600 dark:text-purple-400 font-semibold hover:scale-[1.02] transition-all duration-200"
          />
        </div>

        <div className="py-4 pb-16 space-y-3">
          <h3 className="px-4 pb-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            {t.categories || '카테고리'}
          </h3>
          {groupedCategories.map((group) => (
            <div key={group.key} className="space-y-1">
              <div className="px-4 text-xs font-semibold text-gray-600 dark:text-gray-300 flex items-center gap-2">
                <span>{group.emoji}</span>
                <span>{group.label}</span>
              </div>
              {group.items.map((cat) => (
                <CategoryItem
                  key={cat.id}
                  id={cat.id}
                  name={getTranslatedCategoryName(cat)}
                  icon={iconMap[cat.slug] || ShieldCheck}
                  count={0}
                  isActive={selectedCategory === cat.id}
                  onClick={handleCategoryClick}
                />
              ))}
            </div>
          ))}
        </div>
      </aside>
    </>
  );
}
