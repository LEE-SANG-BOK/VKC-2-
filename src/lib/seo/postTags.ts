import { localizeCommonTagLabel, type SupportedLocale } from '@/lib/constants/tag-translations';
import { buildKeywords, flattenKeywords } from '@/lib/seo/keywords';
import { LEGACY_CATEGORIES, getCategoryName } from '@/lib/constants/categories';
import { normalizeKey } from '@/utils/normalizeKey';

type ModerationInput = {
  condition?: string;
  goal?: string;
  background?: string;
};

export type PostTagGenerationInput = {
  locale: SupportedLocale;
  postType?: 'question' | 'share';
  title?: string;
  content?: string;
  categorySlug?: string | null;
  subcategorySlug?: string | null;
  moderation?: ModerationInput;
};

const STOP_KEYS = new Set([
  '한국',
  'korea',
  'vietnam',
  'viet',
  'tip',
  'tips',
  'recommend',
  'recommendation',
  'info',
  'information',
  'guide',
  'guides',
  '추천',
  '정보',
  '가이드',
  '팁',
  '도움',
  '고려',
  'gợi ý',
  'thông tin',
  'hướng dẫn',
  'goi y',
  'thong tin',
  'huong dan',
].map((value) => normalizeKey(value)));

const isMeaningful = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return false;
  const key = normalizeKey(trimmed);
  if (!key) return false;
  if (STOP_KEYS.has(key)) return false;
  if (key.length < 2) return false;
  if (/^\d+$/.test(key)) return false;
  return true;
};

const pushUnique = (target: string[], value: string, seen: Set<string>) => {
  const cleaned = value.replace(/^#/, '').trim();
  if (!isMeaningful(cleaned)) return;
  const key = normalizeKey(cleaned);
  if (!key || seen.has(key)) return;
  seen.add(key);
  target.push(cleaned);
};

const resolveCategoryLabel = (slug: string | null | undefined, locale: SupportedLocale) => {
  const trimmed = slug?.trim();
  if (!trimmed) return '';
  const legacy = LEGACY_CATEGORIES.find((cat) => cat.slug === trimmed);
  if (!legacy) return trimmed;
  return getCategoryName(legacy, locale);
};

const purposeTag = (postType: PostTagGenerationInput['postType']) => {
  if (postType === 'question') return '질문';
  if (postType === 'share') return '공유';
  return '';
};

const normalizeText = (value: string) =>
  value.replace(/([A-Za-z0-9])\s*-\s*([A-Za-z0-9])/g, '$1$2');

export const generatePostTags = ({
  locale,
  postType,
  categorySlug,
  subcategorySlug,
  moderation,
}: PostTagGenerationInput): string[] => {
  const resolvedCategory = resolveCategoryLabel(categorySlug, locale);
  const resolvedSubcategory = resolveCategoryLabel(subcategorySlug, locale);
  const resolvedPurpose = purposeTag(postType);

  const moderationText = [moderation?.condition, moderation?.goal, moderation?.background]
    .map((value) => value?.trim())
    .filter(Boolean)
    .join(' ');
  const hasModeration = moderationText.length > 0;
  const result: string[] = [];
  const seen = new Set<string>();

  const classificationCandidates = [resolvedCategory, resolvedSubcategory, resolvedPurpose].filter(Boolean);

  if (!hasModeration) {
    classificationCandidates.forEach((value) => pushUnique(result, value, seen));
  } else {
    const mainClassification = resolvedSubcategory || resolvedCategory || resolvedPurpose;
    if (mainClassification) pushUnique(result, mainClassification, seen);

    const moderationKeywords = flattenKeywords(
      buildKeywords({
        title: normalizeText(moderationText),
        content: '',
      }),
      24,
    );
    moderationKeywords.forEach((value) => {
      if (result.length >= 3) return;
      pushUnique(result, value, seen);
    });

    if (result.length < 3) {
      classificationCandidates.forEach((value) => {
        if (result.length >= 3) return;
        pushUnique(result, value, seen);
      });
    }
  }

  const localized = result
    .map((tag) => localizeCommonTagLabel(tag, locale))
    .map((tag) => tag.replace(/^#/, '').trim())
    .filter(Boolean);

  const localizedUnique: string[] = [];
  const localizedSeen = new Set<string>();
  localized.forEach((tag) => pushUnique(localizedUnique, tag, localizedSeen));

  return localizedUnique.slice(0, 3);
};
