export const CATEGORY_GROUP_SLUGS = {
  visa: ['visa-process', 'status-change', 'visa-checklist'],
  students: ['scholarship', 'university-ranking', 'korean-language'],
  career: ['business', 'wage-info', 'legal'],
  living: ['housing', 'cost-of-living', 'healthcare'],
} as const;

const GROUP_PARENT_SLUGS = Object.keys(CATEGORY_GROUP_SLUGS);
const GROUP_CHILD_SLUGS = Object.values(CATEGORY_GROUP_SLUGS).flat();

export const DEPRECATED_GROUP_PARENT_SLUGS = new Set(['living']);
export const ACTIVE_GROUP_PARENT_SLUGS = GROUP_PARENT_SLUGS.filter(
  (slug) => !DEPRECATED_GROUP_PARENT_SLUGS.has(slug)
);

export const isGroupParentSlug = (slug: string) => GROUP_PARENT_SLUGS.includes(slug);

export const isGroupChildSlug = (slug: string) => (GROUP_CHILD_SLUGS as readonly string[]).includes(slug);

export const getChildrenForParent = (slug: string) =>
  (CATEGORY_GROUP_SLUGS as Record<string, readonly string[]>)[slug] || [];
