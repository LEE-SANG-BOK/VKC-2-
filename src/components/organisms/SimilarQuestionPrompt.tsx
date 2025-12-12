'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';

interface SimilarQuestionPromptProps {
  query: string;
  translations?: Record<string, string>;
}

const tagSuggestionsByLocale: Record<string, string[]> = {
  ko: ['비자', '취업', '주거'],
  vi: ['Visa', 'Việc làm', 'Nhà ở'],
  en: ['Visa', 'Jobs', 'Housing'],
};

export default function SimilarQuestionPrompt({ query, translations }: SimilarQuestionPromptProps) {
  const t = translations || {};
  const params = useParams();
  const locale = (params?.lang as string) || 'ko';
  const tagSuggestions = tagSuggestionsByLocale[locale] || tagSuggestionsByLocale.ko;
  const visible = (query || '').trim().length >= 3;
  const [results, setResults] = useState<Array<{ id: string; title: string }>>([]);
  const [loading, setLoading] = useState(false);

  const debouncedQuery = useMemo(() => query.trim(), [query]);

  useEffect(() => {
    let active = true;
    if (!visible) {
      setResults([]);
      return;
    }

    const controller = new AbortController();
    const fetchSimilar = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search/posts?q=${encodeURIComponent(debouncedQuery)}&limit=5&type=question`, {
          signal: controller.signal,
        });
        const data = await res.json().catch(() => null);
        if (!res.ok || !data?.data || !Array.isArray(data.data)) {
          if (active) setResults([]);
          return;
        }
        if (active) {
          setResults(
            data.data.map((item: any) => ({
              id: item.id,
              title: item.title,
            }))
          );
        }
      } catch (error) {
        if (active) setResults([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchSimilar();

    return () => {
      active = false;
      controller.abort();
    };
  }, [debouncedQuery, visible]);

  const list = results.length > 0 ? results : [];

  if (!visible) return null;

  const fallbackTitle = locale === 'vi' ? 'Đã có câu hỏi tương tự' : locale === 'en' ? 'Similar questions found' : '이미 이런 질문이 있어요';
  const fallbackSeeAll = locale === 'vi' ? 'Xem tất cả' : locale === 'en' ? 'See all' : '모두 보기';
  const fallbackDesc = locale === 'vi' ? 'Kiểm tra câu trả lời tương tự trước khi đăng.' : locale === 'en' ? 'Check similar answers before posting.' : '질문을 작성하기 전에 비슷한 답변을 확인해보세요.';
  const fallbackLoading = locale === 'vi' ? 'Đang tải...' : locale === 'en' ? 'Loading...' : '불러오는 중...';
  const fallbackNoResults = locale === 'vi' ? 'Không có câu hỏi tương tự.' : locale === 'en' ? 'No similar questions.' : '유사한 질문이 없습니다.';
  const fallbackTags = locale === 'vi' ? 'Thẻ gợi ý' : locale === 'en' ? 'Suggested tags' : '추천 태그';

  return (
    <section className="rounded-2xl border border-gray-200/70 dark:border-gray-800/70 bg-white dark:bg-gray-900 shadow-sm">
      <div className="px-4 py-4 md:px-5 md:py-5 space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-base md:text-lg font-bold text-gray-900 dark:text-white">{t.similarTitle || fallbackTitle}</h3>
          <a
            href={`/search?q=${encodeURIComponent(debouncedQuery)}&type=question`}
            className="text-xs font-semibold text-blue-600 hover:underline underline-offset-4"
          >
            {t.similarSeeAll || fallbackSeeAll}
          </a>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-300">{t.similarDesc || fallbackDesc}</p>
        <div className="flex flex-col gap-2">
          {loading ? (
            <div className="text-sm text-gray-500 dark:text-gray-400">{t.loading || fallbackLoading}</div>
          ) : list.length > 0 ? (
            list.map((q) => (
              <a
                key={q.id}
                href={`/posts/${q.id}`}
                className="text-left rounded-xl border border-gray-200 dark:border-gray-800 px-3 py-2 text-sm text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              >
                {q.title}
              </a>
            ))
          ) : (
            <div className="text-sm text-gray-500 dark:text-gray-400">{t.noResults || fallbackNoResults}</div>
          )}
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-[0.15em]">{t.similarTagsLabel || fallbackTags}</span>
          <div className="flex flex-wrap gap-1">
            {tagSuggestions.map((tag) => (
              <span key={tag} className="rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-[11px] font-semibold px-2 py-1">
                #{tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
