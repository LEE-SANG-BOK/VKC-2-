'use client';

import { useRouter } from 'nextjs-toploader/app';
import { useParams } from 'next/navigation';
import ShareButton from '../molecules/ShareButton';

const CARDS = {
  ko: [
    { title: 'D-10 비자 연장 체크리스트 5컷', summary: '신청 조건, 필요 서류, 주의사항을 카드뉴스로 정리했습니다.', lang: 'VI / KO' },
    { title: 'E-7 직군별 요구 연봉 한눈에', summary: '직군·연봉·가점 요소를 슬라이드로 빠르게 확인하세요.', lang: 'VI / EN' },
    { title: '한국 생활 꿀팁 TOP3', summary: '은행, 통신, 주거 필수 팁을 3컷으로 요약.', lang: 'VI' },
  ],
  vi: [
    { title: 'Checklist gia hạn D-10 (5 trang)', summary: 'Điều kiện, hồ sơ, lưu ý được tóm tắt dạng card news.', lang: 'VI / KO' },
    { title: 'Lương tối thiểu E-7 theo ngành', summary: 'Xem nhanh lương, điểm cộng theo từng vị trí qua slide.', lang: 'VI / EN' },
    { title: '3 mẹo sống tại Hàn', summary: 'Tóm tắt ngân hàng, viễn thông, nhà ở trong 3 trang.', lang: 'VI' },
  ],
  en: [
    { title: 'D-10 renewal checklist (5 slides)', summary: 'Conditions, required docs, cautions summarized in cards.', lang: 'VI / KO' },
    { title: 'E-7 salary by role at a glance', summary: 'Quick slides for salary and bonus points per role.', lang: 'VI / EN' },
    { title: 'Top 3 Korea life hacks', summary: 'Banking, telecom, housing tips in 3 cards.', lang: 'VI' },
  ],
};

export default function CardNewsShowcase() {
  const router = useRouter();
  const params = useParams();
  const locale = ((params?.lang as string) || 'ko') as keyof typeof CARDS;
  const cards = CARDS[locale] || CARDS.ko;
  const sectionTitle = locale === 'vi' ? 'Card news Visa/Việc làm' : locale === 'en' ? 'Visa/Jobs card news' : '비자·취업 카드뉴스 모음';
  const moreLabel = locale === 'vi' ? 'Xem tất cả' : locale === 'en' ? 'View all' : '모두 보기';
  const viewSlide = locale === 'vi' ? 'Xem slide' : locale === 'en' ? 'View slides' : '슬라이드 보기';
  const saveLabel = locale === 'vi' ? 'Lưu' : locale === 'en' ? 'Save' : '저장';
  const shareLabel = locale === 'vi' ? 'Chia sẻ' : locale === 'en' ? 'Share' : '공유';
  const moreMobile = locale === 'vi' ? 'Xem thêm card news' : locale === 'en' ? 'More card news' : '카드뉴스 더 보기';

  const handleViewAll = () => {
    router.push('search?tab=cardnews');
  };

  const handleSlideView = () => {
    router.push('search?tab=cardnews');
  };

  return (
    <section className="rounded-2xl border border-gray-200/60 dark:border-gray-800/60 bg-white dark:bg-gray-900 shadow-sm">
      <div className="flex items-center justify-between px-4 py-3 md:px-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">Card News</p>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">{sectionTitle}</h2>
        </div>
        <button
          type="button"
          onClick={handleViewAll}
          className="hidden md:inline-flex items-center gap-2 rounded-full border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
        >
          {moreLabel}
        </button>
      </div>
      <div className="grid gap-3 px-4 pb-4 md:px-5 md:grid-cols-3">
        {cards.map((card, idx) => (
          <article
            key={card.title}
            className="rounded-xl border border-gray-200/70 dark:border-gray-800/70 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 p-3 md:p-4 flex flex-col gap-2 hover:shadow-md transition"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-300">#{idx + 1}</span>
              <span className="rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-[11px] text-gray-600 dark:text-gray-300">{card.lang}</span>
            </div>
            <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white leading-snug">{card.title}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{card.summary}</p>
            <div className="mt-auto flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleSlideView}
                className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 text-white text-xs font-semibold px-3 py-1.5 hover:bg-blue-700 transition"
              >
                {viewSlide}
              </button>
              <div className="flex items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400">
                <button className="hover:text-gray-800 dark:hover:text-gray-200 transition">{saveLabel}</button>
                <ShareButton label={shareLabel} className="px-2.5 py-1.5" />
              </div>
            </div>
          </article>
        ))}
      </div>
      <div className="px-4 pb-4 md:px-5 md:hidden">
        <button
          type="button"
          onClick={handleViewAll}
          className="w-full rounded-xl border border-gray-200 dark:border-gray-700 py-2.5 text-sm font-semibold text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
        >
          {moreMobile}
        </button>
      </div>
    </section>
  );
}
