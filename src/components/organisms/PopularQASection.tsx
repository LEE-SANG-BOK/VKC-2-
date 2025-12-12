'use client';

const qas = [
  { title: 'D-10 비자 연장 시 필요한 소득 증빙은?', votes: 143, saves: 52 },
  { title: 'E-7 소프트웨어 직군 연봉 기준이 궁금합니다', votes: 118, saves: 41 },
  { title: '한국에서 방 구할 때 계약서 체크 포인트', votes: 102, saves: 35 },
];

export default function PopularQASection() {
  return (
    <section className="rounded-2xl border border-gray-200/60 dark:border-gray-800/60 bg-white dark:bg-gray-900 shadow-sm">
      <div className="flex items-center justify-between px-4 py-3 md:px-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">Top Q&A</p>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">오늘의 인기 질문/추천 답변</h2>
        </div>
        <button className="hidden md:inline-flex items-center gap-2 rounded-full border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
          모두 보기
        </button>
      </div>
      <div className="flex flex-col gap-3 px-4 pb-4 md:px-5">
        {qas.map((qa) => (
          <article
            key={qa.title}
            className="rounded-xl border border-gray-200/70 dark:border-gray-800/70 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 p-3 md:p-4 flex flex-col gap-2 hover:shadow-md transition"
          >
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 text-[11px] font-semibold px-2 py-0.5">
                추천 {qa.votes}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-[11px] font-semibold px-2 py-0.5">
                저장 {qa.saves}
              </span>
            </div>
            <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white leading-snug">{qa.title}</h3>
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400">
                <button className="rounded-full bg-blue-600 text-white px-3 py-1.5 text-xs font-semibold hover:bg-blue-700 transition">답변 보기</button>
                <button className="hover:text-gray-800 dark:hover:text-gray-200 transition">저장</button>
                <button className="hover:text-gray-800 dark:hover:text-gray-200 transition">공유</button>
              </div>
              <button className="text-xs font-semibold text-amber-600 dark:text-amber-300 hover:underline underline-offset-4">
                공식/전문가 답변 고정
              </button>
            </div>
          </article>
        ))}
      </div>
      <div className="px-4 pb-4 md:px-5 md:hidden">
        <button className="w-full rounded-xl border border-gray-200 dark:border-gray-700 py-2.5 text-sm font-semibold text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
          인기 Q&A 더 보기
        </button>
      </div>
    </section>
  );
}
