'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'nextjs-toploader/app';
import { Bug, MessageSquare, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useSubmitFeedback } from '@/repo/feedback/mutation';

interface FeedbackClientProps {
  translations: Record<string, unknown>;
  lang: string;
}

export default function FeedbackClient({ translations, lang }: FeedbackClientProps) {
  const router = useRouter();
  const submitFeedback = useSubmitFeedback();

  const t = (translations?.feedback || {}) as Record<string, string>;
  const tCommon = (translations?.common || {}) as Record<string, string>;

  const [type, setType] = useState<'feedback' | 'bug'>('feedback');
  const [rating, setRating] = useState<number | null>(null);
  const [description, setDescription] = useState('');
  const [steps, setSteps] = useState('');
  const [pageUrl, setPageUrl] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPageUrl(window.location.href);
    }
  }, []);

  const copy = useMemo(() => {
    const isVi = lang === 'vi';
    const isEn = lang === 'en';
    const ratingLabels = isVi
      ? ['Rất không hài lòng', 'Không hài lòng', 'Bình thường', 'Hài lòng', 'Rất hài lòng']
      : isEn
        ? ['Very dissatisfied', 'Dissatisfied', 'Okay', 'Satisfied', 'Very satisfied']
        : ['매우 불만족', '불만족', '보통', '만족', '매우 만족'];
    const impactLabels = isVi
      ? ['Thấp', 'Nhẹ', 'Trung bình', 'Cao', 'Nghiêm trọng']
      : isEn
        ? ['Low', 'Mild', 'Medium', 'High', 'Critical']
        : ['낮음', '약함', '보통', '높음', '치명적'];
    return {
      title: t.title || (isVi ? 'Khảo sát phản hồi' : isEn ? 'Feedback Survey' : '피드백 설문'),
      subtitle:
        t.subtitle ||
        (isVi
          ? 'Đánh giá trải nghiệm và cho biết điều cần cải thiện, hoặc báo lỗi.'
          : isEn
            ? 'Rate your experience and share what we should improve, or report a bug.'
            : '만족도와 개선점을 알려주시거나 버그를 제보해 주세요.'),
      typeLabel: t.typeLabel || (isVi ? 'Loại' : isEn ? 'Type' : '유형'),
      bugLabel: t.bugLabel || (isVi ? 'Báo lỗi' : isEn ? 'Bug' : '버그'),
      feedbackLabel: t.feedbackLabel || (isVi ? 'Phản hồi' : isEn ? 'Feedback' : '피드백'),
      satisfactionLabel: t.satisfactionLabel || (isVi ? 'Mức độ hài lòng' : isEn ? 'Satisfaction' : '만족도'),
      satisfactionHint:
        t.satisfactionHint ||
        (isVi
          ? 'Chọn trải nghiệm tổng thể của bạn.'
          : isEn
            ? 'Choose your overall experience.'
            : '전반적인 경험을 선택해 주세요.'),
      impactLabel: t.impactLabel || (isVi ? 'Mức độ ảnh hưởng' : isEn ? 'Impact' : '영향도'),
      impactHint:
        t.impactHint ||
        (isVi
          ? 'Sự cố ảnh hưởng đến bạn ở mức nào?'
          : isEn
            ? 'How much did the issue impact you?'
            : '문제가 얼마나 영향을 줬나요?'),
      ratingLabels,
      impactLabels,
      improvementLabel:
        t.improvementLabel || (isVi ? 'Điều cần cải thiện' : isEn ? 'What should we improve?' : '개선이 필요한 점'),
      improvementPlaceholder:
        t.improvementPlaceholder ||
        (isVi
          ? 'Ví dụ: Tốc độ tìm kiếm chậm, khó tìm chủ đề.'
          : isEn
            ? 'Example: Search feels slow, hard to find topics.'
            : '예: 검색 속도가 느리고 주제를 찾기 어려워요.'),
      issueLabel: t.issueLabel || (isVi ? 'Chi tiết lỗi' : isEn ? 'Issue details' : '버그 상세'),
      issuePlaceholder:
        t.issuePlaceholder ||
        (isVi
          ? 'Mô tả kết quả mong đợi và thực tế.'
          : isEn
            ? 'Describe expected vs actual result.'
            : '기대 결과와 실제 결과를 설명해 주세요.'),
      stepsLabel: t.stepsLabel || (isVi ? 'Bước tái hiện (tuỳ chọn)' : isEn ? 'Steps (optional)' : '재현 단계 (선택)'),
      stepsPlaceholder:
        t.stepsPlaceholder ||
        (isVi ? '1) ... 2) ...' : isEn ? '1) ... 2) ...' : '1) ... 2) ...'),
      pageLabel: t.pageLabel || (isVi ? 'URL trang' : isEn ? 'Page URL' : '현재 페이지'),
      submit: t.submit || (isVi ? 'Gửi' : isEn ? 'Submit' : '제출하기'),
      submitting: t.submitting || (isVi ? 'Đang gửi...' : isEn ? 'Submitting...' : '제출 중...'),
      successTitle:
        t.successTitle || (isVi ? 'Đã gửi' : isEn ? 'Submitted' : '제출이 완료되었습니다.'),
      successDesc:
        t.successDesc ||
        (isVi
          ? 'Cảm ơn bạn! Chúng tôi sẽ xem xét.'
          : isEn
            ? 'Thanks! We will review it soon.'
            : '감사합니다. 빠르게 확인하고 개선하겠습니다.'),
      submitError:
        t.submitError ||
        (isVi
          ? 'Gửi thất bại.'
          : isEn
            ? 'Failed to submit.'
            : '제출에 실패했습니다.'),
      backHome: t.backHome || (isVi ? 'Về trang chủ' : isEn ? 'Back to home' : '홈으로'),
      submitAnother: t.submitAnother || (isVi ? 'Gửi thêm' : isEn ? 'Submit another' : '다시 작성하기'),
      ratingRequired:
        t.ratingRequired || (isVi ? 'Vui lòng chọn mức độ hài lòng.' : isEn ? 'Please select a rating.' : '만족도를 선택해 주세요.'),
      detailRequired:
        t.detailRequired ||
        (isVi ? 'Vui lòng nhập chi tiết.' : isEn ? 'Please enter details.' : '상세 내용을 입력해주세요.'),
      cancel: tCommon.cancel || (isVi ? 'Huỷ' : isEn ? 'Cancel' : '취소'),
    };
  }, [lang, t, tCommon]);

  const ratingTitle = type === 'bug' ? copy.impactLabel : copy.satisfactionLabel;
  const ratingHint = type === 'bug' ? copy.impactHint : copy.satisfactionHint;
  const ratingLabels = type === 'bug' ? copy.impactLabels : copy.ratingLabels;
  const detailLabel = type === 'bug' ? copy.issueLabel : copy.improvementLabel;
  const detailPlaceholder = type === 'bug' ? copy.issuePlaceholder : copy.improvementPlaceholder;

  const handleReset = () => {
    setType('feedback');
    setRating(null);
    setDescription('');
    setSteps('');
    setSubmitted(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedDetail = description.trim();
    const minDetail = 10;

    if (!rating) {
      toast.error(copy.ratingRequired);
      return;
    }

    if (trimmedDetail.length < minDetail) {
      toast.error(copy.detailRequired);
      return;
    }
    const computedTitle = `${type === 'bug' ? copy.bugLabel : copy.feedbackLabel} ${rating}/5`;

    try {
      await submitFeedback.mutateAsync({
        type,
        title: computedTitle,
        description: trimmedDetail,
        steps: steps.trim() || undefined,
        pageUrl: pageUrl || undefined,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      });
      setSubmitted(true);
    } catch (error) {
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

                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200">
                      {ratingTitle}
                    </label>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{ratingHint}</span>
                  </div>
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
                </div>

                {type === 'bug' ? (
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200">
                      {copy.stepsLabel}
                    </label>
                    <textarea
                      value={steps}
                      onChange={(e) => setSteps(e.target.value)}
                      rows={3}
                      className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={copy.stepsPlaceholder}
                    />
                  </div>
                ) : null}

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200">
                    {copy.pageLabel}
                  </label>
                  <input
                    type="text"
                    value={pageUrl}
                    readOnly
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-900/60 px-4 py-3 text-xs text-gray-600 dark:text-gray-300"
                  />
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
