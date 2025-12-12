'use client';

import { useParams } from 'next/navigation';

const contributorsByLocale = {
  ko: [
    { name: 'Top Helper', desc: '주간 답변왕 · 가장 많이 도운 사용자', badge: 'Official', score: 320 },
    { name: 'Top Expert', desc: '전문가 인증 답변을 가장 많이 제공', badge: 'Expert', score: 210 },
    { name: 'Community Star', desc: '저장·공유가 많은 인기 답변자', badge: 'Verified', score: 180 },
  ],
  vi: [
    { name: 'Top Helper', desc: 'Trả lời nhiều nhất tuần · giúp đỡ cộng đồng', badge: 'Official', score: 320 },
    { name: 'Top Expert', desc: 'Cung cấp nhiều câu trả lời chuyên gia nhất', badge: 'Expert', score: 210 },
    { name: 'Community Star', desc: 'Được lưu/chia sẻ nhiều nhất', badge: 'Verified', score: 180 },
  ],
  en: [
    { name: 'Top Helper', desc: 'Most answers this week · community helper', badge: 'Official', score: 320 },
    { name: 'Top Expert', desc: 'Most expert-verified answers', badge: 'Expert', score: 210 },
    { name: 'Community Star', desc: 'Most saved/shared contributor', badge: 'Verified', score: 180 },
  ],
};

const getBadgeTone = (badge: string) => {
  const normalized = badge.toLowerCase();
  if (normalized === 'official') {
    return 'bg-green-50 dark:bg-emerald-900/30 text-green-700 dark:text-emerald-200 border-green-200 dark:border-emerald-700';
  }
  if (normalized === 'verified') {
    return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700';
  }
  return 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-200 border-blue-200 dark:border-blue-700';
};

export default function TopContributors() {
  const params = useParams();
  const locale = ((params?.lang as string) || 'ko') as keyof typeof contributorsByLocale;
  const contributors = contributorsByLocale[locale] || contributorsByLocale.ko;
  const title = locale === 'vi' ? 'Huy hiệu xếp hạng tuần' : locale === 'en' ? 'Weekly ranking badges' : '주간 랭킹 배지';
  const moreLabel = locale === 'vi' ? 'Xem thêm' : locale === 'en' ? 'See more' : '랭킹 더 보기';
  const recommendLabel = locale === 'vi' ? 'Đề xuất' : locale === 'en' ? 'Recommend' : '추천';
  const profileLabel = locale === 'vi' ? 'Xem hồ sơ' : locale === 'en' ? 'View profile' : '프로필 보기';

  return (
    <section className="rounded-2xl border border-gray-200/60 dark:border-gray-800/60 bg-white dark:bg-gray-900 shadow-sm">
      <div className="flex items-center justify-between px-4 py-3 md:px-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">Ranking</p>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h2>
        </div>
        <button className="hidden md:inline-flex items-center gap-2 rounded-full border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
          {moreLabel}
        </button>
      </div>
      <div className="grid gap-3 px-4 pb-4 md:px-5 md:grid-cols-3">
        {contributors.map((c) => (
          <article
            key={c.name}
            className="rounded-xl border border-gray-200/70 dark:border-gray-800/70 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 p-3 md:p-4 flex flex-col gap-2 hover:shadow-md transition"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{c.name}</h3>
              <span className={`inline-flex items-center gap-1 rounded-full text-[11px] font-semibold px-2 py-0.5 border ${getBadgeTone(c.badge)}`}>
                {c.badge}
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{c.desc}</p>
            <div className="mt-auto flex items-center justify-between pt-1">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 px-2.5 py-1 text-xs font-semibold">
                {recommendLabel} {c.score}
              </div>
              <button className="text-xs font-semibold text-gray-700 dark:text-gray-200 hover:underline underline-offset-4">
                {profileLabel}
              </button>
            </div>
          </article>
        ))}
      </div>
      <div className="px-4 pb-4 md:px-5 md:hidden">
        <button className="w-full rounded-xl border border-gray-200 dark:border-gray-700 py-2.5 text-sm font-semibold text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
          {moreLabel}
        </button>
      </div>
    </section>
  );
}
