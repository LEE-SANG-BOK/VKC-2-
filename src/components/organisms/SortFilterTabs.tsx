'use client';

import { useParams } from 'next/navigation';

export default function SortFilterTabs() {
  const params = useParams();
  const locale = (params?.lang as string) || 'ko';
  const tabs =
    locale === 'vi'
      ? ['Câu trả lời hay', 'Hữu ích', 'Mới nhất']
      : locale === 'en'
        ? ['Top answers', 'Helpful', 'Latest']
        : ['상위 답변', '유용순', '최신'];
  const tagLabel = locale === 'vi' ? 'Thẻ' : locale === 'en' ? 'Tags' : '태그';
  const categoryLabel = locale === 'vi' ? 'Danh mục' : locale === 'en' ? 'Category' : '카테고리';

  return (
    <div className="rounded-2xl border border-gray-200/70 dark:border-gray-800/70 bg-white dark:bg-gray-900 shadow-sm px-3 py-2 md:px-4 md:py-3 flex flex-col gap-2">
      <div className="flex items-center gap-2 flex-wrap">
        {tabs.map((tab, idx) => (
          <button
            key={tab}
            className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${
              idx === 0
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
        <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-1">{tagLabel}</span>
        <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-1">{categoryLabel}</span>
      </div>
    </div>
  );
}
