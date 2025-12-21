'use client';

import { useState, useEffect, useMemo, Suspense, useCallback } from 'react';
import { useRouter } from 'nextjs-toploader/app';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import dynamic from 'next/dynamic';
import { toast } from 'sonner';
import { ShieldAlert, AlertTriangle, Link as LinkIcon } from 'lucide-react';
import { useCreatePost } from '@/repo/posts/mutation';
import { logEvent } from '@/repo/events/mutation';
import { ApiError, isAccountRestrictedError } from '@/lib/api/errors';
import SimilarQuestionPrompt from '@/components/organisms/SimilarQuestionPrompt';
import Modal from '@/components/atoms/Modal';
import LoginPrompt from '@/components/organisms/LoginPrompt';
import GuidelinesModal from '@/components/molecules/modals/GuidelinesModal';
import { CATEGORY_GROUPS, LEGACY_CATEGORIES, getCategoryName } from '@/lib/constants/categories';
import { generatePostTags } from '@/lib/seo/postTags';
import type { Locale } from '@/i18n/config';
import { UGC_LIMITS, extractPlainText, getPlainTextLength, isLowQualityText } from '@/lib/validation/ugc';

const RichTextEditor = dynamic(() => import('@/components/molecules/editor/RichTextEditor'), {
  ssr: false,
  loading: () => <div className="h-64 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse" />,
});

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const formatTemplateHtml = (value: string) => escapeHtml(value).replace(/\n/g, '<br />');

const extractImageSources = (html: string) => {
  if (!html) return [];
  const regex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  const sources: string[] = [];
  const seen = new Set<string>();
  let match: RegExpExecArray | null;
  while ((match = regex.exec(html))) {
    const src = match[1];
    if (!src || seen.has(src)) continue;
    seen.add(src);
    sources.push(src);
  }
  return sources;
};

const applyThumbnailSelection = (html: string, selected: string) => {
  if (!html || !selected) return html;
  const regex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  return html.replace(regex, (tag, src) => {
    const cleaned = String(tag).replace(/\sdata-thumbnail(\s*=\s*(['"])?true\2)?/gi, '');
    if (src === selected) {
      return cleaned.replace(/<img/i, '<img data-thumbnail="true"');
    }
    return cleaned;
  });
};

const fillTemplateVariables = (template: string, variables: Record<string, string | number>) => {
  return Object.entries(variables).reduce(
    (value, [key, replacement]) => value.replace(new RegExp(`\\{${key}\\}`, 'g'), String(replacement)),
    template,
  );
};

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
  const [selectedThumbnail, setSelectedThumbnail] = useState('');
  const [templateCondition, setTemplateCondition] = useState('');
  const [templateGoal, setTemplateGoal] = useState('');
  const [templateBackground, setTemplateBackground] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagSeed] = useState(() => Math.floor(Math.random() * 1_000_000_000));
  const [tagInput, setTagInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasBannedWords, setHasBannedWords] = useState(false);
  const [hasSpamIndicators, setHasSpamIndicators] = useState(false);
  const lastCatKey = 'vk-last-category';
  const lastSubKey = 'vk-last-subcategory';
  const [manualTagEdit, setManualTagEdit] = useState(false);
  const [isLoginPromptOpen, setIsLoginPromptOpen] = useState(false);
  const openLoginPrompt = () => setIsLoginPromptOpen(true);
  const [isGuidelinesOpen, setIsGuidelinesOpen] = useState(false);

  useEffect(() => {
    if (!user?.id || isLoginPromptOpen) return;
    const storageKey = `vk-guidelines-seen-v1:${user.id}`;
    const seen = window.localStorage.getItem(storageKey);
    if (seen) return;
    setIsGuidelinesOpen(true);
  }, [user?.id, isLoginPromptOpen]);

  const closeGuidelines = useCallback(() => {
    if (user?.id) {
      const storageKey = `vk-guidelines-seen-v1:${user.id}`;
      window.localStorage.setItem(storageKey, new Date().toISOString());
      logEvent({
        eventType: 'guideline',
        entityType: 'user',
        entityId: user.id,
        locale: lang,
        metadata: {
          surface: 'posts/new',
        },
      });
    }
    setIsGuidelinesOpen(false);
  }, [user?.id, lang]);

  const scrollComposerIntoView = useCallback((element: HTMLElement) => {
    element.style.scrollMarginBottom = 'calc(var(--vk-bottom-safe-offset, 72px) + env(safe-area-inset-bottom, 0px) + 24px)';
    requestAnimationFrame(() => {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }, []);

  const handleEditorFocus = useCallback((event: React.FocusEvent<HTMLDivElement>) => {
    scrollComposerIntoView(event.currentTarget);
  }, [scrollComposerIntoView]);

  const templateTitleLabel = t.templateTitle || '';
  const templateDescLabel = t.templateDesc || '';
  const templateNoteLabel = t.templateNote || '';
  const templateConditionLabel = t.templateCondition || '';
  const templateGoalLabel = t.templateGoal || '';
  const templateBackgroundLabel = t.templateBackground || '';
  const templateConditionPlaceholder = t.templateConditionPlaceholder || '';
  const templateGoalPlaceholder = t.templateGoalPlaceholder || '';
  const templateBackgroundPlaceholder = t.templateBackgroundPlaceholder || '';
  const parentCategoryLabel = t.parentCategory || '';
  const selectParentCategoryLabel = t.selectParentCategory || '';
  const noCategoriesLabel = t.noCategories || '';
  const childCategoryLabel = t.childCategory || '';
  const selectChildCategoryLabel = t.selectChildCategory || '';
  const noChildCategoriesLabel = t.noChildCategories || '';
  const thumbnailLabel = t.thumbnailLabel || '';
  const thumbnailHint = t.thumbnailHint || '';
  const thumbnailEmpty = t.thumbnailEmpty || '';
  const thumbnailSelectedLabel = t.thumbnailSelected || '';
  const categoryRequiredError = tErrors.POST_INVALID_CATEGORY || t.validationError || '';
  const titleLowQualityError = tErrors.POST_TITLE_LOW_QUALITY || t.validationError || '';
  const contentLowQualityError = tErrors.POST_CONTENT_LOW_QUALITY || t.validationError || '';
  const bannedWarningLabel = t.bannedWarning || '';
  const spamWarningLabel = t.spamWarning || '';
  const categoryResetError = tErrors.POST_INVALID_CATEGORY || t.validationError || '';
  const childCategoryResetError = tErrors.POST_INVALID_SUBCATEGORY || t.validationError || '';
  const submitSuccessLabel = t.submitSuccess || '';
  const submitErrorLabel = t.submitError || '';
  const cancelConfirmLabel = t.cancelConfirm || '';
  const goBackLabel = t.goBack || '';
  const askQuestionLabel = t.askQuestion || '';
  const shareLabel = t.share || '';
  const rulesTitleLabel = t.rulesTitle || '';
  const rulesRespectLabel = t.rulesRespect || '';
  const rulesAdsLabel = t.rulesAds || '';
  const rulesDupLabel = t.rulesDup || '';
  const typeSelectionLabel = t.typeSelection || '';
  const questionLabel = t.question || '';
  const titleLabel = t.title || '';
  const titlePlaceholderQuestionLabel = t.titlePlaceholderQuestion || '';
  const titlePlaceholderShareLabel = t.titlePlaceholderShare || '';
  const titleMinWarningTemplate = t.titleMinWarning || '';
  const titleMaxWarningTemplate = t.titleMaxWarning || '';
  const contentLabel = t.content || '';
  const contentPlaceholderQuestionLabel = t.contentPlaceholderQuestion || '';
  const contentPlaceholderShareLabel = t.contentPlaceholderShare || '';
  const contentMinWarningTemplate = t.contentMinWarning || '';
  const contentMaxWarningTemplate = t.contentMaxWarning || '';
  const tagsLabel = t.tags || '';
  const tagsMaxLabel = t.tagsMax || '';
  const defaultTagLabel = t.defaultTag || '';
  const tagPlaceholderLabel = t.tagPlaceholder || '';
  const addLabel = t.add || '';
  const submittingLabel = t.submitting || '';
  const submitQuestionLabel = t.submitQuestion || '';
  const submitShareLabel = t.submitShare || '';
  const cancelLabel = t.cancel || '';

  const templateSections = useMemo(() => {
    const sections = [templateCondition, templateGoal, templateBackground]
      .map((value) => value.trim())
      .filter((value) => value.length > 0);
    return sections;
  }, [templateBackground, templateCondition, templateGoal]);

  const templateHtml = useMemo(() => {
    if (templateSections.length === 0) return '';
    return templateSections
      .map((section) => `<p><strong>${formatTemplateHtml(section)}</strong></p>`)
      .join('');
  }, [templateSections]);

  const resolvedContent = useMemo(() => {
    const trimmedContent = content.trim();
    if (!templateHtml) return trimmedContent;
    return trimmedContent ? `${templateHtml}<p></p>${trimmedContent}` : templateHtml;
  }, [content, templateHtml]);

  const contentImages = useMemo(() => extractImageSources(content), [content]);

  useEffect(() => {
    if (contentImages.length === 0) {
      if (selectedThumbnail) {
        setSelectedThumbnail('');
      }
      return;
    }
    if (!selectedThumbnail || !contentImages.includes(selectedThumbnail)) {
      setSelectedThumbnail(contentImages[0]);
    }
  }, [contentImages, selectedThumbnail]);

  const resolvedContentWithThumbnail = useMemo(
    () => applyThumbnailSelection(resolvedContent, selectedThumbnail),
    [resolvedContent, selectedThumbnail]
  );

  const titleLength = title.trim().length;
  const contentLength = getPlainTextLength(resolvedContentWithThumbnail);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      openLoginPrompt();
      return;
    }

    const hasChildren = childCategories.length > 0;
    if (!title.trim() || titleLength < MIN_TITLE) {
      toast.error(
        tErrors.POST_TITLE_TOO_SHORT ||
          t.validationError ||
          fillTemplateVariables(titleMinWarningTemplate, { min: MIN_TITLE }),
      );
      return;
    }
    if (titleLength > MAX_TITLE) {
      toast.error(
        tErrors.POST_TITLE_TOO_LONG ||
          t.validationError ||
          fillTemplateVariables(titleMaxWarningTemplate, { max: MAX_TITLE }),
      );
      return;
    }
    if (!resolvedContentWithThumbnail.trim() || contentLength < MIN_CONTENT) {
      toast.error(
        tErrors.POST_CONTENT_TOO_SHORT ||
          t.validationError ||
          fillTemplateVariables(contentMinWarningTemplate, { min: MIN_CONTENT }),
      );
      return;
    }
    if (contentLength > MAX_CONTENT) {
      toast.error(
        tErrors.POST_CONTENT_TOO_LONG ||
          t.validationError ||
          fillTemplateVariables(contentMaxWarningTemplate, { max: MAX_CONTENT }),
      );
      return;
    }
    if (!parentCategory || (hasChildren && !childCategory)) {
      toast.error(categoryRequiredError);
      return;
    }

    if (isLowQualityText(title)) {
      toast.error(titleLowQualityError);
      return;
    }
    if (isLowQualityText(resolvedContentWithThumbnail)) {
      toast.error(contentLowQualityError);
      return;
    }

    if (hasBannedWords) {
      toast.error(bannedWarningLabel);
      return;
    }

    if (hasSpamIndicators) {
      toast.error(spamWarningLabel);
      return;
    }

    const parentOpt = parentOptions.find((opt) => opt.slug === parentCategory);
    if (!parentOpt) {
      toast.error(categoryResetError);
      return;
    }
    const childOpt = hasChildren ? parentOpt.children.find((c) => c.slug === childCategory) : null;
    if (hasChildren && !childOpt) {
      toast.error(childCategoryResetError);
      return;
    }

    const resolvedCategory = parentOpt.slug;
    const resolvedSubcategory = hasChildren ? childOpt!.slug : null;

    setIsSubmitting(true);

    try {
      const result = await createPost.mutateAsync({
        type: postType,
        title: title.trim(),
        content: resolvedContentWithThumbnail.trim(),
        category: resolvedCategory,
        subcategory: resolvedSubcategory || undefined,
        tags: tags.length > 0 ? tags : undefined,
      });

      if (result.success && result.data) {
        toast.success(submitSuccessLabel);
        router.push(`/${lang}/posts/${result.data.id}`);
      } else {
        toast.error(submitErrorLabel);
      }
    } catch (error) {
      console.error('Failed to create post:', error);
      if (isAccountRestrictedError(error)) {
        toast.error(error.message);
      } else if (error instanceof ApiError && error.code && tErrors[error.code]) {
        toast.error(tErrors[error.code]);
      } else {
        toast.error(error instanceof Error ? error.message : submitErrorLabel);
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

  const buildDefaultTags = () => {
    return generatePostTags({
      locale: lang,
      title,
      categorySlug: parentCategory || null,
      subcategorySlug: childCategory || null,
      moderation: {
        condition: templateCondition,
        goal: templateGoal,
        background: templateBackground,
      },
      defaultTag: defaultTagLabel,
      seed: tagSeed,
    });
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

  // tags 자동 세팅: manualTagEdit가 false인 동안은 자동 갱신
  useEffect(() => {
    if (!parentOptions || parentOptions.length === 0 || !parentCategory || manualTagEdit) return;
    const defaults = buildDefaultTags();
    if (defaults.length === 0) return;
    setTags((current) => {
      const same = current.length === defaults.length && current.every((value, index) => value === defaults[index]);
      return same ? current : defaults;
    });
  }, [
    parentCategory,
    childCategory,
    title,
    templateCondition,
    templateGoal,
    templateBackground,
    manualTagEdit,
    defaultTagLabel,
    lang,
    parentOptions,
    tagSeed,
  ]);

  const handleCancel = () => {
    if (title || content || tags.length > 0 || templateCondition || templateGoal || templateBackground) {
      if (!confirm(cancelConfirmLabel)) {
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

    const text = `${title} ${templateCondition} ${templateGoal} ${templateBackground} ${content}`;
    const sanitized = text
      .replace(/<img[^>]*>/gi, ' ')
      .replace(/https?:\/\/[^\s"']*supabase\.co[^\s"']*/gi, ' ')
      .replace(/https?:\/\/[^\s"']+\.(png|jpe?g|gif|webp)/gi, ' ');
    setHasBannedWords(bannedPatterns.some((pattern) => pattern.test(text)));
    setHasSpamIndicators(spamPatterns.some((pattern) => pattern.test(sanitized)));
  }, [title, content, templateCondition, templateGoal, templateBackground]);

  return (
    <div className="min-h-screen min-h-[100dvh] bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <button
            onClick={handleCancel}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            ← {goBackLabel}
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200/50 dark:border-gray-700/50 p-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              {postType === 'question' ? askQuestionLabel : shareLabel}
            </h1>

            <div className="mb-4 rounded-xl border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-900/20 p-4 space-y-2">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-100 font-semibold">
                <ShieldAlert className="h-4 w-4" />
                <span>{rulesTitleLabel}</span>
              </div>
              <ul className="text-sm text-amber-800 dark:text-amber-50 space-y-1.5 list-disc list-inside">
                <li>{rulesRespectLabel}</li>
                <li>{rulesAdsLabel}</li>
                <li>{rulesDupLabel}</li>
              </ul>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Post Type Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  {typeSelectionLabel}
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
                    {questionLabel}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPostType('share')}
                    className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all duration-300 ${postType === 'share'
                        ? 'bg-gradient-to-r from-red-600 to-amber-500 text-white shadow-md'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                  >
                    {shareLabel}
                  </button>
                </div>
              </div>

              {/* Category Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Parent Category */}
                <div>
                  <label htmlFor="parentCategory" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    {parentCategoryLabel} <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="parentCategory"
                    value={parentCategory}
                    onChange={(e) => setParentCategory(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                    required
                  >
                    <option value="">{selectParentCategoryLabel}</option>
                    {parentOptions.length > 0 ? (
                      parentOptions.map((opt) => (
                        <option key={opt.slug} value={opt.slug}>
                          {opt.label}
                        </option>
                      ))
                    ) : (
                      <option disabled>{noCategoriesLabel}</option>
                    )}
                  </select>
                </div>

                {/* Child Category */}
                <div>
                  <label htmlFor="childCategory" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    {childCategoryLabel} <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="childCategory"
                    value={childCategory}
                    onChange={(e) => setChildCategory(e.target.value)}
                disabled={!parentCategory || childCategories.length === 0}
                className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                required={childCategories.length > 0}
              >
                <option value="">{selectChildCategoryLabel}</option>
                {(childCategories as Array<{ slug: string }>).map((child) => (
                  <option key={child.slug} value={child.slug}>
                    {getCategoryName(child as any, lang)}
                  </option>
                ))}
                  </select>
                  {parentCategory && childCategories.length === 0 && (
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {noChildCategoriesLabel}
                    </p>
                  )}
                </div>
              </div>

              {/* Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  {titleLabel} <span className="text-red-500">*</span>
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
                  placeholder={postType === 'question' ? titlePlaceholderQuestionLabel : titlePlaceholderShareLabel}
                  required
                />
                {titleLength > 0 && titleLength < MIN_TITLE ? (
                  <p className="mt-1 text-xs text-red-600">
                    {titleMinWarningTemplate.replace('{min}', String(MIN_TITLE))}
                  </p>
                ) : null}
              </div>

              {postType === 'question' ? (
                <div className="-mt-2">
                  <SimilarQuestionPrompt query={title} translations={t} />
                </div>
              ) : null}

              {postType === 'question' ? (
                <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 p-3 space-y-3">
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                      {templateTitleLabel}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {templateDescLabel}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {templateNoteLabel}
                    </p>
                  </div>
                  <div className="grid gap-2">
                    <div>
                      <label htmlFor="templateCondition" className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">
                        {templateConditionLabel}
                      </label>
                      <textarea
                        id="templateCondition"
                        value={templateCondition}
                        onChange={(e) => setTemplateCondition(e.target.value)}
                        rows={2}
                        readOnly={!user}
                        onFocus={() => {
                          if (!user) openLoginPrompt();
                        }}
                        onClick={() => {
                          if (!user) openLoginPrompt();
                        }}
                        className={`w-full px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all ${!user ? 'opacity-70 cursor-pointer' : ''}`}
                        placeholder={templateConditionPlaceholder}
                      />
                    </div>
                    <div>
                      <label htmlFor="templateGoal" className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">
                        {templateGoalLabel}
                      </label>
                      <textarea
                        id="templateGoal"
                        value={templateGoal}
                        onChange={(e) => setTemplateGoal(e.target.value)}
                        rows={2}
                        readOnly={!user}
                        onFocus={() => {
                          if (!user) openLoginPrompt();
                        }}
                        onClick={() => {
                          if (!user) openLoginPrompt();
                        }}
                        className={`w-full px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all ${!user ? 'opacity-70 cursor-pointer' : ''}`}
                        placeholder={templateGoalPlaceholder}
                      />
                    </div>
                    <div>
                      <label htmlFor="templateBackground" className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">
                        {templateBackgroundLabel}
                      </label>
                      <textarea
                        id="templateBackground"
                        value={templateBackground}
                        onChange={(e) => setTemplateBackground(e.target.value)}
                        rows={2}
                        readOnly={!user}
                        onFocus={() => {
                          if (!user) openLoginPrompt();
                        }}
                        onClick={() => {
                          if (!user) openLoginPrompt();
                        }}
                        className={`w-full px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all ${!user ? 'opacity-70 cursor-pointer' : ''}`}
                        placeholder={templateBackgroundPlaceholder}
                      />
                    </div>
                  </div>
                  {templateSections.length > 0 ? (
                    <div className="rounded-lg border border-dashed border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/60 p-2.5 space-y-1.5">
                      {templateSections.map((section, index) => (
                        <div
                          key={`${index}-${section.slice(0, 8)}`}
                          className="rounded-md bg-blue-50/70 dark:bg-blue-900/30 px-2.5 py-1.5 text-[11px] font-semibold text-blue-700 dark:text-blue-200 whitespace-pre-line"
                        >
                          {section}
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}

              {/* Rich Text Editor */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  {contentLabel} <span className="text-red-500">*</span>
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
                      placeholder={postType === 'question' ? contentPlaceholderQuestionLabel : contentPlaceholderShareLabel}
                      translations={translations}
                      onFocus={handleEditorFocus}
                      locale={lang}
                    />
                  </div>
                </div>
                {contentLength > 0 && contentLength < MIN_CONTENT ? (
                  <p className="mt-1 text-xs text-red-600">
                    {contentMinWarningTemplate.replace('{min}', String(MIN_CONTENT))}
                  </p>
                ) : null}
                {contentLength > MAX_CONTENT ? (
                  <p className="mt-1 text-xs text-red-600">
                    {contentMaxWarningTemplate.replace('{max}', String(MAX_CONTENT))}
                  </p>
                ) : null}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  {thumbnailLabel}
                </label>
                {contentImages.length > 0 ? (
                  <>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {thumbnailHint}
                    </p>
                    <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {contentImages.map((src) => {
                        const isSelected = src === selectedThumbnail;
                        return (
                          <button
                            key={src}
                            type="button"
                            onClick={() => setSelectedThumbnail(src)}
                            className={`group relative overflow-hidden rounded-lg border transition-all ${
                              isSelected
                                ? 'border-red-500 ring-2 ring-red-200 dark:ring-red-900/40'
                                : 'border-gray-200 dark:border-gray-700 hover:border-red-300'
                            }`}
                          >
                            <img
                              src={src}
                              alt={thumbnailLabel}
                              className="h-28 w-full object-cover"
                            />
                            {isSelected ? (
                              <span className="absolute left-2 top-2 rounded-full bg-red-600 px-2 py-0.5 text-xs font-semibold text-white">
                                {thumbnailSelectedLabel}
                              </span>
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {thumbnailEmpty}
                  </p>
                )}
              </div>

              {/* Tags */}
              <div>
                <label htmlFor="tags" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  {tagsLabel} <span className="text-xs text-gray-500">({tagsMaxLabel})</span>
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                    id="tags"
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    className="flex-1 px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                    placeholder={tagPlaceholderLabel}
                    disabled={tags.length >= 5}
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    disabled={tags.length >= 5 || !tagInput.trim()}
                    className="px-6 py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {addLabel}
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
                    {hasBannedWords ? <p>{bannedWarningLabel}</p> : null}
                    {hasSpamIndicators ? (
                      <p className="flex items-center gap-1">
                        <LinkIcon className="h-4 w-4" />
                        <span>{spamWarningLabel}</span>
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
                  {isSubmitting ? submittingLabel : postType === 'question' ? submitQuestionLabel : submitShareLabel}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-3 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-300 disabled:opacity-50"
                >
                  {cancelLabel}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <GuidelinesModal
        isOpen={isGuidelinesOpen}
        onClose={closeGuidelines}
        title={rulesTitleLabel}
        items={[rulesRespectLabel, rulesAdsLabel, rulesDupLabel]}
        confirmLabel={(((translations as any)?.common || {}) as Record<string, string>).confirm || ''}
      />
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
