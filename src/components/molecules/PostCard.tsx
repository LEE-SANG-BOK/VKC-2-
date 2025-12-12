'use client';

import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'nextjs-toploader/app';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { ThumbsUp, Share2, Bookmark } from 'lucide-react';
import { toast } from 'sonner';
import UserChip from './UserChip';
import Tooltip from '../atoms/Tooltip';
import TrustBadge, { type TrustLevel } from '@/components/atoms/TrustBadge';
import FollowButton from '@/components/atoms/FollowButton';
import dayjs from 'dayjs';
import { useTogglePostLike, useTogglePostBookmark } from '@/repo/posts/mutation';
import { CATEGORY_GROUPS, LEGACY_CATEGORIES, getCategoryName } from '@/lib/constants/categories';

const ALLOWED_CATEGORY_SLUGS = new Set<string>([
  ...Object.keys(CATEGORY_GROUPS),
  ...Object.values(CATEGORY_GROUPS).flatMap((group) => group.slugs),
]);

function formatDateTime(dateString: string): string {
  if (!dateString) return '';

  const date = dayjs(dateString);
  if (!date.isValid()) return dateString;

  return date.format('YYYY.MM.DD HH:mm');
}

interface PostCardProps {
  id: string | number;
  author: {
    id?: string;
    name: string;
    avatar: string;
    followers: number;
    isFollowing?: boolean;
    isVerified?: boolean;
    isExpert?: boolean;
    badgeType?: string | null;
  };
  title: string;
  excerpt: string;
  tags: string[];
  stats: {
    likes: number;
    comments: number;
    shares: number;
  };
  category?: string;
  subcategory?: string;
  thumbnail?: string | null;
  thumbnails?: string[];
  publishedAt: string;
  isQuestion?: boolean;
  isAdopted?: boolean;
  isLiked?: boolean;
  isBookmarked?: boolean;
  isExpertAnswer?: boolean;
  isAdminAnswer?: boolean;
  sourceLabel?: string;
  trustBadge?: 'verified' | 'community' | 'expert' | 'outdated';
  trustWeight?: number;
  translations: Record<string, unknown>;
  imageCount?: number;
}

export default function PostCard({ id, author, title, excerpt, tags, stats, category, subcategory, thumbnail, thumbnails, publishedAt, isQuestion, isAdopted, isLiked: initialIsLiked, isBookmarked: initialIsBookmarked, isExpertAnswer = false, isAdminAnswer = false, sourceLabel, trustBadge, translations, imageCount: imageCountProp }: PostCardProps) {
  const router = useRouter();
  const params = useParams();
  const { data: session } = useSession();
  const locale = (params?.lang as string) || 'ko';
  const t = (translations?.tooltips || {}) as Record<string, string>;
  const tPost = (translations?.post || {}) as Record<string, string>;
  const tCommon = (translations?.common || {}) as Record<string, string>;
  const tTrust = (translations?.trustBadges || {}) as Record<string, string>;

  const derivedTrustLevel: TrustLevel = trustBadge
    ? (trustBadge as TrustLevel)
    : author.isExpert
      ? 'expert'
      : author.isVerified
        ? 'verified'
        : 'community';

  const trustLabels: Record<string, string> = {
    verified: tTrust.verifiedLabel || (locale === 'vi' ? 'Đã xác minh' : locale === 'en' ? 'Verified' : '검증됨'),
    community: tTrust.communityLabel || (locale === 'vi' ? 'Cộng đồng' : locale === 'en' ? 'Community' : '커뮤니티'),
    expert: tTrust.expertLabel || (locale === 'vi' ? 'Chuyên gia' : locale === 'en' ? 'Expert' : '전문가'),
    outdated: tTrust.outdatedLabel || (locale === 'vi' ? 'Hết hạn' : locale === 'en' ? 'Outdated' : '오래된 정보'),
  };

  const trustTooltips: Record<string, string> = {
    verified: tTrust.verifiedTooltip || (locale === 'vi' ? 'Thông tin từ người dùng đã xác minh' : locale === 'en' ? 'From a verified user' : '인증된 사용자 기반 정보'),
    community: tTrust.communityTooltip || (locale === 'vi' ? 'Được cộng đồng tin cậy' : locale === 'en' ? 'Trusted by community' : '커뮤니티 신뢰 정보'),
    expert: tTrust.expertTooltip || (locale === 'vi' ? 'Được chuyên gia xem xét' : locale === 'en' ? 'Reviewed by an expert' : '전문가/공식 답변자'),
    outdated: tTrust.outdatedTooltip || (locale === 'vi' ? 'Thông tin hơn 12 tháng trước' : locale === 'en' ? 'More than 12 months old' : '12개월 이상 지난 정보'),
  };
  const answerLabel = isQuestion
    ? locale === 'vi'
      ? `${stats.comments} câu trả lời`
      : locale === 'en'
        ? `${stats.comments} answers`
        : `${stats.comments}개의 답변이 있습니다`
    : locale === 'vi'
      ? `${stats.comments} bình luận`
      : locale === 'en'
        ? `${stats.comments} comments`
        : `${stats.comments}개의 댓글이 있습니다`;

  const safeName = (raw?: string) => {
    const nm = raw?.trim();
    if (!nm) return tCommon.anonymous || '사용자';
    const uuidLike = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    const hexishId = /^[0-9a-fA-F-]{20,}$/;
    const emailLike = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (uuidLike.test(nm) || hexishId.test(nm)) return tCommon.anonymous || '사용자';
    if (emailLike.test(nm)) {
      const local = nm.split('@')[0];
      if (!local || local.length > 20) return tCommon.anonymous || '사용자';
      return local;
    }
    return nm;
  };

  const safeLabel = (raw?: string) => {
    const val = raw?.trim();
    if (!val) return '';
    const uuidLike = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    const hexishId = /^[0-9a-fA-F-]{20,}$/;
    if (uuidLike.test(val) || hexishId.test(val) || val.length > 40) return '';
    return val;
  };

  const mapSlugToLabel = (slug?: string) => {
    if (!slug) return '';
    if (!ALLOWED_CATEGORY_SLUGS.has(slug)) return '';
    const legacy = LEGACY_CATEGORIES.find((c) => c.slug === slug);
    if (legacy) {
      return getCategoryName(legacy, locale);
    }
    return safeLabel(slug);
  };

  const [localIsLiked, setLocalIsLiked] = useState(initialIsLiked || false);
  const [localIsBookmarked, setLocalIsBookmarked] = useState(initialIsBookmarked || false);
  const [localLikes, setLocalLikes] = useState(stats.likes);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const localizeTag = (tag: string) => {
    const raw = tag?.replace(/^#/, '').trim();
    if (!raw) return '';
    const normalize = (v: string) => v.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');
    const norm = normalize(raw);

    // 매칭: 카테고리/소분류 이름과 동일하면 현지어로 표시
    const legacy = LEGACY_CATEGORIES.find((c) => {
      const candidates = [c.name, c.name_en, c.name_vi, c.slug].filter(Boolean) as string[];
      return candidates.some((cand) => normalize(cand) === norm);
    });
    if (legacy) {
      return getCategoryName(legacy, locale);
    }

    const mapEn: Record<string, string> = {
      '비자': 'Visa',
      '연장': 'Extension',
      '체류': 'Stay',
      '추천': 'Recommend',
      '취업': 'Jobs',
      '채용': 'Hiring',
      '면접': 'Interview',
      '인턴': 'Internship',
      '공모전': 'Contest',
      '포트폴리오': 'Portfolio',
      '장학금': 'Scholarship',
      '학업': 'Study',
      '수업': 'Classes',
      '생활': 'Life',
      '주거': 'Housing',
      '교통': 'Transport',
      '금융': 'Finance',
      '계좌개설': 'Bank account',
      '송금': 'Remittance',
      '의료': 'Healthcare',
      '보험': 'Insurance',
      '병원': 'Hospital',
      '법률': 'Legal',
      '계약': 'Contract',
      '신고': 'Report',
      '비즈니스': 'Business',
      '창업': 'Startup',
      '서류': 'Documents',
      '개발': 'Development',
      '프로젝트': 'Project',
      '게임': 'Game',
      '커뮤니티': 'Community',
      '리뷰': 'Review',
      '한국어': 'Korean',
      '토픽': 'TOPIK',
      '정보': 'Info',
      '가이드': 'Guide',
      '생활정보': 'Life tips'
    };
    const mapVi: Record<string, string> = {
      '비자': 'Visa',
      '연장': 'Gia hạn',
      '체류': 'Lưu trú',
      '추천': 'Gợi ý',
      '취업': 'Việc làm',
      '채용': 'Tuyển dụng',
      '면접': 'Phỏng vấn',
      '인턴': 'Thực tập',
      '공모전': 'Cuộc thi',
      '포트폴리오': 'Hồ sơ',
      '장학금': 'Học bổng',
      '학업': 'Học tập',
      '수업': 'Lớp học',
      '생활': 'Sinh hoạt',
      '주거': 'Nhà ở',
      '교통': 'Giao thông',
      '금융': 'Tài chính',
      '계좌개설': 'Mở tài khoản',
      '송금': 'Chuyển tiền',
      '의료': 'Y tế',
      '보험': 'Bảo hiểm',
      '병원': 'Bệnh viện',
      '법률': 'Pháp lý',
      '계약': 'Hợp đồng',
      '신고': 'Khai báo',
      '비즈니스': 'Kinh doanh',
      '창업': 'Khởi nghiệp',
      '서류': 'Hồ sơ',
      '개발': 'Phát triển',
      '프로젝트': 'Dự án',
      '게임': 'Game',
      '커뮤니티': 'Cộng đồng',
      '리뷰': 'Đánh giá',
      '한국어': 'Tiếng Hàn',
      '토픽': 'TOPIK',
      '정보': 'Thông tin',
      '가이드': 'Hướng dẫn',
      '생활정보': 'Mẹo sinh hoạt'
    };
    if (locale === 'en' && mapEn[raw.toLowerCase()]) return mapEn[raw.toLowerCase()];
    if (locale === 'vi' && mapVi[raw.toLowerCase()]) return mapVi[raw.toLowerCase()];
    return raw;
  };

  const displayTags = useMemo(() => {
    const seen = new Set<string>();
    return tags
      .map((tag) => tag?.replace(/^#/, '').trim())
      .filter(Boolean)
      .map(localizeTag)
      .filter((tg) => {
        if (seen.has(tg.toLowerCase())) return false;
        seen.add(tg.toLowerCase());
        return true;
      });
  }, [tags, locale]);
  const displayImages = useMemo(() => {
    if (thumbnails && thumbnails.length > 0) {
      return thumbnails.filter(Boolean).slice(0, 4);
    }
    if (thumbnail) {
      return [thumbnail];
    }
    return [];
  }, [thumbnails, thumbnail]);

  const imageCount = useMemo(() => {
    if (typeof imageCountProp === 'number') return imageCountProp;
    return displayImages.length;
  }, [displayImages.length, imageCountProp]);

  useEffect(() => {
    setLocalIsLiked(initialIsLiked || false);
  }, [initialIsLiked]);

  useEffect(() => {
    setLocalIsBookmarked(initialIsBookmarked || false);
  }, [initialIsBookmarked]);

  useEffect(() => {
    setLocalLikes(stats.likes);
  }, [stats.likes]);

  const toggleLikeMutation = useTogglePostLike();
  const toggleBookmarkMutation = useTogglePostBookmark();

  const handleClick = () => {
    router.push(`/${locale}/posts/${id}`);
  };

  const handleAuthorClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const authorId = author.id || author.name;
    router.push(`/${locale}/profile/${authorId}`);
  };

  const handleLikeClick = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!session?.user) {
      router.push(`/${locale}/login`);
      return;
    }

    const prevIsLiked = localIsLiked;
    const prevLikes = localLikes;

    setLocalIsLiked(!localIsLiked);
    setLocalLikes(prevLikes + (localIsLiked ? -1 : 1));

    try {
      await toggleLikeMutation.mutateAsync(String(id));
    } catch (error) {
      setLocalIsLiked(prevIsLiked);
      setLocalLikes(prevLikes);
      console.error('Failed to toggle like:', error);
    }
  };

  const handleBookmarkClick = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!session?.user) {
      router.push(`/${locale}/login`);
      return;
    }

    const prevIsBookmarked = localIsBookmarked;
    setLocalIsBookmarked(!localIsBookmarked);

    try {
      await toggleBookmarkMutation.mutateAsync(String(id));
    } catch (error) {
      setLocalIsBookmarked(prevIsBookmarked);
      console.error('Failed to toggle bookmark:', error);
    }
  };

  const handleShareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowShareMenu((prev) => !prev);
  };

  const shareLabels = {
    title: t.share || '공유',
    facebook: t.shareFacebook || 'Facebook',
    x: t.shareX || 'X (Twitter)',
    telegram: t.shareTelegram || 'Telegram',
    copy: t.copyLink || '링크 복사',
  };

  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/${locale}/posts/${id}` : '';

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success(t.linkCopied || '링크가 복사되었습니다!');
    } catch (err) {
      toast.error(t.copyFailed || '복사에 실패했습니다.');
    } finally {
      setShowShareMenu(false);
    }
  };

  const openShareWindow = (url: string) => {
    window.open(url, '_blank', 'width=600,height=600');
  };

  const handleShareFacebook = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!shareUrl) return;
    openShareWindow(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`);
    setShowShareMenu(false);
  };

  const handleShareX = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!shareUrl) return;
    openShareWindow(`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(title)}`);
    setShowShareMenu(false);
  };

  const handleShareTelegram = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!shareUrl) return;
    openShareWindow(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(title)}`);
    setShowShareMenu(false);
  };

  const hasMedia = displayImages.length > 0;
  const totalImages = imageCount || displayImages.length;
  // 모바일은 최대 2장(가로 2열), 웹은 1장만 노출(+배지로 추가 수 표시)
  const mediaItems = displayImages.slice(0, Math.min(totalImages, 2));
  const extraMobile = Math.max(totalImages - mediaItems.length, 0);
  const extraDesktop = Math.max(totalImages - 1, 0);
  const mediaGridClass = `question-card-media-grid question-card-media-grid--row ${mediaItems.length === 1 ? 'question-card-media-grid--single' : ''}`;
  const isSelf = author?.id && session?.user?.id ? String(author.id) === String(session.user.id) : false;

  return (
    <article
      onClick={handleClick}
      className={`question-card group ${isQuestion ? 'question-card--question' : ''} ${hasMedia ? 'question-card--with-media' : ''} ${isAdopted ? 'border-green-400 ring-1 ring-green-200 dark:ring-emerald-600/50' : ''
        }`}
    >
      <div className="question-card-main">
        <div className="question-card-body">
          {/* Author Info & Badges */}
          <div className="flex items-start justify-between gap-3 mb-3 pr-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <button
                type="button"
                className="flex items-center gap-2 sm:gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={handleAuthorClick}
              >
                <UserChip
                  name={safeName(author.name)}
                  avatar={author.avatar !== '/default-avatar.jpg' ? author.avatar : undefined}
                  isVerified={false}
                  size="md"
                />
              </button>
              <div className="flex flex-col gap-1 min-w-0">
                <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                  <span>{formatDateTime(publishedAt)}</span>
                  {derivedTrustLevel !== 'community' && (
                    <Tooltip content={trustTooltips[derivedTrustLevel]} position="top">
                      <span className="inline-flex">
                        <TrustBadge level={derivedTrustLevel} label={trustLabels[derivedTrustLevel]} />
                      </span>
                    </Tooltip>
                  )}
                  {!isSelf && author.id ? (
                    <FollowButton
                      userId={String(author.id)}
                      isFollowing={author.isFollowing}
                      size="xs"
                      className="ml-2"
                    />
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          {/* Title + Trust badges */}
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <h3 className="text-[19px] font-bold leading-snug text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {title}
            </h3>
	            {(isExpertAnswer || isAdminAnswer) && (
	              <div className="flex items-center gap-1 text-[11px] font-semibold">
	                {isExpertAnswer && (
	                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 px-2 py-0.5 border border-blue-200 dark:border-blue-800">
	                    전문가
                  </span>
                )}
                {isAdminAnswer && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-2 py-0.5 border border-amber-200 dark:border-amber-800">
                    관리자
                  </span>
                )}
              </div>
            )}
            {sourceLabel && (
              <span className="text-[11px] font-semibold rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                출처: {sourceLabel}
              </span>
            )}
          </div>

          {/* Excerpt */}
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3 leading-relaxed">
            {excerpt}
          </p>

          {/* Tags */}
          {displayTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {displayTags.map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-0.5 text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 rounded-md hover:bg-gray-200 dark:hover-bg-gray-700 transition-colors"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Answer count & Actions */}
          <div className="flex flex-wrap items-center gap-3 mt-2">
            <div className="flex items-center gap-2">
              <span role="img" aria-label="answers">💬</span>
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                {answerLabel}
              </span>
            </div>
            <div className="question-card-actions-row">
              <Tooltip content={t.like || '좋아요'} position="top">
                <button
                  type="button"
                  onClick={handleLikeClick}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-2 min-h-[44px] text-sm font-semibold transition-colors ${localIsLiked ? 'text-blue-600 font-semibold bg-blue-50 dark:bg-blue-900/30' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                >
                  <ThumbsUp className={`w-5 h-5 ${localIsLiked ? 'fill-current' : ''}`} />
                  <span>{localLikes}</span>
                </button>
              </Tooltip>

              <div className="relative">
                <Tooltip content={t.share || '공유'} position="top">
                  <button
                    onClick={handleShareClick}
                    className="rounded-full px-3 py-2 min-h-[44px] text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <Share2 className="w-5 h-5" />
                  </button>
                </Tooltip>
                {showShareMenu && typeof document !== 'undefined'
                  ? createPortal(
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={() => setShowShareMenu(false)}>
                      <div
                        className="w-full max-w-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">{shareLabels.title}</span>
                          <button
                            onClick={() => setShowShareMenu(false)}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                            aria-label={t.close || '닫기'}
                          >
                            ✕
                          </button>
                        </div>
                        <div className="flex flex-col divide-y divide-gray-200 dark:divide-gray-700">
                          <button
                            onClick={handleShareFacebook}
                            className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
                          >
                            {shareLabels.facebook}
                          </button>
                          <button
                            onClick={handleShareX}
                            className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
                          >
                            {shareLabels.x}
                          </button>
                          <button
                            onClick={handleShareTelegram}
                            className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
                          >
                            {shareLabels.telegram}
                          </button>
                          <button
                            onClick={handleCopyLink}
                            className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
                          >
                            {shareLabels.copy}
                          </button>
                        </div>
                      </div>
                    </div>,
                    document.body
                  )
                  : null}
              </div>

              <Tooltip content={t.bookmark || '북마크'} position="top">
                <button
                  type="button"
                  onClick={handleBookmarkClick}
                  className={`rounded-full px-3 py-2 min-h-[44px] text-sm font-semibold transition-colors ${localIsBookmarked ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/30' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                >
                  <Bookmark className={`w-5 h-5 ${localIsBookmarked ? 'fill-current' : ''}`} />
                </button>
              </Tooltip>
            </div>
          </div>
        </div>

        {hasMedia && (
          <div
            className="question-card-media question-card-media-grid--row"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={mediaGridClass}>
              {mediaItems.map((src, idx) => {
                const hideOnDesktop = idx > 0 ? 'sm:hidden' : '';
                return (
                  <div key={`${src}-${idx}`} className={`question-card-thumb__inner ${hideOnDesktop}`}>
                    <Image
                      src={src}
                      alt={title}
                      loading="lazy"
                      decoding="async"
                      width={180}
                      height={120}
                      className="w-full h-full object-cover"
                    />
                    {idx === 0 && extraDesktop > 0 && (
                      <span className="question-card-thumb__badge hidden sm:flex">
                        +{extraDesktop}
                      </span>
                    )}
                    {idx === 1 && extraMobile > 0 && (
                      <span className="question-card-thumb__badge sm:hidden">
                        +{extraMobile}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
      {isQuestion && (
        <div className="question-card-badges">
          <Tooltip content={tPost.question || '질문'} position="below">
            <span className="flex items-center justify-center w-6 h-6 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-semibold rounded-full border border-blue-200 dark:border-blue-700">
              ?
            </span>
          </Tooltip>
          {isAdopted ? (
            <Tooltip content={tPost.solved || '해결'} position="below">
              <span className="flex items-center justify-center w-6 h-6 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-xs font-semibold rounded-full border border-green-200 dark:border-green-700">
                ✓
              </span>
            </Tooltip>
          ) : (
            <Tooltip content={tPost.unsolved || '미해결'} position="below">
              <span className="flex items-center justify-center w-6 h-6 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-xs font-semibold rounded-full border border-amber-200 dark:border-amber-700">
                !
              </span>
            </Tooltip>
          )}
        </div>
      )}
    </article>
  );
}
