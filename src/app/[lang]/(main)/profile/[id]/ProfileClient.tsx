'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useRouter } from 'nextjs-toploader/app';
import { Calendar, Mail, Phone, Edit, MessageCircle, FileText, CheckCircle, User, Briefcase, Bookmark, LogOut, Info } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import dayjs from 'dayjs';
import Button from '@/components/atoms/Button';
import Avatar from '@/components/atoms/Avatar';
import FollowButton from '@/components/atoms/FollowButton';
import UserTrustBadge from '@/components/molecules/user/UserTrustBadge';
import Header from '@/components/organisms/Header';
import Tooltip from '@/components/atoms/Tooltip';
import PostCard from '@/components/molecules/cards/PostCard';
import AnswerCard from '@/components/molecules/cards/AnswerCard';
import CommentCard from '@/components/molecules/cards/CommentCard';
import { useInfiniteUserPosts, useInfiniteUserAnswers, useInfiniteUserComments, useInfiniteUserBookmarks, useFollowStatus, useUserScore } from '@/repo/users/query';
import { getTrustBadgePresentation } from '@/lib/utils/trustBadges';
import { getUserTypeLabel } from '@/utils/userTypeLabel';


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
  officialAnswerCount?: number;
  reviewedAnswerCount?: number;
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
  isOfficial?: boolean;
  reviewStatus?: 'pending' | 'approved' | 'rejected';
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
  const tCommon = (translations?.common || {}) as Record<string, string>;
  const tTrust = (translations?.trustBadges || {}) as Record<string, string>;

  const trustBadgeGuideHref = `/${locale}/guide/trust-badges`;
  const learnMoreLabel = tCommon.learnMore || (locale === 'vi' ? 'Xem thêm' : locale === 'en' ? 'Learn more' : '자세히');
  const profileFallbacks = useMemo(() => {
    if (locale === 'en') {
      return {
        userName: 'User',
        verifiedInfoTitle: 'Verified info',
        editProfile: 'Edit Profile',
        editProfileTooltip: 'Edit your profile.',
        logout: 'Logout',
        joinedAt: 'Joined',
        gender: 'Gender',
        ageGroup: 'Age',
        status: 'Status',
        followers: 'Followers',
        following: 'Following',
        posts: 'Posts',
        accepted: 'Accepted',
        comments: 'Comments',
        myPosts: 'My Posts',
        acceptedAnswers: 'Accepted Answers',
        myComments: 'My Comments',
        bookmarks: 'Bookmarks',
        points: 'Points',
        title: 'Title',
        level: 'Level',
        rank: 'Rank',
        leaderboard: 'Leaderboard',
        noPosts: 'No posts yet',
        noAccepted: 'No accepted answers yet',
        noComments: 'No comments yet',
        noBookmarks: 'No bookmarks yet',
        loading: 'Loading...',
        male: 'Male',
        female: 'Female',
        other: 'Other',
        teens: 'Teens',
        twenties: '20s',
        thirties: '30s',
        forties: '40s',
        fifties: '50s',
        sixtyPlus: '60+',
      };
    }
    if (locale === 'vi') {
      return {
        userName: 'Người dùng',
        verifiedInfoTitle: 'Thông tin xác minh',
        editProfile: 'Chỉnh sửa hồ sơ',
        editProfileTooltip: 'Chỉnh sửa hồ sơ của bạn.',
        logout: 'Đăng xuất',
        joinedAt: 'Tham gia',
        gender: 'Giới tính',
        ageGroup: 'Độ tuổi',
        status: 'Trạng thái',
        followers: 'Người theo dõi',
        following: 'Đang theo dõi',
        posts: 'Bài viết',
        accepted: 'Được chấp nhận',
        comments: 'Bình luận',
        myPosts: 'Bài viết của tôi',
        acceptedAnswers: 'Câu trả lời được chấp nhận',
        myComments: 'Bình luận của tôi',
        bookmarks: 'Đánh dấu',
        points: 'Điểm',
        title: 'Danh hiệu',
        level: 'Cấp độ',
        rank: 'Xếp hạng',
        leaderboard: 'Bảng xếp hạng',
        noPosts: 'Chưa có bài viết',
        noAccepted: 'Chưa có câu trả lời được chấp nhận',
        noComments: 'Chưa có bình luận',
        noBookmarks: 'Chưa có đánh dấu',
        loading: 'Đang tải...',
        male: 'Nam',
        female: 'Nữ',
        other: 'Khác',
        teens: '10-19',
        twenties: '20-29',
        thirties: '30-39',
        forties: '40-49',
        fifties: '50-59',
        sixtyPlus: '60+',
      };
    }
    return {
      userName: '사용자',
      verifiedInfoTitle: '인증 정보',
      editProfile: '프로필 수정',
      editProfileTooltip: '프로필을 수정할 수 있어요.',
      logout: '로그아웃',
      joinedAt: '가입일',
      gender: '성별',
      ageGroup: '연령대',
      status: '상태',
      followers: '팔로워',
      following: '팔로잉',
      posts: '게시글',
      accepted: '채택',
      comments: '댓글',
      myPosts: '내 게시글',
      acceptedAnswers: '채택된 답변',
      myComments: '내 댓글',
      bookmarks: '북마크',
      points: '포인트',
      title: '칭호',
      level: '레벨',
      rank: '랭킹',
      leaderboard: '리더보드',
      noPosts: '게시글이 없습니다',
      noAccepted: '채택된 답변이 없습니다',
      noComments: '댓글이 없습니다',
      noBookmarks: '북마크한 게시글이 없습니다',
      loading: '로딩 중...',
      male: '남성',
      female: '여성',
      other: '기타',
      teens: '10대',
      twenties: '20대',
      thirties: '30대',
      forties: '40대',
      fifties: '50대',
      sixtyPlus: '60대 이상',
    };
  }, [locale]);

  const profileLabels = {
    verifiedInfoTitle: t.verifiedInfoTitle || profileFallbacks.verifiedInfoTitle,
    editProfile: t.editProfile || profileFallbacks.editProfile,
    editProfileTooltip: t.editProfileTooltip || profileFallbacks.editProfileTooltip,
    logout: t.logout || profileFallbacks.logout,
    joinedAt: t.joinedAt || profileFallbacks.joinedAt,
    gender: t.gender || profileFallbacks.gender,
    ageGroup: t.ageGroup || profileFallbacks.ageGroup,
    status: t.status || profileFallbacks.status,
    followers: t.followers || profileFallbacks.followers,
    following: t.following || profileFallbacks.following,
    posts: t.posts || profileFallbacks.posts,
    accepted: t.accepted || profileFallbacks.accepted,
    comments: t.comments || profileFallbacks.comments,
    myPosts: t.myPosts || profileFallbacks.myPosts,
    acceptedAnswers: t.acceptedAnswers || profileFallbacks.acceptedAnswers,
    myComments: t.myComments || profileFallbacks.myComments,
    bookmarks: t.bookmarks || profileFallbacks.bookmarks,
    points: t.points || profileFallbacks.points,
    title: t.title || profileFallbacks.title,
    level: t.level || profileFallbacks.level,
    rank: t.rank || profileFallbacks.rank,
    leaderboard: t.leaderboard || profileFallbacks.leaderboard,
    noPosts: t.noPosts || profileFallbacks.noPosts,
    noAccepted: t.noAccepted || profileFallbacks.noAccepted,
    noComments: t.noComments || profileFallbacks.noComments,
    noBookmarks: t.noBookmarks || profileFallbacks.noBookmarks,
    loading: t.loading || profileFallbacks.loading,
  };
  const genderLabels = {
    male: t.male || profileFallbacks.male,
    female: t.female || profileFallbacks.female,
    other: t.other || profileFallbacks.other,
  };
  const ageGroupLabels = {
    teens: t.teens || profileFallbacks.teens,
    twenties: t.twenties || profileFallbacks.twenties,
    thirties: t.thirties || profileFallbacks.thirties,
    forties: t.forties || profileFallbacks.forties,
    fifties: t.fifties || profileFallbacks.fifties,
    sixtyPlus: t.sixtyPlus || profileFallbacks.sixtyPlus,
  };
  const numberFormatter = useMemo(() => new Intl.NumberFormat(locale), [locale]);
  const displayName = initialProfile.displayName || initialProfile.username || profileFallbacks.userName;

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
  const { data: scoreData } = useUserScore(initialProfile.id);
  const scoreSummary = scoreData?.data;
  const rankValue = scoreSummary?.rank ?? null;
  const progressPercent = scoreSummary ? Math.round(scoreSummary.levelProgress * 100) : 0;
  const titleValue = scoreSummary
    ? locale === 'vi'
      ? `Cấp ${scoreSummary.level}`
      : locale === 'en'
        ? `Level ${scoreSummary.level}`
        : `Lv. ${scoreSummary.level}`
    : '';
  
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
      case 'male': return genderLabels.male;
      case 'female': return genderLabels.female;
      default: return genderLabels.other;
    }
  };

  const getAgeGroupLabel = (ageGroup: string) => {
    switch (ageGroup) {
      case '10s': return ageGroupLabels.teens;
      case '20s': return ageGroupLabels.twenties;
      case '30s': return ageGroupLabels.thirties;
      case '40s': return ageGroupLabels.forties;
      case '50s': return ageGroupLabels.fifties;
      case '60plus': return ageGroupLabels.sixtyPlus;
      default: return ageGroup;
    }
  };

  const userTypeLabels = {
    student: locale === 'vi' ? 'Sinh viên' : locale === 'en' ? 'Student' : '학생',
    worker: locale === 'vi' ? 'Người lao động' : locale === 'en' ? 'Worker' : '근로자',
    resident: locale === 'vi' ? 'Cư dân' : locale === 'en' ? 'Resident' : '거주자',
    other: locale === 'vi' ? 'Khác' : locale === 'en' ? 'Other' : '기타',
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
                name={displayName}
                imageUrl={initialProfile.avatar}
                size="xl"
                hoverHighlight
              />
              {!isOwnProfile && (
                <FollowButton
                  userId={initialProfile.id}
                  isFollowing={isFollowing}
                  size="sm"
                  onToggle={handleFollowChange}
                  userName={displayName}
                  translations={translations || {}}
                />
              )}
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {profileLabels.followers} {followersCount.toLocaleString()}
              </div>
            </div>

            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{displayName}</h1>
                    <UserTrustBadge
                      presentation={trustBadgePresentation}
                      learnMoreLabel={learnMoreLabel}
                      onClick={() => router.push(trustBadgeGuideHref)}
                      labelVariant="text"
                      badgeClassName="!px-1.5 !py-0.5"
                    />
                  </div>
                  <p className="text-gray-500 dark:text-gray-400">@{initialProfile.username}</p>

                  {trustBadgePresentation.show &&
                    (Boolean(initialProfile.verifiedProfileSummary) ||
                      Boolean(initialProfile.verifiedProfileKeywords?.length)) && (
                      <div className="mt-3 space-y-2">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                          {profileLabels.verifiedInfoTitle}
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
                        className="flex items-center justify-center gap-2 border border-gray-300 w-full pr-9 sm:pr-4"
                        size="sm"
                      >
                        <Edit className="w-4 h-4" />
                        <span className="hidden sm:inline">{profileLabels.editProfile}</span>
                      </Button>
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 sm:hidden">
                        <Tooltip
                          content={profileLabels.editProfileTooltip}
                          position="top"
                        >
                          <button
                            type="button"
                            aria-label={profileLabels.editProfileTooltip}
                            className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-gray-900/60 text-gray-600 dark:text-gray-200 shadow-sm"
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
                      <span className="hidden sm:inline">{profileLabels.logout}</span>
                    </Button>
                  </div>
                ) : null}
              </div>

              {initialProfile.bio && (
                <p className="text-gray-700 dark:text-gray-300 mb-4">{initialProfile.bio}</p>
              )}

                <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-2 sm:gap-3 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-2 min-w-0">
                    <Calendar className="w-4 h-4" />
                    <span className="min-w-0 max-w-full truncate inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-[11px] sm:text-xs font-semibold text-gray-700 dark:text-gray-200">
                      <span className="sr-only">{profileLabels.joinedAt}: </span>
                      {new Date(initialProfile.joinedAt).toLocaleDateString(locale)}
                    </span>
                  </div>
                  {initialProfile.gender && (
                    <div className="flex items-center gap-2 min-w-0">
                      <User className="w-4 h-4" />
                      <span className="min-w-0 max-w-full truncate inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-[11px] sm:text-xs font-semibold text-gray-700 dark:text-gray-200">
                        <span className="sr-only">{profileLabels.gender}: </span>
                        {getGenderLabel(initialProfile.gender)}
                      </span>
                    </div>
                  )}
                  {initialProfile.ageGroup && (
                    <div className="flex items-center gap-2 min-w-0">
                      <User className="w-4 h-4" />
                      <span className="min-w-0 max-w-full truncate inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-[11px] sm:text-xs font-semibold text-gray-700 dark:text-gray-200">
                        <span className="sr-only">{profileLabels.ageGroup}: </span>
                        {getAgeGroupLabel(initialProfile.ageGroup)}
                      </span>
                    </div>
                  )}
                  {(() => {
                    const legacyStatus = initialProfile.status;
                    const effectiveUserType =
                      initialProfile.userType ||
                      (legacyStatus && legacyStatus !== 'banned' && legacyStatus !== 'suspended' ? legacyStatus : null);
                    if (!effectiveUserType) return null;
                    return (
                      <div className="flex items-center gap-2 min-w-0">
                        <Briefcase className="w-4 h-4" />
                        <span className="min-w-0 max-w-full truncate inline-flex items-center rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200 px-2 py-0.5 text-[11px] sm:text-xs font-semibold">
                          <span className="sr-only">{profileLabels.status}: </span>
                          {getUserTypeLabel(effectiveUserType, userTypeLabels)}
                        </span>
                      </div>
                    );
                  })()}
                {isOwnProfile && initialProfile.email && (
                  <div className="col-span-2 flex items-center gap-2 min-w-0">
                    <Mail className="w-4 h-4" />
                    <span className="truncate">{initialProfile.email}</span>
                  </div>
                )}
                {isOwnProfile && initialProfile.phone && (
                  <div className="col-span-2 flex items-center gap-2 min-w-0">
                    <Phone className="w-4 h-4" />
                    <span className="truncate">{initialProfile.phone}</span>
                  </div>
                )}
              </div>

              {scoreSummary ? (
                <div className="mt-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 p-3 sm:p-4">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-col min-w-[80px]">
                      <span className="text-xs text-gray-500 dark:text-gray-400">{profileLabels.points}</span>
                      <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">{numberFormatter.format(scoreSummary.score)}</span>
                    </div>
                    <div className="flex flex-col min-w-[80px]">
                      <span className="text-xs text-gray-500 dark:text-gray-400">{profileLabels.title}</span>
                      <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">{titleValue}</span>
                    </div>
                    <div className="flex flex-col min-w-[80px]">
                      <span className="text-xs text-gray-500 dark:text-gray-400">{profileLabels.rank}</span>
                      <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">{rankValue ? `#${numberFormatter.format(rankValue)}` : '-'}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => router.push(`/${locale}/leaderboard`)}
                      className="rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      {profileLabels.leaderboard}
                    </button>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-gray-200 dark:bg-gray-800">
                    <div
                      className="h-2 rounded-full bg-blue-600 dark:bg-blue-400"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              ) : null}

              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-4 overflow-x-auto scrollbar-hide">
                  <div className="flex min-w-[72px] flex-1 flex-col items-center text-center cursor-pointer hover:opacity-80 transition-opacity">
                    <div className="text-base sm:text-2xl font-bold text-gray-900 dark:text-gray-100 tabular-nums">{followersCount}</div>
                    <div className="text-[10px] sm:text-sm text-gray-500 dark:text-gray-400 leading-tight">{profileLabels.followers}</div>
                  </div>
                  <div className="flex min-w-[72px] flex-1 flex-col items-center text-center cursor-pointer hover:opacity-80 transition-opacity">
                    <div className="text-base sm:text-2xl font-bold text-gray-900 dark:text-gray-100 tabular-nums">{initialProfile.stats.following}</div>
                    <div className="text-[10px] sm:text-sm text-gray-500 dark:text-gray-400 leading-tight">{profileLabels.following}</div>
                  </div>
                  <div className="flex min-w-[72px] flex-1 flex-col items-center text-center">
                    <div className="text-base sm:text-2xl font-bold text-gray-900 dark:text-gray-100 tabular-nums">{initialProfile.stats.posts}</div>
                    <div className="text-[10px] sm:text-sm text-gray-500 dark:text-gray-400 leading-tight">{profileLabels.posts}</div>
                  </div>
                  <div className="flex min-w-[72px] flex-1 flex-col items-center text-center">
                    <div className="text-base sm:text-2xl font-bold text-gray-900 dark:text-gray-100 tabular-nums">{initialProfile.stats.accepted}</div>
                    <div className="text-[10px] sm:text-sm text-gray-500 dark:text-gray-400 leading-tight">{profileLabels.accepted}</div>
                  </div>
                  <div className="flex min-w-[72px] flex-1 flex-col items-center text-center">
                    <div className="text-base sm:text-2xl font-bold text-gray-900 dark:text-gray-100 tabular-nums">{initialProfile.stats.comments}</div>
                    <div className="text-[10px] sm:text-sm text-gray-500 dark:text-gray-400 leading-tight">{profileLabels.comments}</div>
                  </div>
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
                  <span className="text-xs sm:text-base">{profileLabels.myPosts}</span>
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
                  <span className="text-xs sm:text-base">{profileLabels.acceptedAnswers}</span>
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
                  <span className="text-xs sm:text-base">{profileLabels.myComments}</span>
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
                    <span className="text-xs sm:text-base">{profileLabels.bookmarks}</span>
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
                    <p className="text-gray-500 dark:text-gray-400">{profileLabels.noPosts}</p>
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
                        officialAnswerCount={post.officialAnswerCount}
                        reviewedAnswerCount={post.reviewedAnswerCount}
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
                        <span className="text-sm">{profileLabels.loading}</span>
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
                    <p className="text-gray-500 dark:text-gray-400">{profileLabels.noAccepted}</p>
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
                      isOfficial={answer.isOfficial}
                      reviewStatus={answer.reviewStatus}
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
                        <span className="text-sm">{profileLabels.loading}</span>
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
                    <p className="text-gray-500 dark:text-gray-400">{profileLabels.noComments}</p>
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
                        <span className="text-sm">{profileLabels.loading}</span>
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
                    <p className="text-gray-500 dark:text-gray-400">{profileLabels.noBookmarks}</p>
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
                        officialAnswerCount={bookmark.officialAnswerCount}
                        reviewedAnswerCount={bookmark.reviewedAnswerCount}
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
                        <span className="text-sm">{profileLabels.loading}</span>
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
