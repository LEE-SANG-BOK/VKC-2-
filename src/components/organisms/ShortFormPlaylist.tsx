'use client';

import { useRouter } from 'nextjs-toploader/app';
import ShareButton from '../molecules/ShareButton';
import { useParams } from 'next/navigation';

const CLIPS = {
  ko: [
    { title: '60초로 보는 D-10 신청', length: '0:52', tag: '비자팁' },
    { title: 'E-7 면접 꿀팁 3가지', length: '0:41', tag: '면접' },
    { title: '한국 생활 꿀팁 TOP3', length: '0:36', tag: '라이프' },
    { title: 'F-2 가점 요소 한눈에', length: '0:48', tag: '가점' },
  ],
  vi: [
    { title: 'D-10 trong 60 giây', length: '0:52', tag: 'Mẹo visa' },
    { title: '3 mẹo phỏng vấn E-7', length: '0:41', tag: 'Phỏng vấn' },
    { title: '3 mẹo sống ở Hàn', length: '0:36', tag: 'Đời sống' },
    { title: 'Điểm cộng F-2 nhanh', length: '0:48', tag: 'Điểm cộng' },
  ],
  en: [
    { title: 'D-10 in 60 seconds', length: '0:52', tag: 'Visa tips' },
    { title: '3 E-7 interview tips', length: '0:41', tag: 'Interview' },
    { title: 'Top 3 Korea life hacks', length: '0:36', tag: 'Life' },
    { title: 'F-2 bonus points fast', length: '0:48', tag: 'Points' },
  ],
};

export default function ShortFormPlaylist() {
  const router = useRouter();
  const params = useParams();
  const locale = ((params?.lang as string) || 'ko') as keyof typeof CLIPS;
  const clips = CLIPS[locale] || CLIPS.ko;
  const title = locale === 'vi' ? 'Danh sách Shorts' : locale === 'en' ? 'Shorts playlist' : '숏폼 플레이리스트';
  const autoplay = locale === 'vi' ? 'Tự phát' : locale === 'en' ? 'Autoplay' : '자동 재생';
  const more = locale === 'vi' ? 'Xem thêm' : locale === 'en' ? 'More' : '더 보기';
  const watch = locale === 'vi' ? 'Xem' : locale === 'en' ? 'Watch' : '보기';
  const save = locale === 'vi' ? 'Lưu' : locale === 'en' ? 'Save' : '저장';
  const share = locale === 'vi' ? 'Chia sẻ' : locale === 'en' ? 'Share' : '공유';

  const handleViewAll = () => {
    router.push('search?tab=shorts');
  };

  const handleView = () => {
    router.push('search?tab=shorts');
  };

  return (
    <section className="rounded-2xl border border-gray-200/60 dark:border-gray-800/60 bg-white dark:bg-gray-900 shadow-sm">
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
            <div className="relative w-28 h-16 rounded-lg overflow-hidden bg-gradient-to-br from-blue-500 to-emerald-500 text-white flex items-center justify-center text-sm font-semibold">
              {clip.length}
              <span className="absolute bottom-1 right-1 text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full">{clip.tag}</span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2">{clip.title}</h3>
              <div className="mt-2 flex items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400">
                <button
                  type="button"
                  onClick={handleView}
                  className="rounded-full bg-blue-600 text-white px-2 py-1 font-semibold hover:bg-blue-700 transition"
                >
                  {watch}
                </button>
                <button className="hover:text-gray-700 dark:hover:text-gray-200 transition">{save}</button>
                <ShareButton label={share} className="px-2.5 py-1.5" />
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
