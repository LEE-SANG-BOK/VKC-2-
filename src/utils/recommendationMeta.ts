import { LEGACY_CATEGORIES, getCategoryName } from '@/lib/constants/categories';
import { localizeCommonTagLabel } from '@/lib/constants/tag-translations';
import { normalizeKey } from '@/utils/normalizeKey';
import { getUserTypeLabel } from '@/utils/userTypeLabel';

export type RecommendationMetaItem = {
  key: string;
  value: string | number;
};

interface RecommendationMetaArgs {
  items?: RecommendationMetaItem[] | null;
  fallback?: RecommendationMetaItem[];
  metaLabels?: Record<string, string>;
  badgeLabels?: Record<string, string>;
}

type OnboardingLabels = Partial<Record<string, string>>;

export function localizeRecommendationMetaItems({
  items,
  locale,
  onboardingLabels = {},
}: {
  items?: RecommendationMetaItem[] | null;
  locale: 'ko' | 'en' | 'vi';
  onboardingLabels?: OnboardingLabels;
}): RecommendationMetaItem[] {
  const userTypeLabels = {
    student: onboardingLabels.userTypeStudent || '',
    worker: onboardingLabels.userTypeWorker || '',
    resident: onboardingLabels.userTypeResident || '',
    business: onboardingLabels.userTypeBusiness || '',
    homemaker: onboardingLabels.userTypeHomemaker || '',
    other: onboardingLabels.userTypeOther || '',
  };
  const koreanLevelLabels = {
    beginner: onboardingLabels.koreanLevel_beginner || '',
    intermediate: onboardingLabels.koreanLevel_intermediate || '',
    advanced: onboardingLabels.koreanLevel_advanced || '',
  };
  const resolveInterestLabel = (value: string) => {
    const normalized = normalizeKey(value);
    const legacy = LEGACY_CATEGORIES.find((category) => {
      const candidates = [category.slug, category.name, category.name_en, category.name_vi].filter(Boolean) as string[];
      return candidates.some((candidate) => normalizeKey(candidate) === normalized);
    });
    if (legacy) return getCategoryName(legacy, locale);
    return localizeCommonTagLabel(value, locale);
  };

  return (items || [])
    .map((item) => {
      if (!item) return null;
      if (typeof item.value !== 'string') return null;
      const raw = item.value.trim();
      if (!raw) return null;
      let value = raw;
      if (item.key === 'userType') {
        value = getUserTypeLabel(raw, userTypeLabels);
      } else if (item.key === 'koreanLevel') {
        const normalized = raw.toLowerCase();
        value = koreanLevelLabels[normalized as keyof typeof koreanLevelLabels] || raw;
    } else if (item.key === 'interest') {
      value = resolveInterestLabel(raw);
    } else if (item.key === 'visaType') {
      value = raw.toUpperCase();
    }
      if (item.key !== 'visaType' && /\d/.test(value)) return null;
      return {
        ...item,
        value,
      };
    })
    .filter(Boolean) as RecommendationMetaItem[];
}

export function formatRecommendationMetaItems({
  items,
  fallback = [],
  metaLabels = {},
  badgeLabels = {},
}: RecommendationMetaArgs): string[] {
  const source = Array.isArray(items) && items.length > 0 ? items : fallback;
  const stripOrdinalPrefix = (value: string) => value.replace(/^#?\s*\d+[\.:)]?\s*/u, '').trim();

  return source
    .filter((item) => item && item.value !== null && item.value !== undefined && item.value !== '')
    .slice(0, 3)
    .map((item) => {
      if (item.key === 'badge' && typeof item.value === 'string') {
        const normalized = item.value.toLowerCase();
        return stripOrdinalPrefix(badgeLabels[normalized] || item.value);
      }

      if (typeof item.value === 'string') return stripOrdinalPrefix(item.value);

      const label = metaLabels[item.key] || item.key;
      const suffix = item.key.toLowerCase().includes('rate') ? '%' : '';
      return stripOrdinalPrefix(`${label} ${item.value}${suffix}`.trim());
    });
}
