'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'nextjs-toploader/app';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Avatar from '@/components/atoms/Avatar';
import FollowButton from '@/components/atoms/FollowButton';
import UserTrustBadge from '@/components/molecules/user/UserTrustBadge';
import { formatRecommendationMetaItems, localizeRecommendationMetaItems, type RecommendationMetaItem } from '@/utils/recommendationMeta';
import { getTrustBadgePresentation } from '@/lib/utils/trustBadges';

interface RecommendedUserStats {
  followers?: number;
  posts?: number;
  following?: number;
}

interface RecommendedUser {
  id: string | number;
  displayName?: string | null;
  email?: string | null;
  image?: string | null;
  isFollowing?: boolean;
  isVerified?: boolean;
  isExpert?: boolean;
  badgeType?: string | null;
  recommendationMeta?: RecommendationMetaItem[];
  stats?: RecommendedUserStats;
}

interface RecommendedUsersSectionProps {
  title: string;
  locale: string;
  users: RecommendedUser[];
  isLoading: boolean;
  translations?: Record<string, unknown>;
  followerLabel: string;
  postsLabel: string;
  followingLabel: string;
  metaLabels?: Record<string, string>;
  verifiedLabel?: string;
  trustBadgeTranslations?: Record<string, string>;
  badgeLabels?: Record<string, string>;
  previousLabel?: string;
  nextLabel?: string;
  anonymousLabel?: string;
  compact?: boolean;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  onLoadMore?: () => void;
  onboardingLabels?: Record<string, string>;
}

export default function RecommendedUsersSection({
  title,
  locale,
  users,
  isLoading,
  translations,
  followerLabel,
  postsLabel,
  followingLabel,
  metaLabels,
  verifiedLabel,
  trustBadgeTranslations,
  badgeLabels,
  previousLabel,
  nextLabel,
  anonymousLabel,
  compact = false,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
  onboardingLabels,
}: RecommendedUsersSectionProps) {
  const router = useRouter();
  const carouselRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [followStates, setFollowStates] = useState<Record<string, boolean>>({});
  const [hasInteracted, setHasInteracted] = useState(false);
  const cardPaddingClass = compact ? 'px-2.5 py-2' : 'px-3 py-3';
  const cardGapClass = compact ? 'gap-2' : 'gap-3';
  const cardNameClass = compact ? 'text-[13px]' : 'text-sm';
  const cardMetaClass = compact ? 'text-[10px]' : 'text-[11px]';
  const badgeLabelClass = compact ? 'text-[10px] text-gray-500 dark:text-gray-400' : 'text-[11px] text-gray-500 dark:text-gray-400';
  const avatarSize = compact ? 'lg' : 'lg';
  const followButtonSize = compact ? 'xs' : 'sm';

  const mergedMetaLabels = useMemo<Record<string, string>>(() => ({
    followers: followerLabel,
    posts: postsLabel,
    following: followingLabel,
    ...(metaLabels || {}),
  }), [followerLabel, followingLabel, metaLabels, postsLabel]);

  const safeUsers = useMemo(() => users ?? [], [users]);
  const hasUsers = safeUsers.length > 0;

  const markInteracted = useCallback(() => {
    setHasInteracted((prev) => (prev ? prev : true));
  }, []);

  const scrollCarousel = useCallback((direction: -1 | 1) => {
    const el = carouselRef.current;
    if (!el) return;
    markInteracted();
    const delta = Math.max(240, Math.round(el.clientWidth * 0.9));
    el.scrollBy({ left: direction * delta, behavior: 'smooth' });
  }, [markInteracted]);

  const mergedTrustTranslations = useMemo(() => {
    const base = trustBadgeTranslations || {};
    if (!verifiedLabel) return base;
    return {
      ...base,
      verifiedLabel: base.verifiedLabel || verifiedLabel,
      verifiedUserLabel: base.verifiedUserLabel || verifiedLabel,
    };
  }, [trustBadgeTranslations, verifiedLabel]);

  const ariaPrev = previousLabel || '';
  const ariaNext = nextLabel || '';
  const fallbackName = anonymousLabel || '';

  useEffect(() => {
    if (!hasInteracted || !onLoadMore || !hasNextPage || isFetchingNextPage) return;
    const root = carouselRef.current;
    const target = sentinelRef.current;
    if (!root || !target) return;
    if (root.scrollWidth <= root.clientWidth + 8) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          onLoadMore();
        }
      },
      { root, threshold: 0.6 }
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [hasInteracted, hasNextPage, isFetchingNextPage, onLoadMore]);

  const skeletonCards = (
    <>
      {Array.from({ length: 4 }).map((_, idx) => (
        <div
          key={idx}
          className={`flex items-center ${cardGapClass} rounded-lg border border-gray-200 dark:border-gray-800 ${cardPaddingClass} w-full snap-start`}
        >
          <div className={`flex items-center ${cardGapClass} w-full animate-pulse`}>
            <div className="flex flex-col items-center gap-2">
              <div className={`${compact ? 'h-10 w-10' : 'h-12 w-12'} rounded-full bg-gray-200 dark:bg-gray-800`} />
              <div className={`${compact ? 'h-6 w-16' : 'h-8 w-20'} rounded-md bg-gray-200 dark:bg-gray-800`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className={`${compact ? 'h-3 w-28' : 'h-4 w-36'} rounded bg-gray-200 dark:bg-gray-800`} />
              <div className={`${compact ? 'mt-1.5 h-2.5 w-36' : 'mt-2 h-3 w-48'} rounded bg-gray-200 dark:bg-gray-800`} />
            </div>
          </div>
        </div>
      ))}
    </>
  );

  const userCards = (
    <>
      {safeUsers.map((user) => {
        const userId = String(user.id);
        const displayName = user.displayName || user.email || fallbackName;
        const trustBadgePresentation = getTrustBadgePresentation({
          locale,
          author: {
            isVerified: user.isVerified,
            isExpert: user.isExpert,
            badgeType: user.badgeType,
          },
          translations: mergedTrustTranslations,
        });
        const localizedMetaItems = localizeRecommendationMetaItems({
          items: user.recommendationMeta,
          locale: locale as 'ko' | 'en' | 'vi',
          onboardingLabels,
        });
        const resolvedMetaItems: RecommendationMetaItem[] = localizedMetaItems.length > 0 ? localizedMetaItems : [];
        const metaTexts = formatRecommendationMetaItems({
          items: resolvedMetaItems,
          fallback: resolvedMetaItems,
          metaLabels: mergedMetaLabels,
          badgeLabels,
        });
        const visibleMetaTexts = metaTexts.slice(0, 3);
        return (
          <div
            key={userId}
            className={`flex items-center ${cardGapClass} rounded-lg border border-gray-200 dark:border-gray-800 ${cardPaddingClass} w-full snap-start`}
          >
            <div className={`flex items-center ${cardGapClass} w-full`}>
              <div className="flex flex-col items-center gap-2">
                <button
                  type="button"
                  onClick={() => router.push(`/${locale}/profile/${userId}`)}
                  aria-label={displayName}
                >
                  <Avatar
                    name={displayName}
                    imageUrl={user.image || undefined}
                    size={avatarSize}
                    hoverHighlight
                  />
                </button>
                <FollowButton
                  userId={userId}
                  userName={displayName}
                  isFollowing={followStates[userId] ?? user.isFollowing ?? false}
                  size={followButtonSize}
                  translations={translations}
                  onToggle={(next) =>
                    setFollowStates((prev) => ({
                      ...prev,
                      [userId]: next,
                    }))
                  }
                />
              </div>
              <div className="flex-1 min-w-0">
                <button
                  type="button"
                  onClick={() => router.push(`/${locale}/profile/${userId}`)}
                  className="text-left"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div className={`${cardNameClass} font-semibold text-gray-900 dark:text-gray-100 truncate`}>
                      {displayName}
                    </div>
                    <UserTrustBadge
                      presentation={trustBadgePresentation}
                      labelVariant="text"
                      badgeClassName="!px-1.5 !py-0.5"
                      labelClassName={badgeLabelClass}
                      tooltipPosition="top"
                    />
                  </div>
                  {visibleMetaTexts.length > 0 ? (
                    <div className={`${cardMetaClass} text-gray-600 dark:text-gray-300 flex flex-wrap gap-1.5`}>
                      {visibleMetaTexts.map((text, index) => (
                        <span
                          key={`${userId}-meta-${index}`}
                          className={`inline-flex items-center rounded-full px-2 py-0.5 ${
                            index === 0
                              ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200'
                              : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200'
                          }`}
                        >
                          {text}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </>
  );

  if (!isLoading && !hasUsers) return null;

  return (
    <div className={`rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 ${compact ? 'p-3' : 'p-4'}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {title}
        </h3>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => scrollCarousel(-1)}
            className="inline-flex items-center justify-center rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/40 h-11 w-11 sm:h-9 sm:w-9 text-gray-600 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            aria-label={ariaPrev}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => scrollCarousel(1)}
            className="inline-flex items-center justify-center rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/40 h-11 w-11 sm:h-9 sm:w-9 text-gray-600 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            aria-label={ariaNext}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div
        ref={carouselRef}
        onScroll={markInteracted}
        className={`grid grid-flow-col ${compact ? 'auto-cols-[minmax(200px,1fr)]' : 'auto-cols-[minmax(220px,1fr)]'} sm:auto-cols-[minmax(240px,1fr)] lg:auto-cols-[minmax(260px,1fr)] ${compact ? 'gap-2' : 'gap-3'} overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-1 pr-3 scroll-px-3`}
      >
        {isLoading ? skeletonCards : userCards}
        {hasNextPage ? (
          <div ref={sentinelRef} className="w-px" />
        ) : null}
        {isFetchingNextPage ? (
          <div className="flex items-center justify-center rounded-lg border border-dashed border-gray-200 dark:border-gray-800 px-3 py-3 text-xs text-gray-400">
            <div className="h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : null}
      </div>
    </div>
  );
}
