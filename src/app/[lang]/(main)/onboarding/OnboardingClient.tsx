'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'nextjs-toploader/app';
import { useSession } from 'next-auth/react';
import { PenSquare, MessageCircle, Compass, Info } from 'lucide-react';
import { queryKeys } from '@/repo/keys';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCategories } from '@/repo/categories/query';
import { fetchMySubscriptions, toggleCategorySubscription } from '@/repo/categories/fetch';
import { toast } from 'sonner';
import { CATEGORY_GROUPS, LEGACY_CATEGORIES, getCategoryName } from '@/lib/constants/categories';
import Tooltip from '@/components/atoms/Tooltip';

const VISA_TYPES = ['D-2', 'D-10', 'E-7-1', 'E-7-2', 'E-7-3', 'F-2-7', 'F-6'];
const KOREAN_LEVELS = ['beginner', 'intermediate', 'advanced'] as const;

interface OnboardingClientProps {
  lang: string;
  translations?: Record<string, any>;
}

export default function OnboardingClient({ lang, translations }: OnboardingClientProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { status } = useSession();
  const { data: categories } = useCategories();
  const t = translations?.onboarding || {};
  const tProfileEdit = translations?.profileEdit || {};
  const tStaticFaq = translations?.staticPages?.faq || {};
  const pageTitle = t.title || '';
  const pageDescription = t.description || '';
  const userTypeLabel = t.userTypeLabel || '';
  const interestsLabel = t.interestsLabel || '';
  const interestsHint = t.interestsHint || '';
  const koreanLevelLabel = t.koreanLevelLabel || '';
  const visaLabel = t.visaLabel || '';
  const submittingLabel = t.submitting || '';
  const submitLabel = t.submit || '';
  const saveSuccessLabel = tProfileEdit.updateSuccess || '';
  const saveErrorLabel = tProfileEdit.updateFailed || '';
  const defaultErrorLabel = tProfileEdit.updateFailed || '';
  const userTypeOptions = useMemo(
    () => [
      {
        value: 'student',
        label: t.userTypeStudent || '',
        description: t.userTypeStudentDesc || '',
      },
      {
        value: 'worker',
        label: t.userTypeWorker || '',
        description: t.userTypeWorkerDesc || '',
      },
      {
        value: 'resident',
        label: t.userTypeResident || '',
        description: t.userTypeResidentDesc || '',
      },
    ],
    [t]
  );
  const wizardCopy = useMemo(() => {
    return {
      stepLabel: t.stepLabel || '',
      next: t.next || '',
      back: t.back || '',
      skip: t.skip || '',
      step1: t.step1 || '',
      step2: t.step2 || '',
      step3: t.step3 || '',
    };
  }, [t]);
  const guideCopy = useMemo(() => {
    return {
      title: t.guideTitle || '',
      subtitle: t.guideSubtitle || '',
      askTitle: t.guideAskTitle || '',
      askDesc: t.guideAskDesc || '',
      askAction: t.guideAskAction || '',
      askTooltip: t.guideAskTooltip || '',
      answerTitle: t.guideAnswerTitle || '',
      answerDesc: t.guideAnswerDesc || '',
      answerAction: t.guideAnswerAction || '',
      answerTooltip: t.guideAnswerTooltip || '',
      exploreTitle: t.guideExploreTitle || '',
      exploreDesc: t.guideExploreDesc || '',
      exploreAction: t.guideExploreAction || '',
      exploreTooltip: t.guideExploreTooltip || '',
      faqTitle: tStaticFaq.heading || '',
      faq1Q: tStaticFaq.q1 || '',
      faq1A: tStaticFaq.a1 || '',
      faq2Q: tStaticFaq.q2 || '',
      faq2A: tStaticFaq.a2 || '',
      faq3Q: tStaticFaq.q3 || '',
      faq3A: tStaticFaq.a3 || '',
    };
  }, [t, tStaticFaq]);

  const [userType, setUserType] = useState('');
  const [visaType, setVisaType] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [koreanLevel, setKoreanLevel] = useState('');
  const [currentSubs, setCurrentSubs] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

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

  const guideLinks = useMemo(() => {
    return {
      ask: `/${lang}/posts/new?type=question`,
      answer: `/${lang}/?c=popular`,
      explore: `/${lang}`,
    };
  }, [lang]);
  const steps = useMemo(
    () => [
      { key: 'profile', label: wizardCopy.step1 },
      { key: 'interests', label: wizardCopy.step2 },
      { key: 'details', label: wizardCopy.step3 },
    ],
    [wizardCopy]
  );
  const canProceed = useMemo(() => {
    if (currentStep === 1) return Boolean(userType);
    if (currentStep === 2) return interests.length > 0;
    return true;
  }, [currentStep, interests.length, userType]);

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
        throw new Error(error.error || saveErrorLabel);
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
      toast.success(saveSuccessLabel);
      router.push(`/${lang}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : defaultErrorLabel);
    } finally {
      setSaving(false);
    }
  };

  const guideCards = [
    {
      key: 'ask',
      title: guideCopy.askTitle,
      description: guideCopy.askDesc,
      action: guideCopy.askAction,
      tooltip: guideCopy.askTooltip,
      href: guideLinks.ask,
      icon: PenSquare,
      iconClassName: 'text-rose-500',
    },
    {
      key: 'answer',
      title: guideCopy.answerTitle,
      description: guideCopy.answerDesc,
      action: guideCopy.answerAction,
      tooltip: guideCopy.answerTooltip,
      href: guideLinks.answer,
      icon: MessageCircle,
      iconClassName: 'text-amber-500',
    },
    {
      key: 'explore',
      title: guideCopy.exploreTitle,
      description: guideCopy.exploreDesc,
      action: guideCopy.exploreAction,
      tooltip: guideCopy.exploreTooltip,
      href: guideLinks.explore,
      icon: Compass,
      iconClassName: 'text-emerald-500',
    },
  ];

  const faqItems = [
    { question: guideCopy.faq1Q, answer: guideCopy.faq1A },
    { question: guideCopy.faq2Q, answer: guideCopy.faq2A },
    { question: guideCopy.faq3Q, answer: guideCopy.faq3A },
  ];
  const stepIndicator = `${wizardCopy.stepLabel} ${currentStep}/${steps.length}`;

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 via-white to-white dark:from-gray-900 dark:via-gray-900 dark:to-black">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100/80 dark:border-gray-700/60 p-8 space-y-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{pageTitle}</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {pageDescription}
            </p>
          </div>

          <div className="space-y-4 rounded-2xl border border-gray-200/60 dark:border-gray-700/60 bg-gray-50 dark:bg-gray-900/40 p-5">
            <div className="space-y-1">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">{guideCopy.title}</h2>
              <p className="text-xs text-gray-600 dark:text-gray-400">{guideCopy.subtitle}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {guideCards.map((card) => {
                const Icon = card.icon;
                return (
                  <div
                    key={card.key}
                    className="rounded-xl border border-gray-200/70 dark:border-gray-700/70 bg-white dark:bg-gray-900 p-4 flex flex-col gap-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                          <Icon className={`h-4 w-4 ${card.iconClassName}`} />
                        </span>
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">{card.title}</div>
                      </div>
                      <Tooltip content={card.tooltip} position="top" touchBehavior="longPress" interactive>
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 dark:border-gray-700 text-gray-400">
                          <Info className="h-3.5 w-3.5" />
                        </span>
                      </Tooltip>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{card.description}</p>
                    <button
                      type="button"
                      onClick={() => router.push(card.href)}
                      className="mt-auto inline-flex items-center justify-center rounded-full border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                    >
                      {card.action}
                    </button>
                  </div>
                );
              })}
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{guideCopy.faqTitle}</h3>
              <div className="grid gap-2">
                {faqItems.map((item, index) => (
                  <div
                    key={`${item.question}-${index}`}
                    className="rounded-lg border border-gray-200/70 dark:border-gray-700/70 bg-white dark:bg-gray-900 px-4 py-3"
                  >
                    <div className="text-xs font-semibold text-gray-800 dark:text-gray-100">{item.question}</div>
                    <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">{item.answer}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3 rounded-2xl border border-gray-200/70 dark:border-gray-700/60 bg-white dark:bg-gray-900 p-4">
              <div className="flex items-center justify-between text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em]">
                <span>{stepIndicator}</span>
                <span>{steps[currentStep - 1]?.label}</span>
              </div>
              <div className="flex items-center gap-2">
                {steps.map((step, index) => {
                  const isActive = currentStep === index + 1;
                  const isCompleted = currentStep > index + 1;
                  return (
                    <div
                      key={step.key}
                      className={`flex-1 rounded-full px-3 py-1 text-center text-xs font-semibold ${
                        isActive
                          ? 'bg-red-600 text-white'
                          : isCompleted
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-100'
                            : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                      }`}
                    >
                      {step.label}
                    </div>
                  );
                })}
              </div>
            </div>

            {currentStep === 1 && (
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                {userTypeLabel}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {userTypeOptions.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setUserType(type.value)}
                      className={`rounded-lg border px-4 py-3 text-left transition-all ${
                        userType === type.value
                          ? 'border-red-500 bg-red-50 text-red-700 dark:border-red-500 dark:bg-red-900/30 dark:text-red-100'
                          : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-red-300'
                      }`}
                    >
                      <p className="font-semibold">{type.label}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{type.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-3">
                <label className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                {interestsLabel}
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {interestsHint}
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
            )}

            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                    {koreanLevelLabel}
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {KOREAN_LEVELS.map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setKoreanLevel(level)}
                        className={`rounded-lg border px-4 py-3 text-left transition-all ${
                          koreanLevel === level
                            ? 'border-red-500 bg-red-50 text-red-700 dark:border-red-500 dark:bg-red-900/30 dark:text-red-100'
                            : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-red-300'
                        }`}
                      >
                        <p className="font-semibold">
                          {t[`koreanLevel_${level}`] || ''}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {t[`koreanLevel_${level}_desc`] || ''}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                    {visaLabel}
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {VISA_TYPES.map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setVisaType(v)}
                        className={`rounded-md border px-3 py-2 text-sm transition-all ${
                          visaType === v
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
                      placeholder={t.visaOtherPlaceholder || ''}
                      className="col-span-2 sm:col-span-4 px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-3 pt-4">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
                  className="px-6 py-3 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                >
                  {wizardCopy.back}
                </button>
              )}
              {currentStep < steps.length && (
                <button
                  type="button"
                  onClick={() => setCurrentStep((prev) => Math.min(steps.length, prev + 1))}
                  disabled={!canProceed}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-amber-500 text-white font-semibold rounded-lg shadow-md hover:from-red-700 hover:to-amber-600 transition-all disabled:opacity-60"
                >
                  {wizardCopy.next}
                </button>
              )}
              {currentStep === steps.length && (
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-amber-500 text-white font-semibold rounded-lg shadow-md hover:from-red-700 hover:to-amber-600 transition-all disabled:opacity-60"
                >
                  {saving ? submittingLabel : submitLabel}
                </button>
              )}
	              <button
	                type="button"
	                onClick={() => router.push(`/${lang}`)}
	                className="px-6 py-3 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
	              >
	                {wizardCopy.skip}
	              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
