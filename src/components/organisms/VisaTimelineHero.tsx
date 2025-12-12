'use client';

import { useParams } from 'next/navigation';

const stepsByLocale: Record<string, { key: string; title: string; desc: string }[]> = {
  ko: [
    { key: 'd2', title: 'D-2 유학', desc: '재학/연수 중 준비 사항 체크' },
    { key: 'd10', title: 'D-10 구직', desc: '졸업 후 구직·인턴 보고 흐름' },
    { key: 'e7', title: 'E-7 취업', desc: '직군/연봉/서류 요구사항 점검' },
    { key: 'f2', title: 'F-2 점수제', desc: '가점 요소·타임라인 관리' },
  ],
  vi: [
    { key: 'd2', title: 'D-2 Du học', desc: 'Kiểm tra việc cần làm khi đang học/trao đổi' },
    { key: 'd10', title: 'D-10 Tìm việc', desc: 'Luồng báo cáo tìm việc/thực tập sau tốt nghiệp' },
    { key: 'e7', title: 'E-7 Đi làm', desc: 'Kiểm tra yêu cầu vị trí/lương/hồ sơ' },
    { key: 'f2', title: 'F-2 Tích điểm', desc: 'Quản lý điểm cộng và timeline' },
  ],
  en: [
    { key: 'd2', title: 'D-2 Study', desc: 'Checklist while enrolled/exchange' },
    { key: 'd10', title: 'D-10 Job seeking', desc: 'Post-grad job/intern report flow' },
    { key: 'e7', title: 'E-7 Work', desc: 'Review role/salary/document requirements' },
    { key: 'f2', title: 'F-2 Points', desc: 'Manage bonus points and timeline' },
  ],
};

const quickFiltersByLocale: Record<string, string[]> = {
  ko: ['비자 단계', 'E-7 직군', '지역', '언어'],
  vi: ['Giai đoạn visa', 'Ngành E-7', 'Khu vực', 'Ngôn ngữ'],
  en: ['Visa step', 'E-7 role', 'Region', 'Language'],
};

export default function VisaTimelineHero() {
  const params = useParams();
  const locale = (params?.lang as string) || 'ko';
  const steps = stepsByLocale[locale] || stepsByLocale.ko;
  const quickFilters = quickFiltersByLocale[locale] || quickFiltersByLocale.ko;

  const headline =
    locale === 'vi'
      ? 'D2 → D10 → E7 → F2 checklist theo từng giai đoạn'
      : locale === 'en'
        ? 'D2 → D10 → E7 → F2 step-by-step checklist'
        : 'D2 → D10 → E7 → F2 단계별 체크리스트';
  const subhead =
    locale === 'vi'
      ? 'Quản lý chuẩn bị visa/việc làm bằng ngôn ngữ mẹ đẻ. Xem nhanh hồ sơ và lưu ý cho từng giai đoạn.'
      : locale === 'en'
        ? 'Manage visa/job prep in your native language. Quickly see required docs and cautions by step.'
        : '모국어 가이드로 비자/취업 준비를 한눈에 관리하세요. 각 단계별 필수 서류와 주의사항을 빠르게 확인할 수 있습니다.';
  const startLabel = locale === 'vi' ? 'Bắt đầu' : locale === 'en' ? 'Get started' : '시작하기';
  const mobileOpt = locale === 'vi' ? 'Tối ưu di động' : locale === 'en' ? 'Mobile optimized' : '모바일 최적화';
  const askLabel = locale === 'vi' ? 'Đặt câu hỏi' : locale === 'en' ? 'Ask a question' : '질문 올리기';
  const docCheckLabel =
    locale === 'vi' ? 'Kiểm tra hồ sơ theo bước' : locale === 'en' ? 'Stepwise document check' : '단계별 서류 체크';
  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-slate-900 text-white shadow-xl">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.12),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(255,255,255,0.08),transparent_30%)]" />
      <div className="relative px-4 md:px-8 py-6 md:py-8 space-y-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.2em] text-white/70">Visa Roadmap</p>
            <h1 className="text-2xl md:text-3xl font-bold leading-tight">D2 → D10 → E7 → F2 단계별 체크리스트</h1>
            <p className="text-sm md:text-base text-white/80">
              모국어 가이드로 비자/취업 준비를 한눈에 관리하세요. 각 단계별 필수 서류와 주의사항을 빠르게 확인할 수 있습니다.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold backdrop-blur hover:bg-white/25 transition">
              시작하기
              <span className="text-xs font-medium text-white/80">모바일 최적화</span>
            </button>
            <button className="inline-flex items-center gap-2 rounded-full border border-white/25 px-4 py-2 text-sm font-semibold hover:bg-white/10 transition">
              질문 올리기
            </button>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          {steps.map((step, index) => (
            <div
              key={step.key}
              className="rounded-xl bg-white/10 border border-white/15 px-4 py-3 flex flex-col gap-2 backdrop-blur-lg"
            >
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-white/80">{step.title}</div>
                <div className="text-[11px] rounded-full bg-white/15 px-2 py-0.5">
                  {index + 1}/4
                </div>
              </div>
              <p className="text-sm leading-relaxed text-white">{step.desc}</p>
              <div className="flex items-center gap-2 text-[11px] text-white/80">
                <span className="h-2 w-2 rounded-full bg-emerald-300" />
                단계별 서류 체크
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {quickFilters.map((filter) => (
            <button
              key={filter}
              className="rounded-full border border-white/25 px-3 py-1.5 text-xs font-medium text-white/90 hover:bg-white/10 transition"
            >
              {filter}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
