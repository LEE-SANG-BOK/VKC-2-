import type { Metadata } from 'next';

type PageProps = {
  params: Promise<{ lang: string }>;
};

export const metadata: Metadata = {
  title: 'Visa Roadmap · Viet K-Connect',
  description: 'D2 → D10 → E7 → F2 단계별 체크리스트와 전문가 가이드',
};

const steps = [
  { title: 'D-2 유학', desc: '재학/연수 중 준비 사항 체크', badge: '1/4' },
  { title: 'D-10 구직', desc: '졸업 후 구직·인턴 보고 흐름', badge: '2/4' },
  { title: 'E-7 취업', desc: '직군/연봉/서류 요구사항 점검', badge: '3/4' },
  { title: 'F-2 점수제', desc: '가점 요소·타임라인 관리', badge: '4/4' },
];

const expertCards = [
  { title: 'D-10 연장 Q&A', label: 'Verified Expert', desc: '서류 누락 없이 접수하는 방법과 주의사항 정리', likes: 128 },
  { title: 'E-7 면접 준비 팁', label: 'Mentor', desc: '직군별 필수 질문, 연봉 협상 시 주의 포인트', likes: 96 },
  { title: 'F-2 가점 관리 체크리스트', label: 'Official', desc: 'TOPIK, 소득, 경력 가점 항목별 준비 순서', likes: 74 },
];

const topAnswers = [
  { title: 'D-10 비자 연장 준비 서류', label: 'Official', desc: '소득 증빙, 재직/학업 증명, 체류 기간별 유의사항을 정리했습니다.', helpful: 184, saved: 62 },
  { title: 'E-7 직군별 요구 연봉 표', label: 'Expert', desc: '소프트웨어/기획/디자인 직군별 최소 연봉과 가점 요소를 한눈에.', helpful: 156, saved: 48 },
  { title: '방 구하기 계약서 체크리스트', label: 'Verified', desc: '특약, 관리비, 보증금 반환 시나리오를 체크박스로 점검하세요.', helpful: 129, saved: 41 },
];

const similarQuestions = [
  'D-10 비자 연장 시 소득 기준이 궁금합니다',
  'E-7 소프트웨어 직군 연봉 최소 기준이 있나요?',
  '한국에서 방 구할 때 계약서 필수 항목이 뭔가요?',
];

const cardNews = [
  { title: 'D-10 비자 연장 체크리스트 5컷', locale: 'VI / KO', desc: '신청 조건, 필요 서류, 주의사항을 카드뉴스로 정리했습니다.' },
  { title: 'E-7 직군별 요구 연봉 한눈에', locale: 'VI / EN', desc: '직군·연봉·가점 요소를 슬라이드로 빠르게 확인하세요.' },
  { title: '한국 생활 꿀팁 TOP3', locale: 'VI', desc: '은행, 통신, 주거 필수 팁을 3컷으로 요약.' },
];

const shorts = [
  { title: '60초로 보는 D-10 신청', tag: '비자팁', duration: '0:52' },
  { title: 'E-7 면접 꿀팁 3가지', tag: '면접', duration: '0:41' },
  { title: '한국 생활 꿀팁 TOP3', tag: '라이프', duration: '0:36' },
  { title: 'F-2 가점 요소 한눈에', tag: '가점', duration: '0:48' },
];

export default async function VisaRoadmapPage({ params }: PageProps) {
  const { lang } = await params;
  const base = `/${lang}`;

  return (
    <div className="space-y-8 pb-16">
      <section className="rounded-2xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 p-6 border border-blue-100 dark:border-blue-900">
        <p className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-2">Mobile First</p>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">앱처럼 사용하기 & 알림 받기</h1>
        <p className="text-gray-700 dark:text-gray-200 mb-4">홈 화면에 추가하고 알림을 허용하면 새 답변과 알림을 바로 확인할 수 있습니다.</p>
        <div className="flex flex-wrap gap-3">
          <a className="rounded-lg bg-blue-600 text-white px-4 py-2 text-sm font-semibold" href={`${base}`}>홈 화면에 추가</a>
          <a className="rounded-lg border border-blue-200 dark:border-blue-700 px-4 py-2 text-sm font-semibold text-blue-700 dark:text-blue-200" href={`${base}/notifications`}>알림 허용</a>
        </div>
      </section>

      <section className="grid gap-4 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Visa Roadmap</p>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">D2 → D10 → E7 → F2 단계별 체크리스트</h2>
            <p className="text-gray-700 dark:text-gray-200 mt-2">모국어 가이드로 비자/취업 준비를 한눈에 관리하세요.</p>
          </div>
          <a href={`${base}/posts/new?type=question`} className="text-sm font-semibold text-blue-600">시작하기</a>
        </div>
        <div className="grid gap-3 md:grid-cols-4">
          {steps.map((step) => (
            <div key={step.title} className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
              <div className="text-xs font-semibold text-blue-600 dark:text-blue-300 mb-2">{step.badge}</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{step.title}</h3>
              <p className="text-sm text-gray-700 dark:text-gray-200 mt-1">{step.desc}</p>
              <a href={`${base}/posts/new?type=question`} className="inline-flex mt-3 text-sm font-semibold text-blue-600">단계별 서류 체크</a>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 dark:border-gray-700 p-6 space-y-3">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Personalize</h2>
        <p className="text-gray-700 dark:text-gray-200">관심 토픽과 비자 단계를 선택하세요. 선택한 주제에 맞춰 맞춤 피드를 준비합니다.</p>
        <div className="flex gap-3 flex-wrap">
          <a className="rounded-lg bg-blue-600 text-white px-4 py-2 text-sm font-semibold" href={`${base}/onboarding`}>관심 토픽 관리</a>
          <a className="rounded-lg border border-blue-200 dark:border-blue-700 px-4 py-2 text-sm font-semibold text-blue-700 dark:text-blue-200" href={`${base}/onboarding`}>비자 단계 설정</a>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Expert Answers</h2>
          <a href={`${base}/posts?sort=popular`} className="text-sm font-semibold text-blue-600">더 보기</a>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {expertCards.map((card) => (
            <div key={card.title} className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800 space-y-2">
              <div className="text-xs font-semibold text-blue-600 dark:text-blue-300">{card.label}</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{card.title}</h3>
              <p className="text-sm text-gray-700 dark:text-gray-200">{card.desc}</p>
              <div className="text-xs text-gray-500 dark:text-gray-400">추천 {card.likes}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Top Answers</h2>
          <a href={`${base}/posts?sort=popular`} className="text-sm font-semibold text-blue-600">더 보기</a>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {topAnswers.map((item) => (
            <div key={item.title} className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800 space-y-2">
              <div className="text-xs font-semibold text-blue-600 dark:text-blue-300">{item.label}</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{item.title}</h3>
              <p className="text-sm text-gray-700 dark:text-gray-200">{item.desc}</p>
              <div className="text-xs text-gray-500 dark:text-gray-400">도움됨 {item.helpful} · 저장 {item.saved}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 dark:border-gray-700 p-6 space-y-3">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">이미 이런 질문이 있어요</h2>
        <p className="text-gray-700 dark:text-gray-200">질문을 작성하기 전에 비슷한 답변을 확인해보세요.</p>
        <div className="space-y-2">
          {similarQuestions.map((q) => (
            <div key={q} className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2">
              <span className="text-sm text-gray-900 dark:text-white">{q}</span>
              <a href={`${base}/search?query=${encodeURIComponent(q)}`} className="text-xs font-semibold text-blue-600">보기</a>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Card News</h2>
          <a href={`${base}/news`} className="text-sm font-semibold text-blue-600">모두 보기</a>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {cardNews.map((card) => (
            <div key={card.title} className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800 space-y-2">
              <div className="text-xs font-semibold text-blue-600 dark:text-blue-300">{card.locale}</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{card.title}</h3>
              <p className="text-sm text-gray-700 dark:text-gray-200">{card.desc}</p>
              <div className="flex gap-3 text-xs text-blue-600">
                <span>슬라이드 보기</span>
                <span>저장</span>
                <span>공유</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Shorts</h2>
          <a href={`${base}/news`} className="text-sm font-semibold text-blue-600">더 보기</a>
        </div>
        <div className="grid gap-3 md:grid-cols-4">
          {shorts.map((s) => (
            <div key={s.title} className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800 space-y-2">
              <div className="text-xs font-semibold text-blue-600 dark:text-blue-300">{s.duration} · {s.tag}</div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{s.title}</h3>
              <div className="flex gap-3 text-xs text-blue-600">
                <span>보기</span>
                <span>저장</span>
                <span>공유</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
