'use client';

import Link from 'next/link';
import type { Locale } from '@/i18n/config';
import Avatar from '@/components/atoms/Avatar';
import { useUserLeaderboard } from '@/repo/users/query';

interface LeaderboardPreviewProps {
  locale: Locale;
  translations: Record<string, unknown>;
}

export default function LeaderboardPreview({ locale, translations }: LeaderboardPreviewProps) {
  const t = (translations?.leaderboard || {}) as Record<string, string>;
  const fallback = {
    title: locale === 'vi' ? 'Bang xep hang' : locale === 'en' ? 'Leaderboard' : '리더보드',
    subtitle: locale === 'vi' ? 'Top 3 nguoi dong gop' : locale === 'en' ? 'Top contributors' : '상위 기여자',
    viewAll: locale === 'vi' ? 'Xem bang xep hang' : locale === 'en' ? 'View leaderboard' : '리더보드 보기',
    score: locale === 'vi' ? 'Diem' : locale === 'en' ? 'Score' : '점수',
    level: locale === 'vi' ? 'Cap' : locale === 'en' ? 'Lv.' : '레벨',
    userFallback: locale === 'vi' ? 'Nguoi dung' : locale === 'en' ? 'User' : '사용자',
  };
  const levelLabel = t.level || fallback.level;

  const { data } = useUserLeaderboard({ page: 1, limit: 3 });
  const entries = data?.data || [];

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100">
            {t.title || fallback.title}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {t.subtitle || fallback.subtitle}
          </p>
        </div>
        <Link
          href={`/${locale}/leaderboard`}
          className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
        >
          {t.viewAll || fallback.viewAll}
        </Link>
      </div>

      <div className="mt-3 space-y-2">
        {entries.map((entry) => (
          <div key={entry.id} className="flex items-center gap-3 rounded-lg border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/60 px-3 py-2">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">#{entry.rank}</span>
            <Avatar
              name={entry.displayName || entry.name || fallback.userFallback}
              imageUrl={entry.image || entry.avatar || undefined}
              size="sm"
            />
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
                {entry.displayName || entry.name || fallback.userFallback}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {fallback.score}: {entry.score} · {levelLabel} {entry.level}
              </p>
            </div>
          </div>
        ))}
        {entries.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-200 dark:border-gray-700 px-3 py-4 text-center text-xs text-gray-500 dark:text-gray-400">
            {fallback.subtitle}
          </div>
        ) : null}
      </div>
    </div>
  );
}
