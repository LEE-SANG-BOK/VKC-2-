'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ExternalLink } from 'lucide-react';
import { useNews } from '@/repo/news/query';
import type { NewsItem } from '@/repo/news/types';
import { DEFAULT_BLUR_DATA_URL } from '@/lib/constants/images';

interface MediaClientProps {
  translations: Record<string, unknown>;
  lang: string;
}

export default function MediaClient({ translations, lang }: MediaClientProps) {
  const tNews = (translations?.news || {}) as { title?: string };
  const title =
    tNews.title || (lang === 'vi' ? 'Nội dung nổi bật' : lang === 'en' ? 'Featured content' : '추천 콘텐츠');
  const emptyLabel = lang === 'vi' ? 'Chưa có nội dung.' : lang === 'en' ? 'No content yet.' : '아직 콘텐츠가 없습니다.';
  const closeLabel = lang === 'vi' ? 'Đóng' : lang === 'en' ? 'Close' : '닫기';
  const openExternalLabel = lang === 'vi' ? 'Mở liên kết' : lang === 'en' ? 'Open link' : '외부 링크 열기';

  const [selected, setSelected] = useState<NewsItem | null>(null);
  const { data: newsItems, isLoading } = useNews(lang);
  const items = (newsItems || []).filter((item) => item.type === 'post');

  if (isLoading) {
    return (
      <section id="featured" className="rounded-2xl border border-gray-200/60 dark:border-gray-800/60 bg-white dark:bg-gray-900 shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h2>
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-gray-200 dark:bg-gray-800 animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  if (!items || items.length === 0) {
    return (
      <section id="featured" className="rounded-2xl border border-gray-200/60 dark:border-gray-800/60 bg-white dark:bg-gray-900 shadow-sm p-4">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{emptyLabel}</p>
      </section>
    );
  }

  return (
    <>
      <section id="featured" className="rounded-2xl border border-gray-200/60 dark:border-gray-800/60 bg-white dark:bg-gray-900 shadow-sm">
        <div className="px-4 py-3 md:px-5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h2>
        </div>

        <div className="divide-y divide-gray-200/60 dark:divide-gray-800/60">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelected(item)}
              className="w-full text-left px-4 py-3 md:px-5 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors"
            >
              <div className="flex gap-3">
                <div className="relative w-24 h-16 shrink-0 overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200/60 dark:border-gray-700/60">
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.title}
                      fill
                      sizes="96px"
                      className="object-cover"
                      placeholder="blur"
                      blurDataURL={DEFAULT_BLUR_DATA_URL}
                    />
                  ) : null}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 line-clamp-1">
                    {item.category}
                  </div>
                  <div className="mt-0.5 text-base font-bold text-gray-900 dark:text-white line-clamp-2">
                    {item.title}
                  </div>
                  <div className="mt-1 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                    {item.content || ''}
                  </div>
                </div>
              </div>
            </button>
          ))}
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
                <Image
                  src={selected.imageUrl}
                  alt={selected.title}
                  fill
                  sizes="768px"
                  className="object-cover"
                  placeholder="blur"
                  blurDataURL={DEFAULT_BLUR_DATA_URL}
                />
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
