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
  const { status } = useSession();
  const { data: categories } = useCategories();
  const t = translations?.onboarding || {};
  const uiCopy = useMemo(() => {
    if (lang === 'en') {
      return {
        title: 'We\'ll tailor your feed',
        description: 'Choose profile info to surface the categories and content you care about first.',
        userTypeLabel: 'User type',
        userTypeStudent: 'Student',
        userTypeStudentDesc: 'International or exchange student',
        userTypeWorker: 'Worker',
        userTypeWorkerDesc: 'Employment, job change prep',
        userTypeResident: 'Resident',
        userTypeResidentDesc: 'Long-term stay, family',
        koreanLevelLabel: 'Korean level',
        visaLabel: 'Visa type',
        interestsLabel: 'Interest categories',
        interestsHint: 'Select up to 5.',
        submitting: 'Saving...',
        submit: 'Done',
        skip: 'Skip',
        saveSuccess: 'Personalization saved.',
        saveError: 'Failed to save profile.',
        defaultError: 'Failed to save.',
      };
    }
    if (lang === 'vi') {
      return {
        title: 'Chuẩn bị bảng tin cho bạn',
        description: 'Chọn thông tin hồ sơ để ưu tiên danh mục và nội dung bạn quan tâm.',
        userTypeLabel: 'Loại người dùng',
        userTypeStudent: 'Sinh viên',
        userTypeStudentDesc: 'Du học sinh, sinh viên trao đổi',
        userTypeWorker: 'Người đi làm',
        userTypeWorkerDesc: 'Việc làm, chuyển việc',
        userTypeResident: 'Cư dân',
        userTypeResidentDesc: 'Cư trú dài hạn, gia đình',
        koreanLevelLabel: 'Trình độ tiếng Hàn',
        visaLabel: 'Loại visa',
        interestsLabel: 'Danh mục quan tâm',
        interestsHint: 'Chọn tối đa 5 mục.',
        submitting: 'Đang lưu...',
        submit: 'Hoàn tất',
        skip: 'Bỏ qua',
        saveSuccess: 'Đã lưu tuỳ chỉnh cá nhân.',
        saveError: 'Không thể lưu hồ sơ.',
        defaultError: 'Lỗi khi lưu.',
      };
    }
    return {
      title: '맞춤 피드를 준비할게요',
      description: '프로필 정보를 선택하면 관심사에 맞춘 카테고리와 콘텐츠를 먼저 보여드려요.',
      userTypeLabel: '사용자 유형',
      userTypeStudent: '학생',
      userTypeStudentDesc: '유학생, 교환학생',
      userTypeWorker: '근로자',
      userTypeWorkerDesc: '취업/근로/이직 준비',
      userTypeResident: '거주자',
      userTypeResidentDesc: '장기 거주, 가족 동반',
      koreanLevelLabel: '한국어 수준',
      visaLabel: '비자 유형',
      interestsLabel: '관심 카테고리',
      interestsHint: '최대 5개까지 선택하세요.',
      submitting: '저장 중...',
      submit: '완료',
      skip: '건너뛰기',
      saveSuccess: '맞춤 설정이 저장되었습니다.',
      saveError: '프로필 저장에 실패했습니다.',
      defaultError: '저장 중 오류가 발생했습니다.',
    };
  }, [lang]);
  const pageTitle = t.title || uiCopy.title;
  const pageDescription = t.description || uiCopy.description;
  const userTypeLabel = t.userTypeLabel || uiCopy.userTypeLabel;
  const interestsLabel = t.interestsLabel || uiCopy.interestsLabel;
  const interestsHint = t.interestsHint || uiCopy.interestsHint;
  const koreanLevelLabel = t.koreanLevelLabel || uiCopy.koreanLevelLabel;
  const visaLabel = t.visaLabel || uiCopy.visaLabel;
  const submittingLabel = t.submitting || uiCopy.submitting;
  const submitLabel = t.submit || uiCopy.submit;
  const saveSuccessLabel = t.successMessage || uiCopy.saveSuccess;
  const saveErrorLabel = t.saveError || t.errorMessage || uiCopy.saveError;
  const defaultErrorLabel = t.errorMessage || uiCopy.defaultError;
  const userTypeOptions = useMemo(() => (
    [
      {
        value: 'student',
        label: t.userTypeStudent || uiCopy.userTypeStudent,
        description: t.userTypeStudentDesc || uiCopy.userTypeStudentDesc,
      },
      {
        value: 'worker',
        label: t.userTypeWorker || uiCopy.userTypeWorker,
        description: t.userTypeWorkerDesc || uiCopy.userTypeWorkerDesc,
      },
      {
        value: 'resident',
        label: t.userTypeResident || uiCopy.userTypeResident,
        description: t.userTypeResidentDesc || uiCopy.userTypeResidentDesc,
      },
    ]
  ), [t, uiCopy]);
  const wizardCopy = useMemo(() => {
    if (lang === 'en') {
      return {
        stepLabel: 'Step',
        next: 'Next',
        back: 'Back',
        skip: 'Skip for now',
        step1: 'About you',
        step2: 'Choose interests',
        step3: 'Optional details',
      };
    }
    if (lang === 'vi') {
      return {
        stepLabel: 'Bước',
        next: 'Tiếp tục',
        back: 'Quay lại',
        skip: 'Bỏ qua',
        step1: 'Thông tin cơ bản',
        step2: 'Chọn chủ đề',
        step3: 'Thông tin thêm',
      };
    }
    return {
      stepLabel: '단계',
      next: '다음',
      back: '이전',
      skip: '건너뛰기',
      step1: '기본 정보',
      step2: '관심 주제 선택',
      step3: '추가 정보',
    };
  }, [lang]);
  const guideCopy = useMemo(() => {
    const guideFallbacks = {
      en: {
        title: 'Quick start guide',
        subtitle: 'Get started with your first question, answer, and category.',
        askTitle: 'Ask your first question',
        askDesc: 'Share your situation to get focused answers.',
        askAction: 'Ask a question',
        askTooltip: 'Include your visa type and goal for faster help.',
        answerTitle: 'Leave your first answer',
        answerDesc: 'Support others and build trust.',
        answerAction: 'Browse popular questions',
        answerTooltip: 'Helpful answers raise your trust score.',
        exploreTitle: 'Explore categories',
        exploreDesc: 'Find the topics you care about most.',
        exploreAction: 'Explore now',
        exploreTooltip: 'Subscribe to categories to personalize your feed.',
        faqTitle: 'FAQ',
        faq1Q: 'How can I get verified answers?',
        faq1A: 'Check for Verified/Expert badges on posts and profiles.',
        faq2Q: 'Where can I manage subscriptions?',
        faq2A: 'Open profile settings to manage category subscriptions.',
        faq3Q: 'How do I report incorrect info?',
        faq3A: 'Use the report button on each post or answer.',
      },
      vi: {
        title: 'Hướng dẫn nhanh',
        subtitle: 'Bắt đầu với câu hỏi, câu trả lời và danh mục đầu tiên.',
        askTitle: 'Đặt câu hỏi đầu tiên',
        askDesc: 'Chia sẻ hoàn cảnh để nhận câu trả lời phù hợp.',
        askAction: 'Đặt câu hỏi',
        askTooltip: 'Thêm loại visa và mục tiêu để được hỗ trợ nhanh hơn.',
        answerTitle: 'Trả lời câu hỏi đầu tiên',
        answerDesc: 'Giúp cộng đồng và tăng độ tin cậy.',
        answerAction: 'Xem câu hỏi nổi bật',
        answerTooltip: 'Câu trả lời hữu ích giúp tăng điểm tin cậy.',
        exploreTitle: 'Khám phá danh mục',
        exploreDesc: 'Tìm chủ đề bạn quan tâm nhất.',
        exploreAction: 'Khám phá ngay',
        exploreTooltip: 'Theo dõi danh mục để cá nhân hóa bảng tin.',
        faqTitle: 'FAQ',
        faq1Q: 'Làm sao nhận câu trả lời xác minh?',
        faq1A: 'Xem huy hiệu Đã xác minh/Chuyên gia ở bài viết và hồ sơ.',
        faq2Q: 'Quản lý theo dõi ở đâu?',
        faq2A: 'Mở cài đặt hồ sơ để quản lý theo dõi danh mục.',
        faq3Q: 'Báo cáo thông tin sai thế nào?',
        faq3A: 'Dùng nút báo cáo ở mỗi bài viết hoặc câu trả lời.',
      },
      ko: {
        title: '빠른 시작 가이드',
        subtitle: '첫 질문, 첫 답변, 카테고리 탐색을 바로 시작해보세요.',
        askTitle: '첫 질문 등록',
        askDesc: '상황을 공유하면 정확한 답변을 받을 수 있어요.',
        askAction: '질문하기',
        askTooltip: '비자 타입과 목표를 적으면 더 빠르게 도움을 받아요.',
        answerTitle: '첫 답변 남기기',
        answerDesc: '도움을 주고 신뢰 점수를 올려보세요.',
        answerAction: '인기 질문 보기',
        answerTooltip: '도움이 된 답변이 신뢰 점수에 반영됩니다.',
        exploreTitle: '카테고리 탐색',
        exploreDesc: '관심 있는 주제를 찾아 구독해보세요.',
        exploreAction: '탐색하기',
        exploreTooltip: '카테고리를 구독하면 피드가 맞춤화돼요.',
        faqTitle: '자주 묻는 질문',
        faq1Q: '검증된 답변은 어떻게 확인하나요?',
        faq1A: '게시글/프로필의 인증·전문가 배지를 확인하세요.',
        faq2Q: '구독 관리는 어디서 하나요?',
        faq2A: '프로필 설정에서 카테고리 구독을 관리할 수 있어요.',
        faq3Q: '잘못된 정보는 어떻게 신고하나요?',
        faq3A: '게시글/답변의 신고 버튼을 눌러 주세요.',
      },
    };
    const fallback = guideFallbacks[lang as keyof typeof guideFallbacks] ?? guideFallbacks.ko;

    return {
      title: t.guideTitle || fallback.title,
      subtitle: t.guideSubtitle || fallback.subtitle,
      askTitle: t.guideAskTitle || fallback.askTitle,
      askDesc: t.guideAskDesc || fallback.askDesc,
      askAction: t.guideAskAction || fallback.askAction,
      askTooltip: t.guideAskTooltip || fallback.askTooltip,
      answerTitle: t.guideAnswerTitle || fallback.answerTitle,
      answerDesc: t.guideAnswerDesc || fallback.answerDesc,
      answerAction: t.guideAnswerAction || fallback.answerAction,
      answerTooltip: t.guideAnswerTooltip || fallback.answerTooltip,
      exploreTitle: t.guideExploreTitle || fallback.exploreTitle,
      exploreDesc: t.guideExploreDesc || fallback.exploreDesc,
      exploreAction: t.guideExploreAction || fallback.exploreAction,
      exploreTooltip: t.guideExploreTooltip || fallback.exploreTooltip,
      faqTitle: t.guideFaqTitle || fallback.faqTitle,
      faq1Q: t.guideFaq1Q || fallback.faq1Q,
      faq1A: t.guideFaq1A || fallback.faq1A,
      faq2Q: t.guideFaq2Q || fallback.faq2Q,
      faq2A: t.guideFaq2A || fallback.faq2A,
      faq3Q: t.guideFaq3Q || fallback.faq3Q,
      faq3A: t.guideFaq3A || fallback.faq3A,
    };
  }, [lang, t]);

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
                      placeholder={t.visaOtherPlaceholder || (lang === 'vi' ? 'Nhập visa khác' : lang === 'en' ? 'Other visa' : '기타 직접 입력')}
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
                {t.skip || wizardCopy.skip}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
