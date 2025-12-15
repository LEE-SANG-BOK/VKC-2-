'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'nextjs-toploader/app';
import { useParams, usePathname, useSearchParams } from 'next/navigation';
import { Bell, Menu, X } from 'lucide-react';
import { debounce } from 'lodash';
import Logo from '../atoms/Logo';
import Button from '../atoms/Button';
import Tooltip from '../atoms/Tooltip';
import UserProfile from '../molecules/UserProfile';
import LanguageSwitcher from '../atoms/LanguageSwitcher';
import NotificationModal from '../molecules/NotificationModal';
import { useSession, signOut } from 'next-auth/react';
import { useUnreadNotificationCount } from '@/repo/notifications/query';
import { pickExampleQuestion } from '@/lib/constants/search-examples';
import { LEGACY_CATEGORIES } from '@/lib/constants/categories';
import { CATEGORY_GROUPS } from '@/lib/constants/categories';

interface HeaderProps {
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (value: boolean) => void;
  showBackButton?: boolean;
  rightActions?: React.ReactNode;
  hideSearch?: boolean;
  translations: any;
}

export default function Header({ isMobileMenuOpen, setIsMobileMenuOpen, showBackButton, rightActions, hideSearch, translations }: HeaderProps) {
  const t = translations?.header || {};
  const tTooltip = translations?.tooltips || {};
  const tSearch = translations?.search || {};
  const tSidebar = translations?.sidebar || {};
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const locale = params.lang as string || 'ko';
  const { data: session, status } = useSession();
  const user = session?.user;
  const logout = () => signOut();
  const [isScrolled, setIsScrolled] = useState(false);
  const { data: unreadCountData } = useUnreadNotificationCount(!!user);
  const [exampleText, setExampleText] = useState('');
  const getCategoryLabel = (cat: any) => {
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
  const getGroupLabel = (group: (typeof CATEGORY_GROUPS)[keyof typeof CATEGORY_GROUPS]) => {
    if (locale === 'vi' && group.label_vi) return group.label_vi;
    if (locale === 'en' && group.label_en) return group.label_en;
    return group.label;
  };
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
  }, [locale]);

  // 검색어 상태 관리 - URL 파라미터로 초기화
  const [searchKeyword, setSearchKeyword] = useState(searchParams.get('q') || searchParams.get('s') || '');
  const [parentCategory, setParentCategory] = useState('all');
  const [childCategory, setChildCategory] = useState('');
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const brandIntroFallback = useMemo(() => {
    if (locale === 'en') return 'Visa, jobs, and life in Korea Q&A community';
    if (locale === 'vi') return 'Cộng đồng hỏi đáp về visa, việc làm và cuộc sống tại Hàn Quốc';
    return '한국 비자·취업·생활 Q&A 커뮤니티';
  }, [locale]);

  const homeFeed = useMemo(() => {
    const c = searchParams?.get('c');
    if (!c) return 'popular';
    if (c === 'popular' || c === 'latest') return c;
    return null;
  }, [searchParams]);

  const isHomePath = pathname === `/${locale}`;
  const popularLabel =
    tSidebar.popular || (locale === 'vi' ? 'Phổ biến' : locale === 'en' ? 'Popular' : '인기');
  const latestLabel =
    tSidebar.latest || (locale === 'vi' ? 'Mới nhất' : locale === 'en' ? 'Latest' : '최신');

  const handleHomeFeedToggle = (next: 'popular' | 'latest') => {
    router.push(`/${locale}?c=${encodeURIComponent(next)}`);
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

  const unreadCount = unreadCountData?.data?.count ?? 0;

  // URL 파라미터 변경 시 검색어 동기화 (필요한 경우에만)
  useEffect(() => {
    const urlKeyword = searchParams.get('q') || searchParams.get('s');
    if (urlKeyword !== null && urlKeyword !== searchKeyword) {
      setSearchKeyword(urlKeyword);
    }
  }, [searchParams, searchKeyword]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 8);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 대분류 변경 시 자식 카테고리 초기화
  const handleParentCategoryChange = (category: string) => {
    setParentCategory(category);
    setChildCategory(''); // 핸들러에서 직접 초기화
  };

  // 선택된 대분류의 자식 카테고리 가져오기
  const selectedParent = parentOptions.find((opt) => opt.id === parentCategory);
  const childCategories = selectedParent?.children || [];

  // 검색 실행 함수
  const executeSearch = useCallback(() => {
    const params = new URLSearchParams();

    if (searchKeyword.trim()) {
      params.set('q', searchKeyword.trim());
    }

    const selectedCat = childCategory || (parentCategory !== 'all' ? parentCategory : '');
    if (selectedCat) {
      params.set('c', selectedCat);
    }

    // 검색 페이지로 이동
    router.push(`/${locale}/search?${params.toString()}`);
  }, [searchKeyword, parentCategory, childCategory, locale, router]);

  // Debounced 검색 함수 (500ms 지연)
  const debouncedSearch = useMemo(
    () =>
      debounce((keyword: string) => {
        const params = new URLSearchParams();

        if (keyword.trim()) {
          params.set('q', keyword.trim());
        }

        const selectedCat = childCategory || (parentCategory !== 'all' ? parentCategory : '');
        if (selectedCat) {
          params.set('c', selectedCat);
        }

        // 검색 페이지로 이동
        router.push(`/${locale}/search?${params.toString()}`);
      }, 500),
    [parentCategory, childCategory, locale, router]
  );

  // 검색어 변경 핸들러
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchKeyword(value);
    debouncedSearch(value);
  };

  // Enter 키 입력 시 즉시 검색
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      debouncedSearch.cancel(); // debounce 취소
      executeSearch();
    }
  };

  // 컴포넌트 언마운트 시 debounce 정리
  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  const [isExampleActive, setIsExampleActive] = useState(false);
  const [exampleCategory, setExampleCategory] = useState<string>('');
  const [hasSearchFocused, setHasSearchFocused] = useState(false);
  const groupDefaultSlug: Record<string, string> = useMemo(() => ({
    visa: 'visa-process',
    living: 'cost-of-living',
    career: 'business',
    students: 'scholarship',
  }), []);

  // Example Question Logic
  useEffect(() => {
    const pickFallbackExample = () => getRandomExample() || '';
    // Find the selected category object to get the slug
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

    // If user has typed something (and it's not the example) or focused, don't override
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
    <header
      className={`w-full backdrop-blur-md sticky top-0 z-50 transition-all duration-300
        ${isScrolled
          ? 'bg-white/95 dark:bg-gray-900/95 border-b border-gray-200 dark:border-gray-800 shadow-md'
          : 'bg-white/90 dark:bg-gray-900/90 border-b border-gray-200/50 dark:border-gray-800/50 shadow-sm'
        }
        text-gray-900 dark:text-white`}
    >
      {/* Top Row: Logo and Actions */}
      <div className="container mx-auto flex h-[var(--vk-header-height)] items-center justify-between px-2 sm:px-3 lg:px-5">
        {/* Logo / Back Button */}
        <div className="flex items-center space-x-1.5 sm:space-x-3">
          {showBackButton && (
            <button
              onClick={() => router.back()}
              className="p-1.5 sm:p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-300 text-gray-600 dark:text-gray-400"
              aria-label="Go back"
            >
              <span className="text-lg sm:text-base">←</span> {tSearch.goBack || '뒤로'}
            </button>
          )}
          {/* Mobile Menu Button */}
          {!showBackButton && (
            <Tooltip content={tTooltip.sidebarToggle || '사이드바 열기'} position="below">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-1.5 sm:p-1.5 hover:bg-gradient-to-br hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-900/20 dark:hover:to-purple-900/20 rounded-xl transition-all duration-300 group"
                aria-label={tTooltip.sidebarToggle || 'Toggle sidebar'}
              >
                {isMobileMenuOpen ? (
                  <X className="h-5 w-5 sm:h-5 sm:w-5 text-gray-600 dark:text-gray-400" />
                ) : (
                  <Menu className="h-5 w-5 sm:h-5 sm:w-5 text-gray-600 dark:text-gray-400" />
                )}
              </button>
            </Tooltip>
          )}
          <div className="scale-90 sm:scale-100 origin-left">
            <Tooltip content={tTooltip.brandIntro || brandIntroFallback} position="below" className="vk-tooltip-brand">
              <div aria-label={tTooltip.brandIntro || brandIntroFallback}>
                <Logo />
              </div>
            </Tooltip>
          </div>
        </div>

        {/* Search Bar - Large Desktop Only (Inline) */}
        {!hideSearch && (
          <div className="flex-1 hidden lg:flex justify-center items-center mx-3">
            <div className="flex items-center gap-1.5 bg-white dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-700 px-3 py-1.5 max-w-4xl w-full shadow-sm">
              {/* Main Category Dropdown */}
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

              {/* Sub Category Dropdown */}
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

              {/* Search Input */}
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

              {/* Search Button */}
              <button
                onClick={executeSearch}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-full transition-colors flex-shrink-0"
              >
                {tSearch.searchButton || '검색'}
              </button>
            </div>
          </div>
        )}

        {/* Right Side: Custom Actions or Notifications & Login/Profile */}
        <div className="flex items-center space-x-1 sm:space-x-2">
          {rightActions || (
            <>
              {/* Notifications - Only show when logged in */}
              {user && (
                <div className="relative">
                  <Tooltip content={tTooltip.notifications || '알림'} position="below">
                    <button
                      onClick={() => setIsNotificationModalOpen(!isNotificationModalOpen)}
                      className="relative p-1 sm:p-1 hover:bg-gradient-to-br hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-900/20 dark:hover:to-purple-900/20 rounded-lg transition-all duration-300 group"
                    >
                      <Bell className="h-4 w-4 text-gray-600 dark:text-gray-400 group-hover:text-red-600 dark:group-hover:text-amber-400 transition-colors" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 bg-gradient-to-br from-red-500 to-amber-500 rounded-full flex items-center justify-center text-[8px] font-bold text-white shadow-lg">
                          {unreadCount}
                        </span>
                      )}
                    </button>
                  </Tooltip>
                  <NotificationModal
                    isOpen={isNotificationModalOpen}
                    onClose={() => setIsNotificationModalOpen(false)}
                    translations={translations?.notifications as Record<string, string>}
                  />
                </div>
              )}

              {/* Interest Management CTA */}
              {/* Language Switcher */}
              <LanguageSwitcher />

              {/* Login/Profile */}
              {status === 'loading' ? (
                <div className="flex items-center space-x-1 sm:space-x-1.5">
                  <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
                </div>
              ) : user ? (
                <div className="flex items-center space-x-1 sm:space-x-1.5">
                  <UserProfile
                    name={user.name || 'User'}
                    avatar={user.image || undefined}
                    isLoggedIn={true}
                    userId={user.id}
                    onLogout={logout}
                    translations={translations?.userMenu as Record<string, string>}
                  />
                </div>
              ) : (
                <div className="flex items-center space-x-1 sm:space-x-1.5">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => router.push(`/${locale}/login`)}
                    className="text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-1.5"
                  >
                    {t.login || '로그인'}
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    className="hidden xs:block text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-1.5"
                    onClick={() => router.push(`/${locale}/signup`)}
                  >
                    {t.signup || '회원가입'}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {isHomePath ? (
        <div className="container mx-auto px-2 sm:px-3 pb-2 lg:hidden">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleHomeFeedToggle('popular')}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                homeFeed === 'popular'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'border border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-gray-900/40 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
              aria-label={popularLabel}
            >
              <span aria-hidden>🔥</span>
              <span>{popularLabel}</span>
            </button>
            <button
              type="button"
              onClick={() => handleHomeFeedToggle('latest')}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                homeFeed === 'latest'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'border border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-gray-900/40 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
              aria-label={latestLabel}
            >
              <span aria-hidden>🕒</span>
              <span>{latestLabel}</span>
            </button>
          </div>
        </div>
      ) : null}
    </header>
  );
}
