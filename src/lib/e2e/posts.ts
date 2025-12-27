import dayjs from 'dayjs';
import { buildExcerpt, extractImages } from '@/lib/api/post-list';
import type { E2EPost, E2EStore } from './store';

const stripTemplatePrelude = (html: string) => {
  const trimmed = html.trimStart();
  if (!trimmed.startsWith('<p')) return html;

  const withSeparator =
    /^(?:\s*<p[^>]*>\s*<strong>[\s\S]*?<\/strong>\s*<\/p>\s*)+<p[^>]*>\s*<\/p>/i;
  if (withSeparator.test(trimmed)) {
    return trimmed.replace(withSeparator, '').trimStart();
  }

  const onlyPrelude = /^(?:\s*<p[^>]*>\s*<strong>[\s\S]*?<\/strong>\s*<\/p>\s*)+/i;
  if (onlyPrelude.test(trimmed)) {
    return trimmed.replace(onlyPrelude, '').trimStart();
  }

  return html;
};

const resolvePostTrust = (
  author: { isVerified: boolean; isExpert: boolean; badgeType: string | null },
  createdAt: string
) => {
  const months = dayjs().diff(createdAt, 'month', true);
  if (months >= 12) return { badge: 'outdated' as const, weight: 0.5 };
  if (author.isExpert) return { badge: 'expert' as const, weight: 1.3 };
  if (author.isVerified || author.badgeType) return { badge: 'verified' as const, weight: 1 };
  return { badge: 'community' as const, weight: 0.7 };
};

export const countFollowers = (store: E2EStore, targetUserId: string) => {
  let total = 0;
  store.followsByUserId.forEach((targets) => {
    if (targets.has(targetUserId)) total += 1;
  });
  return total;
};

export const formatPublishedAt = (value: string) => dayjs(value).format('YYYY.MM.DD HH:mm');

export const buildPostPreview = (store: E2EStore, post: E2EPost, viewerId: string | null) => {
  const author = store.users.get(post.authorId);
  const { thumbnail, thumbnails, imageCount } = extractImages(post.content || '', 4);
  const liked = viewerId ? store.likesByUserId.get(viewerId)?.has(post.id) === true : false;
  const bookmarked = viewerId ? store.bookmarksByUserId.get(viewerId)?.has(post.id) === true : false;
  const following = viewerId ? store.followsByUserId.get(viewerId)?.has(post.authorId) === true : false;
  const trust = author ? resolvePostTrust(author, post.createdAt) : null;
  const excerptSource = stripTemplatePrelude(post.content || '');

  const answersForPost = Array.from(store.answers.values()).filter((answer) => answer.postId === post.id);
  const postCommentsForPost = Array.from(store.comments.values()).filter(
    (comment) => comment.postId === post.id && !comment.answerId && !comment.parentId
  );
  const answersCount = answersForPost.length;
  const postCommentsCount = postCommentsForPost.length;

  const certifiedResponderIds = new Set<string>();
  const otherResponderIds = new Set<string>();

  const addResponder = (authorId: string) => {
    if (certifiedResponderIds.has(authorId)) return;
    const user = store.users.get(authorId);
    const isCertified = Boolean(user?.isVerified || user?.isExpert || user?.badgeType);
    if (isCertified) {
      certifiedResponderIds.add(authorId);
      otherResponderIds.delete(authorId);
      return;
    }
    otherResponderIds.add(authorId);
  };

  answersForPost.forEach((answer) => addResponder(answer.authorId));
  Array.from(store.comments.values())
    .filter((comment) => comment.postId === post.id)
    .forEach((comment) => addResponder(comment.authorId));

  return {
    id: post.id,
    authorId: post.authorId,
    type: post.type,
    title: post.title,
    excerpt: buildExcerpt(excerptSource || '', 200),
    content: post.content,
    category: post.category,
    subcategory: post.subcategory ?? null,
    tags: post.tags,
    views: post.views,
    likes: post.likes,
    likesCount: post.likes,
    isResolved: post.isResolved,
    adoptedAnswerId: post.adoptedAnswerId,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    thumbnail,
    thumbnails,
    imageCount,
    isLiked: liked,
    isBookmarked: bookmarked,
    answersCount,
    postCommentsCount,
    commentsCount: answersCount + postCommentsCount,
    certifiedResponderCount: certifiedResponderIds.size,
    otherResponderCount: otherResponderIds.size,
    officialAnswerCount: 0,
    reviewedAnswerCount: 0,
    trustBadge: trust?.badge,
    trustWeight: trust?.weight,
    author: author
      ? {
          id: author.id,
          name: author.name,
          displayName: author.displayName,
          image: author.image,
          isVerified: author.isVerified,
          isExpert: author.isExpert,
          badgeType: author.badgeType,
          isFollowing: following,
        }
      : null,
  };
};

export const buildPostDetail = (store: E2EStore, post: E2EPost, viewerId: string | null) => {
  const author = store.users.get(post.authorId);
  const liked = viewerId ? store.likesByUserId.get(viewerId)?.has(post.id) === true : false;
  const bookmarked = viewerId ? store.bookmarksByUserId.get(viewerId)?.has(post.id) === true : false;
  const following = viewerId ? store.followsByUserId.get(viewerId)?.has(post.authorId) === true : false;

  const answersForPost = Array.from(store.answers.values()).filter((answer) => answer.postId === post.id);
  const postCommentsForPost = Array.from(store.comments.values()).filter(
    (comment) => comment.postId === post.id && !comment.answerId && !comment.parentId
  );

  const answersCount = answersForPost.length;
  const postCommentsCount = postCommentsForPost.length;
  const commentsCount = answersCount + postCommentsCount;

  const resolvedAuthor = author
    ? {
        id: author.id,
        name: author.displayName || author.name || '알 수 없음',
        avatar: author.image || '/default-avatar.jpg',
        followers: countFollowers(store, author.id),
        isFollowing: following,
        isVerified: author.isVerified,
        isExpert: author.isExpert,
        badgeType: author.badgeType,
      }
    : {
        id: post.authorId,
        name: '알 수 없음',
        avatar: '/default-avatar.jpg',
        followers: 0,
        isFollowing: false,
        isVerified: false,
        isExpert: false,
        badgeType: null,
      };

  const trust = resolvePostTrust(resolvedAuthor, post.createdAt);
  const { thumbnail, thumbnails, imageCount } = extractImages(post.content || '', 4);

  return {
    id: post.id,
    authorId: post.authorId,
    type: post.type,
    title: post.title,
    content: post.content,
    category: post.category,
    subcategory: post.subcategory ?? undefined,
    tags: post.tags,
    views: post.views,
    likes: post.likes,
    isResolved: post.isResolved,
    adoptedAnswerId: post.adoptedAnswerId,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    author: resolvedAuthor,
    trustBadge: trust.badge,
    trustWeight: trust.weight,
    thumbnail,
    thumbnails,
    imageCount,
    stats: {
      likes: post.likes,
      comments: commentsCount,
      shares: 0,
    },
    answersCount,
    postCommentsCount,
    commentsCount,
    publishedAt: formatPublishedAt(post.createdAt),
    isLiked: liked,
    isBookmarked: bookmarked,
    comments: [],
    answers: [],
    isQuestion: post.type === 'question',
    isAdopted: post.isResolved,
  };
};
