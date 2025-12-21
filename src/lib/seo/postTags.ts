import { localizeCommonTagLabel, type SupportedLocale } from '@/lib/constants/tag-translations';
import { buildKeywords, flattenKeywords } from '@/lib/seo/keywords';
import { normalizeKey } from '@/utils/normalizeKey';

type ModerationInput = {
  condition?: string;
  goal?: string;
  background?: string;
};

export type PostTagGenerationInput = {
  locale: SupportedLocale;
  title?: string;
  content?: string;
  categorySlug?: string | null;
  subcategorySlug?: string | null;
  moderation?: ModerationInput;
  defaultTag?: string;
  seed?: number;
};

const CATEGORY_SEEDS: Record<string, string[]> = {
  visa: ['비자', '체류', '연장', '서류', '가이드', '정보'],
  students: ['학업', '장학금', '한국어', '토픽', '수업', '정보'],
  career: ['취업', '채용', '면접', '계약', '서류', '정보'],
  living: ['생활', '주거', '교통', '금융', '송금', '의료', '보험'],
};

const SUBCATEGORY_SEEDS: Record<string, string[]> = {
  finance: ['금융', '송금', '계좌개설'],
  healthcare: ['의료', '병원', '보험'],
  housing: ['주거', '계약'],
  employment: ['취업', '채용', '면접', '계약'],
  'korean-language': ['한국어', '토픽', '수업'],
  'visa-process': ['비자', '연장', '서류'],
  'status-change': ['비자', '체류'],
  'visa-checklist': ['서류', '가이드'],
  'visa-tips': ['가이드', '정보'],
  'student-life': ['학업', '생활'],
  'daily-life': ['생활정보', '커뮤니티'],
};

const FALLBACK_SEEDS = ['정보', 'TIP', '가이드'] as const;

const STOP_KEYS = new Set(['한국', 'korea']);

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

const mulberry32 = (seed: number) => {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
};

const pickRandom = (items: string[], count: number, seed: number) => {
  if (items.length === 0 || count <= 0) return [];
  const rng = mulberry32(seed);
  const pool = [...items];
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, Math.min(count, pool.length));
};

export const generatePostTags = ({
  locale,
  title,
  content,
  categorySlug,
  subcategorySlug,
  moderation,
  defaultTag,
  seed = 0,
}: PostTagGenerationInput): string[] => {
  const moderationText = [moderation?.condition, moderation?.goal, moderation?.background]
    .map((value) => value?.trim())
    .filter(Boolean)
    .join(' ');
  const hasModeration = moderationText.length > 0;

  const keywordCandidates = flattenKeywords(
    buildKeywords({
      title: `${title || ''} ${moderationText}`.trim(),
      content: content || '',
    }),
    12,
  );

  const seeds = [
    ...(categorySlug ? (CATEGORY_SEEDS[categorySlug] || []) : []),
    ...(subcategorySlug ? (SUBCATEGORY_SEEDS[subcategorySlug] || []) : []),
    ...FALLBACK_SEEDS,
  ];

  const chosenSeeds = pickRandom(seeds, hasModeration ? 1 : 2, seed);

  const result: string[] = [];
  const seen = new Set<string>();

  chosenSeeds.forEach((value) => pushUnique(result, value, seen));
  keywordCandidates.forEach((value) => pushUnique(result, value, seen));
  FALLBACK_SEEDS.forEach((value) => pushUnique(result, value, seen));
  if (defaultTag) pushUnique(result, defaultTag, seen);

  const localized = result
    .map((tag) => localizeCommonTagLabel(tag, locale))
    .map((tag) => tag.replace(/^#/, '').trim())
    .filter(Boolean);

  const localizedUnique: string[] = [];
  const localizedSeen = new Set<string>();
  localized.forEach((tag) => pushUnique(localizedUnique, tag, localizedSeen));

  return localizedUnique.slice(0, 5);
};

