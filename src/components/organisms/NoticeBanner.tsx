'use client';

import { useMemo, useState } from 'react';
import { ExternalLink, Megaphone } from 'lucide-react';
import Image from 'next/image';
import { useNews } from '@/repo/news/query';
import type { NewsItem } from '@/repo/news/types';
import { DEFAULT_BLUR_DATA_URL } from '@/lib/constants/images';

interface NoticeBannerProps {
  translations: Record<string, unknown>;
  lang: string;
  limit?: number;
}

const isNoticeCategory = (value?: string | null) => {
  const normalized = String(value || '').trim().toLowerCase();
  return normalized === 'notice' || normalized === '공지';
};

export default function NoticeBanner({ translations, lang, limit = 2 }: NoticeBannerProps) {
  const locale = lang || 'vi';
  const t = (translations?.noticeBanner || {}) as Record<string, string>;
  const { data: newsItems, isLoading } = useNews(locale);
  const [selected, setSelected] = useState<NewsItem | null>(null);

  const items = useMemo(() => {
    return (newsItems || [])
      .filter((item) => item.type === 'post' && isNoticeCategory(item.category))
      .slice(0, limit);
  }, [limit, newsItems]);

  const labelFallbacks = useMemo(() => {
    if (locale === 'en') {
      return {
        badge: 'Notice',
        openExternal: 'Open link',
        close: 'Close',
      };
    }
    if (locale === 'vi') {
      return {
        badge: 'Thông báo',
        openExternal: 'Mở liên kết',
        close: 'Đóng',
      };
    }
    return {
      badge: '공지',
      openExternal: '외부 링크 열기',
      close: '닫기',
    };
  }, [locale]);
  const badgeLabel = t.badge || labelFallbacks.badge;
  const openExternalLabel = t.openExternal || labelFallbacks.openExternal;
  const closeLabel = t.close || labelFallbacks.close;

  if (isLoading) {
    return (
      <section className="rounded-2xl border border-amber-200/60 bg-amber-50/40 dark:border-amber-800/40 dark:bg-amber-900/10 p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-4 w-4 rounded-full bg-amber-200/80 dark:bg-amber-700/60 animate-pulse" />
          <div className="h-3 w-20 rounded-full bg-amber-200/80 dark:bg-amber-700/60 animate-pulse" />
        </div>
        <div className="space-y-2">
          {[1, 2].map((item) => (
            <div key={item} className="h-12 rounded-lg bg-white/80 dark:bg-amber-900/30 animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  if (items.length === 0) return null;

  return (
    <>
      <section className="rounded-2xl border border-amber-200/60 bg-amber-50/40 dark:border-amber-800/40 dark:bg-amber-900/10">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-200">
            <Megaphone className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-[0.25em]">{badgeLabel}</span>
          </div>
          {items.length > 1 ? (
            <span className="text-xs text-amber-700 dark:text-amber-200">
              +{items.length - 1}
            </span>
          ) : null}
        </div>
        <div className="divide-y divide-amber-100/60 dark:divide-amber-800/40">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-3 px-4 py-3">
              <button
                type="button"
                onClick={() => setSelected(item)}
                className="flex-1 text-left"
              >
                <div className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-1">
                  {item.title}
                </div>
                {item.content ? (
                  <div className="text-xs text-gray-600 dark:text-gray-300 line-clamp-1">
                    {item.content}
                  </div>
                ) : null}
              </button>
              {item.linkUrl ? (
                <a
                  href={item.linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-full border border-amber-200/80 dark:border-amber-700/70 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:text-amber-200 hover:bg-amber-100/60 dark:hover:bg-amber-800/40"
                >
                  {openExternalLabel}
                  <ExternalLink className="h-3 w-3" />
                </a>
              ) : null}
            </div>
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
            onClick={(event) => event.stopPropagation()}
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
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-md bg-amber-600 text-white hover:bg-amber-700"
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
