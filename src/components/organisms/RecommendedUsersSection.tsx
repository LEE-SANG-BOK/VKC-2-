'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { useRouter } from 'nextjs-toploader/app';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Avatar from '@/components/atoms/Avatar';
import FollowButton from '@/components/atoms/FollowButton';

interface RecommendedUserStats {
  followers?: number;
  posts?: number;
  following?: number;
}

interface RecommendationMetaItem {
  key: string;
  value: string | number;
}

interface RecommendedUser {
  id: string | number;
  displayName?: string | null;
  email?: string | null;
  image?: string | null;
  isFollowing?: boolean;
  isVerified?: boolean;
  badgeType?: string | null;
  recommendationMeta?: RecommendationMetaItem[];
  stats?: RecommendedUserStats;
}

interface RecommendedUsersSectionProps {
  title: string;
  locale: string;
  users: RecommendedUser[];
  isLoading: boolean;
  followerLabel: string;
  postsLabel: string;
  followingLabel: string;
  metaLabels?: Record<string, string>;
  verifiedLabel?: string;
  badgeLabels?: Record<string, string>;
  previousLabel?: string;
  nextLabel?: string;
}

export default function RecommendedUsersSection({
  title,
  locale,
  users,
  isLoading,
  followerLabel,
  postsLabel,
  followingLabel,
  metaLabels,
  verifiedLabel,
  badgeLabels,
  previousLabel,
  nextLabel,
}: RecommendedUsersSectionProps) {
  const router = useRouter();
  const carouselRef = useRef<HTMLDivElement | null>(null);
  const [followStates, setFollowStates] = useState<Record<string, boolean>>({});

  const metaLabelMap = useMemo<Record<string, string>>(() => ({
    followers: followerLabel,
    posts: postsLabel,
    following: followingLabel,
    ...(metaLabels || {}),
  }), [followerLabel, followingLabel, metaLabels, postsLabel]);

  const safeUsers = useMemo(() => users ?? [], [users]);
  const hasUsers = safeUsers.length > 0;

  const scrollCarousel = useCallback((direction: -1 | 1) => {
    const el = carouselRef.current;
    if (!el) return;
    const delta = Math.max(240, Math.round(el.clientWidth * 0.9));
    el.scrollBy({ left: direction * delta, behavior: 'smooth' });
  }, []);

  const ariaPrev = previousLabel || (locale === 'vi' ? 'Trước' : locale === 'en' ? 'Previous' : '이전');
  const ariaNext = nextLabel || (locale === 'vi' ? 'Tiếp' : locale === 'en' ? 'Next' : '다음');
  const verifiedLabelText = verifiedLabel || (locale === 'vi' ? 'Đã xác minh' : locale === 'en' ? 'Verified' : '인증됨');

  const formatMetaValue = useCallback((item: RecommendationMetaItem) => {
    if (item.value === null || item.value === undefined || item.value === '') return '';
    if (item.key === 'badge' && typeof item.value === 'string') {
      const normalized = item.value.toLowerCase();
      const label = badgeLabels?.[normalized];
      if (label) return label;
      if (normalized === 'expert') return locale === 'vi' ? 'Chuyên gia' : locale === 'en' ? 'Expert' : '전문가';
      if (normalized === 'community') return locale === 'vi' ? 'Cộng đồng' : locale === 'en' ? 'Community' : '커뮤니티';
      if (normalized === 'verified') return verifiedLabelText;
      return item.value;
    }
    if (typeof item.value === 'string') return item.value;
    const label = metaLabelMap[item.key] || item.key;
    const suffix = item.key.toLowerCase().includes('rate') ? '%' : '';
    return `${label} ${item.value}${suffix}`.trim();
  }, [badgeLabels, locale, metaLabelMap, verifiedLabelText]);

  const skeletonCards = (
    <>
      {Array.from({ length: 4 }).map((_, idx) => (
        <div
          key={idx}
          className="flex items-center gap-3 rounded-lg border border-gray-200 dark:border-gray-800 px-3 py-3 w-full snap-start"
        >
          <div className="flex items-center gap-3 w-full animate-pulse">
            <div className="flex flex-col items-center gap-2">
              <div className="h-12 w-12 rounded-full bg-gray-200 dark:bg-gray-800" />
              <div className="h-8 w-20 rounded-md bg-gray-200 dark:bg-gray-800" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="h-4 w-36 rounded bg-gray-200 dark:bg-gray-800" />
              <div className="mt-2 h-3 w-48 rounded bg-gray-200 dark:bg-gray-800" />
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
        const displayName = user.displayName || user.email || (locale === 'vi' ? 'Không rõ' : locale === 'en' ? 'Unknown' : '알 수 없음');
        const isVerified = Boolean(user.isVerified || user.badgeType);
        const userMetaItems = Array.isArray(user.recommendationMeta)
          ? user.recommendationMeta.filter((item) => item?.value !== undefined && item?.value !== null && item?.value !== '').slice(0, 3)
          : [];
        const fallbackMetaItems: RecommendationMetaItem[] = [
          { key: 'followers', value: user.stats?.followers ?? 0 },
          { key: 'posts', value: user.stats?.posts ?? 0 },
          { key: 'following', value: user.stats?.following ?? 0 },
        ];
        const resolvedMetaItems = userMetaItems.length > 0 ? userMetaItems : fallbackMetaItems;
        return (
          <div
            key={userId}
            className="flex items-center gap-3 rounded-lg border border-gray-200 dark:border-gray-800 px-3 py-3 w-full snap-start"
          >
            <div className="flex items-center gap-3 w-full">
              <div className="flex flex-col items-center gap-2">
                <Avatar
                  name={displayName}
                  imageUrl={user.image || undefined}
                  size="lg"
                  hoverHighlight
                />
                <FollowButton
                  userId={userId}
                  userName={displayName}
                  isFollowing={followStates[userId] ?? user.isFollowing ?? false}
                  size="sm"
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
                  {isVerified ? (
                    <div className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-300">
                      {verifiedLabelText}
                    </div>
                  ) : null}
                  <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                    {displayName}
                  </div>
                  <div className="text-[11px] text-gray-500 dark:text-gray-400 flex flex-wrap gap-1">
                    {resolvedMetaItems.map((item, index) => {
                      const text = formatMetaValue(item);
                      if (!text) return null;
                      return (
                        <span key={`${userId}-${item.key}-${index}`} className="inline-flex">
                          #{index + 1}: {text}
                        </span>
                      );
                    })}
                  </div>
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
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {title}
        </h3>
        <div className="sm:hidden flex items-center gap-1">
          <button
            type="button"
            onClick={() => scrollCarousel(-1)}
            className="inline-flex items-center justify-center rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/40 h-8 w-8 text-gray-600 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            aria-label={ariaPrev}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => scrollCarousel(1)}
            className="inline-flex items-center justify-center rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/40 h-8 w-8 text-gray-600 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            aria-label={ariaNext}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="sm:hidden">
        <div
          ref={carouselRef}
          className="grid grid-flow-col auto-cols-[calc(50%-0.375rem)] gap-3 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-1"
        >
          {isLoading ? skeletonCards : userCards}
        </div>
      </div>

      <div className="hidden sm:grid sm:grid-cols-2 gap-3">
        {isLoading ? skeletonCards : userCards}
      </div>
    </div>
  );
}
