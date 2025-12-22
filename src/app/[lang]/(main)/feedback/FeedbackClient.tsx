'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'nextjs-toploader/app';
import { Bug, MessageSquare, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useSubmitFeedback } from '@/repo/feedback/mutation';
import { ApiError } from '@/lib/api/errors';

interface FeedbackClientProps {
  translations: Record<string, unknown>;
  lang: string;
}

export default function FeedbackClient({ translations, lang }: FeedbackClientProps) {
  const router = useRouter();
  const submitFeedback = useSubmitFeedback();

  const t = (translations?.feedback || {}) as Record<string, string>;
  const tCommon = (translations?.common || {}) as Record<string, string>;
  const tErrors = (translations?.errors || {}) as Record<string, string>;

  const [type, setType] = useState<'feedback' | 'bug'>('feedback');
  const [rating, setRating] = useState<number | null>(null);
  const [description, setDescription] = useState('');
  const [pageUrl, setPageUrl] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPageUrl(window.location.href);
    }
  }, []);

  const copy = useMemo(() => {
    const ratingLabels = [
      t.rating1 || '',
      t.rating2 || '',
      t.rating3 || '',
      t.rating4 || '',
      t.rating5 || '',
    ];
    return {
      title: t.title || '',
      subtitle: t.subtitle || '',
      typeLabel: t.typeLabel || '',
      bugLabel: t.bugLabel || '',
      feedbackLabel: t.feedbackLabel || '',
      satisfactionLabel: t.satisfactionLabel || '',
      satisfactionHint: t.satisfactionHint || '',
      ratingLabels,
      improvementLabel: t.improvementLabel || '',
      improvementPlaceholder: t.improvementPlaceholder || '',
      issueLabel: t.issueLabel || '',
      issuePlaceholder: t.issuePlaceholder || '',
      submit: t.submit || '',
      submitting: t.submitting || '',
      successTitle: t.successTitle || '',
      successDesc: t.successDesc || '',
      submitError: t.submitError || '',
      backHome: t.backHome || '',
      submitAnother: t.submitAnother || '',
      ratingRequired: t.ratingRequired || '',
      detailRequired: t.detailRequired || '',
      bugTitle: t.bugTitle || '',
      cancel: tCommon.cancel || '',
    };
  }, [t, tCommon]);

  const showRating = type === 'feedback';
  const ratingTitle = copy.satisfactionLabel;
  const ratingLabels = copy.ratingLabels;
  const detailLabel = type === 'bug' ? copy.issueLabel : copy.improvementLabel;
  const detailPlaceholder = type === 'bug' ? copy.issuePlaceholder : copy.improvementPlaceholder;

  const handleReset = () => {
    setType('feedback');
    setRating(null);
    setDescription('');
    setSubmitted(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedDetail = description.trim();

    if (showRating && !rating) {
      toast.error(copy.ratingRequired);
      return;
    }

    if (!trimmedDetail) {
      toast.error(copy.detailRequired);
      return;
    }
    const computedTitle = showRating ? `${copy.feedbackLabel} ${rating}/5` : copy.bugTitle;

    try {
      await submitFeedback.mutateAsync({
        type,
        title: computedTitle,
        description: trimmedDetail,
        pageUrl: pageUrl || undefined,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      });
      setSubmitted(true);
    } catch (error) {
      if (error instanceof ApiError) {
        const translated =
          (error.code && tErrors[error.code]) ||
          (error.status === 429 && tErrors.RATE_LIMITED) ||
          '';
        const suffix = error.retryAfterSeconds ? ` (${error.retryAfterSeconds}s)` : '';
        toast.error((translated || error.message || copy.submitError) + suffix);
        return;
      }
      toast.error(error instanceof Error ? error.message : copy.submitError);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-10">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200/60 dark:border-gray-700/60 p-6 sm:p-8 space-y-6">
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{copy.title}</h1>
              <p className="text-sm text-gray-600 dark:text-gray-300">{copy.subtitle}</p>
            </div>

            {submitted ? (
              <div className="rounded-2xl border border-emerald-200 dark:border-emerald-700/60 bg-emerald-50 dark:bg-emerald-900/30 p-6 text-center space-y-4">
                <div className="flex justify-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/60">
                    <CheckCircle className="h-6 w-6 text-emerald-600 dark:text-emerald-300" />
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-lg font-semibold text-emerald-700 dark:text-emerald-200">
                    {copy.successTitle}
                  </div>
                  <div className="text-sm text-emerald-600 dark:text-emerald-100">
                    {copy.successDesc}
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-4 py-2 rounded-lg border border-emerald-300 dark:border-emerald-600 text-emerald-700 dark:text-emerald-200 hover:bg-emerald-100 dark:hover:bg-emerald-800/60 transition-colors"
                  >
                    {copy.submitAnother}
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push(`/${lang}`)}
                    className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                  >
                    {copy.backHome}
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200">
                    {copy.typeLabel}
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setType('feedback')}
                      className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition-colors ${
                        type === 'feedback'
                          ? 'border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-500 dark:bg-blue-900/30 dark:text-blue-200'
                          : 'border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/60'
                      }`}
                    >
                      <MessageSquare className="h-4 w-4" />
                      {copy.feedbackLabel}
                    </button>
                    <button
                      type="button"
                      onClick={() => setType('bug')}
                      className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition-colors ${
                        type === 'bug'
                          ? 'border-red-500 bg-red-50 text-red-700 dark:border-red-500 dark:bg-red-900/30 dark:text-red-200'
                          : 'border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/60'
                      }`}
                    >
                      <Bug className="h-4 w-4" />
                      {copy.bugLabel}
                    </button>
                  </div>
                </div>

                {showRating ? (
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200">
                      {ratingTitle}
                    </label>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                      {ratingLabels.map((label, index) => {
                        const value = index + 1;
                        const active = rating === value;
                        return (
                          <button
                            key={value}
                            type="button"
                            aria-pressed={active}
                            onClick={() => setRating(value)}
                            className={`flex flex-col items-center justify-center gap-1 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${
                              active
                                ? 'border-blue-600 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-900/30 dark:text-blue-200'
                                : 'border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/60'
                            }`}
                          >
                            <span className="text-base font-semibold">{value}</span>
                            <span className="text-[11px] font-medium leading-tight text-center">{label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200">
                    {detailLabel}
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={5}
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={detailPlaceholder}
                  />
                  {showRating ? (
                    <p className="text-xs text-gray-500 dark:text-gray-400">{copy.satisfactionHint}</p>
                  ) : null}
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={submitFeedback.isPending}
                    className="flex-1 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:from-blue-700 hover:to-indigo-700 transition-colors disabled:opacity-60"
                  >
                    {submitFeedback.isPending ? copy.submitting : copy.submit}
                  </button>
                  <button
                    type="button"
                    onClick={() => router.back()}
                    className="flex-1 rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors"
                  >
                    {copy.cancel}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
