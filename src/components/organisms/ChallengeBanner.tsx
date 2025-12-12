'use client';

import { useParams } from 'next/navigation';

export default function ChallengeBanner() {
  const params = useParams();
  const locale = (params?.lang as string) || 'ko';
  const title =
    locale === 'vi'
      ? 'Thử thách hỏi đáp · Mẹo đời sống'
      : locale === 'en'
        ? 'Q&A challenge · Life tips UGC'
        : '질문 챌린지 · 생활 꿀팁 UGC';
  const desc =
    locale === 'vi'
      ? 'Chia sẻ câu hỏi/mẹo hữu ích nhất tuần để nhận badge và lên highlight.'
      : locale === 'en'
        ? 'Share the most helpful questions/tips this week to get badges and highlights.'
        : '이번 주 가장 유용한 질문/꿀팁을 공유하면 뱃지와 하이라이트에 노출됩니다.';
  const ask =
    locale === 'vi' ? 'Đăng câu hỏi' : locale === 'en' ? 'Post a question' : '질문 올리기';
  const tip =
    locale === 'vi' ? 'Chia sẻ mẹo' : locale === 'en' ? 'Share a tip' : '꿀팁 공유하기';

  return (
    <section className="rounded-2xl border border-amber-200/70 dark:border-amber-800/60 bg-gradient-to-r from-amber-50 via-orange-50 to-rose-50 dark:from-amber-900/30 dark:via-orange-900/30 dark:to-rose-900/30 text-amber-900 dark:text-amber-100 shadow-sm">
      <div className="px-4 py-4 md:px-5 md:py-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700/80 dark:text-amber-200">Challenge</p>
          <h3 className="text-lg font-bold">{title}</h3>
          <p className="text-sm text-amber-900/80 dark:text-amber-100/90">{desc}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="rounded-full bg-amber-600 text-white text-sm font-semibold px-4 py-2 hover:bg-amber-700 transition">
            {ask}
          </button>
          <button className="rounded-full border border-amber-300/70 text-sm font-semibold text-amber-800 dark:text-amber-100 px-4 py-2 hover:bg-white/50 dark:hover:bg-white/10 transition">
            {tip}
          </button>
        </div>
      </div>
    </section>
  );
}
