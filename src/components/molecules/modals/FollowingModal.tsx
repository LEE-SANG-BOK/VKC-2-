'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'nextjs-toploader/app';
import { useParams } from 'next/navigation';
import { X, Users, Sparkles, Rss } from 'lucide-react';
import { useSession } from 'next-auth/react';
import Modal from '@/components/atoms/Modal';
import PostCard from '@/components/molecules/cards/PostCard';
import Avatar from '@/components/atoms/Avatar';
import FollowButton from '@/components/atoms/FollowButton';
import UserTrustBadge from '@/components/molecules/user/UserTrustBadge';
import { useInfiniteFollowing, useInfiniteRecommendedUsers } from '@/repo/users/query';
import { useInfinitePosts } from '@/repo/posts/query';
import useProgressiveList from '@/lib/hooks/useProgressiveList';
import { formatRecommendationMetaItems, localizeRecommendationMetaItems, type RecommendationMetaItem } from '@/utils/recommendationMeta';
import { getUserTypeLabel } from '@/utils/userTypeLabel';
import { getTrustBadgePresentation } from '@/lib/utils/trustBadges';

interface FollowingModalProps {
  isOpen: boolean;
  onClose: () => void;
  translations?: Record<string, string>;
}

type TabType = 'recommend' | 'following' | 'feed';

interface UserItem {
  id: string;
  displayName?: string;
  name?: string;
  username?: string;
  avatar?: string;
  image?: string;
  bio?: string;
  isVerified?: boolean;
  badgeType?: string | null;
  isFollowing?: boolean;
  status?: string;
  userType?: string | null;
  recommendationMeta?: RecommendationMetaItem[];
  stats?: {
    followers?: number;
    following?: number;
    posts?: number;
  };
}

export default function FollowingModal({ isOpen, onClose, translations = {} }: FollowingModalProps) {
  const router = useRouter();
  const params = useParams();
  const locale = params.lang as string || 'ko';
  const { data: session } = useSession();
  const user = session?.user;
  
  const t = translations;
  const tCommon = (translations as any)?.common || {};
  const tTrust = (translations as any)?.trustBadges || {};
  const tOnboarding = (translations as any)?.onboarding || {};
  const modalFallbacks = useMemo(() => {
    if (locale === 'en') {
      return {
        followers: 'Followers',
        posts: 'Posts',
        following: 'Following',
        adoptionRate: 'Adoption rate',
        interestMatchRate: 'Interest match rate',
        verifiedUser: 'Verified',
        loading: 'Loading...',
        noRecommendations: 'No recommendations yet.',
        noFollowing: 'You are not following anyone yet.',
        noFeed: 'No posts from people you follow yet.',
        followingTitle: 'Following',
        recommend: 'Recommended',
        followingTab: 'Following',
        feed: 'Feed',
        expertBadge: 'Expert',
        communityBadge: 'Community',
        verifiedBadge: 'Verified',
        unknownUser: 'Unknown',
        student: 'Student',
        worker: 'Worker',
        resident: 'Resident',
        business: 'Business Owner',
        homemaker: 'Homemaker',
      };
    }
    if (locale === 'vi') {
      return {
        followers: 'Người theo dõi',
        posts: 'Bài viết',
        following: 'Đang theo dõi',
        adoptionRate: 'Tỷ lệ được chấp nhận',
        interestMatchRate: 'Tỷ lệ khớp sở thích',
        verifiedUser: 'Đã xác minh',
        loading: 'Đang tải...',
        noRecommendations: 'Chưa có gợi ý người dùng.',
        noFollowing: 'Chưa theo dõi ai.',
        noFeed: 'Chưa có bài từ người bạn theo dõi.',
        followingTitle: 'Đang theo dõi',
        recommend: 'Gợi ý',
        followingTab: 'Đang theo dõi',
        feed: 'Bảng tin',
        expertBadge: 'Chuyên gia',
        communityBadge: 'Cộng đồng',
        verifiedBadge: 'Đã xác minh',
        unknownUser: 'Không rõ',
        student: 'Sinh viên',
        worker: 'Người lao động',
        resident: 'Cư dân',
        business: 'Chủ doanh nghiệp',
        homemaker: 'Nội trợ',
      };
    }
    return {
      followers: '팔로워',
      posts: '게시글',
      following: '팔로잉',
      adoptionRate: '채택률',
      interestMatchRate: '관심사 일치율',
      verifiedUser: '인증됨',
      loading: '로딩 중...',
      noRecommendations: '추천할 사용자가 없습니다.',
      noFollowing: '아직 팔로잉하는 사용자가 없습니다.',
      noFeed: '팔로우한 사용자의 게시글이 없습니다.',
      followingTitle: '팔로우',
      recommend: '추천',
      followingTab: '팔로잉',
      feed: '피드',
      expertBadge: '전문가',
      communityBadge: '커뮤니티',
      verifiedBadge: '인증됨',
      unknownUser: '알 수 없음',
      student: '학생',
      worker: '근로자',
      resident: '거주자',
      business: '사업자',
      homemaker: '주부',
    };
  }, [locale]);
  const modalLabels = {
    followers: tCommon.followers || modalFallbacks.followers,
    posts: tCommon.posts || modalFallbacks.posts,
    following: tCommon.following || modalFallbacks.following,
    adoptionRate: tCommon.adoptionRate || modalFallbacks.adoptionRate,
    interestMatchRate: tCommon.interestMatchRate || modalFallbacks.interestMatchRate,
    verifiedUser: tCommon.verifiedUser || modalFallbacks.verifiedUser,
    loading: (t as any).loading || modalFallbacks.loading,
    noRecommendations: (t as any).noRecommendations || modalFallbacks.noRecommendations,
    noFollowing: (t as any).noFollowing || modalFallbacks.noFollowing,
    noFeed: (t as any).noFeed || modalFallbacks.noFeed,
    followingTitle: (t as any).followingTitle || modalFallbacks.followingTitle,
    recommend: (t as any).recommend || modalFallbacks.recommend,
    followingTab: (t as any).following || modalFallbacks.followingTab,
    feed: (t as any).feed || modalFallbacks.feed,
    expertBadge: tTrust.expertLabel || modalFallbacks.expertBadge,
    communityBadge: tTrust.communityLabel || modalFallbacks.communityBadge,
    verifiedBadge: tTrust.verifiedUserLabel || modalFallbacks.verifiedBadge,
    unknownUser: modalFallbacks.unknownUser,
    student: t.student || modalFallbacks.student,
    worker: t.worker || modalFallbacks.worker,
    resident: t.resident || modalFallbacks.resident,
    business: t.business || modalFallbacks.business,
    homemaker: t.homemaker || modalFallbacks.homemaker,
  };
  const [activeTab, setActiveTab] = useState<TabType>('recommend');
  const modalBodyRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const recommendedObserverRef = useRef<HTMLDivElement>(null);
  const followingObserverRef = useRef<HTMLDivElement>(null);
  const feedObserverRef = useRef<HTMLDivElement>(null);
  const followerLabel = modalLabels.followers;
  const postsLabel = modalLabels.posts;
  const followingLabel = modalLabels.following;
  const metaLabels = {
    followers: followerLabel,
    posts: postsLabel,
    following: followingLabel,
    adoptionRate: modalLabels.adoptionRate,
    interestMatchRate: modalLabels.interestMatchRate,
    badge: modalLabels.verifiedUser,
  };
  const badgeLabels = {
    expert: modalLabels.expertBadge,
    community: modalLabels.communityBadge,
    verified: modalLabels.verifiedBadge,
  };
  const loadingLabel = modalLabels.loading;
  const noRecommendationsLabel = modalLabels.noRecommendations;
  const noFollowingLabel = modalLabels.noFollowing;
  const noFeedLabel = modalLabels.noFeed;
  const followingTitleLabel = modalLabels.followingTitle;
  const recommendLabel = modalLabels.recommend;
  const followingTabLabel = modalLabels.followingTab;
  const feedLabel = modalLabels.feed;

  const {
    data: recommendedData,
    isLoading: recommendedLoading,
    fetchNextPage: fetchNextRecommendedPage,
    hasNextPage: hasNextRecommendedPage,
    isFetchingNextPage: isFetchingNextRecommendedPage,
  } = useInfiniteRecommendedUsers({
    enabled: !!user?.id && isOpen && activeTab === 'recommend',
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  // Following infinite scroll
  const { 
    data: followingData, 
    isLoading: followingLoading,
    fetchNextPage: fetchNextFollowingPage,
    hasNextPage: hasNextFollowingPage,
    isFetchingNextPage: isFetchingNextFollowingPage
  } = useInfiniteFollowing(
    user?.id || '',
    {},
    {
      enabled: !!user?.id && isOpen && activeTab === 'following',
      staleTime: 5 * 60 * 1000,
      gcTime: 15 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    }
  );

  // Feed (following users' posts) infinite scroll
  const {
    data: feedData,
    isLoading: feedLoading,
    fetchNextPage: fetchNextFeedPage,
    hasNextPage: hasNextFeedPage,
    isFetchingNextPage: isFetchingNextFeedPage
  } = useInfinitePosts(
    { filter: 'following-users' },
    {
      enabled: !!user && isOpen && activeTab === 'feed',
      staleTime: 2 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    }
  );

  const normalizeQueryList = <T,>(value: unknown): T[] => {
    if (!value) return [];
    const maybe = value as any;
    if (Array.isArray(maybe.pages)) {
      return maybe.pages.flatMap((page: any) => page?.data || []);
    }
    if (Array.isArray(maybe.data)) return maybe.data;
    return [];
  };

  const recommendations = useMemo(() => normalizeQueryList<UserItem>(recommendedData), [recommendedData]);
  const following = useMemo(() => normalizeQueryList<UserItem>(followingData), [followingData]);
  const feedPosts = useMemo(() => normalizeQueryList<any>(feedData), [feedData]);
  const [followStates, setFollowStates] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!isOpen) {
      setActiveTab('recommend');
      setFollowStates({});
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    if (modalBodyRef.current?.parentElement) {
      modalBodyRef.current.parentElement.scrollTop = 0;
    }
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = 0;
    }
  }, [activeTab, isOpen]);

  const visibleRecommendCount = useProgressiveList({
    enabled: isOpen && activeTab === 'recommend' && !recommendedLoading,
    total: recommendations.length,
    initial: 3,
    step: 3,
    resetKey: activeTab,
  });

  const visibleFollowingCount = useProgressiveList({
    enabled: isOpen && activeTab === 'following' && !followingLoading,
    total: following.length,
    initial: 8,
    step: 8,
    resetKey: activeTab,
  });

  const visibleFeedCount = useProgressiveList({
    enabled: isOpen && activeTab === 'feed' && !feedLoading,
    total: feedPosts.length,
    initial: 4,
    step: 4,
    resetKey: activeTab,
  });

  const visibleRecommendations = recommendations.slice(0, visibleRecommendCount);
  const visibleFollowing = following.slice(0, visibleFollowingCount);
  const visibleFeedPosts = feedPosts.slice(0, visibleFeedCount);

  const handleUserClick = (userId: string) => {
    onClose();
    router.push(`/${locale}/profile/${userId}`);
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
  };

  const userTypeLabels = {
    student: modalLabels.student,
    worker: modalLabels.worker,
    resident: modalLabels.resident,
    business: modalLabels.business,
    homemaker: modalLabels.homemaker,
  };

  const formatDateTime = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    const pad = (input: number) => String(input).padStart(2, '0');
    return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };



  useEffect(() => {
    if (!hasNextRecommendedPage || isFetchingNextRecommendedPage || activeTab !== 'recommend' || !isOpen) return;
    if (visibleRecommendCount < recommendations.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isFetchingNextRecommendedPage && hasNextRecommendedPage && visibleRecommendCount >= recommendations.length) {
          fetchNextRecommendedPage();
        }
      },
      { threshold: 0.1 }
    );

    if (recommendedObserverRef.current) {
      observer.observe(recommendedObserverRef.current);
    }

    return () => observer.disconnect();
  }, [
    activeTab,
    fetchNextRecommendedPage,
    hasNextRecommendedPage,
    isFetchingNextRecommendedPage,
    isOpen,
    recommendations.length,
    visibleRecommendCount,
  ]);

  // Intersection Observer for Following
  useEffect(() => {
    if (!hasNextFollowingPage || isFetchingNextFollowingPage || activeTab !== 'following' || !isOpen) return;
    if (visibleFollowingCount < following.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isFetchingNextFollowingPage && hasNextFollowingPage && visibleFollowingCount >= following.length) {
          fetchNextFollowingPage();
        }
      },
      { threshold: 0.1 }
    );

    if (followingObserverRef.current) {
      observer.observe(followingObserverRef.current);
    }

    return () => observer.disconnect();
  }, [activeTab, fetchNextFollowingPage, following.length, hasNextFollowingPage, isFetchingNextFollowingPage, isOpen, visibleFollowingCount]);

  // Intersection Observer for Feed
  useEffect(() => {
    if (!hasNextFeedPage || isFetchingNextFeedPage || activeTab !== 'feed' || !isOpen) return;
    if (visibleFeedCount < feedPosts.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isFetchingNextFeedPage && hasNextFeedPage && visibleFeedCount >= feedPosts.length) {
          fetchNextFeedPage();
        }
      },
      { threshold: 0.1 }
    );

    if (feedObserverRef.current) {
      observer.observe(feedObserverRef.current);
    }

    return () => observer.disconnect();
  }, [activeTab, feedPosts.length, fetchNextFeedPage, hasNextFeedPage, isFetchingNextFeedPage, isOpen, visibleFeedCount]);

  const renderUserCard = (userItem: UserItem, isFollowingTab: boolean = false) => {
    const displayName = userItem.displayName || userItem.name || modalLabels.unknownUser;
    const isFollowing = followStates[userItem.id] ?? (isFollowingTab ? true : (userItem.isFollowing ?? false));
    const localizedMetaItems = localizeRecommendationMetaItems({
      items: userItem.recommendationMeta,
      locale: locale as 'ko' | 'en' | 'vi',
      onboardingLabels: tOnboarding,
    });
    const metaTexts: string[] = formatRecommendationMetaItems({
      items: localizedMetaItems,
      fallback: localizedMetaItems,
      metaLabels,
      badgeLabels,
    });

    return (
      <div
        key={userItem.id}
        className="bg-white dark:bg-gray-800 rounded-xl p-4 hover:shadow-lg transition-all border border-gray-200 dark:border-gray-700"
      >
        <div className="flex items-start gap-4">
          <div className="flex flex-col items-center gap-2">
            <Avatar
              name={displayName}
              imageUrl={userItem.avatar || userItem.image}
              size="lg"
              hoverHighlight
            />
            <FollowButton
              userId={String(userItem.id)}
              userName={displayName}
              isFollowing={isFollowing}
              size="sm"
              onToggle={(next) =>
                setFollowStates((prev) => ({
                  ...prev,
                  [userItem.id]: next,
                }))
              }
            />
          </div>

          <div className="flex-1 min-w-0">
            <button
              type="button"
              onClick={() => handleUserClick(userItem.id)}
              className="w-full text-left"
            >
              {(() => {
                const trustBadgePresentation = getTrustBadgePresentation({
                  locale,
                  author: {
                    isVerified: userItem.isVerified,
                    badgeType: userItem.badgeType,
                  },
                  translations: tTrust,
                });
                return (
                  <div className="flex items-center gap-1.5 mb-1">
                <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                  {displayName}
                </h4>
                    <UserTrustBadge
                      presentation={trustBadgePresentation}
                      labelVariant="text"
                      badgeClassName="!px-1.5 !py-0.5"
                      labelClassName="text-[11px] text-gray-500 dark:text-gray-400"
                    />
                  </div>
                );
              })()}
              {userItem.username && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                  @{userItem.username}
                </p>
              )}
              {(() => {
                const legacyStatus = userItem.status;
                const effectiveUserType =
                  userItem.userType ||
                  (legacyStatus && legacyStatus !== 'banned' && legacyStatus !== 'suspended' ? legacyStatus : null);
                if (!effectiveUserType) return null;
                return (
                  <span className="inline-block px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full mb-2">
                    #{getUserTypeLabel(effectiveUserType, userTypeLabels)}
                  </span>
                );
              })()}
              {userItem.bio && (
                <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-2">
                  {userItem.bio}
                </p>
              )}
              <div className="text-xs text-gray-500 dark:text-gray-400 flex flex-wrap gap-1">
                {metaTexts.map((text, index) => (
                  <span key={`${userItem.id}-meta-${index}`} className="inline-flex">
                    # {text}
                  </span>
                ))}
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-2xl">
      <div ref={modalBodyRef} className="relative max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {followingTitleLabel}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex">
            <button
              onClick={() => handleTabChange('recommend')}
              className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                activeTab === 'recommend'
                  ? 'text-blue-600 dark:text-blue-500 border-b-2 border-blue-500'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Sparkles className="w-5 h-5" />
                <span>{recommendLabel}</span>
              </div>
            </button>
            <button
              onClick={() => handleTabChange('following')}
              className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                activeTab === 'following'
                  ? 'text-blue-600 dark:text-blue-500 border-b-2 border-blue-500'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Users className="w-5 h-5" />
                <span>{followingTabLabel}</span>
              </div>
            </button>
            <button
              onClick={() => handleTabChange('feed')}
              className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                activeTab === 'feed'
                  ? 'text-blue-600 dark:text-blue-500 border-b-2 border-blue-500'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Rss className="w-5 h-5" />
                <span>{feedLabel}</span>
              </div>
            </button>
          </div>
        </div>

        {/* Content */}
        <div ref={scrollAreaRef} className="flex-1 overflow-y-auto p-5">
          {/* Recommend Tab */}
          {activeTab === 'recommend' && (
            <div className="space-y-4">
              {recommendedLoading ? (
                Array.from({ length: 3 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-start gap-4 animate-pulse">
                      <div className="flex flex-col items-center gap-2">
                        <div className="h-12 w-12 rounded-full bg-gray-200 dark:bg-gray-700" />
                        <div className="h-8 w-20 rounded-md bg-gray-200 dark:bg-gray-700" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="h-4 w-40 rounded bg-gray-200 dark:bg-gray-700" />
                        <div className="mt-2 h-3 w-24 rounded bg-gray-200 dark:bg-gray-700" />
                        <div className="mt-3 h-3 w-full max-w-[260px] rounded bg-gray-200 dark:bg-gray-700" />
                      </div>
                    </div>
                  </div>
                ))
              ) : recommendations.length === 0 ? (
                <div className="text-center py-12">
                  <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">{noRecommendationsLabel}</p>
                </div>
              ) : (
                <>
                  {visibleRecommendations.map((user) => renderUserCard(user as UserItem))}
                  {visibleRecommendCount < recommendations.length ? (
                    <div className="space-y-4">
                      {Array.from({ length: 2 }).map((_, idx) => (
                        <div
                          key={idx}
                          className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700"
                        >
                          <div className="flex items-start gap-4 animate-pulse">
                            <div className="flex flex-col items-center gap-2">
                              <div className="h-12 w-12 rounded-full bg-gray-200 dark:bg-gray-700" />
                              <div className="h-8 w-20 rounded-md bg-gray-200 dark:bg-gray-700" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="h-4 w-40 rounded bg-gray-200 dark:bg-gray-700" />
                              <div className="mt-2 h-3 w-24 rounded bg-gray-200 dark:bg-gray-700" />
                              <div className="mt-3 h-3 w-full max-w-[260px] rounded bg-gray-200 dark:bg-gray-700" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                  {hasNextRecommendedPage && visibleRecommendCount >= recommendations.length ? (
                    <div ref={recommendedObserverRef} className="py-4 text-center">
                      {isFetchingNextRecommendedPage && (
                        <div className="inline-flex items-center gap-2 text-gray-500 dark:text-gray-400">
                          <div className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                          <span className="text-sm">{loadingLabel}</span>
                        </div>
                      )}
                    </div>
                  ) : null}
                </>
              )}
            </div>
          )}

          {/* Following Tab */}
          {activeTab === 'following' && (
            <div className="space-y-4">
              {followingLoading ? (
                <div className="flex justify-center py-12">
                  <div className="h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : following.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">{noFollowingLabel}</p>
                </div>
              ) : (
                <>
                  {visibleFollowing.map((user) => renderUserCard(user as UserItem, true))}
                  {visibleFollowingCount < following.length ? (
                    <div className="space-y-4">
                      {Array.from({ length: 2 }).map((_, idx) => (
                        <div
                          key={idx}
                          className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700"
                        >
                          <div className="flex items-start gap-4 animate-pulse">
                            <div className="flex flex-col items-center gap-2">
                              <div className="h-12 w-12 rounded-full bg-gray-200 dark:bg-gray-700" />
                              <div className="h-8 w-20 rounded-md bg-gray-200 dark:bg-gray-700" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="h-4 w-40 rounded bg-gray-200 dark:bg-gray-700" />
                              <div className="mt-2 h-3 w-24 rounded bg-gray-200 dark:bg-gray-700" />
                              <div className="mt-3 h-3 w-full max-w-[260px] rounded bg-gray-200 dark:bg-gray-700" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                  
                  {hasNextFollowingPage && visibleFollowingCount >= following.length ? (
                    <div ref={followingObserverRef} className="py-4 text-center">
                      {isFetchingNextFollowingPage && (
                        <div className="inline-flex items-center gap-2 text-gray-500 dark:text-gray-400">
                          <div className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                          <span className="text-sm">{loadingLabel}</span>
                        </div>
                      )}
                    </div>
                  ) : null}
                </>
              )}
            </div>
          )}

          {/* Feed Tab */}
          {activeTab === 'feed' && (
            <div className="space-y-4">
              {feedLoading ? (
                <div className="flex justify-center py-12">
                  <div className="h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : feedPosts.length === 0 ? (
                <div className="text-center py-12">
                  <Rss className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">{noFeedLabel}</p>
                </div>
              ) : (
                <>
                  {visibleFeedPosts.map((post: any) => (
                    <PostCard
                      key={post.id}
                      id={post.id}
                      author={{
                        id: post.author?.id,
                        name: post.author?.displayName || post.author?.name || modalLabels.unknownUser,
                        avatar: post.author?.image || post.author?.avatar || '/default-avatar.jpg',
                        followers: 0,
                        isVerified: post.author?.isVerified || false,
                        isExpert: post.author?.isExpert || false,
                        badgeType: post.author?.badgeType || null,
                      }}
                      title={post.title}
                      excerpt={post.excerpt || post.content?.replace(/<img[^>]*>/gi, '').replace(/<[^>]*>/g, '').trim().substring(0, 200) || ''}
                      tags={post.tags || []}
                      stats={{
                        likes: post.likesCount ?? post.likes ?? 0,
                        comments: post.type === 'question'
                          ? (post.answersCount ?? post.commentsCount ?? 0)
                          : (post.commentsCount ?? 0),
                        shares: 0,
                      }}
                      thumbnail={post.thumbnail}
                      publishedAt={formatDateTime(post.createdAt)}
                      isQuestion={post.type === 'question'}
                      isAdopted={post.isResolved}
                      isLiked={post.isLiked}
                      isBookmarked={post.isBookmarked}
                      trustBadge={(post as any).trustBadge}
                      trustWeight={(post as any).trustWeight}
                      translations={translations}
                    />
                  ))}

                  {visibleFeedCount < feedPosts.length ? (
                    <div className="space-y-4">
                      {Array.from({ length: 2 }).map((_, idx) => (
                        <div
                          key={idx}
                          className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 animate-pulse"
                        >
                          <div className="h-4 w-2/3 rounded bg-gray-200 dark:bg-gray-700" />
                          <div className="mt-3 h-3 w-full rounded bg-gray-200 dark:bg-gray-700" />
                          <div className="mt-2 h-3 w-5/6 rounded bg-gray-200 dark:bg-gray-700" />
                        </div>
                      ))}
                    </div>
                  ) : null}
                  
                  {hasNextFeedPage && visibleFeedCount >= feedPosts.length ? (
                    <div ref={feedObserverRef} className="py-4 text-center">
                      {isFetchingNextFeedPage && (
                        <div className="inline-flex items-center gap-2 text-gray-500 dark:text-gray-400">
                          <div className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                          <span className="text-sm">{loadingLabel}</span>
                        </div>
                      )}
                    </div>
                  ) : null}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
