'use client';

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'nextjs-toploader/app';
import Link from 'next/link';
import dayjs from 'dayjs';
import { toast } from 'sonner';
import MainLayout from '@/components/templates/MainLayout';
import PostCard from '@/components/molecules/cards/PostCard';
import { usePosts } from '@/repo/posts/query';
import { useSearchKeywords } from '@/repo/search/query';
import { logEvent } from '@/repo/events/mutation';
import type { PostListItem } from '@/repo/posts/types';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { CATEGORY_GROUPS, LEGACY_CATEGORIES, getCategoryName } from '@/lib/constants/categories';

const MIN_SEARCH_QUERY_LENGTH = 2;

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
  const tCommon = (translations?.common || {}) as Record<string, string>;
  const tTooltips = (translations?.tooltips || {}) as Record<string, string>;
  const searchFallbacks = useMemo(() => {
    if (lang === 'en') {
      return {
        searchPlaceholder: 'Search for anything.',
        searchPlaceholderShort: 'Search...',
        searchButton: 'Search',
        allCategories: 'All Categories',
        subCategories: 'Subcategories',
        categoryLabel: 'Category',
        subCategoryLabel: 'Sub',
        enterKeyword: 'Enter search keyword',
        enterKeywordMin: `Please enter at least ${MIN_SEARCH_QUERY_LENGTH} characters.`,
        enterKeywordMinSearch: `Please enter at least ${MIN_SEARCH_QUERY_LENGTH} characters to search.`,
        searchError: 'Something went wrong while searching. Please try again shortly.',
        popularKeywordsTitle: 'Popular searches',
        fallbackFiltersLabel: 'Applied filters',
        fallbackTokensLabel: 'Search keywords',
        fallbackReasonPopular: 'No close matches, so we\'re surfacing popular questions.',
        fallbackNotice: 'No close matches — showing popular questions instead.',
        noResults: 'No results found for "{query}"',
        previous: 'Previous',
        next: 'Next',
        pageInfo: '{current} / {total} pages',
        unknownAuthor: 'Unknown',
        photo: '(Photo)',
        suggestionTitle: 'Autocomplete',
        suggestionTag: 'Tag',
        suggestionCategory: 'Category',
        suggestionSubcategory: 'Subcategory',
        suggestionEmpty: 'No suggestions yet.',
        suggestionLoading: 'Loading...',
      };
    }
    if (lang === 'vi') {
      return {
        searchPlaceholder: 'Tìm kiếm bất cứ điều gì.',
        searchPlaceholderShort: 'Tìm kiếm...',
        searchButton: 'Tìm kiếm',
        allCategories: 'Tất cả danh mục',
        subCategories: 'Danh mục phụ',
        categoryLabel: 'Danh mục',
        subCategoryLabel: 'Danh mục con',
        enterKeyword: 'Nhập từ khóa tìm kiếm',
        enterKeywordMin: `Vui lòng nhập ít nhất ${MIN_SEARCH_QUERY_LENGTH} ký tự.`,
        enterKeywordMinSearch: `Vui lòng nhập ít nhất ${MIN_SEARCH_QUERY_LENGTH} ký tự để tìm kiếm.`,
        searchError: 'Đã xảy ra lỗi khi tìm kiếm. Vui lòng thử lại sau.',
        popularKeywordsTitle: 'Tìm kiếm phổ biến',
        fallbackFiltersLabel: 'Bộ lọc áp dụng',
        fallbackTokensLabel: 'Từ khóa tìm kiếm',
        fallbackReasonPopular: 'Không có kết quả tương đồng nên đang hiển thị câu hỏi phổ biến.',
        fallbackNotice: 'Không có kết quả phù hợp — hiển thị câu hỏi phổ biến.',
        noResults: 'Không tìm thấy kết quả cho "{query}"',
        previous: 'Trước',
        next: 'Tiếp',
        pageInfo: '{current} / {total} trang',
        unknownAuthor: 'Không xác định',
        photo: '(Ảnh)',
        suggestionTitle: 'Gợi ý',
        suggestionTag: 'Thẻ',
        suggestionCategory: 'Danh mục',
        suggestionSubcategory: 'Danh mục con',
        suggestionEmpty: 'Chưa có gợi ý.',
        suggestionLoading: 'Đang tải...',
      };
    }
    return {
      searchPlaceholder: '궁금한 내용을 검색해보세요.',
      searchPlaceholderShort: '검색...',
      searchButton: '검색',
      allCategories: '전체 분류',
      subCategories: '세부 분류',
      categoryLabel: '분류',
      subCategoryLabel: '세부',
      enterKeyword: '검색어를 입력하세요',
      enterKeywordMin: `검색어를 ${MIN_SEARCH_QUERY_LENGTH}자 이상 입력하세요.`,
      enterKeywordMinSearch: `검색어를 ${MIN_SEARCH_QUERY_LENGTH}자 이상 입력해주세요.`,
      searchError: '검색 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.',
      popularKeywordsTitle: '인기 검색어',
      fallbackFiltersLabel: '적용된 필터',
      fallbackTokensLabel: '검색 키워드',
      fallbackReasonPopular: '검색어와 딱 맞는 결과가 없으므로 인기 질문을 보여드려요.',
      fallbackNotice: '정확히 일치하는 결과가 없어 인기 질문을 보여드려요.',
      noResults: '"{query}"에 대한 검색 결과가 없습니다',
      previous: '이전',
      next: '다음',
      pageInfo: '{current} / {total} 페이지',
      unknownAuthor: '알 수 없음',
      photo: '(사진)',
      suggestionTitle: '자동완성',
      suggestionTag: '태그',
      suggestionCategory: '카테고리',
      suggestionSubcategory: '세부',
      suggestionEmpty: '추천 결과가 없습니다.',
      suggestionLoading: '로딩 중...',
    };
  }, [lang]);
  const searchPlaceholderLabel = t.searchPlaceholder || searchFallbacks.searchPlaceholder;
  const searchButtonLabel = t.searchButton || searchFallbacks.searchButton;
  const allCategoriesLabel = t.allCategories || searchFallbacks.allCategories;
  const subCategoriesLabel = t.subCategories || searchFallbacks.subCategories;
  const categoryLabel = t.categoryLabel || searchFallbacks.categoryLabel;
  const subCategoryLabel = t.subCategoryLabel || searchFallbacks.subCategoryLabel;
  const enterKeywordLabel = t.enterKeyword || searchFallbacks.enterKeyword;
  const enterKeywordMinLabel = searchFallbacks.enterKeywordMin;
  const enterKeywordMinSearchLabel = searchFallbacks.enterKeywordMinSearch;
  const searchErrorLabel = t.searchError || searchFallbacks.searchError;
  const popularKeywordsTitle = t.popularKeywordsTitle || searchFallbacks.popularKeywordsTitle;
  const fallbackFiltersLabel = t.fallbackFiltersLabel || searchFallbacks.fallbackFiltersLabel;
  const fallbackTokensLabel = t.fallbackTokensLabel || searchFallbacks.fallbackTokensLabel;
  const fallbackNoticeLabel = t.fallbackNotice || searchFallbacks.fallbackNotice;
  const fallbackReasonPopularLabel = t.fallbackReasonPopular || searchFallbacks.fallbackReasonPopular;
  const noResultsLabel = t.noResults || searchFallbacks.noResults;
  const previousLabel = t.previous || searchFallbacks.previous;
  const nextLabel = t.next || searchFallbacks.next;
  const pageInfoLabel = t.pageInfo || searchFallbacks.pageInfo;
  const unknownAuthorLabel = t.unknownAuthor || searchFallbacks.unknownAuthor;
  const photoLabel = t.photo || searchFallbacks.photo;

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
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [isSuggestionOpen, setIsSuggestionOpen] = useState(false);
  const lastLoggedRef = useRef('');
  const activeQuery = initialQuery;
  const activeQueryTrimmed = activeQuery.trim();
  const activeParentCategory = initialParentCategory;
  const activeChildCategory = initialChildCategory;
  const isActiveQueryValid = activeQueryTrimmed.length >= MIN_SEARCH_QUERY_LENGTH;
  const trimmedQuery = query.trim();
  const debouncedTrimmedQuery = debouncedQuery.trim();
  const shouldSuggest = debouncedTrimmedQuery.length >= MIN_SEARCH_QUERY_LENGTH;

  useEffect(() => {
    const basePool = [
      t.exampleLiving,
      t.exampleWork,
      t.exampleStudy,
      t.exampleStudentLife,
      t.popularExample1,
      t.popularExample2,
      t.popularExample3,
    ].filter(Boolean) as string[];

    const parentPool = [
      t[`examples.parent.${parentCategory}.1`],
      t[`examples.parent.${parentCategory}.2`],
      t[`examples.parent.${parentCategory}.3`],
      t[`examples.parent.${parentCategory}.4`],
      t[`examples.parent.${parentCategory}.5`],
    ].filter(Boolean) as string[];

    const childPool = [
      t[`examples.sub.${childCategory}.1`],
      t[`examples.sub.${childCategory}.2`],
      t[`examples.sub.${childCategory}.3`],
      t[`examples.sub.${childCategory}.4`],
      t[`examples.sub.${childCategory}.5`],
    ].filter(Boolean) as string[];

    const pool =
      childCategory && childPool.length > 0
        ? childPool
        : parentCategory && parentCategory !== 'all' && parentPool.length > 0
          ? parentPool
          : basePool.length > 0
            ? basePool
            : [searchPlaceholderLabel];

    setExamplePlaceholder(pool[Math.floor(Math.random() * pool.length)] || searchPlaceholderLabel);
  }, [childCategory, parentCategory, searchPlaceholderLabel, t]);

  useEffect(() => {
    setQuery(initialQuery);
    setParentCategory(resolvedInitial.parent);
    setChildCategory(resolvedInitial.child);
  }, [initialQuery, resolvedInitial]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (!isInputFocused) {
      setIsSuggestionOpen(false);
      return;
    }
    if (query.trim().length >= MIN_SEARCH_QUERY_LENGTH) {
      setIsSuggestionOpen(true);
    } else {
      setIsSuggestionOpen(false);
    }
  }, [isInputFocused, query]);

  const filters = useMemo(() => ({
    search: activeQueryTrimmed || undefined,
    parentCategory: activeParentCategory !== 'all' ? activeParentCategory : undefined,
    category: activeChildCategory || undefined,
    page: initialPage,
    limit: 20,
  }), [activeChildCategory, activeParentCategory, activeQueryTrimmed, initialPage]);

  const { data: postsData, isLoading, isError, error } = usePosts(filters, {
    enabled: isActiveQueryValid,
  });
  const { data: keywordSuggestionsData, isFetching: isSuggestionsFetching } = useSearchKeywords(
    { q: shouldSuggest ? debouncedTrimmedQuery : undefined, limit: 8 },
    { enabled: shouldSuggest }
  );
  const { data: keywordRecommendationsData } = useSearchKeywords({ limit: 10 });

  const suggestionLabels = {
    title: t.suggestionTitle || searchFallbacks.suggestionTitle,
    tag: t.suggestionTag || searchFallbacks.suggestionTag,
    category: t.suggestionCategory || searchFallbacks.suggestionCategory,
    subcategory: t.suggestionSubcategory || searchFallbacks.suggestionSubcategory,
    empty: t.suggestionEmpty || searchFallbacks.suggestionEmpty,
    loading: t.suggestionLoading || searchFallbacks.suggestionLoading,
  };
  useEffect(() => {
    if (isError) {
      toast.error(searchErrorLabel);
    }
  }, [isError, searchErrorLabel, error]);

  const keywordSuggestions = useMemo(() => {
    const keywords = keywordSuggestionsData?.data?.keywords || [];
    const seen = new Set<string>();
    return keywords
      .map((item) => {
        const rawValue = item.value?.trim() || '';
        if (!rawValue) return null;
        const key = rawValue.toLowerCase();
        if (seen.has(key)) return null;
        seen.add(key);
        const categoryMatch = LEGACY_CATEGORIES.find((cat) => cat.slug === rawValue);
        const display =
          item.source === 'tag'
            ? rawValue
            : categoryMatch
              ? getCategoryName(categoryMatch, lang)
              : rawValue;
        return {
          ...item,
          display,
        };
      })
      .filter(Boolean) as Array<{ value: string; count: number; source: string; display: string }>;
  }, [keywordSuggestionsData, lang]);

  const posts = postsData?.data || [];
  const totalPages = postsData?.pagination?.totalPages || 0;
  const fallbackMeta = postsData?.meta as
    | {
        isFallback?: boolean;
        reason?: string;
        tokens?: string[];
        query?: string | null;
        fallbackFilters?: { type?: string | null; category?: string | null };
      }
    | undefined;
  const isFallback = Boolean(fallbackMeta?.isFallback);
  const fallbackTokens = useMemo(() => {
    if (!fallbackMeta?.tokens || !Array.isArray(fallbackMeta.tokens)) return [];
    return (fallbackMeta.tokens as string[])
      .map((token) => token?.trim())
      .filter((token): token is string => Boolean(token))
      .slice(0, 6);
  }, [fallbackMeta?.tokens]);
  const questionLabel = tCommon.question || '';
  const shareLabel = tTooltips.share || '';
  const filterLabels = useMemo(() => {
    const filters = fallbackMeta?.fallbackFilters;
    if (!filters) return [];
    const labels: string[] = [];
    if (filters.type) {
      const typeMap: Record<string, string> = {
        question: questionLabel,
        share: shareLabel,
      };
      labels.push(typeMap[filters.type] || filters.type);
    }
    if (filters.category) {
      const child = LEGACY_CATEGORIES.find((cat) => cat.slug === filters.category);
      if (child) {
        labels.push(getCategoryName(child, lang));
      } else {
        labels.push(filters.category);
      }
    }
    return labels;
  }, [fallbackMeta?.fallbackFilters, lang, questionLabel, shareLabel]);
  const fallbackReasonText = fallbackMeta?.reason === 'popular'
    ? fallbackReasonPopularLabel
    : fallbackNoticeLabel;

  useEffect(() => {
    if (!isActiveQueryValid || isLoading || !postsData) return;
    const key = [activeQueryTrimmed, activeParentCategory, activeChildCategory, initialPage].join('|');
    if (!activeQueryTrimmed || lastLoggedRef.current === key) return;
    lastLoggedRef.current = key;
    logEvent({
      eventType: 'search',
      entityType: 'search',
      locale: lang,
      referrer: typeof document !== 'undefined' ? document.referrer : '',
      metadata: {
        query: activeQueryTrimmed,
        parentCategory: activeParentCategory !== 'all' ? activeParentCategory : null,
        childCategory: activeChildCategory || null,
        page: initialPage,
        resultCount: postsData.data?.length || 0,
        isFallback: fallbackMeta?.isFallback ?? false,
        reason: fallbackMeta?.reason ?? null,
        tokens: fallbackMeta?.tokens ?? null,
      },
    });
  }, [
    activeQueryTrimmed,
    activeParentCategory,
    activeChildCategory,
    initialPage,
    isActiveQueryValid,
    isLoading,
    postsData,
    fallbackMeta,
    lang,
  ]);

  const handleParentCategoryChangeWithReset = useCallback((category: string) => {
    setParentCategory(category);
    setChildCategory('');
  }, []);

  const selectedParent = parentOptions.find((opt) => opt.slug === parentCategory);
  const childCategories = selectedParent?.children || [];

  const handleSearch = () => {
    const trimmedQuery = query.trim();
    if (trimmedQuery.length < MIN_SEARCH_QUERY_LENGTH) {
      toast.error(t.enterKeyword || enterKeywordMinLabel);
      return;
    }
    const params = new URLSearchParams();
    params.set('q', trimmedQuery);
    if (parentCategory && parentCategory !== 'all') params.set('c', parentCategory);
    if (childCategory) params.set('sc', childCategory);
    router.push(`/${lang}/search?${params.toString()}`);
  };

  const handleInputFocus = () => {
    setIsInputFocused(true);
  };

  const handleInputBlur = () => {
    setIsInputFocused(false);
    setTimeout(() => {
      setIsSuggestionOpen(false);
    }, 150);
  };

  const handleInputChange = (value: string) => {
    setQuery(value);
    if (value.trim().length >= MIN_SEARCH_QUERY_LENGTH) {
      setIsSuggestionOpen(true);
    }
  };

  const buildPageUrl = (page: number) => {
    const params = new URLSearchParams();
    if (activeQueryTrimmed) params.set('q', activeQueryTrimmed);
    if (activeParentCategory && activeParentCategory !== 'all') params.set('c', activeParentCategory);
    if (activeChildCategory) params.set('sc', activeChildCategory);
    if (page > 1) params.set('page', page.toString());
    return `/${lang}/search?${params.toString()}`;
  };

  const popularKeywords = [
    t.popularKeyword1,
    t.popularKeyword2,
    t.popularKeyword3,
    t.popularKeyword4,
    t.popularKeyword5,
  ].filter(Boolean) as string[];

  const recommendedKeywords = (() => {
    const apiKeywords = keywordRecommendationsData?.data?.keywords || [];
    const values = apiKeywords.length > 0 ? apiKeywords.map((item) => item.value) : popularKeywords;
    const seen = new Set<string>();
    return values
      .map((value) => value?.trim())
      .filter((value): value is string => Boolean(value))
      .filter((value) => {
        const key = value.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 10);
  })();

  const handleApplyKeyword = (keyword: string) => {
    setQuery(keyword);
    setIsSuggestionOpen(false);
    setIsInputFocused(false);
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
        <h1 className="sr-only">{searchButtonLabel}</h1>
        {/* Category Filter - Mobile */}
        <div className="mb-4 flex md:hidden gap-2 px-3">
          <select
            value={parentCategory}
            onChange={(e) => handleParentCategoryChangeWithReset(e.target.value)}
            aria-label={categoryLabel}
            className="flex-1 appearance-none bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white font-medium outline-none cursor-pointer"
          >
            <option value="all">{allCategoriesLabel}</option>
            {parentOptions.map((cat) => (
              <option key={cat.slug} value={cat.slug}>{cat.label}</option>
            ))}
          </select>

          {parentCategory !== 'all' && childCategories.length > 0 && (
            <select
              value={childCategory}
              onChange={(e) => setChildCategory(e.target.value)}
              aria-label={subCategoriesLabel}
              className="flex-1 appearance-none bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white font-medium outline-none cursor-pointer"
            >
              <option value="">{subCategoriesLabel}</option>
              {childCategories.map((child) => (
                <option key={child.slug} value={child.slug}>{getCategoryName(child, lang)}</option>
              ))}
            </select>
          )}
        </div>

        {/* Search Bar */}
        <div className="mb-6 flex justify-center">
          <div className="relative max-w-4xl w-full">
            <div className="flex items-center gap-1.5 bg-white dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-700 px-3 py-1.5 w-full shadow-sm">
            {/* Category - Desktop */}
            <div className="relative flex-shrink-0 hidden md:block">
              <select
                value={parentCategory}
                onChange={(e) => handleParentCategoryChangeWithReset(e.target.value)}
                aria-label={categoryLabel}
                className="appearance-none bg-transparent text-sm text-gray-900 dark:text-white font-medium pr-5 pl-0.5 outline-none cursor-pointer"
              >
                <option value="all">{categoryLabel}</option>
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
                    aria-label={subCategoryLabel}
                    className="appearance-none bg-transparent text-sm text-gray-900 dark:text-white font-medium pr-5 pl-0.5 outline-none cursor-pointer"
                  >
                    <option value="">{subCategoryLabel}</option>
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
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSearch();
                  }
                }}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                onClick={handleInputFocus}
                placeholder={examplePlaceholder || searchPlaceholderLabel}
                aria-label={searchPlaceholderLabel}
                className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none min-w-0"
              />
            </div>

            <button
              onClick={handleSearch}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-full transition-colors flex-shrink-0"
            >
              {searchButtonLabel}
            </button>
          </div>
            {isSuggestionOpen && shouldSuggest ? (
              <div className="absolute left-0 right-0 top-full mt-2 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-xl z-20 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200/60 dark:border-gray-800/60">
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                    {suggestionLabels.title}
                  </span>
                  {isSuggestionsFetching ? (
                    <span className="text-[11px] text-gray-400 dark:text-gray-500">{suggestionLabels.loading}</span>
                  ) : null}
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {keywordSuggestions.length > 0 ? (
                    keywordSuggestions.map((item) => {
                      const sourceLabel =
                        item.source === 'tag'
                          ? suggestionLabels.tag
                          : item.source === 'category'
                            ? suggestionLabels.category
                            : suggestionLabels.subcategory;
                      const displayValue = item.source === 'tag' ? `#${item.display}` : item.display;
                      return (
                        <button
                          key={`${item.source}-${item.value}`}
                          type="button"
                          onMouseDown={() => handleApplyKeyword(item.value)}
                          className="w-full flex items-center justify-between gap-3 px-4 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                        >
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{displayValue}</span>
                          <span className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-2">
                            <span className="rounded-full border border-gray-200 dark:border-gray-700 px-2 py-0.5">
                              {sourceLabel}
                            </span>
                            <span>{item.count}</span>
                          </span>
                        </button>
                      );
                    })
                  ) : (
                    <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {suggestionLabels.empty}
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {recommendedKeywords.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-2 items-center">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
              {popularKeywordsTitle}
            </span>
            {recommendedKeywords.map((kw) => (
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
          !isActiveQueryValid ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">
                {enterKeywordMinSearchLabel}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <div className="h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : posts.length > 0 ? (
                <>
                {isFallback && (
                  <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/60 dark:bg-amber-900/20 px-4 py-3 space-y-2 text-sm text-amber-900 dark:text-amber-100">
                    <p className="font-semibold">
                      {fallbackReasonText}
                    </p>
                    {filterLabels.length > 0 && (
                      <p className="text-xs text-gray-800 dark:text-gray-200">
                        {fallbackFiltersLabel + ': ' + filterLabels.join(', ')}
                      </p>
                    )}
                    {fallbackTokens.length > 0 && (
                      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-800 dark:text-gray-200">
                        <span className="font-semibold text-amber-900 dark:text-amber-100">
                          {fallbackTokensLabel}:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {fallbackTokens.map((token) => (
                            <span
                              key={token}
                              className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white dark:bg-gray-800 px-2 py-0.5 text-[11px] text-gray-600 dark:text-gray-300"
                            >
                              #{token}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {posts.map((post: PostListItem) => (
                  <PostCard
                    key={post.id}
                    id={post.id}
                    author={{
                      id: post.author?.id,
                      name: post.author?.displayName || post.author?.name || unknownAuthorLabel,
                      avatar: post.author?.image || '/default-avatar.jpg',
                      followers: 0,
                      isVerified: post.author?.isVerified || false,
                    }}
                    title={post.title}
                    excerpt={post.excerpt || (post.content || '').replace(/<img[^>]*>/gi, photoLabel).replace(/<[^>]*>/g, '').substring(0, 200)}
                    tags={post.tags || []}
                    stats={{
                      likes: post.likesCount ?? post.likes ?? 0,
                      comments: post.type === 'question'
                        ? (post.answersCount ?? post.commentsCount ?? 0)
                        : (post.commentsCount ?? 0),
                      shares: 0,
                    }}
                    category={post.category}
                    subcategory={post.subcategory || undefined}
                    thumbnail={post.thumbnail}
                    thumbnails={post.thumbnails}
                    imageCount={post.imageCount}
                    officialAnswerCount={post.officialAnswerCount}
                    reviewedAnswerCount={post.reviewedAnswerCount}
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
                        {previousLabel}
                      </Link>
                    )}

                    <span className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                      {pageInfoLabel.replace('{current}', String(initialPage)).replace('{total}', String(totalPages))}
                    </span>

                    {initialPage < totalPages && (
                      <Link
                        href={buildPageUrl(initialPage + 1)}
                        className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        {nextLabel}
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">
                  {noResultsLabel.replace('{query}', initialQuery)}
                </p>
              </div>
            )}
            </div>
          )
        ) : (
          <div className="text-center py-16">
            <div className="text-gray-400 dark:text-gray-600 mb-4">
              <svg className="w-24 h-24 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {enterKeywordLabel}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {searchPlaceholderLabel}
            </p>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
