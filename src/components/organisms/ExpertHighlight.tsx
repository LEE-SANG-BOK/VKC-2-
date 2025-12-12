'use client';

const experts = [
  {
    name: '이민 행정사',
    title: 'D-10 연장 Q&A',
    summary: '서류 누락 없이 접수하는 방법과 주의사항 정리',
    badge: 'Verified Expert',
    votes: 128,
  },
  {
    name: '취업 멘토',
    title: 'E-7 면접 준비 팁',
    summary: '직군별 필수 질문, 연봉 협상 시 주의 포인트',
    badge: 'Mentor',
    votes: 96,
  },
  {
    name: '커뮤니티 매니저',
    title: 'F-2 가점 관리 체크리스트',
    summary: 'TOPIK, 소득, 경력 가점 항목별 준비 순서',
    badge: 'Official',
    votes: 74,
  },
];

export default function ExpertHighlight() {
  return (
    <section className="rounded-2xl border border-gray-200/60 dark:border-gray-800/60 bg-white dark:bg-gray-900 shadow-sm">
      <div className="flex items-center justify-between px-4 py-3 md:px-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">Expert Answers</p>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">전문가 답변 하이라이트</h2>
        </div>
        <button className="hidden md:inline-flex items-center gap-2 rounded-full border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
          더 보기
        </button>
      </div>
      <div className="grid gap-3 px-4 pb-4 md:px-5 md:grid-cols-3">
        {experts.map((expert) => (
          <article
            key={expert.title}
            className="rounded-xl border border-gray-200/70 dark:border-gray-800/70 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 p-3 md:p-4 flex flex-col gap-2 hover:shadow-md transition"
          >
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-gray-900 dark:text-white">{expert.title}</div>
              <span className="rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 text-[11px] font-semibold px-2 py-0.5">
                {expert.badge}
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-2">{expert.summary}</p>
            <div className="flex items-center justify-between pt-1">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-300 px-2.5 py-1 text-xs font-semibold">
                추천 {expert.votes}
              </div>
              <div className="flex items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400">
                <button className="hover:text-gray-800 dark:hover:text-gray-200 transition">저장</button>
                <span className="h-1 w-1 rounded-full bg-gray-300 dark:bg-gray-700" />
                <button className="hover:text-gray-800 dark:hover:text-gray-200 transition">공유</button>
              </div>
            </div>
          </article>
        ))}
      </div>
      <div className="px-4 pb-4 md:px-5 md:hidden">
        <button className="w-full rounded-xl border border-gray-200 dark:border-gray-700 py-2.5 text-sm font-semibold text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
          전문가 답변 더 보기
        </button>
      </div>
    </section>
  );
}
