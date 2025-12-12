'use client';

interface PinnedAnswerHighlightProps {
  title?: string;
  author?: string;
  badge?: 'Official' | 'Expert' | 'Verified' | string;
  excerpt?: string;
  answerId?: string;
}

export default function PinnedAnswerHighlight({ title, author, badge, excerpt, answerId }: PinnedAnswerHighlightProps) {
  if (!title && !excerpt) return null;

  const normalizedBadge = (badge || '').toLowerCase();
  const badgeStyle =
    normalizedBadge === 'official'
      ? {
          bg: 'bg-emerald-50 dark:bg-emerald-900/30',
          text: 'text-emerald-700 dark:text-emerald-100',
          border: 'border-emerald-200 dark:border-emerald-800',
          container: 'border-emerald-100 dark:border-emerald-800/60',
        }
      : normalizedBadge === 'verified'
        ? {
            bg: 'bg-gray-100 dark:bg-gray-800',
            text: 'text-gray-800 dark:text-gray-200',
            border: 'border-gray-200 dark:border-gray-700',
            container: 'border-gray-100 dark:border-gray-700/60',
          }
        : {
            bg: 'bg-blue-50 dark:bg-blue-900/30',
            text: 'text-blue-700 dark:text-blue-200',
            border: 'border-blue-200 dark:border-blue-700',
            container: 'border-blue-100 dark:border-blue-800/60',
          };

  const handleJump = () => {
    if (typeof window === 'undefined' || !answerId) return;
    const target = document.getElementById(`answer-${answerId}`);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.location.hash = `answer-${answerId}`;
    }
  };

  return (
    <section className={`rounded-xl border ${badgeStyle.container} bg-white dark:bg-gray-900 shadow-sm`}>
      <div className="px-4 py-4 md:px-5 md:py-4 space-y-2.5">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-600 text-white text-[11px] font-semibold px-2.5 py-1">
            공식/전문가 답변
          </span>
          {badge && (
            <span className={`inline-flex items-center gap-1 rounded-full ${badgeStyle.bg} ${badgeStyle.text} text-[11px] font-semibold px-2 py-0.5 border ${badgeStyle.border}`}>
              {badge}
            </span>
          )}
        </div>
        {title && (
          <h3 className="text-base md:text-lg font-bold text-gray-900 dark:text-gray-50 leading-snug">
            {title}
          </h3>
        )}
        {author && (
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">by {author}</p>
        )}
        {excerpt && (
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed line-clamp-3">
            {excerpt}
          </p>
        )}
        {answerId && (
          <div>
            <button
              type="button"
              onClick={handleJump}
              className="inline-flex items-center gap-2 rounded-full bg-blue-600 text-white text-xs font-semibold px-3 py-2 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1 focus:ring-offset-white dark:focus:ring-offset-gray-900 transition"
            >
              답변 바로 보기
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
