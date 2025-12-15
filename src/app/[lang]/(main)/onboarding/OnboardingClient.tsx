'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'nextjs-toploader/app';
import { useSession } from 'next-auth/react';
import { queryKeys } from '@/repo/keys';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCategories } from '@/repo/categories/query';
import { fetchMySubscriptions, toggleCategorySubscription } from '@/repo/categories/fetch';
import { toast } from 'sonner';
import { CATEGORY_GROUPS, LEGACY_CATEGORIES, getCategoryName } from '@/lib/constants/categories';

const VISA_TYPES = ['D-2', 'D-10', 'E-7-1', 'E-7-2', 'E-7-3', 'F-2-7', 'F-6'];
const KOREAN_LEVELS = [
  { value: 'beginner', label: { ko: '기초', vi: 'Sơ cấp', en: 'Beginner' } },
  { value: 'intermediate', label: { ko: '중급', vi: 'Trung cấp', en: 'Intermediate' } },
  { value: 'advanced', label: { ko: '고급', vi: 'Cao cấp', en: 'Advanced' } },
];

interface OnboardingClientProps {
  lang: string;
  translations?: Record<string, any>;
}

export default function OnboardingClient({ lang, translations }: OnboardingClientProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session, status } = useSession();
  const { data: categories } = useCategories();
  const t = translations?.onboarding || {};

  const [userType, setUserType] = useState('');
  const [visaType, setVisaType] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [koreanLevel, setKoreanLevel] = useState('');
  const [currentSubs, setCurrentSubs] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const slugToId = useMemo(() => {
    const map = new Map<string, string>();
    (categories || []).forEach((parent: any) => {
      if (parent?.slug && parent?.id) map.set(parent.slug, parent.id);
      (parent?.children || []).forEach((child: any) => {
        if (child?.slug && child?.id) map.set(child.slug, child.id);
      });
    });
    return map;
  }, [categories]);

  const interestOptions = useMemo(() => {
    const opts: { id: string; name: string }[] = [];
    Object.entries(CATEGORY_GROUPS).forEach(([, group]) => {
      (group.slugs as readonly string[]).forEach((childSlug) => {
        const childId = slugToId.get(childSlug);
        if (!childId) return;
        const childLegacy = LEGACY_CATEGORIES.find((c) => c.slug === childSlug);
        opts.push({
          id: childId,
          name: childLegacy ? getCategoryName(childLegacy, lang) : childSlug,
        });
      });
    });
    return opts;
  }, [lang, slugToId]);

  const saveProfile = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/users/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userType: userType || null,
          visaType: visaType || null,
          interests,
          preferredLanguage: lang || 'vi',
          onboardingCompleted: true,
          koreanLevel: koreanLevel || null,
        }),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || '프로필 저장에 실패했습니다.');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.me() });
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.subscriptions() });
    },
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(`/${lang}/login`);
    }
  }, [status, router, lang]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    fetchMySubscriptions()
      .then((subs) => setCurrentSubs(subs.map((s) => s.id)))
      .catch(() => undefined);
  }, [status]);

  const toggleInterest = (id: string) => {
    setInterests((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length < 5
          ? [...prev, id]
          : prev
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await saveProfile.mutateAsync();
      // 관심사 구독 적용 (이미 구독한 것은 건너뜀)
      const toSubscribe = interests.filter((id) => !currentSubs.includes(id));
      for (const id of toSubscribe) {
        try {
          await toggleCategorySubscription(id);
        } catch {
          // ignore individual failures
        }
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.subscriptions() });
      const successMessage =
        t.successMessage ||
        (lang === 'vi' ? 'Đã lưu tuỳ chỉnh cá nhân.' : lang === 'en' ? 'Personalization saved.' : '맞춤 설정이 저장되었습니다.');
      toast.success(successMessage);
      router.push(`/${lang}`);
    } catch (err) {
      const defaultError = lang === 'vi' ? 'Lỗi khi lưu.' : lang === 'en' ? 'Failed to save.' : '저장 중 오류가 발생했습니다.';
      toast.error(err instanceof Error ? err.message : defaultError);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 via-white to-white dark:from-gray-900 dark:via-gray-900 dark:to-black">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100/80 dark:border-gray-700/60 p-8 space-y-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t.title || '맞춤 피드를 준비할게요'}</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t.description || '프로필 정보를 선택하면 관심사에 맞춘 카테고리와 콘텐츠를 먼저 보여드려요.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                {t.userTypeLabel || '사용자 유형'}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    value: 'student',
                    label: t.userTypeStudent || '학생',
                    description: t.userTypeStudentDesc || '유학생, 교환학생',
                  },
                  {
                    value: 'worker',
                    label: t.userTypeWorker || '근로자',
                    description: t.userTypeWorkerDesc || '취업/근로/이직 준비',
                  },
                  {
                    value: 'resident',
                    label: t.userTypeResident || '거주자',
                    description: t.userTypeResidentDesc || '장기 거주, 가족 동반',
                  },
                ].map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setUserType(type.value)}
                    className={`rounded-lg border px-4 py-3 text-left transition-all ${userType === type.value
                        ? 'border-red-500 bg-red-50 text-red-700 dark:border-red-500 dark:bg-red-900/30 dark:text-red-100'
                        : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-red-300'
                      }`}
                  >
                    <p className="font-semibold">{type.label}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {type.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                {t.koreanLevelLabel || '한국어 수준'}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {KOREAN_LEVELS.map((level) => (
                  <button
                    key={level.value}
                    type="button"
                    onClick={() => setKoreanLevel(level.value)}
                    className={`rounded-lg border px-4 py-3 text-left transition-all ${
                      koreanLevel === level.value
                        ? 'border-red-500 bg-red-50 text-red-700 dark:border-red-500 dark:bg-red-900/30 dark:text-red-100'
                        : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-red-300'
                    }`}
                  >
                    <p className="font-semibold">
                      {t[`koreanLevel_${level.value}`] || level.label[lang as 'ko' | 'vi' | 'en'] || level.label.ko}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {t[`koreanLevel_${level.value}_desc`] || ''}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                {t.visaLabel || '비자 유형'}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {VISA_TYPES.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setVisaType(v)}
                    className={`rounded-md border px-3 py-2 text-sm transition-all ${visaType === v
                        ? 'border-red-500 bg-red-50 text-red-700 dark:border-red-500 dark:bg-red-900/30 dark:text-red-100'
                        : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-red-300'
                      }`}
                  >
                    {v}
                  </button>
                ))}
                <input
                  type="text"
                  value={visaType}
                  onChange={(e) => setVisaType(e.target.value)}
                  placeholder={t.visaOtherPlaceholder || (lang === 'vi' ? 'Nhập visa khác' : lang === 'en' ? 'Other visa' : '기타 직접 입력')}
                  className="col-span-2 sm:col-span-4 px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                {t.interestsLabel || '관심 카테고리'}
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t.interestsHint || '최대 5개까지 선택하세요.'}
              </p>
              <div className="flex flex-wrap gap-2">
                {interestOptions.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => toggleInterest(cat.id)}
                      className={`px-4 py-2 rounded-full text-sm border transition-all ${
                        interests.includes(cat.id)
                          ? 'border-red-500 bg-red-50 text-red-700 dark:border-red-500 dark:bg-red-900/30 dark:text-red-100'
                          : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-red-300'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-amber-500 text-white font-semibold rounded-lg shadow-md hover:from-red-700 hover:to-amber-600 transition-all disabled:opacity-60"
              >
                {saving ? t.submitting || '저장 중...' : t.submit || '완료'}
              </button>
              <button
                type="button"
                onClick={() => router.push(`/${lang}`)}
                className="px-6 py-3 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
              >
                {t.skip || '건너뛰기'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
