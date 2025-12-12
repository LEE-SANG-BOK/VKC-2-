'use client';

import { useRouter } from 'nextjs-toploader/app';
import { useParams } from 'next/navigation';
import ShareButton from '../molecules/ShareButton';

const RELATED_ITEMS = {
  ko: [
    { title: '60초로 보는 D-10 신청', type: '숏폼', duration: '0:52' },
    { title: 'E-7 직군별 연봉 카드뉴스', type: '카드뉴스', duration: '6컷' },
    { title: '한국 생활 꿀팁 TOP3', type: '숏폼', duration: '0:36' },
  ],
  vi: [
    { title: 'D-10 trong 60 giây', type: 'Short', duration: '0:52' },
    { title: 'Lương theo ngành E-7 (card news)', type: 'Card news', duration: '6 trang' },
    { title: '3 mẹo sống ở Hàn', type: 'Short', duration: '0:36' },
  ],
  en: [
    { title: 'D-10 in 60 seconds', type: 'Short', duration: '0:52' },
    { title: 'E-7 salary by role (card news)', type: 'Card news', duration: '6 cards' },
    { title: 'Top 3 Korea life hacks', type: 'Short', duration: '0:36' },
  ],
};

export default function RelatedMediaSlider() {
  const router = useRouter();
  const params = useParams();
  const locale = ((params?.lang as string) || 'ko') as keyof typeof RELATED_ITEMS;
  const relatedItems = RELATED_ITEMS[locale] || RELATED_ITEMS.ko;
  const sectionTitle = locale === 'vi' ? 'Nội dung liên quan' : locale === 'en' ? 'Related shorts & cards' : '연관 숏폼 · 카드뉴스';
  const moreLabel = locale === 'vi' ? 'Xem thêm' : locale === 'en' ? 'More' : '더 보기';
  const viewLabel = locale === 'vi' ? 'Xem' : locale === 'en' ? 'View' : '보기';
  const saveLabel = locale === 'vi' ? 'Lưu' : locale === 'en' ? 'Save' : '저장';
  const shareLabel = locale === 'vi' ? 'Chia sẻ' : locale === 'en' ? 'Share' : '공유';

  const handleMore = () => {
    router.push('search?tab=media');
  };

  const handleView = () => {
    router.push('search?tab=media');
  };

  return (
    <section className="rounded-2xl border border-gray-200/60 dark:border-gray-800/60 bg-white dark:bg-gray-900 shadow-sm">
      <div className="flex items-center justify-between px-4 py-3 md:px-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">Related</p>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">{sectionTitle}</h2>
        </div>
        <button
          type="button"
          onClick={handleMore}
          className="hidden md:inline-flex items-center gap-2 rounded-full border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
        >
          {moreLabel}
        </button>
      </div>
      <div className="flex gap-3 px-4 pb-4 md:px-5 overflow-x-auto scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {relatedItems.map((item) => (
          <article
            key={item.title}
            className="min-w-[240px] rounded-xl border border-gray-200/70 dark:border-gray-800/70 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 p-3 flex flex-col gap-2 hover:shadow-md transition"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-gray-700 dark:text-gray-200">
                {item.type}
              </span>
              <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">{item.duration}</span>
            </div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white leading-snug line-clamp-2">{item.title}</h3>
            <div className="mt-auto flex items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400">
              <button
                type="button"
                onClick={handleView}
                className="rounded-full bg-blue-600 text-white px-3 py-1.5 text-xs font-semibold hover:bg-blue-700 transition"
              >
                {viewLabel}
              </button>
              <button className="hover:text-gray-800 dark:hover:text-gray-200 transition">{saveLabel}</button>
              <ShareButton label={shareLabel} className="px-2.5 py-1.5" />
            </div>
          </article>
        ))}
      </div>
      <div className="px-4 pb-4 md:px-5 md:hidden">
        <button
          type="button"
          onClick={handleMore}
          className="w-full rounded-xl border border-gray-200 dark:border-gray-700 py-2.5 text-sm font-semibold text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
        >
          {locale === 'vi' ? 'Xem thêm nội dung liên quan' : locale === 'en' ? 'See more related content' : '연관 콘텐츠 더 보기'}
        </button>
      </div>
    </section>
  );
}
