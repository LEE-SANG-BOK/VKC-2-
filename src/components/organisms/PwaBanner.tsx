'use client';

import { useParams } from 'next/navigation';

export default function PwaBanner() {
  const params = useParams();
  const locale = (params?.lang as string) || 'ko';
  const title =
    locale === 'vi'
      ? 'Dùng như app & nhận thông báo'
      : locale === 'en'
        ? 'Use like an app & get notifications'
        : '앱처럼 사용하기 & 알림 받기';
  const desc =
    locale === 'vi'
      ? 'Thêm vào màn hình chính và bật thông báo để xem trả lời mới ngay.'
      : locale === 'en'
        ? 'Add to home screen and enable notifications to see new answers instantly.'
        : '홈 화면에 추가하고 알림을 허용하면 새 답변과 알림을 바로 확인할 수 있습니다.';
  const addHome =
    locale === 'vi' ? 'Thêm vào màn hình chính' : locale === 'en' ? 'Add to home screen' : '홈 화면에 추가';
  const enableNotif =
    locale === 'vi' ? 'Bật thông báo' : locale === 'en' ? 'Enable notifications' : '알림 허용';

  return (
    <section className="rounded-2xl border border-blue-200/60 bg-gradient-to-r from-blue-50 to-emerald-50 dark:from-blue-900/40 dark:to-emerald-900/30 text-blue-900 dark:text-blue-50 shadow-sm">
      <div className="px-4 py-4 md:px-5 md:py-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700/80 dark:text-blue-200">PWA Ready</p>
          <h3 className="text-lg font-bold">{title}</h3>
          <p className="text-sm text-blue-900/80 dark:text-blue-100/90">{desc}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="rounded-full bg-blue-600 text-white text-sm font-semibold px-4 py-2 hover:bg-blue-700 transition">
            {addHome}
          </button>
          <button className="rounded-full border border-blue-300/70 text-sm font-semibold text-blue-800 dark:text-blue-100 px-4 py-2 hover:bg-white/50 dark:hover:bg-white/10 transition">
            {enableNotif}
          </button>
        </div>
      </div>
    </section>
  );
}
