'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { useRouter } from 'nextjs-toploader/app';
import { useSession } from 'next-auth/react';
import dayjs from 'dayjs';
import PostCard from '../molecules/PostCard';
import { useInfinitePosts, useMyPostInteractions } from '@/repo/posts/query';
import { useRecommendedUsers } from '@/repo/users/query';
import { useMySubscriptions } from '@/repo/categories/query';
import Avatar from '@/components/atoms/Avatar';
import FollowButton from '@/components/atoms/FollowButton';
import { CATEGORY_GROUPS, LEGACY_CATEGORIES, getCategoryName } from '@/lib/constants/categories';
import type { PaginatedResponse, PostListItem } from '@/repo/posts/types';

interface PostListProps {
  selectedCategory?: string;
  isSearchMode?: boolean;
  searchQuery?: string;
  translations: Record<string, unknown>;
}

export default function PostList({ selectedCategory = 'all', isSearchMode = false, searchQuery = '', translations }: PostListProps) {
  const t = (translations?.post || {}) as Record<string, string>;
  const tCommon = (translations?.common || {}) as Record<string, string>;
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const locale = (params?.lang as string) || 'ko';
  const { data: session } = useSession();
  const { data: recommended } = useRecommendedUsers({ enabled: selectedCategory === 'following' });
  const { data: mySubs } = useMySubscriptions(selectedCategory === 'subscribed' && !!session?.user);
  const topicSlugs = useMemo(() => {
    return new Set(Object.values(CATEGORY_GROUPS).flatMap((group) => group.slugs as readonly string[]));
  }, []);
  const topicSubscriptions = useMemo(() => {
    return (mySubs || []).filter((cat) => topicSlugs.has(cat.slug));
  }, [mySubs, topicSlugs]);
  const [selectedChildCategory, setSelectedChildCategory] = useState('all');
  const [selectedSubscribedCategory, setSelectedSubscribedCategory] = useState('all');
  const [followStates, setFollowStates] = useState<Record<string, boolean>>({});
  const observerRef = useRef<HTMLDivElement>(null);
  const recommendedRef = useRef<HTMLDivElement>(null);

  const parentSlugs = useMemo(() => Object.keys(CATEGORY_GROUPS), []);
  const childSlugToParent = useMemo(() => {
    const map = new Map<string, string>();
    Object.entries(CATEGORY_GROUPS).forEach(([parentSlug, group]) => {
      group.slugs.forEach((slug) => map.set(slug, parentSlug));
    });
    return map;
  }, []);

  const activeParentSlug = useMemo(() => {
    if (parentSlugs.includes(selectedCategory)) return selectedCategory;
    if (childSlugToParent.has(selectedCategory)) return childSlugToParent.get(selectedCategory) || null;
    return null;
  }, [childSlugToParent, parentSlugs, selectedCategory]);

  const childCategories = useMemo(() => {
    if (!activeParentSlug) return [];
    const group = CATEGORY_GROUPS[activeParentSlug as keyof typeof CATEGORY_GROUPS];
    if (!group) return [];
    const slugs = group.slugs as readonly string[];
    return LEGACY_CATEGORIES.filter((cat) => slugs.includes(cat.slug));
  }, [activeParentSlug]);

  useEffect(() => {
    if (activeParentSlug && childSlugToParent.has(selectedCategory)) {
      setSelectedChildCategory(selectedCategory);
      return;
    }
    setSelectedChildCategory('all');
  }, [activeParentSlug, childSlugToParent, selectedCategory]);

  const handleChildCategoryChange = useCallback((category: string) => {
    setSelectedChildCategory(category);
  }, []);

  const isMenuCategory = ['popular', 'latest', 'following', 'subscribed', 'my-posts'].includes(selectedCategory);

  const parentCategoryForQuery = isMenuCategory
    ? undefined
    : selectedChildCategory === 'all' && activeParentSlug
      ? activeParentSlug
      : undefined;

  const categoryForQuery = isMenuCategory
    ? undefined
    : selectedChildCategory !== 'all'
      ? selectedChildCategory
      : !activeParentSlug && selectedCategory !== 'all'
        ? selectedCategory
      : undefined;

  const sortForQuery: 'popular' | 'latest' = selectedCategory === 'popular' ? 'popular' : 'latest';

  const getFilterForQuery = () => {
    if (selectedCategory === 'following') return 'following-users';
    if (selectedCategory === 'subscribed') return 'following';
    if (selectedCategory === 'my-posts') return 'my-posts';
    return undefined;
  };
  const filterForQuery = getFilterForQuery();

  const subscribedParentForQuery =
    selectedCategory === 'subscribed' && selectedSubscribedCategory !== 'all' && parentSlugs.includes(selectedSubscribedCategory)
      ? selectedSubscribedCategory
      : undefined;
  const subscribedCategoryForQuery =
    selectedCategory === 'subscribed' && selectedSubscribedCategory !== 'all' && !parentSlugs.includes(selectedSubscribedCategory)
      ? selectedSubscribedCategory
      : undefined;
  const filterForQueryResolved =
    selectedCategory === 'subscribed'
      ? selectedSubscribedCategory === 'all'
        ? 'following'
        : undefined
      : filterForQuery;

  const initialPage = Math.max(1, parseInt(searchParams?.get('page') || '1') || 1);

  const postListFilters = {
    parentCategory: selectedCategory === 'subscribed' ? subscribedParentForQuery : parentCategoryForQuery,
    category: selectedCategory === 'subscribed' ? subscribedCategoryForQuery : categoryForQuery,
    sort: sortForQuery,
    filter: filterForQueryResolved as 'following-users' | 'following' | 'my-posts' | undefined,
  };

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfinitePosts(postListFilters, {
    initialPage,
  }) as ReturnType<typeof useInfinitePosts>;

  // Intersection Observer로 무한 스크롤 구현
  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isFetchingNextPage && hasNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // 모든 페이지의 게시글을 평탄화
  const allPosts =
    data?.pages.flatMap((page: PaginatedResponse<PostListItem>) => page.data) || [];

  const shouldFetchInteractions = Boolean(session?.user) && !filterForQueryResolved && allPosts.length > 0;
  const interactionPostIds = useMemo(() => allPosts.map((post) => post.id), [allPosts]);
  const { data: interactionsData } = useMyPostInteractions(interactionPostIds, {
    enabled: shouldFetchInteractions,
  });
  const likedPostIdSet = useMemo(() => {
    return new Set(interactionsData?.data?.likedPostIds ?? []);
  }, [interactionsData?.data?.likedPostIds]);
  const bookmarkedPostIdSet = useMemo(() => {
    return new Set(interactionsData?.data?.bookmarkedPostIds ?? []);
  }, [interactionsData?.data?.bookmarkedPostIds]);

  const pagination = (data?.pages?.[0] as PaginatedResponse<PostListItem> | undefined)?.pagination;
  const currentPage = pagination?.page ?? 1;
  const totalPages = pagination?.totalPages ?? 1;

  const previousLabel = t.previous || (locale === 'vi' ? 'Trước' : locale === 'en' ? 'Previous' : '이전');
  const nextLabel = t.next || (locale === 'vi' ? 'Tiếp' : locale === 'en' ? 'Next' : '다음');
  const pageInfoLabel = t.pageInfo || (locale === 'vi' ? '{current} / {total} trang' : locale === 'en' ? 'Page {current} / {total}' : '{current} / {total} 페이지');
  const paginationAriaLabel = t.paginationAriaLabel || (locale === 'vi' ? 'Phân trang' : locale === 'en' ? 'Pagination' : '페이지네이션');

  const buildPageUrl = (page: number) => {
    const nextParams = new URLSearchParams(searchParams?.toString());
    if (page > 1) {
      nextParams.set('page', String(page));
    } else {
      nextParams.delete('page');
    }
    const qs = nextParams.toString();
    return qs ? `/${locale}?${qs}` : `/${locale}`;
  };

  const followerLabel = tCommon.followers || (locale === 'vi' ? 'Người theo dõi' : locale === 'en' ? 'Followers' : '팔로워');
  const recommendedUsersLabel = t.recommendedUsersTitle || t.recommendedUsers || (locale === 'vi' ? 'Người dùng đề xuất' : locale === 'en' ? 'Recommended users' : '추천 사용자');
  const recommendedCtaLabel = t.recommendedUsersCta || (locale === 'vi' ? 'Xem người dùng đề xuất' : locale === 'en' ? 'View recommended users' : '추천 사용자 보기');
  const allSubscriptionsLabel = t.allSubscriptions || (locale === 'vi' ? 'Tất cả' : locale === 'en' ? 'All' : '전체');
  const noFollowingPostsLabel = t.noFollowingPosts || (locale === 'vi' ? 'Chưa có bài từ người bạn theo dõi.' : locale === 'en' ? 'No posts from people you follow yet.' : '팔로우한 사용자의 게시글이 없습니다');
  const noPostsLabel = t.noPosts || (locale === 'vi' ? 'Chưa có bài viết.' : locale === 'en' ? 'No posts yet.' : '게시글이 없습니다');
  const loadingLabel = t.loading || (locale === 'vi' ? 'Đang tải...' : locale === 'en' ? 'Loading...' : '로딩 중...');
  const allLoadedLabel = t.allPostsLoaded || (locale === 'vi' ? 'Đã tải tất cả bài viết' : locale === 'en' ? 'All posts loaded' : '모든 게시글을 불러왔습니다');

  useEffect(() => {
    if (selectedCategory !== 'subscribed') return;
    if (topicSubscriptions.length === 0) {
      setSelectedSubscribedCategory('all');
      return;
    }
    if (selectedSubscribedCategory === 'all') return;
    const stillExists = topicSubscriptions.some((cat) => cat.slug === selectedSubscribedCategory);
    if (!stillExists) setSelectedSubscribedCategory('all');
  }, [selectedCategory, selectedSubscribedCategory, topicSubscriptions]);

  const scrollToRecommended = () => {
    if (recommendedRef.current) {
      recommendedRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="pt-0 pb-4">
      {selectedCategory === 'subscribed' && topicSubscriptions.length > 0 ? (
        <div className="lg:hidden mb-2">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-0.5">
            <button
              type="button"
              onClick={() => setSelectedSubscribedCategory('all')}
              className={`shrink-0 inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold transition-colors ${
                selectedSubscribedCategory === 'all'
                  ? 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-900/30 dark:text-blue-100'
                  : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-200 dark:hover:bg-gray-800'
              }`}
            >
              {allSubscriptionsLabel}
            </button>
            {topicSubscriptions.map((cat) => {
              const legacy = LEGACY_CATEGORIES.find((c) => c.slug === cat.slug);
              const label = legacy ? getCategoryName(legacy, locale) : cat.name;
              const active = selectedSubscribedCategory === cat.slug;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedSubscribedCategory(cat.slug)}
                  className={`shrink-0 inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold transition-colors ${
                    active
                      ? 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-900/30 dark:text-blue-100'
                      : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-200 dark:hover:bg-gray-800'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* 2차 카테고리 필터 (1차 카테고리 선택 시만 표시) */}
      {!isMenuCategory &&
        selectedCategory !== 'all' &&
        activeParentSlug &&
        childCategories.length > 0 && (
          <div className="mb-4">
            <select
              value={selectedChildCategory}
              onChange={(e) => handleChildCategoryChange(e.target.value)}
              className="w-auto px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
            >
              <option value="all">{t.allSubcategories || (locale === 'vi' ? 'Tất cả danh mục con' : locale === 'en' ? 'All subcategories' : '전체 하위 카테고리')}</option>
              {childCategories.map((child) => (
                <option key={child.slug} value={child.slug}>
                  {getCategoryName(child, locale)}
                </option>
              ))}
            </select>
          </div>
        )}

      {selectedCategory === 'following' && recommended?.data?.length ? (
        <button
          type="button"
          onClick={scrollToRecommended}
          className="mb-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-blue-200 dark:border-blue-800/60 bg-blue-50 dark:bg-blue-900/20 px-4 py-3 text-sm font-semibold text-blue-800 dark:text-blue-100 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
        >
          {recommendedCtaLabel}
        </button>
      ) : null}

      {/* 로딩 상태 */}
      {isLoading && (
            <div className="flex justify-center py-12">
              <div className="inline-flex items-center gap-2 text-gray-500 dark:text-gray-400">
                <div className="h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm">{loadingLabel}</span>
              </div>
            </div>
          )}

      {/* 게시글 목록 */}
      {!isLoading && (
        <div className="flex flex-col gap-2">
          {allPosts.length > 0 ? (
            allPosts.map((post: PostListItem) => (
              <div key={post.id} className="flex flex-col">
                <PostCard
                  id={post.id}
                  author={{
                    id: post.author?.id,
                    name: post.author?.displayName || post.author?.name || (locale === 'vi' ? 'Không rõ' : locale === 'en' ? 'Unknown' : '알 수 없음'),
                    avatar: (post.author as any)?.image || (post.author as any)?.avatar || '/default-avatar.jpg',
                    followers: (post.author as any)?.followers ?? 0,
                    isFollowing: (post.author as any)?.isFollowing ?? false,
                    isVerified: post.author?.isVerified || false,
                    isExpert: post.author?.isExpert || false,
                    badgeType: post.author?.badgeType || null,
                  }}
                  title={post.title}
                  excerpt={post.excerpt || (post.content || '').replace(/<img[^>]*>/gi, '').replace(/<[^>]*>/g, '').trim().substring(0, 200)}
                  tags={post.tags}
                  stats={{
                    likes: (post as any).likesCount ?? post.likes ?? 0,
                    comments: (post as any).commentsCount ?? 0,
                    shares: 0,
                  }}
                  category={(post as any).category}
                  subcategory={(post as any).subcategory}
                  thumbnail={(post as any).thumbnail}
                  thumbnails={(post as any).thumbnails}
                  publishedAt={dayjs(post.createdAt).format('YYYY.MM.DD HH:mm')}
                  isQuestion={post.type === 'question'}
                  isAdopted={post.isResolved}
                  isLiked={shouldFetchInteractions ? likedPostIdSet.has(post.id) : post.isLiked}
                  isBookmarked={shouldFetchInteractions ? bookmarkedPostIdSet.has(post.id) : post.isBookmarked}
                  imageCount={(post as any).imageCount}
                  certifiedResponderCount={(post as any).certifiedResponderCount}
                  otherResponderCount={(post as any).otherResponderCount}
                  trustBadge={(post as any).trustBadge}
                  trustWeight={(post as any).trustWeight}
                  translations={translations}
                />
              </div>
            ))
          ) : (
            <div className="flex flex-col gap-6 py-10">
              <div className="text-center text-gray-500 dark:text-gray-400">
                {isSearchMode && searchQuery
                  ? (t.noSearchResults || `"${searchQuery}"에 대한 검색 결과가 없습니다`)
                  : (selectedCategory === 'following'
                      ? noFollowingPostsLabel
                      : noPostsLabel)}
              </div>
            </div>
          )}

          {selectedCategory === 'following' && recommended?.data?.length ? (
            <div ref={recommendedRef} className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800 mt-3">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {recommendedUsersLabel}
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[...recommended.data].sort((a, b) => (b.stats?.followers ?? 0) - (a.stats?.followers ?? 0)).map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center gap-3 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-3"
                    >
                      <div className="flex items-center gap-3 w-full">
                        <div className="flex flex-col items-center gap-2">
                          <Avatar
                            name={user.displayName || user.email || 'U'}
                            imageUrl={(user as any)?.image}
                            size="lg"
                            hoverHighlight
                          />
                          <FollowButton
                            userId={String(user.id)}
                            userName={user.displayName || user.email || (locale === 'vi' ? 'Không rõ' : locale === 'en' ? 'Unknown' : '알 수 없음')}
                            isFollowing={followStates[user.id] ?? (user as any)?.isFollowing ?? false}
                            size="sm"
                            onToggle={(next) =>
                              setFollowStates((prev) => ({
                                ...prev,
                                [user.id]: next,
                              }))
                            }
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <button
                            type="button"
                            onClick={() => router.push(`/${locale}/profile/${user.id}`)}
                            className="text-left"
                          >
                            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                              {user.displayName || user.email || (locale === 'vi' ? 'Không rõ' : locale === 'en' ? 'Unknown' : '알 수 없음')}
                            </div>
                            {user.stats?.followers !== undefined && (
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {followerLabel} {user.stats.followers}
                              </div>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
          ) : null}
        </div>
      )}

      {/* Loading Indicator (다음 페이지 로딩) */}
      {allPosts.length > 0 && totalPages > 1 && (
        <nav className="py-4" aria-label={paginationAriaLabel}>
          <div className="flex items-center justify-center gap-3">
            {currentPage > 1 ? (
              <Link
                href={buildPageUrl(currentPage - 1)}
                className="inline-flex items-center rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                {previousLabel}
              </Link>
            ) : (
              <span className="inline-flex items-center rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 px-3 py-2 text-sm font-semibold text-gray-400 dark:text-gray-500 cursor-not-allowed">
                {previousLabel}
              </span>
            )}

            <span className="text-sm text-gray-500 dark:text-gray-400">
              {pageInfoLabel
                .replace('{current}', String(currentPage))
                .replace('{total}', String(totalPages))}
            </span>

            {currentPage < totalPages ? (
              <Link
                href={buildPageUrl(currentPage + 1)}
                className="inline-flex items-center rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                {nextLabel}
              </Link>
            ) : (
              <span className="inline-flex items-center rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 px-3 py-2 text-sm font-semibold text-gray-400 dark:text-gray-500 cursor-not-allowed">
                {nextLabel}
              </span>
            )}
          </div>
        </nav>
      )}

      {allPosts.length > 0 && hasNextPage && (
        <div ref={observerRef} className="py-8 text-center">
          {isFetchingNextPage && (
            <div className="inline-flex items-center gap-2 text-gray-500 dark:text-gray-400">
              <div className="h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm">{loadingLabel}</span>
            </div>
          )}
        </div>
      )}

      {/* End of posts message */}
      {allPosts.length > 0 && !hasNextPage && (
        <div className="py-8 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {allLoadedLabel}
          </p>
        </div>
      )}
    </div>
  );
}
