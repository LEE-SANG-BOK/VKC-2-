'use client';

import { useState, useEffect, useMemo, Suspense, useCallback } from 'react';
import { useRouter } from 'nextjs-toploader/app';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import dynamic from 'next/dynamic';
import { toast } from 'sonner';
import { ShieldAlert, AlertTriangle, Link as LinkIcon } from 'lucide-react';
import { useCreatePost } from '@/repo/posts/mutation';
import { ApiError, isAccountRestrictedError } from '@/lib/api/errors';
import SimilarQuestionPrompt from '@/components/organisms/SimilarQuestionPrompt';
import Modal from '@/components/atoms/Modal';
import LoginPrompt from '@/components/organisms/LoginPrompt';
import { CATEGORY_GROUPS, LEGACY_CATEGORIES, getCategoryName } from '@/lib/constants/categories';
import { localizeCommonTagLabel } from '@/lib/constants/tag-translations';
import type { Locale } from '@/i18n/config';
import { UGC_LIMITS, getPlainTextLength, isLowQualityText } from '@/lib/validation/ugc';

const RichTextEditor = dynamic(() => import('@/components/molecules/editor/RichTextEditor'), {
  ssr: false,
  loading: () => <div className="h-64 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse" />,
});

interface NewPostClientProps {
  translations: Record<string, unknown>;
  lang: Locale;
}

function NewPostForm({ translations, lang }: NewPostClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const user = session?.user;
  const createPost = useCreatePost();
  const t = (translations?.newPost || {}) as Record<string, string>;
  const tErrors = (translations?.errors || {}) as Record<string, string>;
  const MIN_TITLE = UGC_LIMITS.postTitle.min;
  const MAX_TITLE = UGC_LIMITS.postTitle.max;
  const MIN_CONTENT = UGC_LIMITS.postContent.min;
  const MAX_CONTENT = UGC_LIMITS.postContent.max;

  const typeParam = searchParams.get('type');
  const initialType = typeParam === 'share' ? 'share' : 'question';
  const [postType, setPostType] = useState<'question' | 'share'>(initialType);
  const [parentCategory, setParentCategory] = useState('');
  const [childCategory, setChildCategory] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasBannedWords, setHasBannedWords] = useState(false);
  const [hasSpamIndicators, setHasSpamIndicators] = useState(false);
  const lastCatKey = 'vk-last-category';
  const lastSubKey = 'vk-last-subcategory';
  const [manualTagEdit, setManualTagEdit] = useState(false);
  const [isLoginPromptOpen, setIsLoginPromptOpen] = useState(false);
  const openLoginPrompt = () => setIsLoginPromptOpen(true);

  const scrollComposerIntoView = useCallback((element: HTMLElement) => {
    element.style.scrollMarginBottom = 'calc(var(--vk-bottom-safe-offset, 72px) + env(safe-area-inset-bottom, 0px) + 24px)';
    requestAnimationFrame(() => {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }, []);

  const handleEditorFocus = useCallback((event: React.FocusEvent<HTMLDivElement>) => {
    scrollComposerIntoView(event.currentTarget);
  }, [scrollComposerIntoView]);

  const titleLength = title.trim().length;
  const contentLength = getPlainTextLength(content);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      openLoginPrompt();
      return;
    }

    const hasChildren = childCategories.length > 0;
    if (!title.trim() || titleLength < MIN_TITLE) {
      toast.error(tErrors.POST_TITLE_TOO_SHORT || t.validationError || `제목을 최소 ${MIN_TITLE}자 이상 입력해주세요.`);
      return;
    }
    if (titleLength > MAX_TITLE) {
      toast.error(tErrors.POST_TITLE_TOO_LONG || t.validationError || `제목을 ${MAX_TITLE}자 이하로 작성해주세요.`);
      return;
    }
    if (!content.trim() || contentLength < MIN_CONTENT) {
      toast.error(tErrors.POST_CONTENT_TOO_SHORT || t.validationError || `본문을 최소 ${MIN_CONTENT}자 이상 입력해주세요.`);
      return;
    }
    if (contentLength > MAX_CONTENT) {
      toast.error(tErrors.POST_CONTENT_TOO_LONG || t.validationError || `본문을 ${MAX_CONTENT}자 이하로 작성해주세요.`);
      return;
    }
    if (!parentCategory || (hasChildren && !childCategory)) {
      toast.error(t.validationError || '카테고리를 선택해주세요.');
      return;
    }

    if (isLowQualityText(title)) {
      toast.error(tErrors.POST_TITLE_LOW_QUALITY || t.validationError || '제목이 너무 단순하거나 반복됩니다. 내용을 수정해주세요.');
      return;
    }
    if (isLowQualityText(content)) {
      toast.error(tErrors.POST_CONTENT_LOW_QUALITY || t.validationError || '내용이 너무 단순하거나 반복됩니다. 내용을 수정해주세요.');
      return;
    }

    if (hasBannedWords) {
      toast.error(t.bannedWarning || '금칙어가 포함되어 있습니다. 내용을 순화해주세요.');
      return;
    }

    if (hasSpamIndicators) {
      toast.error(t.spamWarning || '외부 링크/연락처가 감지되었습니다. 정보성 글만 허용됩니다.');
      return;
    }

    const parentOpt = parentOptions.find((opt) => opt.slug === parentCategory);
    if (!parentOpt) {
      toast.error(t.validationError || '카테고리를 다시 선택해주세요.');
      return;
    }
    const childOpt = hasChildren ? parentOpt.children.find((c) => c.slug === childCategory) : null;
    if (hasChildren && !childOpt) {
      toast.error(t.validationError || '세부분류를 다시 선택해주세요.');
      return;
    }

    const resolvedCategory = parentOpt.slug;
    const resolvedSubcategory = hasChildren ? childOpt!.slug : null;

    setIsSubmitting(true);

    try {
      const result = await createPost.mutateAsync({
        type: postType,
        title: title.trim(),
        content: content.trim(),
        category: resolvedCategory,
        subcategory: resolvedSubcategory || undefined,
        tags: tags.length > 0 ? tags : undefined,
      });

      if (result.success && result.data) {
        toast.success(t.submitSuccess || '게시글이 등록되었습니다.');
        router.push(`/${lang}/posts/${result.data.id}`);
      } else {
        toast.error(t.submitError || '게시글 작성에 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to create post:', error);
      if (isAccountRestrictedError(error)) {
        toast.error(error.message);
      } else if (error instanceof ApiError && error.code && tErrors[error.code]) {
        toast.error(tErrors[error.code]);
      } else {
        toast.error(error instanceof Error ? error.message : (t.submitError || '게시글 작성에 실패했습니다.'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // 부모 카테고리 목록: API의 최상위 카테고리 중 허용 슬러그만 사용, 없으면 LEGACY fallback
  const parentOptions = useMemo(() => {
    // 4대 대분류는 CATEGORY_GROUPS 기준으로 고정 노출
    return Object.entries(CATEGORY_GROUPS).map(([slug, group]) => {
      const majorLegacy = LEGACY_CATEGORIES.find((c) => c.slug === slug);
      const majorLabel = majorLegacy ? getCategoryName(majorLegacy, lang) : slug;
      const children = (group.slugs as readonly string[])
        .map((childSlug) => LEGACY_CATEGORIES.find((c) => c.slug === childSlug))
        .filter(Boolean) as typeof LEGACY_CATEGORIES;

      return {
        id: slug,
        slug,
        label: `${group.emoji} ${majorLabel}`,
        children,
      };
    });
  }, [lang]);

  const selectedParent = parentOptions.find((p) => p.slug === parentCategory) || parentOptions[0];
  const childCategories = selectedParent?.children || [];

  // 대분류 변경 시 세부분류 유지 가능 여부 체크 후 초기화
  useEffect(() => {
    const selectedParent = parentOptions.find(opt => opt.slug === parentCategory);
    const children = (selectedParent?.children || []) as Array<{ slug: string }>;
    const childExists = children.some((child) => child.slug === childCategory);
    if (!childExists) {
      setChildCategory('');
    }
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(lastCatKey, parentCategory || '');
      if (childExists) {
        window.localStorage.setItem(lastSubKey, childCategory);
      } else {
        window.localStorage.removeItem(lastSubKey);
      }
    }
  }, [parentCategory, parentOptions, childCategory]);

  // 카테고리별 인기 태그 매핑 (id/slug/name 소문자 키 모두 대응 + slug 포함 키워드 매칭)
  const popularTags: Record<string, string[]> = {
    'jobs': ['취업', '채용', '지원서'],
    'employment': ['취업', '지원서', '면접'],
    'intern': ['인턴', '서류', '면접'],
    'contest': ['공모전', '포트폴리오', '수상'],
    'visa': ['비자', '연장', '체류'],
    'study': ['학업', '장학금', '수업'],
    'education': ['학업', '수업', '장학금'],
    'life': ['생활', '주거', '교통'],
    'daily-life': ['생활', '주거', '생활정보'],
    'housing': ['주거', '월세', '방구하기'],
    'finance': ['금융', '계좌개설', '송금'],
    'healthcare': ['의료', '보험', '병원'],
    'legal': ['법률', '계약', '신고'],
    'business': ['비즈니스', '창업', '서류'],
    'tech': ['IT', '개발', '프로젝트'],
    'gaming': ['게임', '커뮤니티', '리뷰'],
    'korean-language': ['한국어', '토픽', '수업'],
  };

  const keywordTags: Record<string, string[]> = {
    '비자': ['비자', '연장', '체류'],
    'visa': ['비자', '연장', '체류'],
    '채용': ['취업', '채용', '면접'],
    '취업': ['취업', '채용', '면접'],
    '면접': ['면접', '자소서', '포트폴리오'],
    '인턴': ['인턴', '서류', '면접'],
    '공모전': ['공모전', '포트폴리오', '수상'],
    '포트폴리오': ['포트폴리오', '공모전', '수상'],
    '장학': ['장학금', '학업', '수업'],
    '학업': ['학업', '수업', '장학금'],
    '주거': ['주거', '월세', '방구하기'],
    '월세': ['주거', '월세', '방구하기'],
    '계좌': ['금융', '계좌개설', '송금'],
    '송금': ['송금', '계좌개설', '금융'],
    '보험': ['보험', '의료', '병원'],
    '병원': ['병원', '의료', '보험'],
    '법률': ['법률', '계약', '신고'],
    '계약': ['계약', '법률', '신고'],
    '창업': ['비즈니스', '창업', '서류'],
    '개발': ['IT', '개발', '프로젝트'],
    '게임': ['게임', '커뮤니티', '리뷰'],
    '토픽': ['한국어', '토픽', '수업'],
  };

  const extractKeywords = (text: string) => {
    const lower = text.toLowerCase();
    const tokens = lower.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
    return new Set(tokens);
  };

  const localizeTag = (tag: string) => {
    return localizeCommonTagLabel(tag, lang);
  };

  const resolveLocalizedLabel = (slug?: string) => {
    if (!slug) return '';
    const legacy = LEGACY_CATEGORIES.find((c) => c.slug === slug);
    if (legacy) {
      if (lang === 'vi' && legacy.name_vi) return legacy.name_vi;
      if (lang === 'en' && legacy.name_en) return legacy.name_en;
      return legacy.name || legacy.slug;
    }
    const childOptions = childCategories as Array<{ slug: string; label?: string }>;
    const option = parentOptions.find((p) => p.slug === slug) || childOptions.find((child) => child.slug === slug);
    return option?.label || '';
  };

  const buildDefaultTags = () => {
    const childOptions = childCategories as Array<{ slug: string; name?: string; id?: string }>;
    const child = childOptions.find((childOption) => childOption.slug === childCategory);
    const parentLabel = resolveLocalizedLabel(parentCategory) || selectedParent?.label;
    const childLabel = resolveLocalizedLabel(child?.slug) || child?.name;
    const keys = [
      child?.id, child?.slug, child?.name,
      parentCategory, selectedParent?.slug, selectedParent?.label,
    ].filter(Boolean).map((v) => v!.toLowerCase());

    const collected: string[] = [];
    keys.forEach((k) => {
      const arr = popularTags[k];
      if (arr) {
        collected.push(...arr);
        return;
      }
      if (k.includes('visa')) collected.push('비자', '연장', '체류');
      if (k.includes('job') || k.includes('employment')) collected.push('취업', '채용', '면접');
      if (k.includes('intern')) collected.push('인턴', '서류', '면접');
      if (k.includes('contest')) collected.push('공모전', '포트폴리오', '수상');
      if (k.includes('study') || k.includes('edu')) collected.push('학업', '장학금', '수업');
      if (k.includes('life') || k.includes('daily')) collected.push('생활', '주거', '교통');
      if (k.includes('finance')) collected.push('금융', '계좌개설', '송금');
      if (k.includes('health')) collected.push('의료', '보험', '병원');
      if (k.includes('legal')) collected.push('법률', '계약', '신고');
      if (k.includes('business')) collected.push('비즈니스', '창업', '서류');
      if (k.includes('tech')) collected.push('IT', '개발', '프로젝트');
      if (k.includes('game')) collected.push('게임', '커뮤니티', '리뷰');
      if (k.includes('korean')) collected.push('한국어', '토픽', '수업');
    });

    // 제목/본문 키워드 기반 태그 추가
    const keywordPool = extractKeywords(`${title} ${content}`);
    Object.entries(keywordTags).forEach(([kw, tags]) => {
      if (keywordPool.has(kw.toLowerCase())) {
        collected.push(...tags);
      }
    });

    // 카테고리/세부분류를 우선 포함
    const base = [
      childLabel,
      parentLabel,
      ...collected,
      t.defaultTag || '추천',
    ].filter(Boolean) as string[];
    const localized = base.map(localizeTag);
    const unique = Array.from(new Set(localized));
    const fallback = ['정보', 'TIP', '가이드', parentLabel, childLabel, t.defaultTag || '추천'].filter(Boolean) as string[];
    while (unique.length < 3 && fallback.length > 0) {
      const next = fallback.shift() as string;
      const localizedNext = localizeTag(next);
      if (!unique.includes(localizedNext)) unique.push(localizedNext);
    }
    return unique.slice(0, 5);
  };

  // 최근 선택 카테고리 복원
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!parentOptions || parentOptions.length === 0) return;
    const savedParent = window.localStorage.getItem(lastCatKey) || '';
    const savedChild = window.localStorage.getItem(lastSubKey) || '';
    const parentSlug = savedParent && parentOptions.some((p) => p.slug === savedParent)
      ? savedParent
      : parentOptions[0]?.slug || '';
    if (parentSlug) setParentCategory(parentSlug);
    if (savedChild) {
      const parent = parentOptions.find((p) => p.slug === parentSlug);
      const children = (parent?.children || []) as Array<{ slug: string }>;
      const childExists = children.some((child) => child.slug === savedChild);
      if (childExists) setChildCategory(savedChild);
    }
  }, [parentOptions]);

  // 하위 카테고리 변경 시 저장
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (childCategory) {
        window.localStorage.setItem(lastSubKey, childCategory);
      } else {
        window.localStorage.removeItem(lastSubKey);
      }
    }
  }, [childCategory]);

  // tags 자동 세팅: 태그가 비어 있고 카테고리가 선택된 경우만
  useEffect(() => {
    if (!parentOptions || parentOptions.length === 0 || tags.length > 0 || !parentCategory) return;
    const defaults = buildDefaultTags();
    if (defaults.length > 0 && !manualTagEdit) {
      setTags(defaults);
    }
  }, [parentCategory, childCategory, parentOptions, tags.length, manualTagEdit]);

  const handleCancel = () => {
    if (title || content || tags.length > 0) {
      if (!confirm(t.cancelConfirm || '작성 중인 내용이 있습니다. 정말 취소하시겠습니까?')) {
        return;
      }
    }
    router.back();
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim()) && tags.length < 5) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
      setManualTagEdit(true);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
    setManualTagEdit(true);
  };

  useEffect(() => {
    const bannedPatterns = [
      /씨발/i,
      /시발/i,
      /ㅅㅂ/i,
      /fuck/i,
      /shit/i,
      /đụ\s?m[aá]/i,
      /duma/i,
      /\bđm\b/i
    ];

    const spamPatterns = [
      /https?:\/\//i,
      /www\./i,
      /\S+@\S+\.\S+/i,
      /\b\d{2,3}-\d{3,4}-\d{4}\b/,
      /\b\d{9,}\b/
    ];

    const text = `${title} ${content}`;
    const sanitized = text
      .replace(/<img[^>]*>/gi, ' ')
      .replace(/https?:\/\/[^\s"']*supabase\.co[^\s"']*/gi, ' ')
      .replace(/https?:\/\/[^\s"']+\.(png|jpe?g|gif|webp)/gi, ' ');
    setHasBannedWords(bannedPatterns.some((pattern) => pattern.test(text)));
    setHasSpamIndicators(spamPatterns.some((pattern) => pattern.test(sanitized)));
  }, [title, content]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <button
            onClick={handleCancel}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            ← {t.goBack || '뒤로 가기'}
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200/50 dark:border-gray-700/50 p-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              {postType === 'question' ? (t.askQuestion || '질문하기') : (t.share || '공유하기')}
            </h1>

            <div className="mb-4 rounded-xl border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-900/20 p-4 space-y-2">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-100 font-semibold">
                <ShieldAlert className="h-4 w-4" />
                <span>{t.rulesTitle || '커뮤니티 가이드'}</span>
              </div>
              <ul className="text-sm text-amber-800 dark:text-amber-50 space-y-1.5 list-disc list-inside">
                <li>{t.rulesRespect || '예의 준수, 욕설·혐오 표현 금지'}</li>
                <li>{t.rulesAds || '광고/연락처/외부 링크 포함 글은 제한 또는 승인 필요'}</li>
                <li>{t.rulesDup || '게시 전 유사 질문 검색, 중복 게시 자제'}</li>
              </ul>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Post Type Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  {t.typeSelection || '타입 선택'}
                </label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setPostType('question')}
                    className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all duration-300 ${postType === 'question'
                        ? 'bg-gradient-to-r from-red-600 to-amber-500 text-white shadow-md'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                  >
                    {t.question || '질문'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPostType('share')}
                    className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all duration-300 ${postType === 'share'
                        ? 'bg-gradient-to-r from-red-600 to-amber-500 text-white shadow-md'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                  >
                    {t.share || '공유하기'}
                  </button>
                </div>
              </div>

              {/* Category Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Parent Category */}
                <div>
                  <label htmlFor="parentCategory" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    {t.parentCategory || '대분류'} <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="parentCategory"
                    value={parentCategory}
                    onChange={(e) => setParentCategory(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                    required
                  >
                    <option value="">{t.selectParentCategory || '대분류 선택'}</option>
                    {parentOptions.length > 0 ? (
                      parentOptions.map((opt) => (
                        <option key={opt.slug} value={opt.slug}>
                          {opt.label}
                        </option>
                      ))
                    ) : (
                      <option disabled>{t.noCategories || '카테고리가 없습니다'}</option>
                    )}
                  </select>
                </div>

                {/* Child Category */}
                <div>
                  <label htmlFor="childCategory" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    {t.childCategory || '세부분류'} <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="childCategory"
                    value={childCategory}
                    onChange={(e) => setChildCategory(e.target.value)}
                disabled={!parentCategory || childCategories.length === 0}
                className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                required={childCategories.length > 0}
              >
                <option value="">{t.selectChildCategory || '세부분류 선택'}</option>
                {(childCategories as Array<{ slug: string }>).map((child) => (
                  <option key={child.slug} value={child.slug}>
                    {getCategoryName(child as any, lang)}
                  </option>
                ))}
                  </select>
                  {parentCategory && childCategories.length === 0 && (
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {t.noChildCategories || '이 카테고리에는 세부분류가 없습니다.'}
                    </p>
                  )}
                </div>
              </div>

              {/* Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  {t.title || '제목'} <span className="text-red-500">*</span>
                </label>
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={MAX_TITLE}
                  readOnly={!user}
                  onFocus={() => {
                    if (!user) openLoginPrompt();
                  }}
                  onClick={() => {
                    if (!user) openLoginPrompt();
                  }}
                  className={`w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all ${!user ? 'opacity-70 cursor-pointer' : ''}`}
                  placeholder={postType === 'question' ? (t.titlePlaceholderQuestion || '질문을 입력하세요') : (t.titlePlaceholderShare || '제목을 입력하세요')}
                  required
                />
                {titleLength > 0 && titleLength < MIN_TITLE ? (
                  <p className="mt-1 text-xs text-red-600">
                    {t.titleMinWarning
                      ? t.titleMinWarning.replace('{min}', String(MIN_TITLE))
                      : `제목을 최소 ${MIN_TITLE}자 이상 작성해주세요.`}
                  </p>
                ) : null}
              </div>

              {postType === 'question' ? (
                <div className="-mt-2">
                  <SimilarQuestionPrompt query={title} translations={t} />
                </div>
              ) : null}

              {/* Rich Text Editor */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  {t.content || '내용'} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  {!user && (
                    <button
                      type="button"
                      onClick={openLoginPrompt}
                      className="absolute inset-0 z-10 cursor-pointer"
                      aria-label="login-required"
                    />
                  )}
                  <div className={!user ? 'pointer-events-none opacity-60' : ''}>
                    <RichTextEditor
                      content={content}
                      onChange={setContent}
                      placeholder={postType === 'question' ? (t.contentPlaceholderQuestion || '질문 내용을 작성하세요...') : (t.contentPlaceholderShare || '공유할 내용을 작성하세요...')}
                      translations={translations}
                      onFocus={handleEditorFocus}
                    />
                  </div>
                </div>
                {contentLength > 0 && contentLength < MIN_CONTENT ? (
                  <p className="mt-1 text-xs text-red-600">
                    {t.contentMinWarning
                      ? t.contentMinWarning.replace('{min}', String(MIN_CONTENT))
                      : `본문을 최소 ${MIN_CONTENT}자 이상 작성해주세요.`}
                  </p>
                ) : null}
                {contentLength > MAX_CONTENT ? (
                  <p className="mt-1 text-xs text-red-600">
                    {t.contentMaxWarning
                      ? t.contentMaxWarning.replace('{max}', String(MAX_CONTENT))
                      : `본문은 최대 ${MAX_CONTENT}자까지 작성할 수 있습니다.`}
                  </p>
                ) : null}
              </div>

              {/* Tags */}
              <div>
                <label htmlFor="tags" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  {t.tags || '태그'} <span className="text-xs text-gray-500">({t.tagsMax || '최대 5개'})</span>
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                    id="tags"
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    className="flex-1 px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                    placeholder={t.tagPlaceholder || '태그 입력 후 추가 버튼 클릭'}
                    disabled={tags.length >= 5}
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    disabled={tags.length >= 5 || !tagInput.trim()}
                    className="px-6 py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {t.add || '추가'}
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full text-sm font-medium"
                    >
                      #{tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-red-900 dark:hover:text-red-100 transition-colors"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {(hasBannedWords || hasSpamIndicators) && (
                <div className="flex items-start gap-3 rounded-lg border border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/30 p-3 text-sm text-red-800 dark:text-red-100">
                  <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div className="space-y-1">
                    {hasBannedWords ? <p>{t.bannedWarning || '금칙어가 포함되어 있습니다. 내용을 순화해주세요.'}</p> : null}
                    {hasSpamIndicators ? (
                      <p className="flex items-center gap-1">
                        <LinkIcon className="h-4 w-4" />
                        <span>{t.spamWarning || '외부 링크/연락처가 감지되었습니다. 정보성 글만 허용됩니다.'}</span>
                      </p>
                    ) : null}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="submit"
                  disabled={isSubmitting || hasBannedWords || hasSpamIndicators}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-amber-500 text-white font-semibold rounded-lg hover:from-red-700 hover:to-amber-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (t.submitting || '등록 중...') : postType === 'question' ? (t.submitQuestion || '질문 등록') : (t.submitShare || '공유 등록')}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-3 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-300 disabled:opacity-50"
                >
                  {t.cancel || '취소'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <Modal isOpen={isLoginPromptOpen} onClose={() => setIsLoginPromptOpen(false)}>
        <LoginPrompt onClose={() => setIsLoginPromptOpen(false)} variant="modal" translations={translations} />
      </Modal>
    </div>
  );
}

export default function NewPostClient({ translations, lang }: NewPostClientProps) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 dark:bg-gray-900" />}>
      <NewPostForm translations={translations} lang={lang} />
    </Suspense>
  );
}
