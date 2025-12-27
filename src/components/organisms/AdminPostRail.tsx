'use client';

import { useCallback, useRef, useState } from 'react';
import Image from 'next/image';
import { ExternalLink } from 'lucide-react';
import { useNews } from '@/repo/news/query';
import { NewsItem } from '@/repo/news/types';
import { DEFAULT_BLUR_DATA_URL } from '@/lib/constants/images';

interface AdminPostRailProps {
  translations: Record<string, unknown>;
  lang: string;
  limit?: number;
}

export default function AdminPostRail({ translations, lang, limit = 7 }: AdminPostRailProps) {
  const tNews = (translations?.news || {}) as { title?: string; moreLabel?: string; close?: string; openExternal?: string };
  const tCommon = (translations?.common || {}) as { previous?: string; next?: string };
  const [selected, setSelected] = useState<NewsItem | null>(null);
  const carouselRef = useRef<HTMLDivElement | null>(null);

  const { data: newsItems, isLoading } = useNews(lang);
  const items = (newsItems || []).filter((item) => item.type === 'post').slice(0, limit);

  const title = tNews.title || '';
  const closeLabel = tNews.close || '';
  const openExternalLabel = tNews.openExternal || '';
  const previousLabel = tCommon.previous || '';
  const nextLabel = tCommon.next || '';

  const scrollCarousel = useCallback((direction: -1 | 1) => {
    const el = carouselRef.current;
    if (!el) return;
    const delta = Math.max(220, Math.round(el.clientWidth * 0.85));
    el.scrollBy({ left: direction * delta, behavior: 'smooth' });
  }, []);

  if (isLoading) {
    return (
      <section data-testid="recommended-content-rail" className="rounded-xl bg-transparent p-2 lg:p-0">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h2>
        </div>
        <div data-testid="recommended-content-carousel" className="lg:hidden flex gap-2 overflow-x-auto scrollbar-hide pb-1 pr-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="min-w-[220px] h-16 rounded-lg bg-gray-200 dark:bg-gray-800 animate-pulse" />
          ))}
        </div>
        <div className="hidden lg:block space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-14 rounded-lg bg-gray-200 dark:bg-gray-800 animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  if (items.length === 0) return null;

  return (
    <>
      <section data-testid="recommended-content-rail" className="rounded-xl bg-transparent p-2 lg:p-0">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h2>
          <div className="lg:hidden flex items-center gap-1">
            <button
              type="button"
              onClick={() => scrollCarousel(-1)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/40 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              aria-label={previousLabel}
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => scrollCarousel(1)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/40 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              aria-label={nextLabel}
            >
              ›
            </button>
          </div>
        </div>

        <div
          ref={carouselRef}
          data-testid="recommended-content-carousel"
          className="lg:hidden flex gap-2 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-1 pr-2"
        >
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelected(item)}
              data-testid="recommended-content-card"
              className="min-w-[220px] max-w-[240px] snap-start text-left rounded-lg border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/40 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="flex gap-2 p-2">
                <div className="relative w-16 h-12 shrink-0 overflow-hidden rounded-md bg-gray-100 dark:bg-gray-800">
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.title}
                      fill
                      sizes="64px"
                      className="object-cover"
                      placeholder="blur"
                      blurDataURL={DEFAULT_BLUR_DATA_URL}
                    />
                  ) : null}
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-1">{item.category}</div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2">{item.title}</div>
                </div>
              </div>
            </button>
          ))}
        </div>

        <ul className="hidden lg:block space-y-2">
          {items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => setSelected(item)}
                className="w-full text-left rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex gap-2 p-2">
                  <div className="relative w-16 h-12 shrink-0 overflow-hidden rounded-md bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.title}
                        fill
                        sizes="64px"
                        className="object-cover"
                        placeholder="blur"
                        blurDataURL={DEFAULT_BLUR_DATA_URL}
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-1">
                      {item.category}
                    </div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2">
                      {item.title}
                    </div>
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ul>
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
