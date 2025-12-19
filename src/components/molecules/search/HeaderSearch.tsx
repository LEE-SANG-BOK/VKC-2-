'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'nextjs-toploader/app';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { pickExampleQuestion } from '@/lib/constants/search-examples';
import { LEGACY_CATEGORIES, CATEGORY_GROUPS } from '@/lib/constants/categories';
import { useSearchExamples } from '@/repo/search/query';
import type { Locale } from '@/i18n/config';

interface HeaderSearchProps {
  locale: Locale;
  translations: Record<string, unknown>;
}

type CategoryLike = {
  slug?: string;
  name?: string;
  name_en?: string;
  name_vi?: string;
};

const MIN_SEARCH_QUERY_LENGTH = 2;
const isLowQualityExample = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return true;
  const normalized = trimmed.replace(/[\s\p{P}\p{S}]/gu, '');
  if (normalized.length < 6) return true;
  if (normalized.length > 80) return true;
  if (/(.)\1{4,}/u.test(normalized)) return true;
  if (/(.{1,3})\1{3,}/u.test(normalized)) return true;
  const uniqueCount = new Set(normalized).size;
  return uniqueCount <= Math.max(2, Math.floor(normalized.length * 0.2));
};

export default function HeaderSearch({ locale, translations }: HeaderSearchProps) {
  const tSearch = (translations?.search || {}) as Record<string, string>;
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchFallbacks = useMemo(() => {
    if (locale === 'en') {
      return {
        categoryLabel: 'Categories',
        subCategoryLabel: 'Subcategory',
        searchPlaceholder: 'Search for anything',
        searchButton: 'Search',
      };
    }
    if (locale === 'vi') {
      return {
        categoryLabel: 'Danh mục',
        subCategoryLabel: 'Danh mục con',
        searchPlaceholder: 'Nhập từ khóa tìm kiếm',
        searchButton: 'Tìm kiếm',
      };
    }
    return {
      categoryLabel: '분류',
      subCategoryLabel: '하위 카테고리',
      searchPlaceholder: '검색어를 입력하세요',
      searchButton: '검색',
    };
  }, [locale]);
  const searchLabels = {
    category: tSearch.categoryLabel || searchFallbacks.categoryLabel,
    subCategory: tSearch.subCategoryLabel || searchFallbacks.subCategoryLabel,
    placeholder: tSearch.searchPlaceholder || searchFallbacks.searchPlaceholder,
    button: tSearch.searchButton || searchFallbacks.searchButton,
  };

  const [exampleText, setExampleText] = useState('');
  const [searchKeyword, setSearchKeyword] = useState(searchParams.get('q') || searchParams.get('s') || '');
  const [parentCategory, setParentCategory] = useState('all');
  const [childCategory, setChildCategory] = useState('');
  const { data: exampleData } = useSearchExamples({ limit: 8, period: 'week' });

  const getCategoryLabel = (cat?: CategoryLike | null) => {
    const base = LEGACY_CATEGORIES.find((c) => c.slug === cat?.slug);
    if (base) {
      if (locale === 'vi' && base.name_vi) return base.name_vi;
      if (locale === 'en' && base.name_en) return base.name_en;
      return base.name;
    }
    if (!cat) return '';
    if (locale === 'vi' && cat.name_vi) return cat.name_vi;
    if (locale === 'en' && cat.name_en) return cat.name_en;
    return cat.name || '';
  };

  const getGroupLabel = useCallback(
    (group: (typeof CATEGORY_GROUPS)[keyof typeof CATEGORY_GROUPS]) => {
      if (locale === 'vi' && group.label_vi) return group.label_vi;
      if (locale === 'en' && group.label_en) return group.label_en;
      return group.label;
    },
    [locale]
  );

  const parentOptions = useMemo(() => {
    return Object.entries(CATEGORY_GROUPS).map(([slug, group]) => {
      const slugs = Array.from(group.slugs) as Array<(typeof LEGACY_CATEGORIES)[number]['slug']>;
      const groupLabel = `${group.emoji} ${getGroupLabel(group)}`;
      const children = LEGACY_CATEGORIES.filter((cat) => slugs.includes(cat.slug));
      return {
        id: slug,
        slug,
        label: groupLabel,
        children,
      };
    });
  }, [getGroupLabel]);

  const handleParentCategoryChange = (category: string) => {
    setParentCategory(category);
    setChildCategory('');
  };

  const selectedParent = parentOptions.find((opt) => opt.id === parentCategory);
  const childCategories = selectedParent?.children || [];

  const executeSearch = useCallback(() => {
    const trimmedQuery = searchKeyword.trim();
    if (trimmedQuery.length === 0) {
      const fallbackMessage =
        locale === 'vi'
          ? 'Vui lòng nhập từ khóa.'
          : locale === 'en'
            ? 'Please enter a search keyword.'
            : '검색어를 입력하세요.';
      toast.error(tSearch.enterKeyword || fallbackMessage);
      return;
    }

    if (trimmedQuery.length < MIN_SEARCH_QUERY_LENGTH) {
      const fallbackMessage =
        locale === 'vi'
          ? `Vui lòng nhập ít nhất ${MIN_SEARCH_QUERY_LENGTH} ký tự.`
          : locale === 'en'
            ? `Please enter at least ${MIN_SEARCH_QUERY_LENGTH} characters.`
            : `검색어를 ${MIN_SEARCH_QUERY_LENGTH}자 이상 입력하세요.`;
      toast.error(fallbackMessage);
      return;
    }

    const params = new URLSearchParams();

    params.set('q', trimmedQuery);

    if (parentCategory !== 'all') {
      params.set('c', parentCategory);
    }

    if (childCategory) {
      params.set('sc', childCategory);
    }

    router.push(`/${locale}/search?${params.toString()}`);
  }, [childCategory, locale, parentCategory, router, searchKeyword, tSearch.enterKeyword]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchKeyword(value);
    setIsExampleActive(false);
    setHasSearchFocused(true);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      executeSearch();
    }
  };

  const dynamicExamples = useMemo(() => {
    const examples = exampleData?.data?.examples || [];
    return examples
      .map((example) => example.title)
      .filter((title): title is string => Boolean(title) && !isLowQualityExample(title));
  }, [exampleData]);

  const examplePool = useMemo(() => {
    if (dynamicExamples.length > 0) return dynamicExamples;
    const pool = [
      tSearch.exampleLiving,
      tSearch.exampleWork,
      tSearch.exampleStudy,
      tSearch.exampleStudentLife,
      tSearch.popularExample1,
      tSearch.popularExample2,
      tSearch.popularExample3,
    ].filter((value): value is string => Boolean(value) && !isLowQualityExample(value));
    return pool.length > 0 ? pool : null;
  }, [
    dynamicExamples,
    tSearch.exampleLiving,
    tSearch.exampleWork,
    tSearch.exampleStudy,
    tSearch.exampleStudentLife,
    tSearch.popularExample1,
    tSearch.popularExample2,
    tSearch.popularExample3,
  ]);
  const getRandomExample = useCallback(() => {
    if (examplePool && examplePool.length > 0) {
      return examplePool[Math.floor(Math.random() * examplePool.length)];
    }
    return searchLabels.placeholder;
  }, [examplePool, searchLabels.placeholder]);

  useEffect(() => {
    const urlKeyword = searchParams.get('q') || searchParams.get('s');
    if (urlKeyword !== null && urlKeyword !== searchKeyword) {
      setSearchKeyword(urlKeyword);
    }
  }, [searchParams, searchKeyword]);

  const [isExampleActive, setIsExampleActive] = useState(false);
  const [exampleCategory, setExampleCategory] = useState<string>('');
  const [hasSearchFocused, setHasSearchFocused] = useState(false);
  const groupDefaultSlug: Record<string, string> = useMemo(
    () => ({
      visa: 'visa-process',
      living: 'cost-of-living',
      career: 'business',
      students: 'scholarship',
    }),
    []
  );

  useEffect(() => {
    const pickFallbackExample = () => getRandomExample() || '';
    const resolveSlug = () => {
      if (childCategory) {
        return childCategory;
      }
      if (parentCategory && parentCategory !== 'all') {
        const mapped = groupDefaultSlug[parentCategory];
        if (mapped) return mapped;
      }
      return '';
    };

    const categorySlug = resolveSlug();
    const categoryExample = categorySlug ? pickExampleQuestion(categorySlug, locale) : '';
    const fallbackExample = categoryExample && !isLowQualityExample(categoryExample) ? categoryExample : pickFallbackExample();
    const example = dynamicExamples.length > 0 ? pickFallbackExample() : fallbackExample;

    if (exampleCategory !== categorySlug) {
      setExampleCategory(categorySlug);
    }
    if (exampleText !== (example || '')) {
      setExampleText(example || '');
    }
  }, [parentCategory, childCategory, exampleCategory, exampleText, getRandomExample, locale, groupDefaultSlug, dynamicExamples.length]);

  useEffect(() => {
    if (hasSearchFocused || searchKeyword.trim().length > 0) {
      if (isExampleActive) setIsExampleActive(false);
      return;
    }
    setIsExampleActive(Boolean(exampleText));
  }, [exampleText, hasSearchFocused, isExampleActive, searchKeyword]);

  const handleSearchFocus = () => {
    setHasSearchFocused(true);
    setIsExampleActive(false);
  };

  const handleSearchActivate = () => {
    handleSearchFocus();
  };

  const handleSearchBlur = () => {
    setHasSearchFocused(false);
    if (searchKeyword.trim().length === 0) {
      setIsExampleActive(Boolean(exampleText));
    }
  };

  const placeholderText = useMemo(() => {
    if (!hasSearchFocused && isExampleActive && exampleText) {
      return exampleText;
    }
    return searchLabels.placeholder;
  }, [exampleText, hasSearchFocused, isExampleActive, searchLabels.placeholder]);

  return (
    <div className="flex items-center gap-1.5 bg-white dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-700 px-2 sm:px-3 py-1.5 w-full shadow-sm">
      <div className="relative min-w-[72px] max-w-[88px] sm:max-w-[110px] lg:max-w-[140px]">
        <select
          value={parentCategory}
          onChange={(e) => handleParentCategoryChange(e.target.value)}
          className="w-full truncate appearance-none bg-transparent text-sm text-gray-900 dark:text-white font-medium pr-5 pl-0.5 outline-none cursor-pointer"
        >
          <option value="all">{searchLabels.category}</option>
          {parentOptions.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.label}</option>
          ))}
        </select>
        <svg className="absolute right-0.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      <div className="w-px h-4 bg-gray-200 dark:bg-gray-700" />

      {parentCategory !== 'all' && childCategories.length > 0 && (
        <>
          <div className="relative min-w-[88px] max-w-[120px] sm:max-w-[150px] lg:max-w-[200px]">
            <select
              value={childCategory}
              onChange={(e) => setChildCategory(e.target.value)}
              className="w-full truncate appearance-none bg-transparent text-sm text-gray-900 dark:text-white font-medium pr-5 pl-0.5 outline-none cursor-pointer"
            >
              <option value="">{searchLabels.subCategory}</option>
              {childCategories.map((child) => (
                <option key={child.slug} value={child.slug}>{getCategoryLabel(child)}</option>
              ))}
            </select>
            <svg className="absolute right-0.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          <div className="w-px h-4 bg-gray-200 dark:bg-gray-700" />
        </>
      )}

      <div className="flex-1 flex items-center gap-2 min-w-0">
        <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={searchKeyword}
          onChange={handleSearchChange}
          onKeyDown={handleSearchKeyDown}
          onFocus={handleSearchActivate}
          onBlur={handleSearchBlur}
          onClick={handleSearchActivate}
          onMouseDown={handleSearchActivate}
          placeholder={placeholderText}
          className="flex-1 bg-transparent text-sm outline-none min-w-0 placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white"
        />
      </div>

      <button
        onClick={executeSearch}
        className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-full transition-colors flex-shrink-0"
      >
        {searchLabels.button}
      </button>
    </div>
  );
}
