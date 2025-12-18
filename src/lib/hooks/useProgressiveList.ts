import { useEffect, useMemo, useState } from 'react';

interface UseProgressiveListOptions {
  enabled: boolean;
  total: number;
  initial?: number;
  step?: number;
  resetKey?: unknown;
}

export default function useProgressiveList({ enabled, total, initial = 6, step = 6, resetKey }: UseProgressiveListOptions) {
  const safeInitial = useMemo(() => Math.max(0, initial), [initial]);
  const safeStep = useMemo(() => Math.max(1, step), [step]);

  const [visibleCount, setVisibleCount] = useState(() => Math.min(total, safeInitial));

  useEffect(() => {
    if (!enabled) {
      setVisibleCount(Math.min(total, safeInitial));
      return;
    }
    setVisibleCount(Math.min(total, safeInitial));
  }, [enabled, resetKey, safeInitial, total]);

  useEffect(() => {
    setVisibleCount((prev) => Math.min(prev, total));
  }, [total]);

  useEffect(() => {
    if (!enabled) return;
    if (visibleCount >= total) return;
    if (typeof window === 'undefined') return;

    const timeoutId = window.setTimeout(() => {
      setVisibleCount((prev) => Math.min(total, prev + safeStep));
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [enabled, safeStep, total, visibleCount]);

  return visibleCount;
}

