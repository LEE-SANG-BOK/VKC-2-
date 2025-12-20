'use client';

import { useMemo } from 'react';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import ShareButton from '@/components/molecules/actions/ShareButton';
import { useNews } from '@/repo/news/query';
import { DEFAULT_BLUR_DATA_URL } from '@/lib/constants/images';

export default function ShortFormPlaylist() {
  const params = useParams();
  const locale = (params?.lang as string) || 'vi';

  const { data: newsItems, isLoading } = useNews(locale);
  const clips = (newsItems || []).filter((item) => item.type === 'shorts').slice(0, 8);

  const labels = useMemo(() => {
    if (locale === 'en') {
      return {
        title: 'Shorts playlist',
        autoplay: 'Autoplay',
        more: 'More',
        watch: 'Watch',
        save: 'Save',
        share: 'Share',
        empty: 'No shorts yet.',
      };
    }
    if (locale === 'vi') {
      return {
        title: 'Danh sách Shorts',
        autoplay: 'Tự phát',
        more: 'Xem thêm',
        watch: 'Xem',
        save: 'Lưu',
        share: 'Chia sẻ',
        empty: 'Chưa có shorts.',
      };
    }
    return {
      title: '숏폼 플레이리스트',
      autoplay: '자동 재생',
      more: '더 보기',
      watch: '보기',
      save: '저장',
      share: '공유',
      empty: '아직 숏폼이 없습니다.',
    };
  }, [locale]);
  const { title, autoplay, more, watch, save, share, empty: emptyLabel } = labels;

  const handleViewAll = () => {
    const target = `/${locale}/media`;
    if (typeof window !== 'undefined') {
      window.location.href = target;
    }
  };

  const handleView = (url?: string | null) => {
    if (!url) return;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (isLoading) {
    return (
      <section id="shorts" className="rounded-2xl border border-gray-200/60 dark:border-gray-800/60 bg-white dark:bg-gray-900 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3 md:px-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">Shorts</p>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h2>
          </div>
        </div>
        <div className="grid gap-3 px-4 pb-4 md:px-5 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-gray-200 dark:bg-gray-800 animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  if (clips.length === 0) {
    return (
      <section id="shorts" className="rounded-2xl border border-gray-200/60 dark:border-gray-800/60 bg-white dark:bg-gray-900 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3 md:px-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">Shorts</p>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h2>
          </div>
          <button
            type="button"
            onClick={handleViewAll}
            className="hidden md:inline-flex items-center gap-2 rounded-full border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
          >
            {more}
          </button>
        </div>
        <div className="px-4 pb-4 md:px-5 text-sm text-gray-600 dark:text-gray-300">{emptyLabel}</div>
      </section>
    );
  }

  return (
    <section id="shorts" className="rounded-2xl border border-gray-200/60 dark:border-gray-800/60 bg-white dark:bg-gray-900 shadow-sm">
      <div className="flex items-center justify-between px-4 py-3 md:px-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">Shorts</p>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h2>
        </div>
        <div className="hidden md:flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <label className="inline-flex items-center gap-1">
            <input type="checkbox" defaultChecked className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
            {autoplay}
          </label>
          <span className="text-gray-400">·</span>
          <button type="button" onClick={handleViewAll} className="underline-offset-4 hover:underline">{more}</button>
        </div>
      </div>
      <div className="grid gap-3 px-4 pb-4 md:px-5 md:grid-cols-2">
        {clips.map((clip) => (
          <article
            key={clip.title}
            className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/60 p-3 flex items-center gap-3 hover:shadow-md transition"
          >
            <div className="relative w-28 h-16 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700">
              {clip.imageUrl ? (
                <Image
                  src={clip.imageUrl}
                  alt={clip.title}
                  fill
                  sizes="112px"
                  className="object-cover"
                  placeholder="blur"
                  blurDataURL={DEFAULT_BLUR_DATA_URL}
                />
              ) : null}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2">{clip.title}</h3>
              <div className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400 line-clamp-1">{clip.category}</div>
              <div className="mt-2 flex items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400">
                <button
                  type="button"
                  onClick={() => handleView(clip.linkUrl)}
                  className="rounded-full bg-blue-600 text-white px-2 py-1 font-semibold hover:bg-blue-700 transition"
                >
                  {watch}
                </button>
                <button className="hover:text-gray-700 dark:hover:text-gray-200 transition">{save}</button>
                <ShareButton url={clip.linkUrl || undefined} title={clip.title} label={share} className="px-2.5 py-1.5" />
              </div>
            </div>
          </article>
        ))}
      </div>
      <div className="px-4 pb-4 md:px-5 md:hidden">
        <div className="flex items-center justify-between rounded-xl border border-gray-200 dark:border-gray-700 px-3 py-2 text-xs text-gray-600 dark:text-gray-300">
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" defaultChecked className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
            {autoplay}
          </label>
          <button type="button" onClick={handleViewAll} className="font-semibold hover:text-gray-800 dark:hover:text-gray-100">{more}</button>
        </div>
      </div>
    </section>
  );
}
