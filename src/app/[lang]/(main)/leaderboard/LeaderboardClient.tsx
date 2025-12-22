'use client';

import { useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight, Flame, Medal, Sparkles, Trophy } from 'lucide-react';
import Avatar from '@/components/atoms/Avatar';
import Tooltip from '@/components/atoms/Tooltip';
import { useUserLeaderboard } from '@/repo/users/query';
import { UserLeaderboardEntry } from '@/repo/users/types';

interface LeaderboardClientProps {
  translations: Record<string, unknown>;
  lang: string;
  initialPage: number;
  initialLimit: number;
}

const resolveTemperatureTone = (temperature: number) => {
  if (temperature >= 40.5) {
    return {
      iconClassName: 'text-red-600',
      chipClassName: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-200',
      filled: true,
      extraFlames: 1,
    };
  }
  if (temperature >= 38.5) {
    return {
      iconClassName: 'text-red-500',
      chipClassName: 'bg-red-50/70 text-red-700 dark:bg-red-900/20 dark:text-red-200',
      filled: true,
      extraFlames: 0,
    };
  }
  return {
    iconClassName: 'text-orange-500/80',
    chipClassName: 'bg-orange-50/70 text-orange-700 dark:bg-orange-900/20 dark:text-orange-200',
    filled: false,
    extraFlames: 0,
  };
};

export default function LeaderboardClient({ translations, lang, initialPage, initialLimit }: LeaderboardClientProps) {
  const searchParams = useSearchParams();
  const pageParam = parseInt(searchParams?.get('page') || '', 10);
  const limitParam = parseInt(searchParams?.get('limit') || '', 10);
  const topCarouselRef = useRef<HTMLDivElement | null>(null);

  const currentPage = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : initialPage;
  const currentLimit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(20, limitParam) : initialLimit;

  const tCommon = (translations?.common || {}) as Record<string, string>;
  const tTrust = (translations?.trustBadges || {}) as Record<string, string>;
  const t = (translations?.leaderboard || {}) as Record<string, any>;

  const copy = useMemo(() => {
    const rankGuideItems = Array.isArray(t.rankGuideItems) ? t.rankGuideItems : [];
    return {
      title: t.title || '',
      subtitle: t.subtitle || '',
      listTitle: t.listTitle || '',
      temperatureLabel: t.temperatureLabel || '',
      helpfulLabel: tCommon.helpful || t.helpfulLabel || '',
      adoptionRateLabel: tCommon.adoptionRate || t.adoptionRateLabel || '',
      weeklyAnswersLabel: t.weeklyAnswersLabel || '',
      pageInfo: t.pageInfo || '',
      previous: tCommon.previous || t.previous || '',
      next: tCommon.next || t.next || '',
      empty: t.empty || '',
      loading: t.loading || '',
      rankLabel: t.rankLabel || '',
      guideLabel: t.guideLabel || '',
      rankGuideTitle: t.rankGuideTitle || '',
      rankGuideItems,
      eventTitle: t.eventTitle || '',
      eventDescription: t.eventDescription || '',
      unknownUser: tCommon.anonymous || t.unknownUser || '',
    };
  }, [t, tCommon]);

  const numberFormatter = useMemo(() => new Intl.NumberFormat(lang), [lang]);
  const temperatureFormatter = useMemo(
    () => new Intl.NumberFormat(lang, { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
    [lang]
  );
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

  const entries = (data?.data || []) as UserLeaderboardEntry[];
  const pagination = data?.pagination;
  const totalPages = pagination?.totalPages || 1;

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

  const scrollTopCarousel = useCallback((direction: -1 | 1) => {
    const el = topCarouselRef.current;
    if (!el) return;
    const delta = Math.max(280, Math.round(el.clientWidth * 0.85));
    el.scrollBy({ left: direction * delta, behavior: 'smooth' });
  }, []);

  const rankGuideContent = (
    <div className="max-w-[280px] sm:max-w-[360px]">
      <div className="flex items-center gap-2 text-xs font-semibold text-gray-900 dark:text-white">
        <Trophy className="h-4 w-4 text-amber-600 dark:text-amber-300" />
        {copy.rankGuideTitle}
      </div>
      <ul className="mt-2 list-disc pl-5 space-y-1 text-sm text-gray-600 dark:text-gray-300">
        {(copy.rankGuideItems || []).map((item: string) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );

  const renderTopRankerCard = (entry: UserLeaderboardEntry, index: number) => {
    const config = topConfigs[index] || topConfigs[0];
    const Icon = config.icon;
    const displayName = entry.displayName || entry.name || copy.unknownUser;
    const avatarSrc = entry.avatar || entry.image || '';
    const temperatureTone = resolveTemperatureTone(entry.temperature);

    return (
      <div
        key={entry.id}
        className="relative overflow-hidden rounded-2xl border border-gray-200/60 dark:border-gray-800/60 bg-white dark:bg-gray-900 p-5"
      >
        <div className={`absolute inset-0 bg-gradient-to-br ${config.accent}`} />
        <div className="relative flex flex-col gap-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-full bg-white/90 dark:bg-gray-900/80 ring-1 ${config.ring}`}
              >
                <Icon className={`h-4 w-4 ${config.iconClass}`} />
              </span>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                  {copy.rankLabel} #{entry.rank}
                </div>
                <Link
                  href={`/${lang}/profile/${entry.id}`}
                  className="text-base font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-300 transition truncate"
                >
                  {displayName}
                </Link>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href={`/${lang}/profile/${entry.id}`} className="shrink-0">
              <Avatar name={displayName} imageUrl={avatarSrc} size="lg" hoverHighlight />
            </Link>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 ${temperatureTone.chipClassName}`}>
                  <Flame
                    className={`h-3.5 w-3.5 ${temperatureTone.iconClassName}`}
                    fill={temperatureTone.filled ? 'currentColor' : 'none'}
                  />
                  {temperatureTone.extraFlames ? (
                    <Flame
                      className={`h-3.5 w-3.5 ${temperatureTone.iconClassName}`}
                      fill={temperatureTone.filled ? 'currentColor' : 'none'}
                    />
                  ) : null}
                  {copy.temperatureLabel} {temperatureFormatter.format(entry.temperature)}°
                </span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-600 dark:text-gray-300">
                <span>
                  {copy.helpfulLabel} {numberFormatter.format(entry.helpfulAnswers)}
                </span>
                <span>
                  {copy.adoptionRateLabel} {percentFormatter.format(entry.adoptionRate)}%
                </span>
                <span>
                  {copy.weeklyAnswersLabel} {numberFormatter.format(entry.weeklyAnswers)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6 px-4 py-6">
      <section className="rounded-2xl border border-gray-200/60 dark:border-gray-800/60 bg-white dark:bg-gray-900 shadow-sm p-5 sm:p-6">
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            {copy.title}
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {copy.subtitle}
          </p>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
          <Link
            href={`/${lang}/guide/trust-badges`}
            className="inline-flex items-center rounded-full border border-gray-200 dark:border-gray-700 px-3 py-1.5 font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            {copy.guideLabel}
          </Link>
          {(copy.rankGuideItems || []).length > 0 ? (
            <Tooltip content={rankGuideContent} position="below" touchBehavior="longPress" interactive>
              <button
                type="button"
                aria-label={copy.rankGuideTitle}
                className="lg:hidden inline-flex h-11 w-11 sm:h-9 sm:w-9 items-center justify-center rounded-full border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/40 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <Trophy className="h-4 w-4 text-amber-600 dark:text-amber-300" />
              </button>
            </Tooltip>
          ) : null}
        </div>

        {(copy.rankGuideItems || []).length > 0 ? (
          <div className="mt-4 hidden lg:block rounded-xl border border-gray-200/60 dark:border-gray-800/60 bg-gray-50 dark:bg-gray-900/40 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-200">
              <Trophy className="h-4 w-4 text-amber-600 dark:text-amber-300" />
              {copy.rankGuideTitle}
            </div>
            <ul className="mt-2 list-disc pl-5 space-y-1 text-sm text-gray-600 dark:text-gray-300">
              {(copy.rankGuideItems || []).map((item: string) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="mt-3 lg:hidden rounded-xl border border-gray-200/60 dark:border-gray-800/60 bg-white dark:bg-gray-900 p-4">
          <div className="text-xs font-semibold text-gray-900 dark:text-white">
            {copy.eventTitle}
          </div>
          <div className="mt-1 text-sm text-gray-600 dark:text-gray-300">
            {copy.eventDescription}
          </div>
        </div>
      </section>

      {showTopSection ? (
        <>
          <section className="md:hidden">
            <div className="flex items-center justify-end gap-1 mb-2">
              <button
                type="button"
                onClick={() => scrollTopCarousel(-1)}
                className="inline-flex h-11 w-11 sm:h-9 sm:w-9 items-center justify-center rounded-full border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/40 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                aria-label={copy.previous}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => scrollTopCarousel(1)}
                className="inline-flex h-11 w-11 sm:h-9 sm:w-9 items-center justify-center rounded-full border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/40 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                aria-label={copy.next}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <div
              ref={topCarouselRef}
              className="flex gap-3 overflow-x-auto scrollbar-hide snap-x snap-mandatory pr-4 scroll-px-4"
            >
              {topRankers.map((entry, index) => (
                <div
                  key={entry.id}
                  className="min-w-[280px] max-w-[340px] snap-start"
                >
                  {renderTopRankerCard(entry, index)}
                </div>
              ))}
            </div>
          </section>
          <section className="hidden md:grid gap-4 md:grid-cols-3">
            {topRankers.map((entry, index) => renderTopRankerCard(entry, index))}
          </section>
        </>
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
            {entries.map((entry: UserLeaderboardEntry) => {
              const displayName = entry.displayName || entry.name || copy.unknownUser;
              const avatarSrc = entry.avatar || entry.image || '';
              const temperatureTone = resolveTemperatureTone(entry.temperature);

              return (
                <div key={entry.id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
	                  <div className="flex items-center gap-3 min-w-0">
	                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-xs font-semibold text-gray-700 dark:text-gray-200">
	                      {entry.rank}
	                    </span>
	                    <Link href={`/${lang}/profile/${entry.id}`} className="shrink-0">
	                      <Avatar name={displayName} imageUrl={avatarSrc} size="md" hoverHighlight />
	                    </Link>
	                    <div className="min-w-0">
	                      <div className="flex flex-wrap items-center gap-2">
                        <Link
	                          href={`/${lang}/profile/${entry.id}`}
                          className="text-sm font-semibold text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-300 transition truncate"
                        >
                          {displayName}
                        </Link>
                      </div>
                      <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 ${temperatureTone.chipClassName}`}>
                          <Flame
                            className={`h-3.5 w-3.5 ${temperatureTone.iconClassName}`}
                            fill={temperatureTone.filled ? 'currentColor' : 'none'}
                          />
                          {temperatureTone.extraFlames ? (
                            <Flame
                              className={`h-3.5 w-3.5 ${temperatureTone.iconClassName}`}
                              fill={temperatureTone.filled ? 'currentColor' : 'none'}
                            />
                          ) : null}
                          {copy.temperatureLabel} {temperatureFormatter.format(entry.temperature)}°
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-xs text-gray-600 dark:text-gray-300 sm:text-right">
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
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase tracking-wide text-gray-400">{copy.weeklyAnswersLabel}</span>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        {numberFormatter.format(entry.weeklyAnswers)}
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
