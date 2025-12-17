'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'nextjs-toploader/app';
import { useParams } from 'next/navigation';
import { X, Users, BadgeCheck, Sparkles, Rss } from 'lucide-react';
import { useSession } from 'next-auth/react';
import dayjs from 'dayjs';
import Modal from '@/components/atoms/Modal';
import PostCard from '@/components/molecules/PostCard';
import Avatar from '@/components/atoms/Avatar';
import FollowButton from '@/components/atoms/FollowButton';
import { useInfiniteFollowers, useInfiniteFollowing, useRecommendedUsers } from '@/repo/users/query';
import { useInfinitePosts } from '@/repo/posts/query';
import { useTogglePostLike, useTogglePostBookmark } from '@/repo/posts/mutation';

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
  isFollowing?: boolean;
  status?: string;
  userType?: string | null;
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
  const [activeTab, setActiveTab] = useState<TabType>('recommend');
  const followingObserverRef = useRef<HTMLDivElement>(null);
  const feedObserverRef = useRef<HTMLDivElement>(null);
  const followerLabel = tCommon.followers || (locale === 'vi' ? 'Người theo dõi' : locale === 'en' ? 'Followers' : '팔로워');
  const postsLabel = tCommon.posts || (locale === 'vi' ? 'Bài viết' : locale === 'en' ? 'Posts' : '게시글');
  const loadingLabel = (t as any).loading || (locale === 'vi' ? 'Đang tải...' : locale === 'en' ? 'Loading...' : '로딩 중...');
  const noRecommendationsLabel = (t as any).noRecommendations || (locale === 'vi' ? 'Chưa có gợi ý người dùng.' : locale === 'en' ? 'No recommendations yet.' : '추천할 사용자가 없습니다.');
  const noFollowingLabel = (t as any).noFollowing || (locale === 'vi' ? 'Chưa theo dõi ai.' : locale === 'en' ? 'You are not following anyone yet.' : '아직 팔로잉하는 사용자가 없습니다.');
  const noFeedLabel = (t as any).noFeed || (locale === 'vi' ? 'Chưa có bài từ người bạn theo dõi.' : locale === 'en' ? 'No posts from people you follow yet.' : '팔로우한 사용자의 게시글이 없습니다.');
  const followingTitleLabel = (t as any).followingTitle || (locale === 'vi' ? 'Đang theo dõi' : locale === 'en' ? 'Following' : '팔로우');
  const recommendLabel = (t as any).recommend || (locale === 'vi' ? 'Gợi ý' : locale === 'en' ? 'Recommended' : '추천');
  const followingTabLabel = (t as any).following || (locale === 'vi' ? 'Đang theo dõi' : locale === 'en' ? 'Following' : '팔로잉');
  const feedLabel = (t as any).feed || (locale === 'vi' ? 'Bảng tin' : locale === 'en' ? 'Feed' : '피드');

  // Recommend (Recommended Users) - fixed 3 users
  const { 
    data: recommendedData, 
    isLoading: recommendedLoading,
    refetch: refetchRecommended,
  } = useRecommendedUsers(
    { enabled: !!user?.id && isOpen && activeTab === 'recommend' }
  );

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
    { enabled: !!user?.id && isOpen && activeTab === 'following' }
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
    { enabled: !!user && isOpen && activeTab === 'feed' }
  );

  const recommendations = recommendedData?.data || [];
  const following = followingData?.pages?.flatMap(page => page.data) || [];
  const feedPosts = feedData?.pages?.flatMap(page => page.data) || [];
  const [followStates, setFollowStates] = useState<Record<string, boolean>>({});

  const handleUserClick = (userId: string) => {
    onClose();
    router.push(`/${locale}/profile/${userId}`);
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    if (tab === 'recommend') {
      refetchRecommended();
    }
  };

  const getUserTypeLabel = (value: string) => {
    switch (value) {
      case 'student':
      case '학생':
        return t.student || '학생';
      case 'worker':
      case '직장인':
      case '근로자':
        return t.worker || '근로자';
      case 'resident':
      case '거주자':
        return t.resident || (locale === 'vi' ? 'Cư dân' : locale === 'en' ? 'Resident' : '거주자');
      case 'business':
      case '사업자':
        return t.business || '사업자';
      case 'homemaker':
      case '주부':
        return t.homemaker || '주부';
      default:
        return value;
    }
  };



  // Intersection Observer for Following
  useEffect(() => {
    if (!hasNextFollowingPage || isFetchingNextFollowingPage || activeTab !== 'following' || !isOpen) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isFetchingNextFollowingPage && hasNextFollowingPage) {
          fetchNextFollowingPage();
        }
      },
      { threshold: 0.1 }
    );

    if (followingObserverRef.current) {
      observer.observe(followingObserverRef.current);
    }

    return () => observer.disconnect();
  }, [hasNextFollowingPage, isFetchingNextFollowingPage, fetchNextFollowingPage, activeTab, isOpen]);

  // Intersection Observer for Feed
  useEffect(() => {
    if (!hasNextFeedPage || isFetchingNextFeedPage || activeTab !== 'feed' || !isOpen) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isFetchingNextFeedPage && hasNextFeedPage) {
          fetchNextFeedPage();
        }
      },
      { threshold: 0.1 }
    );

    if (feedObserverRef.current) {
      observer.observe(feedObserverRef.current);
    }

    return () => observer.disconnect();
  }, [hasNextFeedPage, isFetchingNextFeedPage, fetchNextFeedPage, activeTab, isOpen]);

  const renderUserCard = (userItem: UserItem, isFollowingTab: boolean = false) => {
    const displayName = userItem.displayName || userItem.name || '알 수 없음';
    const isFollowing = followStates[userItem.id] ?? (isFollowingTab ? true : (userItem.isFollowing ?? false));

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
              <div className="flex items-center gap-1.5 mb-1">
                <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                  {displayName}
                </h4>
                {userItem.isVerified && (
                  <BadgeCheck className="w-4 h-4 text-blue-500 flex-shrink-0" />
                )}
              </div>
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
                    #{getUserTypeLabel(effectiveUserType)}
                  </span>
                );
              })()}
              {userItem.bio && (
                <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-2">
                  {userItem.bio}
                </p>
              )}
              <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                <span>{userItem.stats?.followers || 0} {followerLabel}</span>
                <span>{userItem.stats?.posts || 0} {postsLabel}</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-2xl">
      <div className="relative max-h-[80vh] flex flex-col">
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
        <div className="flex-1 overflow-y-auto p-5">
          {/* Recommend Tab */}
          {activeTab === 'recommend' && (
            <div className="space-y-4">
              {recommendedLoading ? (
                <div className="flex justify-center py-12">
                  <div className="h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : recommendations.length === 0 ? (
                <div className="text-center py-12">
                  <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">{noRecommendationsLabel}</p>
                </div>
              ) : (
                <>
                  {recommendations.map((user) => renderUserCard(user as UserItem))}
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
                  {following.map((user) => renderUserCard(user as UserItem, true))}
                  
                  {hasNextFollowingPage && (
                    <div ref={followingObserverRef} className="py-4 text-center">
                      {isFetchingNextFollowingPage && (
                        <div className="inline-flex items-center gap-2 text-gray-500 dark:text-gray-400">
                          <div className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                          <span className="text-sm">{loadingLabel}</span>
                        </div>
                      )}
                    </div>
                  )}
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
                  {feedPosts.map((post: any) => (
                    <PostCard
                      key={post.id}
                      id={post.id}
                      author={{
                        id: post.author?.id,
                        name: post.author?.displayName || post.author?.name || '알 수 없음',
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
                        comments: post.commentsCount ?? 0,
                        shares: 0,
                      }}
                      thumbnail={post.thumbnail}
                      publishedAt={dayjs(post.createdAt).format('YYYY.MM.DD HH:mm')}
                      isQuestion={post.type === 'question'}
                      isAdopted={post.isResolved}
                      isLiked={post.isLiked}
                      isBookmarked={post.isBookmarked}
                      trustBadge={(post as any).trustBadge}
                      trustWeight={(post as any).trustWeight}
                      translations={translations}
                    />
                  ))}
                  
                  {hasNextFeedPage && (
                    <div ref={feedObserverRef} className="py-4 text-center">
                      {isFetchingNextFeedPage && (
                        <div className="inline-flex items-center gap-2 text-gray-500 dark:text-gray-400">
                          <div className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                          <span className="text-sm">{t.loading || '로딩 중...'}</span>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
