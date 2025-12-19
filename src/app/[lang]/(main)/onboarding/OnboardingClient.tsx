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
  const { data: session, status } = useSession();
  const { data: categories } = useCategories();
  const t = translations?.onboarding || {};
  const guideCopy = useMemo(() => {
    if (lang === 'en') {
      return {
        title: t.guideTitle || 'Quick start guide',
        subtitle: t.guideSubtitle || 'Get started with your first question, answer, and category.',
        askTitle: t.guideAskTitle || 'Ask your first question',
        askDesc: t.guideAskDesc || 'Share your situation to get focused answers.',
        askAction: t.guideAskAction || 'Ask a question',
        askTooltip: t.guideAskTooltip || 'Include your visa type and goal for faster help.',
        answerTitle: t.guideAnswerTitle || 'Leave your first answer',
        answerDesc: t.guideAnswerDesc || 'Support others and build trust.',
        answerAction: t.guideAnswerAction || 'Browse popular questions',
        answerTooltip: t.guideAnswerTooltip || 'Helpful answers raise your trust score.',
        exploreTitle: t.guideExploreTitle || 'Explore categories',
        exploreDesc: t.guideExploreDesc || 'Find the topics you care about most.',
        exploreAction: t.guideExploreAction || 'Explore now',
        exploreTooltip: t.guideExploreTooltip || 'Subscribe to categories to personalize your feed.',
        faqTitle: t.guideFaqTitle || 'FAQ',
        faq1Q: t.guideFaq1Q || 'How can I get verified answers?',
        faq1A: t.guideFaq1A || 'Check for Verified/Expert badges on posts and profiles.',
        faq2Q: t.guideFaq2Q || 'Where can I manage subscriptions?',
        faq2A: t.guideFaq2A || 'Open profile settings to manage category subscriptions.',
        faq3Q: t.guideFaq3Q || 'How do I report incorrect info?',
        faq3A: t.guideFaq3A || 'Use the report button on each post or answer.',
      };
    }
    if (lang === 'vi') {
      return {
        title: t.guideTitle || 'Hướng dẫn nhanh',
        subtitle: t.guideSubtitle || 'Bắt đầu với câu hỏi, câu trả lời và danh mục đầu tiên.',
        askTitle: t.guideAskTitle || 'Đặt câu hỏi đầu tiên',
        askDesc: t.guideAskDesc || 'Chia sẻ hoàn cảnh để nhận câu trả lời phù hợp.',
        askAction: t.guideAskAction || 'Đặt câu hỏi',
        askTooltip: t.guideAskTooltip || 'Thêm loại visa và mục tiêu để được hỗ trợ nhanh hơn.',
        answerTitle: t.guideAnswerTitle || 'Trả lời câu hỏi đầu tiên',
        answerDesc: t.guideAnswerDesc || 'Giúp cộng đồng và tăng độ tin cậy.',
        answerAction: t.guideAnswerAction || 'Xem câu hỏi nổi bật',
        answerTooltip: t.guideAnswerTooltip || 'Câu trả lời hữu ích giúp tăng điểm tin cậy.',
        exploreTitle: t.guideExploreTitle || 'Khám phá danh mục',
        exploreDesc: t.guideExploreDesc || 'Tìm chủ đề bạn quan tâm nhất.',
        exploreAction: t.guideExploreAction || 'Khám phá ngay',
        exploreTooltip: t.guideExploreTooltip || 'Theo dõi danh mục để cá nhân hóa bảng tin.',
        faqTitle: t.guideFaqTitle || 'FAQ',
        faq1Q: t.guideFaq1Q || 'Làm sao nhận câu trả lời xác minh?',
        faq1A: t.guideFaq1A || 'Xem huy hiệu Đã xác minh/Chuyên gia ở bài viết và hồ sơ.',
        faq2Q: t.guideFaq2Q || 'Quản lý theo dõi ở đâu?',
        faq2A: t.guideFaq2A || 'Mở cài đặt hồ sơ để quản lý theo dõi danh mục.',
        faq3Q: t.guideFaq3Q || 'Báo cáo thông tin sai thế nào?',
        faq3A: t.guideFaq3A || 'Dùng nút báo cáo ở mỗi bài viết hoặc câu trả lời.',
      };
    }
    return {
      title: t.guideTitle || '빠른 시작 가이드',
      subtitle: t.guideSubtitle || '첫 질문, 첫 답변, 카테고리 탐색을 바로 시작해보세요.',
      askTitle: t.guideAskTitle || '첫 질문 등록',
      askDesc: t.guideAskDesc || '상황을 공유하면 정확한 답변을 받을 수 있어요.',
      askAction: t.guideAskAction || '질문하기',
      askTooltip: t.guideAskTooltip || '비자 타입과 목표를 적으면 더 빠르게 도움을 받아요.',
      answerTitle: t.guideAnswerTitle || '첫 답변 남기기',
      answerDesc: t.guideAnswerDesc || '도움을 주고 신뢰 점수를 올려보세요.',
      answerAction: t.guideAnswerAction || '인기 질문 보기',
      answerTooltip: t.guideAnswerTooltip || '도움이 된 답변이 신뢰 점수에 반영됩니다.',
      exploreTitle: t.guideExploreTitle || '카테고리 탐색',
      exploreDesc: t.guideExploreDesc || '관심 있는 주제를 찾아 구독해보세요.',
      exploreAction: t.guideExploreAction || '탐색하기',
      exploreTooltip: t.guideExploreTooltip || '카테고리를 구독하면 피드가 맞춤화돼요.',
      faqTitle: t.guideFaqTitle || '자주 묻는 질문',
      faq1Q: t.guideFaq1Q || '검증된 답변은 어떻게 확인하나요?',
      faq1A: t.guideFaq1A || '게시글/프로필의 인증·전문가 배지를 확인하세요.',
      faq2Q: t.guideFaq2Q || '구독 관리는 어디서 하나요?',
      faq2A: t.guideFaq2A || '프로필 설정에서 카테고리 구독을 관리할 수 있어요.',
      faq3Q: t.guideFaq3Q || '잘못된 정보는 어떻게 신고하나요?',
      faq3A: t.guideFaq3A || '게시글/답변의 신고 버튼을 눌러 주세요.',
    };
  }, [lang, t]);

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

  const guideLinks = useMemo(() => {
    return {
      ask: `/${lang}/posts/new?type=question`,
      answer: `/${lang}/?c=popular`,
      explore: `/${lang}`,
    };
  }, [lang]);

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
