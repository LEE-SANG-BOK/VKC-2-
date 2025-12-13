import type { Metadata } from 'next';

type PageProps = {
  params: Promise<{ lang: string }>;
};

export const metadata: Metadata = {
  title: 'Visa Roadmap · Viet K-Connect',
  description: 'D2 → D10 → E7 → F2 단계별 체크리스트와 질문 바로가기',
};

const steps = [
  { title: 'D-2 유학', desc: '재학/연수 중 준비 사항 체크', badge: '1/4' },
  { title: 'D-10 구직', desc: '졸업 후 구직·인턴 보고 흐름', badge: '2/4' },
  { title: 'E-7 취업', desc: '직군/연봉/서류 요구사항 점검', badge: '3/4' },
  { title: 'F-2 점수제', desc: '가점 요소·타임라인 관리', badge: '4/4' },
];

export default async function VisaRoadmapPage({ params }: PageProps) {
  const { lang } = await params;
  const base = `/${lang}`;

  return (
    <div className="space-y-8 pb-16">
      <section className="grid gap-4 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Visa Roadmap</p>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">D2 → D10 → E7 → F2 단계별 체크리스트</h2>
            <p className="text-gray-700 dark:text-gray-200 mt-2">모국어 가이드로 비자/취업 준비를 한눈에 관리하세요.</p>
          </div>
          <a href={`${base}/posts/new?type=question`} className="text-sm font-semibold text-blue-600">질문 올리기</a>
        </div>
        <div className="grid gap-3 md:grid-cols-4">
          {steps.map((step) => (
            <div key={step.title} className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
              <div className="text-xs font-semibold text-blue-600 dark:text-blue-300 mb-2">{step.badge}</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{step.title}</h3>
              <p className="text-sm text-gray-700 dark:text-gray-200 mt-1">{step.desc}</p>
              <a href={`${base}/search?q=${encodeURIComponent(step.title)}`} className="inline-flex mt-3 text-sm font-semibold text-blue-600">관련 질문 보기</a>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 dark:border-gray-700 p-6 space-y-3">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">바로가기</h2>
        <div className="flex flex-wrap gap-3">
          <a className="rounded-lg bg-blue-600 text-white px-4 py-2 text-sm font-semibold" href={`${base}?c=visa`}>비자 Q&A 보기</a>
          <a className="rounded-lg border border-blue-200 dark:border-blue-700 px-4 py-2 text-sm font-semibold text-blue-700 dark:text-blue-200" href={`${base}/posts/new?type=question`}>질문 등록</a>
          <a className="rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm font-semibold text-gray-800 dark:text-gray-200" href={`${base}/search?q=E-7`}>E-7 검색</a>
        </div>
      </section>
    </div>
  );
}
