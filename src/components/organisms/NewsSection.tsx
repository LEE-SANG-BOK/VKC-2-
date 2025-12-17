'use client';

import { useEffect, useRef, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import NewsCard from '@/components/molecules/NewsCard';
import { useNews } from '@/repo/news/query';
import { NewsItem } from '@/repo/news/types';

interface TranslationsType {
  news?: { title?: string };
}

interface NewsSectionProps {
  translations: TranslationsType;
  lang?: string;
}

export default function NewsSection({ translations, lang }: NewsSectionProps) {
  const locale = lang || 'vi';
  const t = translations?.news || {};
  const title =
    t.title || (locale === 'vi' ? 'Nội dung nổi bật' : locale === 'en' ? 'Featured content' : '추천 콘텐츠');
  const closeLabel = locale === 'vi' ? 'Đóng' : locale === 'en' ? 'Close' : '닫기';
  const openExternalLabel = locale === 'vi' ? 'Mở liên kết' : locale === 'en' ? 'Open link' : '외부 링크 열기';

  const scrollRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<NewsItem | null>(null);

  const { data: newsItems, isLoading } = useNews(locale);
  const items = (newsItems || []).filter((item) => item.type === 'post');

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 400;
      const newScrollLeft = direction === 'left'
        ? scrollRef.current.scrollLeft - scrollAmount
        : scrollRef.current.scrollLeft + scrollAmount;

      scrollRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    if (!items || items.length === 0) return;

    const interval = setInterval(() => {
      if (scrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;

        if (scrollLeft >= scrollWidth - clientWidth - 10) {
          scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          scroll('right');
        }
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [items]);

  if (isLoading) {
    return (
      <div className="w-full bg-transparent border-b border-gray-200/25 dark:border-gray-800/25">
      <div className="px-3 py-2">
        <span className="sr-only">{title}</span>
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex-shrink-0 w-[172px] h-[160px] rounded-xl bg-gray-200 dark:bg-gray-800 animate-pulse" />
          ))}
        </div>
        </div>
      </div>
    );
  }

  if (!items || items.length === 0) {
    return null;
  }

  return (
    <div className="w-full bg-transparent">
      <div className="px-0 py-2">
        <div className="flex items-center justify-end mb-2">
          <span className="sr-only">{title}</span>
        </div>

        <div
          ref={scrollRef}
          className="flex gap-2 overflow-x-auto scrollbar-hide scroll-smooth pb-1.5"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {items.map((news) => (
            <NewsCard
              key={news.id}
              id={news.id}
              title={news.title}
              category={news.category}
              imageUrl={news.imageUrl}
              linkUrl={news.linkUrl}
              onSelect={() => setSelected(news)}
            />
          ))}
        </div>
      </div>
      {selected && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {selected.imageUrl && (
              <div className="relative w-full h-56 bg-gray-100 dark:bg-gray-800">
                <img src={selected.imageUrl} alt={selected.title} className="w-full h-full object-cover" />
              </div>
            )}
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
                {selected.linkUrl && (
                  <a
                    href={selected.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700"
                  >
                    {openExternalLabel}
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
