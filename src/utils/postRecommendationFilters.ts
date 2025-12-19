import type { PostFilters } from '@/repo/posts/types';

type RelatedQueryInput = {
  title?: string | null;
  tags?: string[] | null;
  category?: string | null;
  type?: 'question' | 'share';
  limit?: number;
};

type CategoryPopularInput = {
  category?: string | null;
  type?: 'question' | 'share';
  limit?: number;
};

const normalizeTokens = (value: string) => {
  const normalized = value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
  if (!normalized) return [];
  return normalized.split(/\s+/).filter(Boolean);
};

export const buildRelatedSearchQuery = ({
  title,
  tags,
  maxTokens = 4,
  minLength = 2,
}: {
  title?: string | null;
  tags?: string[] | null;
  maxTokens?: number;
  minLength?: number;
}) => {
  const tagTokens = (tags || [])
    .flatMap((tag) => normalizeTokens(tag.replace(/^#/, '')))
    .filter(Boolean);
  const titleTokens = title ? normalizeTokens(title) : [];
  const seedTokens = tagTokens.length > 0 ? tagTokens : titleTokens;
  const uniqueTokens = Array.from(new Set(seedTokens));
  const query = uniqueTokens.slice(0, Math.max(1, maxTokens)).join(' ');
  return query.length >= minLength ? query : '';
};

export const buildRelatedPostFilters = ({
  title,
  tags,
  category,
  type,
  limit = 6,
}: RelatedQueryInput): PostFilters | null => {
  const search = buildRelatedSearchQuery({ title, tags });
  if (!search) return null;
  const normalizedCategory = category?.trim();
  return {
    page: 1,
    limit,
    category: normalizedCategory || undefined,
    type,
    search,
    sort: 'latest',
  };
};

export const buildCategoryPopularFilters = ({
  category,
  type,
  limit = 6,
}: CategoryPopularInput): PostFilters | null => {
  const normalizedCategory = category?.trim();
  if (!normalizedCategory) return null;
  return {
    page: 1,
    limit,
    category: normalizedCategory,
    type,
    sort: 'popular',
  };
};
