'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'nextjs-toploader/app';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { pickExampleQuestion } from '@/lib/constants/search-examples';
import { LEGACY_CATEGORIES, CATEGORY_GROUPS } from '@/lib/constants/categories';
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

export default function HeaderSearch({ locale, translations }: HeaderSearchProps) {
  const tSearch = (translations?.search || {}) as Record<string, string>;
  const router = useRouter();
  const searchParams = useSearchParams();

  const [exampleText, setExampleText] = useState('');
  const [searchKeyword, setSearchKeyword] = useState(searchParams.get('q') || searchParams.get('s') || '');
  const [parentCategory, setParentCategory] = useState('all');
  const [childCategory, setChildCategory] = useState('');

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
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      executeSearch();
    }
  };

  const examplePool = useMemo(() => {
    const pool = [
      tSearch.exampleLiving,
      tSearch.exampleWork,
      tSearch.exampleStudy,
      tSearch.exampleStudentLife,
      tSearch.popularExample1,
      tSearch.popularExample2,
      tSearch.popularExample3,
    ].filter(Boolean) as string[];
    return pool.length > 0 ? pool : null;
  }, [
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
    return tSearch.searchPlaceholder || '검색어를 입력하세요';
  }, [examplePool, tSearch.searchPlaceholder]);

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

    if (!categorySlug) {
      const fallback = pickFallbackExample();
      if (!hasSearchFocused && fallback) {
        setSearchKeyword(fallback);
        setIsExampleActive(true);
        setExampleText(fallback);
      }
      if (exampleCategory) setExampleCategory('');
      return;
    }

    const example = pickExampleQuestion(categorySlug, locale) || pickFallbackExample();
    const isNewCategory = exampleCategory !== categorySlug;

    if (isNewCategory) {
      setHasSearchFocused(false);
      setExampleText(example || '');
    }

    if (!example) {
      if (isExampleActive) {
        setIsExampleActive(false);
      }
      if (isNewCategory) {
        setExampleCategory(categorySlug);
      }
      return;
    }

    if (!isNewCategory && (!isExampleActive || hasSearchFocused) && searchKeyword.trim().length > 0) {
      return;
    }

    if (!hasSearchFocused && searchKeyword !== example) {
      setSearchKeyword(example);
      setIsExampleActive(true);
      setExampleText(example || '');
    }
    if (exampleCategory !== categorySlug) {
      setExampleCategory(categorySlug);
    }
  }, [parentCategory, childCategory, searchKeyword, isExampleActive, exampleCategory, hasSearchFocused]);

  useEffect(() => {
    if (!searchKeyword && !hasSearchFocused) {
      const fallback = getRandomExample();
      if (fallback) {
        setSearchKeyword(fallback);
        setIsExampleActive(true);
        setExampleText(fallback);
      }
    }
  }, [getRandomExample, hasSearchFocused, searchKeyword]);

  const handleSearchFocus = () => {
    setHasSearchFocused(true);
    if (isExampleActive || (exampleText && searchKeyword === exampleText)) {
      setSearchKeyword('');
      setIsExampleActive(false);
      setExampleText('');
    }
  };

  const handleSearchActivate = () => {
    handleSearchFocus();
  };

  const handleSearchBlur = () => {
    if (searchKeyword.trim().length === 0) {
      const fallback = getRandomExample();
      setSearchKeyword(fallback);
      setExampleText(fallback);
      setIsExampleActive(true);
      setHasSearchFocused(false);
    }
  };

  return (
    <div className="flex items-center gap-1.5 bg-white dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-700 px-3 py-1.5 max-w-4xl w-full shadow-sm">
      <div className="relative flex-shrink-0">
        <select
          value={parentCategory}
          onChange={(e) => handleParentCategoryChange(e.target.value)}
          className="appearance-none bg-transparent text-sm text-gray-900 dark:text-white font-medium pr-5 pl-0.5 outline-none cursor-pointer"
        >
          <option value="all">{tSearch.categoryLabel || '분류'}</option>
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
          <div className="relative flex-shrink-0">
            <select
              value={childCategory}
              onChange={(e) => setChildCategory(e.target.value)}
              className="appearance-none bg-transparent text-sm text-gray-900 dark:text-white font-medium pr-5 pl-0.5 outline-none cursor-pointer"
            >
              <option value="">{tSearch.subCategoryLabel || '하위 카테고리'}</option>
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
          placeholder={tSearch.searchPlaceholder || '검색어를 입력하세요'}
          className={`flex-1 bg-transparent text-sm outline-none min-w-0 placeholder-gray-400 dark:placeholder-gray-500 ${
            isExampleActive && !hasSearchFocused ? 'text-gray-400 dark:text-gray-400' : 'text-gray-900 dark:text-white'
          }`}
        />
      </div>

      <button
        onClick={executeSearch}
        className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-full transition-colors flex-shrink-0"
      >
        {tSearch.searchButton || '검색'}
      </button>
    </div>
  );
}
