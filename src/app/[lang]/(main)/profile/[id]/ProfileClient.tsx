'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'nextjs-toploader/app';
import { Calendar, Mail, Phone, Edit, MessageCircle, FileText, CheckCircle, User, Briefcase, Bookmark, LogOut, Info } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import dayjs from 'dayjs';
import Button from '@/components/atoms/Button';
import Avatar from '@/components/atoms/Avatar';
import FollowButton from '@/components/atoms/FollowButton';
import TrustBadge from '@/components/atoms/TrustBadge';
import Header from '@/components/organisms/Header';
import Tooltip from '@/components/atoms/Tooltip';
import PostCard from '@/components/molecules/PostCard';
import AnswerCard from '@/components/molecules/AnswerCard';
import CommentCard from '@/components/molecules/CommentCard';
import { useInfiniteUserPosts, useInfiniteUserAnswers, useInfiniteUserComments, useInfiniteUserBookmarks, useFollowStatus } from '@/repo/users/query';
import { getTrustBadgePresentation } from '@/lib/utils/trustBadges';


export interface ProfileData {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  email: string;
  phone?: string | null;
  bio: string;
  joinedAt: string;
  isVerified: boolean;
  isExpert?: boolean;
  badgeType?: string | null;
  verifiedProfileSummary?: string | null;
  verifiedProfileKeywords?: string[] | null;
  gender?: string | null;
  ageGroup?: string | null;
  nationality?: string | null;
  status?: string | null;
  userType?: string | null;
  isFollowing?: boolean;
  stats: {
    followers: number;
    following: number;
    posts: number;
    accepted: number;
    comments: number;
    bookmarks: number;
  };
}

interface PostItem {
  id: string;
  author: { id?: string; name: string; avatar: string; followers: number; isFollowing?: boolean; isVerified?: boolean; isExpert?: boolean; badgeType?: string | null };
  title: string;
  content: string;
  excerpt: string;
  tags?: string[];
  stats: { likes: number; comments: number; shares: number };
  answersCount?: number;
  postCommentsCount?: number;
  commentsCount?: number;
  category: string;
  subcategory?: string;
  thumbnail?: string | null;
  thumbnails?: string[];
  imageCount?: number;
  publishedAt: string;
  isQuestion?: boolean;
  isAdopted?: boolean;
  isLiked?: boolean;
  isBookmarked?: boolean;
  certifiedResponderCount?: number;
  otherResponderCount?: number;
}

interface AnswerItem {
  id: string;
  author: { id?: string; name: string; avatar: string; followers?: number; isVerified?: boolean; isExpert?: boolean; badgeType?: string | null };
  content: string;
  excerpt?: string;
  publishedAt: string;
  stats?: { likes: number };
  likes?: number;
  isLiked?: boolean;
  isAdopted?: boolean;
  post?: { id: string; title: string };
}

interface CommentItem {
  id: string;
  author: { id?: string; name: string; avatar: string; followers?: number; isVerified?: boolean; isExpert?: boolean; badgeType?: string | null };
  content: string;
  excerpt?: string;
  publishedAt: string;
  stats?: { likes: number };
  likes?: number;
  isLiked?: boolean;
  post?: { id: string; title: string };
}

interface ProfileClientProps {
  initialProfile: ProfileData;
  locale: string;
  translations?: Record<string, unknown>;
}

export default function ProfileClient({ initialProfile, locale, translations }: ProfileClientProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const user = session?.user;

  const t = (translations?.profile || {}) as Record<string, string>;
  const tTrust = (translations?.trustBadges || {}) as Record<string, string>;

  const trustBadgePresentation = getTrustBadgePresentation({
    locale,
    author: {
      isVerified: initialProfile.isVerified,
      isExpert: initialProfile.isExpert,
      badgeType: initialProfile.badgeType,
    },
    translations: tTrust,
  });

  const [activeTab, setActiveTab] = useState<'posts' | 'accepted' | 'comments' | 'bookmarks'>('posts');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const postsObserverRef = useRef<HTMLDivElement>(null);
  const answersObserverRef = useRef<HTMLDivElement>(null);
  const commentsObserverRef = useRef<HTMLDivElement>(null);
  const bookmarksObserverRef = useRef<HTMLDivElement>(null);

  const isOwnProfile = user?.id === initialProfile.id;
  
  const { data: followStatus } = useFollowStatus(initialProfile.id, !isOwnProfile && !!user);
  
  const [isFollowing, setIsFollowing] = useState(initialProfile.isFollowing ?? false);
  const [followersCount, setFollowersCount] = useState(initialProfile.stats.followers);
  
  useEffect(() => {
    if (followStatus?.isFollowing !== undefined) {
      setIsFollowing(followStatus.isFollowing);
    }
  }, [followStatus?.isFollowing]);

  const handleFollowChange = (next: boolean) => {
    setIsFollowing(next);
    setFollowersCount((prev) => (next ? prev + 1 : Math.max(0, prev - 1)));
  };

  // Infinite scroll hooks
  const { 
    data: postsData, 
    isLoading: postsLoading,
    fetchNextPage: fetchNextPostsPage,
    hasNextPage: hasNextPostsPage,
    isFetchingNextPage: isFetchingNextPostsPage
  } = useInfiniteUserPosts(initialProfile.id);
  
  const { 
    data: answersData, 
    isLoading: answersLoading,
    fetchNextPage: fetchNextAnswersPage,
    hasNextPage: hasNextAnswersPage,
    isFetchingNextPage: isFetchingNextAnswersPage
  } = useInfiniteUserAnswers(initialProfile.id, { adoptedOnly: true });
  
  const { 
    data: commentsData, 
    isLoading: commentsLoading,
    fetchNextPage: fetchNextCommentsPage,
    hasNextPage: hasNextCommentsPage,
    isFetchingNextPage: isFetchingNextCommentsPage
  } = useInfiniteUserComments(initialProfile.id);
  
  const { 
    data: bookmarksData, 
    isLoading: bookmarksLoading,
    fetchNextPage: fetchNextBookmarksPage,
    hasNextPage: hasNextBookmarksPage,
    isFetchingNextPage: isFetchingNextBookmarksPage
  } = useInfiniteUserBookmarks(initialProfile.id, { enabled: isOwnProfile });

  const userPosts = postsData?.pages?.flatMap(page => page.data) || [];
  const acceptedAnswers = answersData?.pages?.flatMap(page => page.data) || [];
  const userComments = commentsData?.pages?.flatMap(page => page.data) || [];
  const userBookmarks = bookmarksData?.pages?.flatMap(page => page.data) || [];

  // Intersection Observer for Posts
  useEffect(() => {
    if (!hasNextPostsPage || isFetchingNextPostsPage || activeTab !== 'posts') return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isFetchingNextPostsPage && hasNextPostsPage) {
          fetchNextPostsPage();
        }
      },
      { threshold: 0.1 }
    );

    if (postsObserverRef.current) {
      observer.observe(postsObserverRef.current);
    }

    return () => observer.disconnect();
  }, [hasNextPostsPage, isFetchingNextPostsPage, fetchNextPostsPage, activeTab]);

  // Intersection Observer for Answers
  useEffect(() => {
    if (!hasNextAnswersPage || isFetchingNextAnswersPage || activeTab !== 'accepted') return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isFetchingNextAnswersPage && hasNextAnswersPage) {
          fetchNextAnswersPage();
        }
      },
      { threshold: 0.1 }
    );

    if (answersObserverRef.current) {
      observer.observe(answersObserverRef.current);
    }

    return () => observer.disconnect();
  }, [hasNextAnswersPage, isFetchingNextAnswersPage, fetchNextAnswersPage, activeTab]);

  // Intersection Observer for Comments
  useEffect(() => {
    if (!hasNextCommentsPage || isFetchingNextCommentsPage || activeTab !== 'comments') return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isFetchingNextCommentsPage && hasNextCommentsPage) {
          fetchNextCommentsPage();
        }
      },
      { threshold: 0.1 }
    );

    if (commentsObserverRef.current) {
      observer.observe(commentsObserverRef.current);
    }

    return () => observer.disconnect();
  }, [hasNextCommentsPage, isFetchingNextCommentsPage, fetchNextCommentsPage, activeTab]);

  // Intersection Observer for Bookmarks
  useEffect(() => {
    if (!hasNextBookmarksPage || isFetchingNextBookmarksPage || activeTab !== 'bookmarks') return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isFetchingNextBookmarksPage && hasNextBookmarksPage) {
          fetchNextBookmarksPage();
        }
      },
      { threshold: 0.1 }
    );

    if (bookmarksObserverRef.current) {
      observer.observe(bookmarksObserverRef.current);
    }

    return () => observer.disconnect();
  }, [hasNextBookmarksPage, isFetchingNextBookmarksPage, fetchNextBookmarksPage, activeTab]);

  const handleEditProfile = () => {
    router.push(`/${locale}/profile/edit`);
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' });
  };

  const renderLoading = () => (
    <div className="flex justify-center py-12">
      <div className="h-8 w-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const getGenderLabel = (gender: string) => {
    switch (gender) {
      case 'male': return t.male || 'Male';
      case 'female': return t.female || 'Female';
      default: return t.other || 'Other';
    }
  };

  const getAgeGroupLabel = (ageGroup: string) => {
    switch (ageGroup) {
      case '10s': return t.teens || '10s';
      case '20s': return t.twenties || '20s';
      case '30s': return t.thirties || '30s';
      case '40s': return t.forties || '40s';
      case '50s': return t.fifties || '50s';
      case '60plus': return t.sixtyPlus || '60+';
      default: return ageGroup;
    }
  };

  const getUserTypeLabel = (value: string) => {
    const normalized = value.toLowerCase();
    if (normalized === 'student' || value === '학생') {
      return locale === 'vi' ? 'Sinh viên' : locale === 'en' ? 'Student' : '학생';
    }
    if (normalized === 'worker' || value === '직장인' || value === '근로자') {
      return locale === 'vi' ? 'Người lao động' : locale === 'en' ? 'Worker' : '근로자';
    }
    if (normalized === 'resident' || value === '거주자') {
      return locale === 'vi' ? 'Cư dân' : locale === 'en' ? 'Resident' : '거주자';
    }
    if (normalized === 'other' || value === '기타') {
      return locale === 'vi' ? 'Khác' : locale === 'en' ? 'Other' : '기타';
    }
    return value;
  };

  const formatDate = (dateString: string) => {
    if (!dateString || dateString === '방금 전') return dateString;
    const date = dayjs(dateString);
    if (!date.isValid()) return dateString;
    return date.format('YYYY.MM.DD HH:mm');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        showBackButton={true}
        hideSearch={true}
        translations={translations || {}}
      />

      <div className="container mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-shrink-0 flex flex-col items-center gap-3">
              <Avatar
                name={initialProfile.displayName || initialProfile.username || '사용자'}
                imageUrl={initialProfile.avatar}
                size="xl"
                hoverHighlight
              />
              {!isOwnProfile && (
                <FollowButton
                  userId={initialProfile.id}
                  userName={initialProfile.displayName}
                  isFollowing={isFollowing}
                  size="sm"
                  onToggle={handleFollowChange}
                />
              )}
              <div className="text-xs text-gray-500 dark:text-gray-400">
                팔로워 {followersCount.toLocaleString()}
              </div>
            </div>

            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{initialProfile.displayName}</h1>
                    {trustBadgePresentation.show ? (
                      <Tooltip content={trustBadgePresentation.tooltip}>
                        <span className="inline-flex">
                          <TrustBadge level={trustBadgePresentation.level} label={trustBadgePresentation.label} />
                        </span>
                      </Tooltip>
                    ) : null}
                  </div>
                  <p className="text-gray-500 dark:text-gray-400">@{initialProfile.username}</p>

                  {trustBadgePresentation.show &&
                    (Boolean(initialProfile.verifiedProfileSummary) ||
                      Boolean(initialProfile.verifiedProfileKeywords?.length)) && (
                      <div className="mt-3 space-y-2">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                          {t.verifiedInfoTitle || 'Verified info'}
                        </p>
                        {Boolean(initialProfile.verifiedProfileKeywords?.length) && (
                          <div className="flex flex-wrap gap-1.5">
                            {(initialProfile.verifiedProfileKeywords || [])
                              .filter(Boolean)
                              .slice(0, 12)
                              .map((keyword) => (
                                <span
                                  key={keyword}
                                  className="inline-flex items-center rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-200 px-2 py-0.5 text-xs font-medium"
                                >
                                  #{String(keyword).replace(/^#/, '')}
                                </span>
                              ))}
                          </div>
                        )}

                        {initialProfile.verifiedProfileSummary && (
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            {initialProfile.verifiedProfileSummary}
                          </p>
                        )}
                      </div>
                    )}
                </div>

                {isOwnProfile ? (
                  <div className="flex gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:flex-initial">
                      <Button
                        variant="secondary"
                        onClick={handleEditProfile}
                        className="flex items-center justify-center gap-2 border border-gray-300 w-full"
                        size="sm"
                      >
                        <Edit className="w-4 h-4" />
                        <span className="hidden sm:inline">{t.editProfile || 'Edit Profile'}</span>
                      </Button>
                      <div className="absolute -top-2 -right-2 sm:hidden">
                        <Tooltip
                          content={
                            t.editProfileTooltip ||
                            (locale === 'vi'
                              ? 'Chỉnh sửa hồ sơ của bạn.'
                              : locale === 'en'
                                ? 'Edit your profile.'
                                : '프로필을 수정할 수 있어요.')
                          }
                          position="top"
                        >
                          <button
                            type="button"
                            aria-label={t.editProfileTooltip || '프로필 편집 도움말'}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-gray-900/60 text-gray-600 dark:text-gray-200 shadow-sm"
                          >
                            <Info className="h-4 w-4" />
                          </button>
                        </Tooltip>
                      </div>
                    </div>
                    <Button
                      variant="secondary"
                      onClick={handleLogout}
                      className="flex items-center justify-center gap-2 border border-gray-300 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 flex-1 sm:flex-initial"
                      size="sm"
                    >
                      <LogOut className="w-4 h-4" />
                      <span className="hidden sm:inline">{t.logout || 'Logout'}</span>
                    </Button>
                  </div>
                ) : null}
              </div>

              {initialProfile.bio && (
                <p className="text-gray-700 dark:text-gray-300 mb-4">{initialProfile.bio}</p>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{t.joinedAt || 'Joined'}: {new Date(initialProfile.joinedAt).toLocaleDateString(locale)}</span>
                </div>
                {initialProfile.gender && (
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span>{t.gender || 'Gender'}: {getGenderLabel(initialProfile.gender)}</span>
                  </div>
                )}
                {initialProfile.ageGroup && (
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span>{t.ageGroup || 'Age'}: {getAgeGroupLabel(initialProfile.ageGroup)}</span>
                  </div>
                )}
                {(() => {
                  const legacyStatus = initialProfile.status;
                  const effectiveUserType =
                    initialProfile.userType ||
                    (legacyStatus && legacyStatus !== 'banned' && legacyStatus !== 'suspended' ? legacyStatus : null);
                  if (!effectiveUserType) return null;
                  return (
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4" />
                      <span>{t.status || 'Status'}: {getUserTypeLabel(effectiveUserType)}</span>
                    </div>
                  );
                })()}
                {isOwnProfile && initialProfile.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    <span>{initialProfile.email}</span>
                  </div>
                )}
                {isOwnProfile && initialProfile.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    <span>{initialProfile.phone}</span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-4 sm:gap-6 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="flex-1 min-w-[80px] text-center cursor-pointer hover:opacity-80 transition-opacity">
                  <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">{followersCount}</div>
                  <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{t.followers || 'Followers'}</div>
                </div>
                <div className="flex-1 min-w-[80px] text-center cursor-pointer hover:opacity-80 transition-opacity">
                  <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">{initialProfile.stats.following}</div>
                  <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{t.following || 'Following'}</div>
                </div>
                <div className="flex-1 min-w-[80px] text-center">
                  <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">{initialProfile.stats.posts}</div>
                  <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{t.posts || 'Posts'}</div>
                </div>
                <div className="flex-1 min-w-[80px] text-center">
                  <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">{initialProfile.stats.accepted}</div>
                  <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{t.accepted || 'Accepted'}</div>
                </div>
                <div className="flex-1 min-w-[80px] text-center">
                  <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">{initialProfile.stats.comments}</div>
                  <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{t.comments || 'Comments'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <div className="flex overflow-x-auto scrollbar-hide">
              <button
                onClick={() => setActiveTab('posts')}
                className={`flex-1 min-w-fit py-3 sm:py-4 px-3 sm:px-6 text-center font-medium transition-colors whitespace-nowrap ${
                  activeTab === 'posts'
                    ? 'text-amber-600 dark:text-amber-500 border-b-2 border-amber-500'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <div className="flex items-center justify-center gap-1 sm:gap-2">
                  <FileText className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                  <span className="text-xs sm:text-base">{t.myPosts || 'My Posts'}</span>
                  <span className="text-xs sm:text-sm">({initialProfile.stats.posts})</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('accepted')}
                className={`flex-1 min-w-fit py-3 sm:py-4 px-3 sm:px-6 text-center font-medium transition-colors whitespace-nowrap ${
                  activeTab === 'accepted'
                    ? 'text-amber-600 dark:text-amber-500 border-b-2 border-amber-500'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <div className="flex items-center justify-center gap-1 sm:gap-2">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                  <span className="text-xs sm:text-base">{t.acceptedAnswers || 'Accepted Answers'}</span>
                  <span className="text-xs sm:text-sm">({initialProfile.stats.accepted})</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('comments')}
                className={`flex-1 min-w-fit py-3 sm:py-4 px-3 sm:px-6 text-center font-medium transition-colors whitespace-nowrap ${
                  activeTab === 'comments'
                    ? 'text-amber-600 dark:text-amber-500 border-b-2 border-amber-500'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <div className="flex items-center justify-center gap-1 sm:gap-2">
                  <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                  <span className="text-xs sm:text-base">{t.myComments || 'My Comments'}</span>
                  <span className="text-xs sm:text-sm">({initialProfile.stats.comments})</span>
                </div>
              </button>
              {isOwnProfile && (
                <button
                  onClick={() => setActiveTab('bookmarks')}
                  className={`flex-1 min-w-fit py-3 sm:py-4 px-3 sm:px-6 text-center font-medium transition-colors whitespace-nowrap ${
                    activeTab === 'bookmarks'
                      ? 'text-amber-600 dark:text-amber-500 border-b-2 border-amber-500'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1 sm:gap-2">
                    <Bookmark className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                    <span className="text-xs sm:text-base">{t.bookmarks || 'Bookmarks'}</span>
                    <span className="text-xs sm:text-sm">({initialProfile.stats.bookmarks})</span>
                  </div>
                </button>
              )}
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'posts' && (
              <div className="space-y-4">
                {postsLoading ? renderLoading() : userPosts.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400">{t.noPosts || 'No posts yet'}</p>
                  </div>
                ) : (
                  userPosts.map((post: PostItem) => {
                    const resolvedThumbnail = post.thumbnail || post.thumbnails?.[0];
                    const thumbnails = post.thumbnails?.length ? post.thumbnails : undefined;
                    return (
                      <PostCard
                        key={post.id}
                        id={post.id}
                        author={post.author}
                        title={post.title}
                        excerpt={post.excerpt || ''}
                        tags={post.tags || []}
                        stats={{
                          ...post.stats,
                          comments: post.isQuestion
                            ? (post.answersCount ?? post.stats.comments)
                            : post.stats.comments,
                        }}
                        category={post.category}
                        subcategory={post.subcategory}
                        thumbnail={resolvedThumbnail}
                        thumbnails={thumbnails}
                        imageCount={post.imageCount}
                        certifiedResponderCount={post.certifiedResponderCount}
                        otherResponderCount={post.otherResponderCount}
                        publishedAt={formatDate(post.publishedAt)}
                        isQuestion={post.isQuestion}
	                      isAdopted={post.isAdopted}
	                      isLiked={post.isLiked}
	                      isBookmarked={post.isBookmarked}
	                      trustBadge={(post as any).trustBadge}
	                      trustWeight={(post as any).trustWeight}
	                      translations={translations || {}}
	                    />
                    );
                  })
                )}
                
                {/* Loading indicator for posts */}
                {hasNextPostsPage && (
                  <div ref={postsObserverRef} className="py-4 text-center">
                    {isFetchingNextPostsPage && (
                      <div className="inline-flex items-center gap-2 text-gray-500 dark:text-gray-400">
                        <div className="h-4 w-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm">{t.loading || '로딩 중...'}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'accepted' && (
              <div className="space-y-4">
                {answersLoading ? renderLoading() : acceptedAnswers.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400">{t.noAccepted || 'No accepted answers yet'}</p>
                  </div>
                ) : (
                  acceptedAnswers.map((answer: AnswerItem) => (
                    <AnswerCard
                      key={answer.id}
                      id={answer.id}
                      author={answer.author}
                      content={answer.content}
                      publishedAt={formatDate(answer.publishedAt)}
                      likes={answer.stats?.likes || answer.likes || 0}
                      isLiked={answer.isLiked}
                      isAdopted={answer.isAdopted}
                      post={answer.post}
                      locale={locale}
                      translations={translations}
                    />
                  ))
                )}
                
                {/* Loading indicator for answers */}
                {hasNextAnswersPage && (
                  <div ref={answersObserverRef} className="py-4 text-center">
                    {isFetchingNextAnswersPage && (
                      <div className="inline-flex items-center gap-2 text-gray-500 dark:text-gray-400">
                        <div className="h-4 w-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm">{t.loading || '로딩 중...'}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'comments' && (
              <div className="space-y-4">
                {commentsLoading ? renderLoading() : userComments.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400">{t.noComments || 'No comments yet'}</p>
                  </div>
                ) : (
                  userComments.map((comment: CommentItem) => (
                    <CommentCard
                      key={comment.id}
                      id={comment.id}
                      author={comment.author}
                      content={comment.content}
                      publishedAt={formatDate(comment.publishedAt)}
                      likes={comment.stats?.likes || comment.likes || 0}
                      isLiked={comment.isLiked}
                      post={comment.post}
                      locale={locale}
                      translations={translations}
                    />
                  ))
                )}
                
                {/* Loading indicator for comments */}
                {hasNextCommentsPage && (
                  <div ref={commentsObserverRef} className="py-4 text-center">
                    {isFetchingNextCommentsPage && (
                      <div className="inline-flex items-center gap-2 text-gray-500 dark:text-gray-400">
                        <div className="h-4 w-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm">{t.loading || '로딩 중...'}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'bookmarks' && (
              <div className="space-y-4">
                {bookmarksLoading ? renderLoading() : userBookmarks.length === 0 ? (
                  <div className="text-center py-12">
                    <Bookmark className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400">{t.noBookmarks || 'No bookmarks yet'}</p>
                  </div>
                ) : (
                  userBookmarks.map((bookmark: PostItem) => {
                    const resolvedThumbnail = bookmark.thumbnail || bookmark.thumbnails?.[0];
                    const thumbnails = bookmark.thumbnails?.length ? bookmark.thumbnails : undefined;
                    return (
                      <PostCard
                        key={bookmark.id}
                        id={bookmark.id}
                        author={bookmark.author}
                        title={bookmark.title}
                        excerpt={bookmark.excerpt || ''}
                        tags={bookmark.tags || []}
                        stats={{
                          ...bookmark.stats,
                          comments: bookmark.isQuestion
                            ? (bookmark.answersCount ?? bookmark.stats.comments)
                            : bookmark.stats.comments,
                        }}
                        category={bookmark.category}
                        subcategory={bookmark.subcategory}
                        thumbnail={resolvedThumbnail}
                        thumbnails={thumbnails}
                        imageCount={bookmark.imageCount}
                        certifiedResponderCount={bookmark.certifiedResponderCount}
                        otherResponderCount={bookmark.otherResponderCount}
                        publishedAt={formatDate(bookmark.publishedAt)}
                        isQuestion={bookmark.isQuestion}
	                      isAdopted={bookmark.isAdopted}
	                      isLiked={bookmark.isLiked}
	                      isBookmarked={true}
	                      trustBadge={(bookmark as any).trustBadge}
	                      trustWeight={(bookmark as any).trustWeight}
	                      translations={translations || {}}
	                    />
                    );
                  })
                )}
                
                {/* Loading indicator for bookmarks */}
                {hasNextBookmarksPage && (
                  <div ref={bookmarksObserverRef} className="py-4 text-center">
                    {isFetchingNextBookmarksPage && (
                      <div className="inline-flex items-center gap-2 text-gray-500 dark:text-gray-400">
                        <div className="h-4 w-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm">{t.loading || '로딩 중...'}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
