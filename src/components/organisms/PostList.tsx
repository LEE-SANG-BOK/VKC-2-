'use client';

import { Fragment, useEffect, useRef, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import dayjs from 'dayjs';
import PostCard from '@/components/molecules/cards/PostCard';
import { useInfinitePosts, useMyPostInteractions } from '@/repo/posts/query';
import { useInfiniteRecommendedUsers } from '@/repo/users/query';
import { useMySubscriptions } from '@/repo/categories/query';
import RecommendedUsersSection from '@/components/organisms/RecommendedUsersSection';
import { CATEGORY_GROUPS, LEGACY_CATEGORIES, getCategoryName } from '@/lib/constants/categories';
import type { PaginatedResponse, PostListItem } from '@/repo/posts/types';

interface PostListProps {
  selectedCategory?: string;
  isSearchMode?: boolean;
  searchQuery?: string;
  translations: Record<string, unknown>;
}

const stripModerationTemplateFromHtml = (html: string) => {
  const input = html || '';
  const strippedDataAttribute = input.replace(
    /^\s*(?:<p[^>]*data-vk-template=(['"])1\1[^>]*>[\s\S]*?<\/p>\s*){1,3}(?:<p[^>]*data-vk-template-spacer=(['"])1\2[^>]*>\s*<\/p>\s*)?/i,
    ''
  );
  const strippedLegacySpacer = strippedDataAttribute.replace(
    /^\s*(?:<p>\s*<strong>[\s\S]*?<\/strong>\s*<\/p>\s*){1,3}<p>\s*<\/p>\s*/i,
    ''
  );
  if (strippedLegacySpacer !== strippedDataAttribute) return strippedLegacySpacer;
  return strippedDataAttribute.replace(
    /^\s*(?:<p>\s*<strong>[\s\S]*?<\/strong>\s*<\/p>\s*){1,3}\s*$/i,
    ''
  );
};

const buildFeedExcerpt = (html: string) =>
  stripModerationTemplateFromHtml(html)
    .replace(/<img[^>]*>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();

export default function PostList({ selectedCategory = 'all', isSearchMode = false, searchQuery = '', translations }: PostListProps) {
  const t = (translations?.post || {}) as Record<string, string>;
  const tCommon = (translations?.common || {}) as Record<string, string>;
  const tTrust = (translations?.trustBadges || {}) as Record<string, string>;
  const tOnboarding = (translations?.onboarding || {}) as Record<string, string>;
  const tProfile = (translations?.profile || {}) as Record<string, string>;
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const locale = (params?.lang as string) || 'ko';
  const { data: session } = useSession();
  const { data: mySubs } = useMySubscriptions(selectedCategory === 'subscribed' && !!session?.user);
  const topicSlugs = useMemo(() => {
    return new Set(Object.values(CATEGORY_GROUPS).flatMap((group) => group.slugs as readonly string[]));
  }, []);
  const topicSubscriptions = useMemo(() => {
    return (mySubs || []).filter((cat) => topicSlugs.has(cat.slug));
  }, [mySubs, topicSlugs]);
  const [selectedChildCategory, setSelectedChildCategory] = useState('all');
  const subscribedParam = searchParams?.get('sc');
  const resolvedSubscribedParam = subscribedParam && subscribedParam.trim().length > 0 ? subscribedParam : 'all';
  const [selectedSubscribedCategory, setSelectedSubscribedCategory] = useState(resolvedSubscribedParam);
  const observerRef = useRef<HTMLDivElement>(null);

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

  const updateSubscribedParam = useCallback(
    (nextCategory: string, replace = false) => {
      const nextParams = new URLSearchParams(searchParams?.toString());
      nextParams.set('c', 'subscribed');
      if (nextCategory && nextCategory !== 'all') {
        nextParams.set('sc', nextCategory);
      } else {
        nextParams.delete('sc');
      }
      nextParams.delete('page');
      const nextQuery = nextParams.toString();
      const currentQuery = searchParams?.toString() ?? '';
      if (nextQuery === currentQuery) return;
      const url = nextQuery ? `/${locale}?${nextQuery}` : `/${locale}`;
      if (replace) {
        router.replace(url);
        return;
      }
      router.push(url);
    },
    [searchParams, router, locale]
  );

  const handleSubscribedCategoryChange = useCallback(
    (category: string) => {
      setSelectedSubscribedCategory(category);
      updateSubscribedParam(category);
    },
    [updateSubscribedParam]
  );

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

  const sortForQuery: 'popular' | 'latest' =
    selectedCategory === 'popular' || selectedCategory === 'subscribed' ? 'popular' : 'latest';

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

  const shouldInsertRecommended = Boolean(session?.user) && !isSearchMode && (selectedCategory === 'popular' || selectedCategory === 'latest') && allPosts.length >= 5;
  const shouldInsertFollowingRecommended = selectedCategory === 'following'
    && !isSearchMode
    && allPosts.length > 0;
  const shouldFetchRecommended = !isSearchMode && (selectedCategory === 'following' || shouldInsertRecommended);
  const {
    data: recommended,
    isLoading: recommendedLoading,
    fetchNextPage: fetchNextRecommendedPage,
    hasNextPage: hasNextRecommendedPage,
    isFetchingNextPage: isFetchingNextRecommendedPage,
  } = useInfiniteRecommendedUsers({ enabled: shouldFetchRecommended });
  const recommendedUsers = useMemo(() => {
    return recommended?.pages.flatMap((page) => page.data) ?? [];
  }, [recommended?.pages]);
  const sortedRecommendations = useMemo(() => {
    const seen = new Set<string>();
    const deduped = recommendedUsers.filter((user) => {
      const id = String(user.id);
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
    return deduped;
  }, [recommendedUsers]);

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

  const previousLabel = t.previous || tCommon.previous || '';
  const nextLabel = t.next || tCommon.next || '';
  const pageInfoLabel = t.pageInfo || '';
  const paginationAriaLabel = t.paginationAriaLabel || '';

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

  const followerLabel = tProfile.followers || '';
  const postsLabel = tProfile.posts || '';
  const followingLabel = tProfile.following || '';
  const verifiedLabel = tCommon.verifiedUser || '';
  const anonymousLabel = tCommon.anonymous || '';
  const badgeLabels = {
    expert: tTrust.expertLabel || '',
    community: tTrust.communityLabel || '',
    verified: tTrust.verifiedUserLabel || verifiedLabel,
  };
  const metaLabels = {
    followers: followerLabel,
    posts: postsLabel,
    following: followingLabel,
    badge: verifiedLabel,
  };
  const recommendedUsersLabel = t.recommendedUsersTitle || t.recommendedUsers || '';
  const allSubscriptionsLabel = t.allSubscriptions || t.allSubcategories || '';
  const noFollowingPostsLabel = t.noFollowingPosts || '';
  const noPostsLabel = t.noPosts || '';
  const noSearchResultsLabel = (t.noSearchResults || '').replace('{query}', searchQuery);
  const loadingLabel = t.loading || '';
  const allLoadedLabel = t.allPostsLoaded || '';

  useEffect(() => {
    if (selectedCategory !== 'subscribed') return;
    if (resolvedSubscribedParam !== selectedSubscribedCategory) {
      setSelectedSubscribedCategory(resolvedSubscribedParam);
      return;
    }
    if (topicSubscriptions.length === 0) {
      if (selectedSubscribedCategory !== 'all') {
        setSelectedSubscribedCategory('all');
        updateSubscribedParam('all', true);
      }
      return;
    }
    if (selectedSubscribedCategory === 'all') return;
    const stillExists = topicSubscriptions.some((cat) => cat.slug === selectedSubscribedCategory);
    if (!stillExists) {
      setSelectedSubscribedCategory('all');
      updateSubscribedParam('all', true);
    }
  }, [
    resolvedSubscribedParam,
    selectedCategory,
    selectedSubscribedCategory,
    topicSubscriptions,
    updateSubscribedParam,
  ]);

  return (
    <div className="pt-0 pb-4">
      {selectedCategory === 'subscribed' && topicSubscriptions.length > 0 ? (
        <div className="mb-4">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-0.5 px-3 pr-10 scroll-px-3">
            <button
              type="button"
              onClick={() => handleSubscribedCategoryChange('all')}
              className={`shrink-0 inline-flex items-center rounded-full border px-3.5 py-1.5 text-[12px] font-semibold leading-none transition-colors max-w-[200px] ${
                selectedSubscribedCategory === 'all'
                  ? 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-900/30 dark:text-blue-100'
                  : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-200 dark:hover:bg-gray-800'
              }`}
              title={allSubscriptionsLabel}
            >
              <span className="min-w-0 flex-1 truncate">{allSubscriptionsLabel}</span>
            </button>
            {topicSubscriptions.map((cat) => {
              const legacy = LEGACY_CATEGORIES.find((c) => c.slug === cat.slug);
              const label = legacy ? getCategoryName(legacy, locale) : cat.name;
              const active = selectedSubscribedCategory === cat.slug;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleSubscribedCategoryChange(cat.slug)}
                  className={`shrink-0 inline-flex items-center rounded-full border px-3.5 py-1.5 text-[12px] font-semibold leading-none transition-colors max-w-[200px] ${
                    active
                      ? 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-900/30 dark:text-blue-100'
                      : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-200 dark:hover:bg-gray-800'
                  }`}
                  title={label}
                >
                  <span className="min-w-0 flex-1 truncate">{label}</span>
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
              <option value="all">{t.allSubcategories || ''}</option>
              {childCategories.map((child) => (
                <option key={child.slug} value={child.slug}>
                  {getCategoryName(child, locale)}
                </option>
              ))}
            </select>
          </div>
        )}

  {selectedCategory === 'following' && !isLoading && allPosts.length === 0 && (recommendedLoading || sortedRecommendations.length) ? (
        <div className="mb-4">
          <RecommendedUsersSection
            title={recommendedUsersLabel}
            locale={locale}
            users={sortedRecommendations}
            isLoading={recommendedLoading}
            translations={translations}
            hasNextPage={hasNextRecommendedPage}
            isFetchingNextPage={isFetchingNextRecommendedPage}
            onLoadMore={() => {
              if (hasNextRecommendedPage && !isFetchingNextRecommendedPage) {
                fetchNextRecommendedPage();
              }
            }}
            followerLabel={followerLabel}
            postsLabel={postsLabel}
            followingLabel={followingLabel}
            metaLabels={metaLabels}
            verifiedLabel={verifiedLabel}
            trustBadgeTranslations={tTrust}
            badgeLabels={badgeLabels}
            previousLabel={previousLabel}
            nextLabel={nextLabel}
            anonymousLabel={anonymousLabel}
            onboardingLabels={tOnboarding}
            compact
          />
        </div>
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
            allPosts.map((post: PostListItem, idx) => (
              <Fragment key={post.id}>
                <div className="flex flex-col">
                  <PostCard
                    id={post.id}
                    author={{
                      id: post.author?.id,
                      name: post.author?.displayName || post.author?.name || anonymousLabel,
                      avatar: (post.author as any)?.image || (post.author as any)?.avatar || '/default-avatar.jpg',
                      followers: (post.author as any)?.followers ?? 0,
                      isFollowing: (post.author as any)?.isFollowing ?? false,
                      isVerified: post.author?.isVerified || false,
                      isExpert: post.author?.isExpert || false,
                      badgeType: post.author?.badgeType || null,
                    }}
                    title={post.title}
                    excerpt={(post.excerpt || buildFeedExcerpt(post.content || '')).substring(0, 200)}
                    tags={post.tags}
                    stats={{
                      likes: (post as any).likesCount ?? post.likes ?? 0,
                      comments: post.type === 'question'
                        ? (post.answersCount ?? post.commentsCount ?? 0)
                        : (post.commentsCount ?? 0),
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
                {shouldInsertFollowingRecommended && idx === 0 && (recommendedLoading || sortedRecommendations.length > 0) ? (
                  <div className="mt-1">
                    <RecommendedUsersSection
                      title={recommendedUsersLabel}
                      locale={locale}
                      users={sortedRecommendations}
                      isLoading={recommendedLoading}
                      translations={translations}
                      hasNextPage={hasNextRecommendedPage}
                      isFetchingNextPage={isFetchingNextRecommendedPage}
                      onLoadMore={() => {
                        if (hasNextRecommendedPage && !isFetchingNextRecommendedPage) {
                          fetchNextRecommendedPage();
                        }
                      }}
                      followerLabel={followerLabel}
                      postsLabel={postsLabel}
                      followingLabel={followingLabel}
                      metaLabels={metaLabels}
                      verifiedLabel={verifiedLabel}
                      trustBadgeTranslations={tTrust}
                      badgeLabels={badgeLabels}
                      previousLabel={previousLabel}
                      nextLabel={nextLabel}
                      anonymousLabel={anonymousLabel}
                      onboardingLabels={tOnboarding}
                      compact
                    />
                  </div>
                ) : null}
                {shouldInsertRecommended && idx === 4 && (recommendedLoading || sortedRecommendations.length > 0) ? (
                  <div className="mt-1">
                    <RecommendedUsersSection
                      title={recommendedUsersLabel}
                      locale={locale}
                      users={sortedRecommendations}
                      isLoading={recommendedLoading}
                      translations={translations}
                      hasNextPage={hasNextRecommendedPage}
                      isFetchingNextPage={isFetchingNextRecommendedPage}
                      onLoadMore={() => {
                        if (hasNextRecommendedPage && !isFetchingNextRecommendedPage) {
                          fetchNextRecommendedPage();
                        }
                      }}
                      followerLabel={followerLabel}
                      postsLabel={postsLabel}
                      followingLabel={followingLabel}
                      metaLabels={metaLabels}
                      verifiedLabel={verifiedLabel}
                      trustBadgeTranslations={tTrust}
                      badgeLabels={badgeLabels}
                      previousLabel={previousLabel}
                      nextLabel={nextLabel}
                      anonymousLabel={anonymousLabel}
                      onboardingLabels={tOnboarding}
                      compact
                    />
                  </div>
                ) : null}
              </Fragment>
            ))
          ) : (
            <div className="flex flex-col gap-6 py-10">
              <div className="text-center text-gray-500 dark:text-gray-400">
                {isSearchMode && searchQuery
                  ? noSearchResultsLabel
                  : (selectedCategory === 'following'
                      ? noFollowingPostsLabel
                      : noPostsLabel)}
              </div>
            </div>
          )}

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
          <p className="text-sm text-gray-500 dark:text-gray-400" data-testid="feed-end-message">
            {allLoadedLabel}
          </p>
        </div>
      )}
    </div>
  );
}
