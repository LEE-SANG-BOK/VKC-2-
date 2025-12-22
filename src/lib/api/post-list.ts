import { sql } from 'drizzle-orm';
import { posts, users } from '@/lib/db/schema';

export const DEFAULT_PREVIEW_LIMIT = 4000;

export const postListSelect = (previewLimit: number = DEFAULT_PREVIEW_LIMIT) => ({
  id: posts.id,
  authorId: posts.authorId,
  type: posts.type,
  title: posts.title,
  content: sql<string>`left(${posts.content}, ${previewLimit})`.as('content'),
  category: posts.category,
  subcategory: posts.subcategory,
  tags: posts.tags,
  views: posts.views,
  likes: posts.likes,
  isResolved: posts.isResolved,
  adoptedAnswerId: posts.adoptedAnswerId,
  createdAt: posts.createdAt,
  updatedAt: posts.updatedAt,
  author: {
    id: users.id,
    name: users.name,
    displayName: users.displayName,
    image: users.image,
    isVerified: users.isVerified,
    isExpert: users.isExpert,
    badgeType: users.badgeType,
  },
});

const stripHtmlToText = (html: string) =>
  html
    .replace(/<img[^>]*>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();

export const buildExcerpt = (html: string, maxLength = 200) => stripHtmlToText(html).slice(0, maxLength);

const stripTemplatePrelude = (html: string) => {
  const trimmed = html.trimStart();
  if (!trimmed.startsWith('<p>')) return html;

  const withSeparator = /^(?:\s*<p>\s*<strong>[\s\S]*?<\/strong>\s*<\/p>\s*)+<p>\s*<\/p>/i;
  if (withSeparator.test(trimmed)) {
    return trimmed.replace(withSeparator, '').trimStart();
  }

  const onlyPrelude = /^(?:\s*<p>\s*<strong>[\s\S]*?<\/strong>\s*<\/p>\s*)+/i;
  if (onlyPrelude.test(trimmed)) {
    return trimmed.replace(onlyPrelude, '').trimStart();
  }

  return html;
};

export const extractImages = (html: string, maxThumbs = 4) => {
  if (!html) return { thumbnails: [] as string[], thumbnail: null as string | null, imageCount: 0 };
  const regex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  const thumbnails: string[] = [];
  let match: RegExpExecArray | null;
  let imageCount = 0;
  let selected: string | null = null;
  while ((match = regex.exec(html))) {
    imageCount += 1;
    const src = match[1];
    if (!selected && /data-thumbnail\s*=\s*['"]?true['"]?/i.test(match[0])) {
      selected = src;
    }
    if (thumbnails.length < maxThumbs) thumbnails.push(src);
  }
  if (selected) {
    const ordered = [selected, ...thumbnails.filter((src) => src !== selected)];
    return { thumbnails: ordered.slice(0, maxThumbs), thumbnail: selected, imageCount };
  }
  return { thumbnails, thumbnail: thumbnails[0] ?? null, imageCount };
};

type PostAuthorInput = {
  id: string;
  name?: string | null;
  displayName?: string | null;
  image?: string | null;
  isVerified?: boolean | null;
  isExpert?: boolean | null;
  badgeType?: string | null;
};

type PostPreviewInput = {
  id: string;
  authorId: string;
  type: 'question' | 'share';
  title: string;
  content?: string | null;
  category: string;
  subcategory?: string | null;
  tags?: string[] | null;
  views?: number | null;
  likes?: number | null;
  isResolved?: boolean | null;
  adoptedAnswerId?: string | null;
  createdAt: Date | string;
  updatedAt?: Date | string | null;
  author?: PostAuthorInput | null;
};

export const serializePostPreview = (
  post: PostPreviewInput,
  options?: { followingIdSet?: Set<string> }
) => {
  const preview = typeof post.content === 'string' ? post.content : '';
  const { thumbnail, thumbnails, imageCount } = extractImages(preview, 4);
  const excerptSource = stripTemplatePrelude(preview);
  const author = post.author
    ? {
        ...post.author,
        isExpert: Boolean(post.author.isExpert),
        isFollowing: options?.followingIdSet ? options.followingIdSet.has(post.authorId) : false,
      }
    : post.author ?? null;

  return {
    id: post.id,
    authorId: post.authorId,
    type: post.type,
    title: post.title,
    excerpt: buildExcerpt(excerptSource),
    category: post.category,
    subcategory: post.subcategory ?? null,
    tags: Array.isArray(post.tags) ? post.tags : [],
    views: post.views ?? 0,
    likes: post.likes ?? 0,
    isResolved: post.isResolved ?? false,
    adoptedAnswerId: post.adoptedAnswerId ?? null,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt ?? post.createdAt,
    thumbnail,
    thumbnails,
    imageCount,
    author,
  };
};
