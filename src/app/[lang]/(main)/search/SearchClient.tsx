'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useRouter } from 'nextjs-toploader/app';
import Link from 'next/link';
import dayjs from 'dayjs';
import { toast } from 'sonner';
import MainLayout from '@/components/templates/MainLayout';
import PostCard from '@/components/molecules/PostCard';
import { usePosts } from '@/repo/posts/query';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { CATEGORY_GROUPS, LEGACY_CATEGORIES, getCategoryName } from '@/lib/constants/categories';

interface SearchPost {
  id: string;
  title: string;
  content: string;
  tags?: string[];
  thumbnail?: string | null;
  thumbnails?: string[];
  category?: string;
  subcategory?: string;
  imageCount?: number;
  createdAt: string;
  type: 'question' | 'share';
  isResolved?: boolean;
  isLiked?: boolean;
  isBookmarked?: boolean;
  likesCount?: number;
  likes?: number;
  commentsCount?: number;
  author?: {
    id?: string;
    displayName?: string;
    name?: string;
    image?: string;
    isVerified?: boolean;
  };
}

interface SearchClientProps {
  translations: Record<string, unknown>;
  lang: string;
  initialQuery: string;
  initialParentCategory: string;
  initialChildCategory: string;
  initialPage: number;
}

export default function SearchClient({ 
  translations, 
  lang,
  initialQuery,
  initialParentCategory,
  initialChildCategory,
  initialPage,
}: SearchClientProps) {
  const router = useRouter();
  const t = (translations?.search || {}) as Record<string, string>;

  const getGroupLabel = useCallback((group: (typeof CATEGORY_GROUPS)[keyof typeof CATEGORY_GROUPS]) => {
    if (lang === 'vi' && group.label_vi) return group.label_vi;
    if (lang === 'en' && group.label_en) return group.label_en;
    return group.label;
  }, [lang]);

  const parentOptions = useMemo(() => {
    return Object.entries(CATEGORY_GROUPS).map(([slug, group]) => {
      const typedGroup = group as (typeof CATEGORY_GROUPS)[keyof typeof CATEGORY_GROUPS];
      const children = LEGACY_CATEGORIES.filter((cat) => (typedGroup.slugs as readonly string[]).includes(cat.slug));
      return {
        slug,
        label: `${typedGroup.emoji} ${getGroupLabel(typedGroup)}`,
        children,
      };
    });
  }, [getGroupLabel]);

  const childSlugToParent = useMemo(() => {
    const map = new Map<string, string>();
    parentOptions.forEach((opt) => {
      opt.children.forEach((child) => map.set(child.slug, opt.slug));
    });
    return map;
  }, [parentOptions]);

  const resolvedInitial = useMemo(() => {
    const rawChild = initialChildCategory || '';
    const rawParent = initialParentCategory || 'all';

    if (rawChild) {
      const parentSlug = childSlugToParent.get(rawChild) || '';
      return { parent: parentSlug || (rawParent !== 'all' ? rawParent : 'all'), child: rawChild };
    }

    if (rawParent && rawParent !== 'all') {
      if (childSlugToParent.has(rawParent)) {
        const parentSlug = childSlugToParent.get(rawParent) || 'all';
        return { parent: parentSlug, child: rawParent };
      }
      if (parentOptions.some((p) => p.slug === rawParent)) {
        return { parent: rawParent, child: '' };
      }
    }

    return { parent: 'all', child: '' };
  }, [childSlugToParent, initialChildCategory, initialParentCategory, parentOptions]);

  const [query, setQuery] = useState(initialQuery);
  const [parentCategory, setParentCategory] = useState(resolvedInitial.parent);
  const [childCategory, setChildCategory] = useState(resolvedInitial.child);
  const [examplePlaceholder, setExamplePlaceholder] = useState('');

  // 카테고리/소분류별 예시 키 풀을 구성
  const resolveExamplePool = useCallback(() => {
    // 기본 인기/생활 예시 풀
    const basePool = [
      t.exampleLiving,
      t.exampleWork,
      t.exampleStudy,
      t.exampleStudentLife,
      t.popularExample1,
      t.popularExample2,
      t.popularExample3,
    ].filter(Boolean) as string[];

    // 대분류 전용 예시: 예) search.examples.parent.<parentId>1~5 형태로 번역 키 사용
    const parentPool = [
      t[`examples.parent.${parentCategory}.1`],
      t[`examples.parent.${parentCategory}.2`],
      t[`examples.parent.${parentCategory}.3`],
      t[`examples.parent.${parentCategory}.4`],
      t[`examples.parent.${parentCategory}.5`],
    ].filter(Boolean) as string[];

    // 소분류 전용 예시: 예) search.examples.sub.<childId>1~5
    const childPool = [
      t[`examples.sub.${childCategory}.1`],
      t[`examples.sub.${childCategory}.2`],
      t[`examples.sub.${childCategory}.3`],
      t[`examples.sub.${childCategory}.4`],
      t[`examples.sub.${childCategory}.5`],
    ].filter(Boolean) as string[];

    if (childCategory && childPool.length > 0) return childPool;
    if (parentCategory && parentCategory !== 'all' && parentPool.length > 0) return parentPool;
    if (basePool.length > 0) return basePool;
    return [t.searchPlaceholder || '검색어를 입력하세요'];
  }, [childCategory, parentCategory, t]);

  useEffect(() => {
    const pool = resolveExamplePool();
    setExamplePlaceholder(pool[Math.floor(Math.random() * pool.length)] || (t.searchPlaceholder || '검색어를 입력하세요'));
  }, [resolveExamplePool, t.searchPlaceholder]);

  useEffect(() => {
    setQuery(initialQuery);
    setParentCategory(resolvedInitial.parent);
    setChildCategory(resolvedInitial.child);
  }, [initialQuery, resolvedInitial]);

  const filters = useMemo(() => ({
    search: query || undefined,
    parentCategory: parentCategory !== 'all' && !childCategory ? parentCategory : undefined,
    category: childCategory || undefined,
    page: initialPage,
    limit: 20,
  }), [childCategory, initialPage, parentCategory, query]);

  const { data: postsData, isLoading, isError, error } = usePosts(filters, {
    enabled: !!query,
  });
  useEffect(() => {
    if (isError) {
      toast.error(t.searchError || '검색 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.');
    }
  }, [isError, t.searchError, error]);

  const posts = postsData?.data || [];
  const totalPages = postsData?.pagination?.totalPages || 0;

  const handleParentCategoryChangeWithReset = useCallback((category: string) => {
    setParentCategory(category);
    setChildCategory('');
  }, []);

  const selectedParent = parentOptions.find((opt) => opt.slug === parentCategory);
  const childCategories = selectedParent?.children || [];

  const handleSearch = () => {
    if (!query.trim()) {
      toast.error(t.enterKeyword || '검색어를 입력하세요');
      return;
    }
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    if (parentCategory && parentCategory !== 'all') params.set('c', parentCategory);
    if (childCategory) params.set('sc', childCategory);
    router.push(`/${lang}/search?${params.toString()}`);
  };

  const buildPageUrl = (page: number) => {
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    if (parentCategory && parentCategory !== 'all') params.set('c', parentCategory);
    if (childCategory) params.set('sc', childCategory);
    if (page > 1) params.set('page', page.toString());
    return `/${lang}/search?${params.toString()}`;
  };

  const popularKeywords = useMemo(() => {
    return [
      t.popularKeyword1,
      t.popularKeyword2,
      t.popularKeyword3,
      t.popularKeyword4,
      t.popularKeyword5,
    ].filter(Boolean) as string[];
  }, [t.popularKeyword1, t.popularKeyword2, t.popularKeyword3, t.popularKeyword4, t.popularKeyword5]);

  const handleApplyKeyword = (keyword: string) => {
    setQuery(keyword);
    const params = new URLSearchParams();
    params.set('q', keyword);
    if (parentCategory && parentCategory !== 'all') params.set('c', parentCategory);
    if (childCategory) params.set('sc', childCategory);
    router.push(`/${lang}/search?${params.toString()}`);
  };

  return (
    <MainLayout
      selectedCategory={parentCategory}
      onCategoryChange={() => {}}
      hideSidebar={false}
      hideSearch={true}
      translations={translations || {}}
    >
      <div className="px-3 py-6">
        {/* Category Filter - Mobile */}
        <div className="mb-4 flex md:hidden gap-2 px-3">
          <select
            value={parentCategory}
            onChange={(e) => handleParentCategoryChangeWithReset(e.target.value)}
            className="flex-1 appearance-none bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white font-medium outline-none cursor-pointer"
          >
            <option value="all">{t.allCategories || '전체 카테고리'}</option>
            {parentOptions.map((cat) => (
              <option key={cat.slug} value={cat.slug}>{cat.label}</option>
            ))}
          </select>

          {parentCategory !== 'all' && childCategories.length > 0 && (
            <select
              value={childCategory}
              onChange={(e) => setChildCategory(e.target.value)}
                className="flex-1 appearance-none bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white font-medium outline-none cursor-pointer"
            >
              <option value="">{t.subCategories || '하위 카테고리'}</option>
              {childCategories.map((child) => (
                <option key={child.slug} value={child.slug}>{getCategoryName(child, lang)}</option>
              ))}
            </select>
          )}
        </div>

        {/* Search Bar */}
        <div className="mb-6 flex justify-center">
          <div className="flex items-center gap-1.5 bg-white dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-700 px-3 py-1.5 max-w-4xl w-full shadow-sm">
            {/* Category - Desktop */}
            <div className="relative flex-shrink-0 hidden md:block">
              <select
                value={parentCategory}
                onChange={(e) => handleParentCategoryChangeWithReset(e.target.value)}
                className="appearance-none bg-transparent text-sm text-gray-900 dark:text-white font-medium pr-5 pl-0.5 outline-none cursor-pointer"
              >
                <option value="all">{t.categoryLabel || '카테고리'}</option>
                {parentOptions.map((cat) => (
                  <option key={cat.slug} value={cat.slug}>{cat.label}</option>
                ))}
              </select>
              <svg className="absolute right-0.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>

            <div className="w-px h-4 bg-gray-200 dark:bg-gray-700 hidden md:block" />

            {/* Sub Category - Desktop */}
            {parentCategory !== 'all' && childCategories.length > 0 && (
              <>
                <div className="relative flex-shrink-0 hidden md:block">
                  <select
                    value={childCategory}
                    onChange={(e) => setChildCategory(e.target.value)}
                    className="appearance-none bg-transparent text-sm text-gray-900 dark:text-white font-medium pr-5 pl-0.5 outline-none cursor-pointer"
                  >
                    <option value="">{t.subCategoryLabel || '세부'}</option>
                    {childCategories.map((child) => (
                      <option key={child.slug} value={child.slug}>{getCategoryName(child, lang)}</option>
                    ))}
                  </select>
                  <svg className="absolute right-0.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                <div className="w-px h-4 bg-gray-200 dark:bg-gray-700 hidden md:block" />
              </>
            )}

            {/* Search Input */}
            <div className="flex-1 flex items-center gap-2 min-w-0">
              <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder={examplePlaceholder || t.searchPlaceholder || '검색어를 입력하세요'}
                className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none min-w-0"
              />
            </div>

            <button
              onClick={handleSearch}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-full transition-colors flex-shrink-0"
            >
              {t.searchButton || '검색'}
            </button>
          </div>
        </div>

        {popularKeywords.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-2 items-center">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
              {t.popularKeywordsTitle || '인기 검색어'}
            </span>
            {popularKeywords.map((kw) => (
              <button
                key={kw}
                onClick={() => handleApplyKeyword(kw)}
                className="px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                {kw}
              </button>
            ))}
          </div>
        )}

        {/* Search Results */}
        {initialQuery ? (
          <div className="space-y-4">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : posts.length > 0 ? (
              <>
                {posts.map((post: SearchPost) => (
                  <PostCard
                    key={post.id}
                    id={post.id}
                    author={{
                      id: post.author?.id,
                      name: post.author?.displayName || post.author?.name || t.unknownAuthor || 'Unknown',
                      avatar: post.author?.image || '/default-avatar.jpg',
                      followers: 0,
                      isVerified: post.author?.isVerified || false,
                    }}
                    title={post.title}
                    excerpt={post.content.replace(/<img[^>]*>/gi, t.photo || '(Photo)').replace(/<[^>]*>/g, '').substring(0, 200)}
                    tags={post.tags || []}
                    stats={{
                      likes: post.likesCount ?? post.likes ?? 0,
                      comments: post.commentsCount ?? 0,
                      shares: 0,
                    }}
                    category={post.category}
                    subcategory={post.subcategory}
                    thumbnail={post.thumbnail}
                    thumbnails={post.thumbnails}
                    imageCount={post.imageCount}
                    publishedAt={dayjs(post.createdAt).format('YYYY.MM.DD HH:mm')}
                    isQuestion={post.type === 'question'}
                    isAdopted={post.isResolved}
                    isLiked={post.isLiked || false}
                    isBookmarked={post.isBookmarked || false}
                    trustBadge={(post as any).trustBadge}
                    trustWeight={(post as any).trustWeight}
                    translations={translations}
                  />
                ))}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 py-8">
                    {initialPage > 1 && (
                      <Link
                        href={buildPageUrl(initialPage - 1)}
                        className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        {t.previous || 'Previous'}
                      </Link>
                    )}

                    <span className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                      {(t.pageInfo || '{current} / {total} pages').replace('{current}', String(initialPage)).replace('{total}', String(totalPages))}
                    </span>

                    {initialPage < totalPages && (
                      <Link
                        href={buildPageUrl(initialPage + 1)}
                        className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        {t.next || 'Next'}
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">
                  {(t.noResults || 'No results found for "{query}"').replace('{query}', initialQuery)}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-gray-400 dark:text-gray-600 mb-4">
              <svg className="w-24 h-24 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {t.enterKeyword || '검색어를 입력하세요'}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {t.searchPlaceholder || '궁금한 내용을 검색해보세요'}
            </p>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
