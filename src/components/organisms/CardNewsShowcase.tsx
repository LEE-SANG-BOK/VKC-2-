'use client';

import { useParams } from 'next/navigation';
import ShareButton from '../molecules/ShareButton';
import Image from 'next/image';
import { useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { useNews } from '@/repo/news/query';
import type { NewsItem } from '@/repo/news/types';

export default function CardNewsShowcase() {
  const params = useParams();
  const locale = (params?.lang as string) || 'vi';

  const { data: newsItems, isLoading } = useNews(locale);
  const cards = (newsItems || []).filter((item) => item.type === 'cardnews').slice(0, 6);

  const [selected, setSelected] = useState<NewsItem | null>(null);

  const sectionTitle = locale === 'vi' ? 'Card news Visa/Việc làm' : locale === 'en' ? 'Visa/Jobs card news' : '비자·취업 카드뉴스 모음';
  const moreLabel = locale === 'vi' ? 'Xem tất cả' : locale === 'en' ? 'View all' : '모두 보기';
  const viewSlide = locale === 'vi' ? 'Xem' : locale === 'en' ? 'View' : '보기';
  const saveLabel = locale === 'vi' ? 'Lưu' : locale === 'en' ? 'Save' : '저장';
  const shareLabel = locale === 'vi' ? 'Chia sẻ' : locale === 'en' ? 'Share' : '공유';
  const moreMobile = locale === 'vi' ? 'Xem thêm card news' : locale === 'en' ? 'More card news' : '카드뉴스 더 보기';
  const closeLabel = locale === 'vi' ? 'Đóng' : locale === 'en' ? 'Close' : '닫기';
  const openExternalLabel = locale === 'vi' ? 'Mở liên kết' : locale === 'en' ? 'Open link' : '외부 링크 열기';
  const emptyLabel =
    locale === 'vi'
      ? 'Chưa có card news.'
      : locale === 'en'
        ? 'No card news yet.'
        : '아직 카드뉴스가 없습니다.';

  const handleViewAll = () => {
    const target = `/${locale}/media`;
    if (typeof window !== 'undefined') {
      window.location.href = target;
    }
  };

  const handleView = (item: NewsItem) => {
    setSelected(item);
  };

  if (isLoading) {
    return (
      <section id="cardnews" className="rounded-2xl border border-gray-200/60 dark:border-gray-800/60 bg-white dark:bg-gray-900 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3 md:px-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">Card News</p>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">{sectionTitle}</h2>
          </div>
        </div>
        <div className="grid gap-3 px-4 pb-4 md:px-5 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-xl bg-gray-200 dark:bg-gray-800 animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  if (cards.length === 0) {
    return (
      <section id="cardnews" className="rounded-2xl border border-gray-200/60 dark:border-gray-800/60 bg-white dark:bg-gray-900 shadow-sm">
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
        <div className="px-4 pb-4 md:px-5 text-sm text-gray-600 dark:text-gray-300">{emptyLabel}</div>
      </section>
    );
  }

  return (
    <>
      <section id="cardnews" className="rounded-2xl border border-gray-200/60 dark:border-gray-800/60 bg-white dark:bg-gray-900 shadow-sm">
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
              key={card.id}
              className="rounded-xl border border-gray-200/70 dark:border-gray-800/70 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 p-3 md:p-4 flex flex-col gap-2 hover:shadow-md transition"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-300">#{idx + 1}</span>
                <span className="rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-[11px] text-gray-600 dark:text-gray-300">
                  {card.language.toUpperCase()}
                </span>
              </div>
              <div className="relative w-full h-28 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700">
                {card.imageUrl ? (
                  <Image src={card.imageUrl} alt={card.title} fill sizes="320px" className="object-cover" />
                ) : null}
              </div>
              <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white leading-snug line-clamp-2">
                {card.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-2">{card.content}</p>
              <div className="mt-auto flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => handleView(card)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 text-white text-xs font-semibold px-3 py-1.5 hover:bg-blue-700 transition"
                >
                  {viewSlide}
                </button>
                <div className="flex items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400">
                  <button className="hover:text-gray-800 dark:hover:text-gray-200 transition">{saveLabel}</button>
                  <ShareButton url={card.linkUrl || undefined} title={card.title} label={shareLabel} className="px-2.5 py-1.5" />
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

      {selected ? (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {selected.imageUrl ? (
              <div className="relative w-full h-56 bg-gray-100 dark:bg-gray-800">
                <Image src={selected.imageUrl} alt={selected.title} fill sizes="768px" className="object-cover" />
              </div>
            ) : null}
            <div className="p-6 space-y-3">
              <div className="text-xs text-gray-500 dark:text-gray-400">{selected.category}</div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">{selected.title}</h3>
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                {selected.content || ''}
              </p>
              <div className="flex justify-between items-center pt-2">
                <button
                  onClick={() => setSelected(null)}
                  className="px-4 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  {closeLabel}
                </button>
                {selected.linkUrl ? (
                  <a
                    href={selected.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700"
                  >
                    {openExternalLabel}
                    <ExternalLink className="h-4 w-4" />
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
