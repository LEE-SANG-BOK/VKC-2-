'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'nextjs-toploader/app';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Bookmark, CircleCheck, CircleDashed, CircleHelp, MessageCircle, Share2, ThumbsUp } from 'lucide-react';
import { toast } from 'sonner';
import Tooltip from '@/components/atoms/Tooltip';
import ActionIconButton from '@/components/atoms/ActionIconButton';
import FeedImage from '@/components/atoms/FeedImage';
import UserTrustBadge from '@/components/molecules/user/UserTrustBadge';
import Avatar from '@/components/atoms/Avatar';
import { useLoginPrompt } from '@/providers/LoginPromptProvider';
import { useCategories } from '@/repo/categories/query';
import { useTogglePostLike, useTogglePostBookmark } from '@/repo/posts/mutation';
import { useToggleFollow } from '@/repo/users/mutation';
import { logEvent } from '@/repo/events/mutation';
import { useHiddenTargets } from '@/repo/hides/query';
import { useHideTarget, useUnhideTarget } from '@/repo/hides/mutation';
import { ALLOWED_CATEGORY_SLUGS, LEGACY_CATEGORIES, getCategoryName } from '@/lib/constants/categories';
import { localizeCommonTagLabel } from '@/lib/constants/tag-translations';
import { normalizePostImageSrc } from '@/utils/normalizePostImageSrc';
import { getTrustBadgePresentation } from '@/lib/utils/trustBadges';
import { formatDateTime } from '@/utils/dateTime';
import { normalizeKey } from '@/utils/normalizeKey';
import { safeDisplayName, safeShortLabel } from '@/utils/safeText';

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
  sourceLabel?: string;
  trustBadge?: 'verified' | 'community' | 'expert' | 'outdated';
  trustWeight?: number;
  translations: Record<string, unknown>;
  imageCount?: number;
  certifiedResponderCount?: number;
  otherResponderCount?: number;
  officialAnswerCount?: number;
  reviewedAnswerCount?: number;
}

export default function PostCard({ id, author, title, excerpt, tags, stats, category, subcategory, thumbnail, thumbnails, publishedAt, isQuestion, isAdopted, isLiked: initialIsLiked, isBookmarked: initialIsBookmarked, sourceLabel, trustBadge, translations, imageCount: imageCountProp, certifiedResponderCount, otherResponderCount }: PostCardProps) {
  const router = useRouter();
  const params = useParams();
  const { data: session } = useSession();
  const { openLoginPrompt } = useLoginPrompt();
  const { idSet: hiddenPostIds } = useHiddenTargets('post', Boolean(session?.user));
  const hideTargetMutation = useHideTarget();
  const unhideTargetMutation = useUnhideTarget();
  const locale = (params?.lang as 'ko' | 'en' | 'vi') || 'ko';
  const t = (translations?.tooltips || {}) as Record<string, string>;
  const tCommon = (translations?.common || {}) as Record<string, string>;
  const tPost = (translations?.post || {}) as Record<string, string>;
  const tTrust = (translations?.trustBadges || {}) as Record<string, string>;
  const likeLabel = t.like || (locale === 'vi' ? 'Thích' : locale === 'en' ? 'Like' : '좋아요');
  const shareLabel = t.share || (locale === 'vi' ? 'Chia sẻ' : locale === 'en' ? 'Share' : '공유');
  const bookmarkLabel = t.bookmark || (locale === 'vi' ? 'Lưu' : locale === 'en' ? 'Bookmark' : '북마크');
  const copyLinkLabel = t.copyLink || (locale === 'vi' ? 'Sao chép liên kết' : locale === 'en' ? 'Copy link' : '링크 복사');
  const closeLabel = t.close || (locale === 'vi' ? 'Đóng' : locale === 'en' ? 'Close' : '닫기');
  const linkCopiedLabel = t.linkCopied || (locale === 'vi' ? 'Đã sao chép liên kết!' : locale === 'en' ? 'Link copied!' : '링크가 복사되었습니다!');
  const copyFailedLabel = t.copyFailed || (locale === 'vi' ? 'Không thể sao chép liên kết.' : locale === 'en' ? 'Failed to copy link.' : '복사에 실패했습니다.');
  const sourcePrefix = tCommon.source || (locale === 'vi' ? 'Nguồn' : locale === 'en' ? 'Source' : '출처');
  const hideLabel = tCommon.hide || (locale === 'vi' ? 'Ẩn' : locale === 'en' ? 'Hide' : '안보기');
  const unhideLabel = tCommon.unhide || (locale === 'vi' ? 'Bỏ ẩn' : locale === 'en' ? 'Unhide' : '숨김 해제');
  const hideActionLabel = isHidden ? unhideLabel : hideLabel;
  const hideEmoji = isHidden ? '👀' : '🙈';
  const hiddenPostLabel = tCommon.hiddenPost || (locale === 'vi' ? 'Bài viết đã được ẩn.' : locale === 'en' ? 'This post is hidden.' : '숨긴 게시글입니다.');
  const hideFailedLabel = tCommon.hideFailed || (locale === 'vi' ? 'Không thể ẩn bài viết.' : locale === 'en' ? 'Failed to hide the post.' : '게시글을 숨길 수 없습니다.');
  const unhideFailedLabel = tCommon.unhideFailed || (locale === 'vi' ? 'Không thể bỏ ẩn.' : locale === 'en' ? 'Failed to unhide.' : '숨김 해제에 실패했습니다.');

  const trustBadgePresentation = getTrustBadgePresentation({
    locale,
    trustBadge,
    author: {
      isVerified: author.isVerified,
      isExpert: author.isExpert,
      badgeType: author.badgeType,
    },
    translations: tTrust,
  });

  const trustBadgeGuideHref = `/${locale}/guide/trust-badges`;
  const learnMoreLabel = tCommon.learnMore || (locale === 'vi' ? 'Xem thêm' : locale === 'en' ? 'Learn more' : '자세히');

  const responseCount = Math.max(0, Number(stats.comments ?? 0));
  const responseLabel = isQuestion
    ? (tCommon.answer || (locale === 'vi' ? 'Trả lời' : locale === 'en' ? 'Answer' : '답변'))
    : (tCommon.comment || (locale === 'vi' ? 'Bình luận' : locale === 'en' ? 'Comment' : '댓글'));
  const answerLabel = locale === 'en'
    ? `${responseCount} ${responseCount === 1 ? responseLabel : `${responseLabel}s`}`
    : locale === 'vi'
      ? `${responseCount} ${responseLabel}`
      : `${responseLabel} ${responseCount}개`;

  const certifiedCount = Math.max(0, certifiedResponderCount ?? 0);
  const otherCount = Math.max(0, otherResponderCount ?? 0);
  const responseNoun = isQuestion
    ? (locale === 'en' ? 'answers' : tCommon.answer || (locale === 'vi' ? 'Trả lời' : '답변'))
    : (locale === 'en' ? 'comments' : tCommon.comment || (locale === 'vi' ? 'Bình luận' : '댓글'));
  const certifiedSummaryLabel = certifiedCount > 0
    ? (otherCount > 0
      ? (tPost.certifiedResponderSummary
        ? tPost.certifiedResponderSummary
            .replace('{certified}', String(certifiedCount))
            .replace('{others}', String(otherCount))
            .replace('{noun}', responseNoun)
        : locale === 'vi'
          ? `Có ${responseNoun.toLowerCase()} từ ${certifiedCount} người dùng đã xác minh và ${otherCount} người khác`
          : locale === 'en'
            ? `${certifiedCount} certified users + ${otherCount} others left ${responseNoun}`
            : `인증 사용자 ${certifiedCount}명 외 ${otherCount}명의 ${responseNoun}이 있습니다`)
      : (tPost.certifiedResponderSummaryOnly
        ? tPost.certifiedResponderSummaryOnly
            .replace('{certified}', String(certifiedCount))
            .replace('{noun}', responseNoun)
        : locale === 'vi'
          ? `Có ${responseNoun.toLowerCase()} từ ${certifiedCount} người dùng đã xác minh`
          : locale === 'en'
            ? `${certifiedCount} certified users left ${responseNoun}`
            : `인증 사용자 ${certifiedCount}명의 ${responseNoun}이 있습니다`))
    : '';
  const verifiedSummaryTooltip = tTrust.verifiedUserTooltip || tTrust.verifiedTooltip || (locale === 'vi'
    ? 'Câu trả lời từ người dùng đã xác minh danh tính.'
    : locale === 'en'
      ? 'Answers from users whose identity has been verified.'
      : '신분이 확인된 사용자의 답변입니다.');
  const certifiedTooltipContent = certifiedSummaryLabel
    ? `${certifiedSummaryLabel} - ${verifiedSummaryTooltip}`
    : verifiedSummaryTooltip;

  const anonymousFallback = tCommon.anonymous || (locale === 'vi' ? 'Người dùng' : locale === 'en' ? 'User' : '사용자');
  const safeName = (raw?: string) => safeDisplayName(raw, anonymousFallback);
  const safeLabel = (raw?: string) => safeShortLabel(raw);

  const { data: fetchedCategories } = useCategories();
  const flatCategories = useMemo(() => {
    if (!fetchedCategories) return [];
    const children = fetchedCategories.flatMap((cat) => cat.children || []);
    return [...fetchedCategories, ...children];
  }, [fetchedCategories]);

  const resolveCategorySlug = useCallback((value?: string) => {
    const raw = value?.trim();
    if (!raw) return '';
    if (ALLOWED_CATEGORY_SLUGS.has(raw)) return raw;
    const match = flatCategories.find((cat) => cat.id === raw || cat.slug === raw);
    return match?.slug || '';
  }, [flatCategories]);

  const mapSlugToLabel = (slug?: string) => {
    if (!slug) return '';
    if (!ALLOWED_CATEGORY_SLUGS.has(slug)) return '';
    const legacy = LEGACY_CATEGORIES.find((c) => c.slug === slug);
    if (legacy) {
      return getCategoryName(legacy, locale);
    }
    return safeLabel(slug);
  };

  const categorySlug = useMemo(() => resolveCategorySlug(category), [category, resolveCategorySlug]);
  const subcategorySlug = useMemo(() => resolveCategorySlug(subcategory), [subcategory, resolveCategorySlug]);

  const categoryLabel = useMemo(() => mapSlugToLabel(categorySlug), [categorySlug, locale]);
  const subcategoryLabel = useMemo(() => mapSlugToLabel(subcategorySlug), [subcategorySlug, locale]);

  const [localIsLiked, setLocalIsLiked] = useState(initialIsLiked || false);
  const [localIsBookmarked, setLocalIsBookmarked] = useState(initialIsBookmarked || false);
  const [localLikes, setLocalLikes] = useState(stats.likes);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const isHidden = hiddenPostIds.has(String(id));
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

    return localizeCommonTagLabel(raw, locale);
  };

  const displayTags = useMemo(() => {
    const seen = new Set<string>();
    return tags
      .map((tag) => tag?.replace(/^#/, '').trim())
      .filter(Boolean)
      .map(localizeTag)
      .filter((tg) => {
        const key = normalizeKey(tg);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  }, [tags, locale]);

  const tagChips = useMemo(() => {
    const reserved = new Set(
      [
        tTrust.verifiedLabel,
        tTrust.verifiedStudentLabel,
        tTrust.verifiedWorkerLabel,
        tTrust.verifiedUserLabel,
        tTrust.trustedAnswererLabel,
        tTrust.expertLabel,
        tTrust.expertVisaLabel,
        tTrust.expertEmploymentLabel,
        tTrust.communityLabel,
        tTrust.outdatedLabel,
        'verified',
        'expert',
        'community',
        'outdated',
        'đã xác minh',
        'chuyên gia',
        'cộng đồng',
        'hết hạn',
        '검증됨',
        '전문가',
        '커뮤니티',
        '오래된 정보',
      ]
        .map((v) => v?.toString().trim())
        .filter(Boolean)
        .map((v) => normalizeKey(v))
    );
    const seen = new Set<string>();

    const candidates = [categoryLabel, subcategoryLabel, ...displayTags]
      .map((v) => v?.trim())
      .filter(Boolean) as string[];

    return candidates
      .filter((v) => {
        const key = normalizeKey(v);
        if (!key) return false;
        if (reserved.has(key)) return false;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 4);
  }, [categoryLabel, subcategoryLabel, displayTags, tTrust.communityLabel, tTrust.expertEmploymentLabel, tTrust.expertLabel, tTrust.expertVisaLabel, tTrust.outdatedLabel, tTrust.trustedAnswererLabel, tTrust.verifiedLabel, tTrust.verifiedStudentLabel, tTrust.verifiedUserLabel, tTrust.verifiedWorkerLabel]);

  const displayImages = useMemo(() => {
    const candidates: unknown[] = Array.isArray(thumbnails) && thumbnails.length > 0 ? thumbnails : thumbnail ? [thumbnail] : [];
    const normalized = candidates
      .map((src) => normalizePostImageSrc(src))
      .filter((src): src is string => Boolean(src));
    const seen = new Set<string>();
    return normalized.filter((src) => {
      if (seen.has(src)) return false;
      seen.add(src);
      return true;
    }).slice(0, 4);
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
  const toggleFollowMutation = useToggleFollow();

  const authorId = author?.id ? String(author.id) : '';
  const isSelf = authorId && session?.user?.id ? authorId === String(session.user.id) : false;

  const [localIsFollowing, setLocalIsFollowing] = useState(!!author.isFollowing);
  useEffect(() => {
    setLocalIsFollowing(!!author.isFollowing);
  }, [author.isFollowing]);

  const followLabel = tCommon.follow || (locale === 'vi' ? 'Theo dõi' : locale === 'en' ? 'Follow' : '팔로우');
  const followingLabel = tCommon.following || (locale === 'vi' ? 'Đang theo dõi' : locale === 'en' ? 'Following' : '팔로잉');
  const followText = localIsFollowing ? followingLabel : followLabel;
  const followTextClassName = localIsFollowing
    ? 'text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-400'
    : 'text-blue-600 dark:text-blue-400 hover:underline';

  const handleClick = () => {
    router.push(`/${locale}/posts/${id}`);
  };

  const handleAnswerCountClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/${locale}/posts/${id}#${isQuestion ? 'answers' : 'comments'}`);
  };

  const handleAuthorClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const authorTargetId = author.id || author.name;
    router.push(`/${locale}/profile/${authorTargetId}`);
  };

  const handleFollowClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();

    if (!authorId || isSelf) return;

    if (!session?.user) {
      openLoginPrompt();
      return;
    }

    if (toggleFollowMutation.isPending) return;

    const prev = localIsFollowing;
    const next = !prev;
    setLocalIsFollowing(next);

    try {
      const result = await toggleFollowMutation.mutateAsync(authorId);
      const resolved = result?.data?.isFollowing;
      if (typeof resolved === 'boolean') {
        setLocalIsFollowing(resolved);
      }
    } catch {
      setLocalIsFollowing(prev);
    }
  };

  const handleLikeClick = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!session?.user) {
      openLoginPrompt();
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
      openLoginPrompt();
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

  const handleToggleHide = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!session?.user) {
      openLoginPrompt();
      return;
    }

    try {
      if (isHidden) {
        await unhideTargetMutation.mutateAsync({ targetType: 'post', targetId: String(id) });
      } else {
        await hideTargetMutation.mutateAsync({ targetType: 'post', targetId: String(id) });
      }
    } catch (error) {
      console.error('Failed to toggle hide:', error);
      toast.error(isHidden ? unhideFailedLabel : hideFailedLabel);
    }
  };

  const handleShareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowShareMenu((prev) => !prev);
  };

  const shareLabels = {
    title: shareLabel,
    facebook: t.shareFacebook || 'Facebook',
    x: t.shareX || 'X (Twitter)',
    telegram: t.shareTelegram || 'Telegram',
    copy: copyLinkLabel,
  };

  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/${locale}/posts/${id}` : '';

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success(linkCopiedLabel);
      logEvent({
        eventType: 'share',
        entityType: 'post',
        entityId: String(id),
        locale,
        metadata: { channel: 'copy' },
      });
    } catch (err) {
      toast.error(copyFailedLabel);
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
    logEvent({
      eventType: 'share',
      entityType: 'post',
      entityId: String(id),
      locale,
      metadata: { channel: 'facebook' },
    });
    setShowShareMenu(false);
  };

  const handleShareX = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!shareUrl) return;
    openShareWindow(`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(title)}`);
    logEvent({
      eventType: 'share',
      entityType: 'post',
      entityId: String(id),
      locale,
      metadata: { channel: 'x' },
    });
    setShowShareMenu(false);
  };

  const handleShareTelegram = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!shareUrl) return;
    openShareWindow(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(title)}`);
    logEvent({
      eventType: 'share',
      entityType: 'post',
      entityId: String(id),
      locale,
      metadata: { channel: 'telegram' },
    });
    setShowShareMenu(false);
  };

  const hasMedia = displayImages.length > 0;
  const totalImages = imageCount || displayImages.length;
  const primaryImage = displayImages[0] || '';

  const extraCount = Math.max(totalImages - 1, 0);
  const mediaGridClass = `question-card-media-grid question-card-media-grid--row question-card-media-grid--single`;

  if (isHidden) {
    return (
      <article className="question-card group">
        <div className="question-card-main">
          <div className="flex items-center justify-between gap-3 px-2 py-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">{hiddenPostLabel}</span>
            <Tooltip content={hideActionLabel} position="top">
              <button
                type="button"
                onClick={handleToggleHide}
                aria-label={hideActionLabel}
                className="rounded-full p-1.5 text-base leading-none text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                {hideEmoji}
              </button>
            </Tooltip>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article
      onClick={handleClick}
      className={`question-card group ${isQuestion ? 'question-card--question' : ''} ${hasMedia ? 'question-card--with-media' : ''} ${isAdopted ? 'border-green-400 ring-1 ring-green-200 dark:ring-emerald-600/50' : ''
        }`}
    >
      <div className="question-card-main">
        <div className="question-card-body">
          {/* Author Info & Badges */}
          <div className="flex items-start gap-2 mb-3 min-w-0">
            <div className="flex items-start gap-2 min-w-0">
              <button
                type="button"
                className="shrink-0"
                onClick={handleAuthorClick}
                aria-label={safeName(author.name)}
              >
                <Avatar
                  name={safeName(author.name)}
                  imageUrl={author.avatar !== '/default-avatar.jpg' ? author.avatar : undefined}
                  size="lg"
                  hoverHighlight
                />
              </button>
              <div className="flex flex-col gap-0.5 min-w-0">
                <div className="flex flex-wrap items-center gap-2 min-w-0">
                  <button
                    type="button"
                    className="text-left min-w-0"
                    onClick={handleAuthorClick}
                  >
                    <span className="block truncate text-base font-semibold text-gray-900 dark:text-gray-100">
                      {safeName(author.name)}
                    </span>
                  </button>
                  <UserTrustBadge
                    presentation={trustBadgePresentation}
                    learnMoreLabel={learnMoreLabel}
                    onClick={() => router.push(trustBadgeGuideHref)}
                    labelVariant="text"
                    badgeClassName="!px-1.5 !py-0.5"
                    labelClassName="text-[11px] text-gray-500 dark:text-gray-400 inline-block max-w-[140px] truncate sm:max-w-none"
                  />
                  {!isSelf && authorId ? (
                    <button
                      type="button"
                      className={`shrink-0 text-[13px] font-medium transition-colors ${followTextClassName} ${toggleFollowMutation.isPending ? 'opacity-60 cursor-not-allowed' : ''}`}
                      onClick={handleFollowClick}
                      aria-pressed={localIsFollowing}
                      aria-label={followText}
                      aria-disabled={toggleFollowMutation.isPending}
                    >
                      <span className="mr-1 text-gray-400 dark:text-gray-500">·</span>
                      {followText}
                    </button>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400">
                  <span>{formatDateTime(publishedAt, locale)}</span>
                </div>
              </div>
            </div>
            <div className="ml-auto shrink-0">
              <Tooltip content={hideActionLabel} position="top">
                <button
                  type="button"
                  onClick={handleToggleHide}
                  aria-label={hideActionLabel}
                  className="rounded-full p-1.5 text-base leading-none text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                >
                  {hideEmoji}
                </button>
              </Tooltip>
            </div>
          </div>

          <div className="lg:pl-12">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <h3 className="text-[19px] font-bold leading-snug text-gray-900 dark:text-gray-100 transition-colors group-hover:opacity-90">
                {title}
              </h3>
              {sourceLabel && (
                <span className="text-[11px] font-semibold rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                  {sourcePrefix}: {sourceLabel}
                </span>
              )}
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2 leading-relaxed">
              {excerpt}
            </p>
          </div>

        </div>

        {hasMedia ? (
          <div
            className="question-card-media question-card-media-grid--row"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={mediaGridClass}>
              <div className="question-card-thumb__inner">
                <FeedImage
                  src={primaryImage}
                  alt={title}
                  width={180}
                  height={120}
                  sizes="(max-width: 640px) 100vw, 180px"
                  className="w-full h-full object-cover"
                />
                {extraCount > 0 ? (
                  <span className="question-card-thumb__badge sm:hidden">+{extraCount}</span>
                ) : null}
                {extraCount > 0 ? (
                  <span className="question-card-thumb__badge hidden sm:flex">+{extraCount}</span>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {tagChips.length > 0 ? (
        <div className="mt-2 flex items-center gap-1.5 overflow-x-auto scrollbar-hide pr-2 lg:pl-12">
          {tagChips.map((tag) => {
            const isCategoryTag = !!categoryLabel && tag === categoryLabel;
            const isSubcategoryTag = !!subcategoryLabel && tag === subcategoryLabel;
            const pillClass = isCategoryTag
              ? 'text-gray-700 bg-gray-100 dark:text-gray-200 dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
              : isSubcategoryTag
                ? 'text-gray-700 bg-gray-100 dark:text-gray-200 dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
                : 'text-gray-500 bg-gray-100 dark:text-gray-300 dark:bg-gray-800';

            return (
              <span
                key={tag}
                title={`#${tag}`}
                className={`min-w-0 max-w-full truncate px-2 py-0.5 text-xs rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${pillClass}`}
              >
                #{tag}
              </span>
            );
          })}
        </div>
      ) : null}

      <div className="question-card-actions">
        <div className="question-card-footer-fixed !flex-nowrap !gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1 flex-nowrap lg:pl-12">
            <button
              type="button"
              onClick={handleAnswerCountClick}
              aria-label={answerLabel}
              className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-sm font-semibold text-gray-900 dark:text-gray-100 transition-all duration-200 ease-out hover:scale-105 active:scale-95 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-blue-600 dark:hover:text-blue-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-900 min-w-0 overflow-hidden"
            >
              <MessageCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="truncate tabular-nums">{responseCount}</span>
            </button>
            {certifiedSummaryLabel ? (
              <Tooltip content={certifiedTooltipContent} position="top">
                <button
                  type="button"
                  onClick={handleAnswerCountClick}
                  aria-label={certifiedTooltipContent}
                  title={certifiedSummaryLabel}
                  className="group inline-flex items-center gap-1.5 rounded-full border border-blue-200/80 bg-blue-50/70 px-2 py-1 text-[11px] font-semibold text-blue-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-100/80 hover:text-blue-800 hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-blue-900/60 dark:bg-blue-900/30 dark:text-blue-200 dark:hover:border-blue-700 dark:hover:bg-blue-900/50 dark:focus-visible:ring-offset-gray-900 min-w-0 max-w-[220px] sm:max-w-none"
                >
                  <CircleCheck className="h-3 w-3 shrink-0 transition-transform duration-200 group-hover:scale-110 group-hover:animate-pulse" />
                  <span className="truncate">{certifiedSummaryLabel}</span>
                </button>
              </Tooltip>
            ) : null}
          </div>
          <div className="question-card-actions-row shrink-0 !w-auto !ml-auto !flex-nowrap !gap-2">
            <Tooltip content={likeLabel} position="top">
              <ActionIconButton
                icon={<ThumbsUp className={`w-4 h-4 ${localIsLiked ? 'fill-current' : ''}`} />}
                label={likeLabel}
                count={localLikes}
                onClick={handleLikeClick}
                aria-pressed={localIsLiked}
                aria-disabled={toggleLikeMutation.isPending}
                className={localIsLiked ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/30' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}
              />
            </Tooltip>
            <div className="relative">
              <Tooltip content={shareLabel} position="top">
                <ActionIconButton
                  icon={<Share2 className="w-4 h-4" />}
                  label={shareLabel}
                  onClick={handleShareClick}
                  className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                />
              </Tooltip>
              {showShareMenu && typeof document !== 'undefined'
                ? createPortal(
                  <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
                    onClick={() => setShowShareMenu(false)}
                  >
                    <div
                      className="w-full max-w-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-2xl"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">{shareLabels.title}</span>
                        <button
                          onClick={() => setShowShareMenu(false)}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                          aria-label={closeLabel}
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
            <Tooltip content={bookmarkLabel} position="top">
              <button
                type="button"
                onClick={handleBookmarkClick}
                className={`inline-flex items-center justify-center rounded-full p-1.5 min-h-[30px] min-w-[30px] transition-colors ${localIsBookmarked ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/30' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
              >
                <Bookmark className={`w-4 h-4 ${localIsBookmarked ? 'fill-current' : ''}`} />
              </button>
            </Tooltip>
            {isQuestion ? (
              <>
                <Tooltip
                  content={t.questionPost || (locale === 'vi' ? 'Bài hỏi đáp' : locale === 'en' ? 'Question post' : '질문글')}
                  position="top"
                >
                  <button
                    type="button"
                    onClick={(e) => e.stopPropagation()}
                    aria-label={t.questionPost || (locale === 'vi' ? 'Bài hỏi đáp' : locale === 'en' ? 'Question post' : '질문글')}
                    className="inline-flex items-center justify-center rounded-full p-1.5 min-h-[30px] min-w-[30px] text-blue-600 bg-blue-50 dark:bg-blue-900/30 shrink-0"
                  >
                    <CircleHelp className="w-4 h-4" />
                  </button>
                </Tooltip>
                <Tooltip
                  content={
                    isAdopted
                      ? t.resolvedPost || (locale === 'vi' ? 'Đã giải quyết' : locale === 'en' ? 'Resolved' : '해결됨')
                      : t.unresolvedPost || (locale === 'vi' ? 'Chưa giải quyết' : locale === 'en' ? 'Unresolved' : '미해결')
                  }
                  position="top"
                >
                  <button
                    type="button"
                    onClick={(e) => e.stopPropagation()}
                    aria-label={
                      isAdopted
                        ? t.resolvedPost || (locale === 'vi' ? 'Đã giải quyết' : locale === 'en' ? 'Resolved' : '해결됨')
                        : t.unresolvedPost || (locale === 'vi' ? 'Chưa giải quyết' : locale === 'en' ? 'Unresolved' : '미해결')
                    }
                    className={`inline-flex items-center justify-center rounded-full p-1.5 min-h-[30px] min-w-[30px] ${
                      isAdopted
                        ? 'text-emerald-600 bg-emerald-50 dark:text-emerald-200 dark:bg-emerald-900/20'
                        : 'text-gray-600 bg-gray-50 dark:text-gray-200 dark:bg-gray-800'
                    } shrink-0`}
                  >
                    {isAdopted ? <CircleCheck className="w-4 h-4" /> : <CircleDashed className="w-4 h-4" />}
                  </button>
                </Tooltip>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}
