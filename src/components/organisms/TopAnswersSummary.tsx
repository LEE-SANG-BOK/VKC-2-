'use client';

import { useRouter } from 'nextjs-toploader/app';
import { useParams } from 'next/navigation';

const localizedTopAnswers: Record<string, { title: string; excerpt: string; badge: string; helpful: number; saves: number; }[]> = {
  ko: [
    { title: 'D-10 비자 연장 준비 서류', excerpt: '소득 증빙, 재직/학업 증명, 체류 기간별 유의사항을 정리했습니다.', badge: 'Official', helpful: 184, saves: 62 },
    { title: 'E-7 직군별 요구 연봉 표', excerpt: '소프트웨어/기획/디자인 직군별 최소 연봉과 가점 요소를 한눈에.', badge: 'Expert', helpful: 156, saves: 48 },
    { title: '방 구하기 계약서 체크리스트', excerpt: '특약, 관리비, 보증금 반환 시나리오를 체크박스로 점검하세요.', badge: 'Verified', helpful: 129, saves: 41 },
  ],
  vi: [
    { title: 'Hồ sơ gia hạn visa D-10', excerpt: 'Tổng hợp giấy tờ chứng minh thu nhập, học tập/làm việc và lưu ý theo thời gian lưu trú.', badge: 'Official', helpful: 184, saves: 62 },
    { title: 'Mức lương tối thiểu cho từng nhóm E-7', excerpt: 'Bảng lương tối thiểu và điểm cộng cho SW/Kế hoạch/Thiết kế.', badge: 'Expert', helpful: 156, saves: 48 },
    { title: 'Checklist hợp đồng thuê nhà', excerpt: 'Kiểm tra điều khoản đặc biệt, phí quản lý, hoàn cọc bằng checklist.', badge: 'Verified', helpful: 129, saves: 41 },
  ],
  en: [
    { title: 'D-10 visa renewal documents', excerpt: 'Income proof, enrollment/employment proof, and stay-by-period cautions.', badge: 'Official', helpful: 184, saves: 62 },
    { title: 'E-7 minimum salary by role', excerpt: 'Minimum salary and bonus points for SW/PM/Design roles.', badge: 'Expert', helpful: 156, saves: 48 },
    { title: 'Housing contract checklist', excerpt: 'Checklist for special terms, maintenance fees, and deposit refund scenarios.', badge: 'Verified', helpful: 129, saves: 41 },
  ],
};

export default function TopAnswersSummary() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.lang as string) || 'ko';
  const topAnswers = localizedTopAnswers[locale] || localizedTopAnswers.ko;

  const getBadgeTone = (badge: string) => {
    const normalized = badge.toLowerCase();
    if (normalized === 'official') {
      return 'bg-green-50 dark:bg-emerald-900/30 text-green-700 dark:text-emerald-200 border-green-200 dark:border-emerald-700';
    }
    if (normalized === 'verified') {
      return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700';
    }
    return 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-200 border-blue-200 dark:border-blue-700';
  };

  const handleMore = () => {
    router.push('search?tab=answers');
  };

  const handleView = () => {
    router.push('search?tab=answers');
  };

  return (
    <section className="rounded-2xl border border-gray-200/60 dark:border-gray-800/60 bg-white dark:bg-gray-900 shadow-sm">
      <div className="flex items-center justify-between px-4 py-3 md:px-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
            {locale === 'vi' ? 'CÂU TRẢ LỜI HAY' : locale === 'en' ? 'TOP ANSWERS' : 'TOP ANSWERS'}
          </p>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            {locale === 'vi' ? 'Tổng hợp câu trả lời nổi bật' : locale === 'en' ? 'Featured top answers' : '상위 답변 모아보기'}
          </h2>
        </div>
        <button
          type="button"
          onClick={handleMore}
          className="hidden md:inline-flex items-center gap-2 rounded-full border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
        >
          {locale === 'vi' ? 'Xem thêm' : locale === 'en' ? 'See more' : '더 보기'}
        </button>
      </div>
      <div className="flex flex-col gap-3 px-4 pb-4 md:px-5">
        {topAnswers.map((item) => (
          <article
            key={item.title}
            className="rounded-xl border border-gray-200/70 dark:border-gray-800/70 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 p-3 md:p-4 flex flex-col gap-2 hover:shadow-md transition"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white leading-snug">{item.title}</h3>
              <span className={`inline-flex items-center gap-1 rounded-full text-[11px] font-semibold px-2 py-0.5 border ${getBadgeTone(item.badge)}`}>
                {item.badge}
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-2">{item.excerpt}</p>
            <div className="flex items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-300 px-2 py-1">
                {locale === 'vi' ? 'Hữu ích' : locale === 'en' ? 'Helpful' : '도움됨'} {item.helpful}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 px-2 py-1">
                {locale === 'vi' ? 'Lưu' : locale === 'en' ? 'Saved' : '저장'} {item.saves}
              </span>
              <button
                type="button"
                onClick={handleView}
                className="inline-flex items-center gap-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 px-2.5 py-1 font-semibold hover:bg-blue-100 dark:hover:bg-blue-900/50 transition"
              >
                {locale === 'vi' ? 'Xem câu trả lời' : locale === 'en' ? 'View answer' : '답변 보기'}
              </button>
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
          {locale === 'vi' ? 'Xem thêm câu trả lời hay' : locale === 'en' ? 'See more top answers' : '상위 답변 더 보기'}
        </button>
      </div>
    </section>
  );
}
