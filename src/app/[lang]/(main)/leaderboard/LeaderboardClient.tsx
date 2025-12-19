'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight, Flame, Medal, Sparkles, Trophy } from 'lucide-react';
import Avatar from '@/components/atoms/Avatar';
import Tooltip from '@/components/atoms/Tooltip';
import TrustBadge from '@/components/atoms/TrustBadge';
import { useUserLeaderboard } from '@/repo/users/query';
import { getTrustBadgePresentation } from '@/lib/utils/trustBadges';

interface LeaderboardClientProps {
  translations: Record<string, unknown>;
  lang: string;
  initialPage: number;
  initialLimit: number;
}

export default function LeaderboardClient({ translations, lang, initialPage, initialLimit }: LeaderboardClientProps) {
  const searchParams = useSearchParams();
  const pageParam = parseInt(searchParams?.get('page') || '', 10);
  const limitParam = parseInt(searchParams?.get('limit') || '', 10);

  const currentPage = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : initialPage;
  const currentLimit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(20, limitParam) : initialLimit;

  const tCommon = (translations?.common || {}) as Record<string, string>;
  const tTrust = (translations?.trustBadges || {}) as Record<string, string>;

  const copy = useMemo(() => {
    const fallback =
      lang === 'en'
        ? {
            title: 'Community Leaderboard',
            subtitle: 'Discover the most trusted and helpful members in the community.',
            topTitle: 'Top Rankers',
            listTitle: 'All Rankers',
            trustLabel: 'Trust',
            levelLabel: 'Level',
            temperatureLabel: 'Temperature',
            helpfulLabel: 'Helpful',
            adoptionRateLabel: 'Adoption rate',
            scoreLabel: 'Score',
            totalLabel: 'Total members',
            pageInfo: 'Page {current} / {total}',
            previous: 'Previous',
            next: 'Next',
            empty: 'No rankings available yet.',
            loading: 'Loading...',
            rankLabel: 'Rank',
            guideLabel: 'How trust badges work',
            scoreFormula: 'Score = Trust + Helpful × 5 + Adoption rate',
            unknownUser: 'Unknown',
          }
        : lang === 'vi'
          ? {
              title: 'Bảng xếp hạng cộng đồng',
              subtitle: 'Khám phá những thành viên đáng tin và hữu ích nhất trong cộng đồng.',
              topTitle: 'Top xếp hạng',
              listTitle: 'Tất cả thành viên',
              trustLabel: 'Độ tin cậy',
              levelLabel: 'Cấp',
              temperatureLabel: 'Nhiệt',
              helpfulLabel: 'Hữu ích',
              adoptionRateLabel: 'Tỷ lệ được chấp nhận',
              scoreLabel: 'Điểm',
              totalLabel: 'Tổng thành viên',
              pageInfo: 'Trang {current} / {total}',
              previous: 'Trước',
              next: 'Tiếp theo',
              empty: 'Chưa có bảng xếp hạng.',
              loading: 'Đang tải...',
              rankLabel: 'Hạng',
              guideLabel: 'Cách hoạt động của huy hiệu tin cậy',
              scoreFormula: 'Điểm = Độ tin cậy + Hữu ích × 5 + Tỷ lệ được chấp nhận',
              unknownUser: 'Không rõ',
            }
          : {
              title: '커뮤니티 랭킹',
              subtitle: '신뢰 답변과 기여도가 높은 멤버를 확인하세요.',
              topTitle: 'TOP 랭커',
              listTitle: '전체 랭킹',
              trustLabel: '신뢰',
              levelLabel: '레벨',
              temperatureLabel: '온도',
              helpfulLabel: '도움',
              adoptionRateLabel: '채택률',
              scoreLabel: '점수',
              totalLabel: '전체 멤버',
              pageInfo: '{current} / {total} 페이지',
              previous: '이전',
              next: '다음',
              empty: '아직 랭킹 데이터가 없습니다.',
              loading: '로딩 중...',
              rankLabel: '순위',
              guideLabel: '신뢰 배지 안내',
              scoreFormula: '점수 = 신뢰 + 도움 × 5 + 채택률',
              unknownUser: '알 수 없음',
            };

    return {
      ...fallback,
      helpfulLabel: tCommon.helpful || fallback.helpfulLabel,
      adoptionRateLabel: tCommon.adoptionRate || fallback.adoptionRateLabel,
    };
  }, [lang, tCommon]);

  const numberFormatter = useMemo(() => new Intl.NumberFormat(lang), [lang]);
  const percentFormatter = useMemo(() => new Intl.NumberFormat(lang, { maximumFractionDigits: 1 }), [lang]);

  const { data, isLoading } = useUserLeaderboard(
    { page: currentPage, limit: currentLimit },
    {
      staleTime: 60 * 1000,
      gcTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    }
  );

  const entries = data?.data || [];
  const pagination = data?.pagination;
  const totalPages = pagination?.totalPages || 1;
  const totalCount = pagination?.total || entries.length;

  const showTopSection = currentPage === 1 && entries.length > 0;
  const topRankers = showTopSection ? entries.slice(0, 3) : [];

  const topConfigs = [
    {
      icon: Trophy,
      accent: 'from-amber-500/10 to-amber-400/5',
      ring: 'ring-amber-200/60 dark:ring-amber-500/30',
      iconClass: 'text-amber-600 dark:text-amber-300',
    },
    {
      icon: Medal,
      accent: 'from-slate-500/10 to-slate-400/5',
      ring: 'ring-slate-200/60 dark:ring-slate-500/30',
      iconClass: 'text-slate-600 dark:text-slate-300',
    },
    {
      icon: Sparkles,
      accent: 'from-emerald-500/10 to-emerald-400/5',
      ring: 'ring-emerald-200/60 dark:ring-emerald-500/30',
      iconClass: 'text-emerald-600 dark:text-emerald-300',
    },
  ];

  const buildPageHref = (page: number) => {
    const params = new URLSearchParams();
    if (page > 1) {
      params.set('page', String(page));
    }
    if (currentLimit !== initialLimit) {
      params.set('limit', String(currentLimit));
    }
    const query = params.toString();
    return `/${lang}/leaderboard${query ? `?${query}` : ''}`;
  };

  const pageInfo = copy.pageInfo
    .replace('{current}', numberFormatter.format(currentPage))
    .replace('{total}', numberFormatter.format(totalPages));

  return (
    <div className="flex flex-col gap-6 px-4 py-6">
      <section className="rounded-2xl border border-gray-200/60 dark:border-gray-800/60 bg-white dark:bg-gray-900 shadow-sm p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              {copy.title}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {copy.subtitle}
            </p>
          </div>
          <div className="rounded-xl border border-gray-200/60 dark:border-gray-800/60 bg-gray-50 dark:bg-gray-900/40 px-4 py-3 text-right">
            <div className="text-xs text-gray-500 dark:text-gray-400">{copy.totalLabel}</div>
            <div className="text-xl font-semibold text-gray-900 dark:text-white">
              {isLoading ? '--' : numberFormatter.format(totalCount)}
            </div>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
          <Link
            href={`/${lang}/guide/trust-badges`}
            className="inline-flex items-center rounded-full border border-gray-200 dark:border-gray-700 px-3 py-1.5 font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            {copy.guideLabel}
          </Link>
          <span className="inline-flex items-center rounded-full border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-gray-500 dark:text-gray-300">
            {copy.scoreFormula}
          </span>
        </div>
      </section>

      {showTopSection ? (
        <section className="grid gap-4 md:grid-cols-3">
          {topRankers.map((entry, index) => {
            const config = topConfigs[index] || topConfigs[0];
            const Icon = config.icon;
            const displayName = entry.displayName || entry.name || copy.unknownUser;
            const avatarSrc = entry.avatar || entry.image || '';
            const levelPercent = Math.round((entry.levelProgress || 0) * 100);
            const badge = getTrustBadgePresentation({
              locale: lang,
              author: {
                isVerified: entry.isVerified,
                isExpert: entry.isExpert,
                badgeType: entry.badgeType,
              },
              translations: tTrust,
            });

            return (
              <div
                key={entry.id}
                className="relative overflow-hidden rounded-2xl border border-gray-200/60 dark:border-gray-800/60 bg-white dark:bg-gray-900 p-5"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${config.accent}`} />
                <div className="relative flex flex-col gap-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`flex h-9 w-9 items-center justify-center rounded-full bg-white/90 dark:bg-gray-900/80 ring-1 ${config.ring}`}>
                        <Icon className={`h-4 w-4 ${config.iconClass}`} />
                      </span>
                      <div>
                        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                          {copy.rankLabel} #{entry.rank}
                        </div>
                        <Link
                          href={`/${lang}/profile/${entry.id}`}
                          className="text-base font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-300 transition"
                        >
                          {displayName}
                        </Link>
                      </div>
                    </div>
                    {badge.show ? (
                      <Tooltip content={badge.tooltip} position="top" touchBehavior="longPress" interactive>
                        <span>
                          <TrustBadge level={badge.level} label={badge.label} />
                        </span>
                      </Tooltip>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-3">
                    <Avatar name={displayName} imageUrl={avatarSrc} size="lg" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                        <span>{copy.levelLabel} {entry.level}</span>
                        <span>{levelPercent}%</span>
                      </div>
                      <div className="mt-1 h-2 w-full rounded-full bg-gray-200/70 dark:bg-gray-800">
                        <div
                          className="h-full rounded-full bg-blue-500/80"
                          style={{ width: `${levelPercent}%` }}
                        />
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-600 dark:text-gray-300">
                        <span className="inline-flex items-center gap-1">
                          <Flame className="h-3.5 w-3.5 text-orange-500/80" />
                          {copy.temperatureLabel} {numberFormatter.format(entry.score)}
                        </span>
                        <span>{copy.trustLabel} {numberFormatter.format(entry.trustScore)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </section>
      ) : null}

      <section className="rounded-2xl border border-gray-200/60 dark:border-gray-800/60 bg-white dark:bg-gray-900 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200/60 dark:border-gray-800/60">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">{copy.listTitle}</h2>
          <div className="text-xs text-gray-500 dark:text-gray-400">{pageInfo}</div>
        </div>
        {isLoading ? (
          <div className="px-4 py-6 text-sm text-gray-500 dark:text-gray-400">{copy.loading}</div>
        ) : entries.length === 0 ? (
          <div className="px-4 py-6 text-sm text-gray-500 dark:text-gray-400">{copy.empty}</div>
        ) : (
          <div className="divide-y divide-gray-200/60 dark:divide-gray-800/60">
            {entries.map((entry) => {
              const displayName = entry.displayName || entry.name || copy.unknownUser;
              const avatarSrc = entry.avatar || entry.image || '';
              const levelPercent = Math.round((entry.levelProgress || 0) * 100);
              const badge = getTrustBadgePresentation({
                locale: lang,
                author: {
                  isVerified: entry.isVerified,
                  isExpert: entry.isExpert,
                  badgeType: entry.badgeType,
                },
                translations: tTrust,
              });

              return (
                <div key={entry.id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-xs font-semibold text-gray-700 dark:text-gray-200">
                      {entry.rank}
                    </span>
                    <Avatar name={displayName} imageUrl={avatarSrc} size="md" />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/${lang}/profile/${entry.id}`}
                          className="text-sm font-semibold text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-300 transition truncate"
                        >
                          {displayName}
                        </Link>
                        {badge.show ? (
                          <Tooltip content={badge.tooltip} position="top" touchBehavior="longPress" interactive>
                            <span>
                              <TrustBadge level={badge.level} label={badge.label} />
                            </span>
                          </Tooltip>
                        ) : null}
                      </div>
                      <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {copy.levelLabel} {entry.level} · {copy.temperatureLabel} {numberFormatter.format(entry.score)}
                      </div>
                      <div className="mt-2 h-1.5 w-full max-w-[220px] rounded-full bg-gray-200/70 dark:bg-gray-800">
                        <div
                          className="h-full rounded-full bg-blue-500/80"
                          style={{ width: `${levelPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-xs text-gray-600 dark:text-gray-300 sm:text-right">
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase tracking-wide text-gray-400">{copy.trustLabel}</span>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        {numberFormatter.format(entry.trustScore)}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase tracking-wide text-gray-400">{copy.helpfulLabel}</span>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        {numberFormatter.format(entry.helpfulAnswers)}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase tracking-wide text-gray-400">{copy.adoptionRateLabel}</span>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        {percentFormatter.format(entry.adoptionRate)}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {totalPages > 1 ? (
        <div className="flex items-center justify-between">
          {currentPage > 1 ? (
            <Link
              href={buildPageHref(currentPage - 1)}
              className="inline-flex items-center gap-2 rounded-full border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              <ChevronLeft className="h-4 w-4" />
              {copy.previous}
            </Link>
          ) : (
            <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm font-semibold text-gray-400 dark:text-gray-600">
              <ChevronLeft className="h-4 w-4" />
              {copy.previous}
            </span>
          )}
          {currentPage < totalPages ? (
            <Link
              href={buildPageHref(currentPage + 1)}
              className="inline-flex items-center gap-2 rounded-full border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              {copy.next}
              <ChevronRight className="h-4 w-4" />
            </Link>
          ) : (
            <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm font-semibold text-gray-400 dark:text-gray-600">
              {copy.next}
              <ChevronRight className="h-4 w-4" />
            </span>
          )}
        </div>
      ) : null}
    </div>
  );
}
