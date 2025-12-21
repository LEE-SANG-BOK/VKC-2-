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
  const [fallbackMeta, setFallbackMeta] = useState<{ isFallback?: boolean; reason?: string; tokens?: string[] } | null>(null);

  const debouncedQuery = useMemo(() => query.trim(), [query]);
  const fallbackTokens = useMemo(() => {
    if (!fallbackMeta?.tokens) return [];
    return fallbackMeta.tokens.map((token) => token?.trim()).filter((token): token is string => Boolean(token));
  }, [fallbackMeta?.tokens]);

  useEffect(() => {
    let active = true;
    if (!visible) {
      setResults([]);
      setFallbackMeta(null);
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
          if (active) {
            setResults([]);
            setFallbackMeta(data?.meta ?? null);
          }
          return;
        }
        if (active) {
          setResults(
            data.data.map((item: any) => ({
              id: item.id,
              title: item.title,
            }))
          );
          setFallbackMeta(data.meta ?? null);
        }
      } catch (error) {
        if (active) {
          setResults([]);
          setFallbackMeta(null);
        }
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

  const fallbackNoticeText = t.similarFallbackNotice || '';
  const fallbackReasonText = fallbackMeta?.reason === 'popular' ? (t.similarFallbackReasonPopular || '') : '';
  const noResultsLabel = t.similarNoResults || '';

  return (
    <section className="rounded-2xl border border-gray-200/70 dark:border-gray-800/70 bg-white dark:bg-gray-900 shadow-sm">
      <div className="px-4 py-4 md:px-5 md:py-5 space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-base md:text-lg font-bold text-gray-900 dark:text-white">{t.similarTitle || ''}</h3>
          <a
            href={`/${locale}/search?q=${encodeURIComponent(debouncedQuery)}&type=question`}
            className="text-xs font-semibold text-blue-600 hover:underline underline-offset-4"
          >
            {t.similarSeeAll || ''}
          </a>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-300">{t.similarDesc || ''}</p>
        {fallbackMeta?.isFallback && (
          <div className="rounded-lg bg-amber-50/70 dark:bg-amber-900/30 px-3 py-2 text-xs text-amber-900 dark:text-amber-100">
            <p className="font-semibold">{fallbackNoticeText}</p>
            {fallbackReasonText ? <p className="text-[11px] text-amber-900/80">{fallbackReasonText}</p> : null}
          </div>
        )}
        {fallbackTokens.length > 0 && (
          <div className="flex flex-wrap items-center gap-1 text-[11px] text-gray-600 dark:text-gray-300">
            <span className="font-semibold">
              {t.similarFallbackTokensLabel || ''}:
            </span>
            {fallbackTokens.map((token) => (
              <span key={token} className="rounded-full border border-gray-200 bg-gray-100 dark:bg-gray-800 px-2 py-0.5">
                #{token}
              </span>
            ))}
          </div>
        )}
        <div className="flex flex-col gap-2">
          {loading ? (
            <div className="text-sm text-gray-500 dark:text-gray-400">{t.loading || ''}</div>
          ) : list.length > 0 ? (
            list.map((q) => (
              <a
                key={q.id}
                href={`/${locale}/posts/${q.id}`}
                className="text-left rounded-xl border border-gray-200 dark:border-gray-800 px-3 py-2 text-sm text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              >
                {q.title}
              </a>
            ))
          ) : (
            <div className="text-sm text-gray-500 dark:text-gray-400">{noResultsLabel}</div>
          )}
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-[0.15em]">{t.similarTagsLabel || ''}</span>
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
