import { normalizeKey } from '@/utils/normalizeKey';

export type KeywordInput = {
  title?: string | null;
  content?: string | null;
  tags?: string[] | null;
  category?: string | null;
  subcategory?: string | null;
};

export type KeywordResult = {
  primary: string[];
  secondary: string[];
};

const tokenize = (value?: string | null) => {
  if (!value) return [];
  return value
    .toLowerCase()
    .match(/[\p{L}\p{N}]+/gu)
    ?.map((token) => token.trim())
    .filter(Boolean) || [];
};

const pushUnique = (target: string[], token: string, seen: Set<string>, limit?: number) => {
  if (!token) return;
  if (limit && target.length >= limit) return;
  const key = normalizeKey(token);
  if (!key || seen.has(key)) return;
  seen.add(key);
  target.push(token);
};

export const buildKeywords = ({ title, content, tags, category, subcategory }: KeywordInput): KeywordResult => {
  const primary: string[] = [];
  const secondary: string[] = [];
  const seen = new Set<string>();

  (tags || [])
    .map((tag) => tag?.replace(/^#/, '').trim())
    .filter(Boolean)
    .forEach((tag) => pushUnique(primary, tag, seen, 6));

  [category, subcategory]
    .map((value) => value?.trim())
    .filter(Boolean)
    .forEach((value) => pushUnique(primary, value as string, seen, 6));

  tokenize(title).forEach((token) => pushUnique(primary, token, seen, 6));
  tokenize(content).forEach((token) => pushUnique(secondary, token, seen, 12));

  return { primary, secondary };
};

export const flattenKeywords = (result: KeywordResult, limit = 12) =>
  [...result.primary, ...result.secondary].slice(0, limit);
