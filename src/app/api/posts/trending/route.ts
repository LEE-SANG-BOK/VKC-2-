import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { posts, users, answers, comments } from '@/lib/db/schema';
import { successResponse, serverErrorResponse } from '@/lib/api/response';
import { getSession } from '@/lib/api/auth';
import { getFollowingIdSet } from '@/lib/api/follow';
import { and, desc, eq, gte, inArray, isNull, sql, type SQL } from 'drizzle-orm';
import dayjs from 'dayjs';
import { isExpertBadgeType } from '@/lib/constants/badges';
import { ACTIVE_GROUP_PARENT_SLUGS } from '@/lib/constants/category-groups';

const resolveTrust = (author: any, createdAt: Date | string) => {
  const months = dayjs().diff(createdAt, 'month', true);
  if (months >= 12) return { badge: 'outdated', weight: 0.5 };
  if (author?.isExpert || isExpertBadgeType(author?.badgeType)) return { badge: 'expert', weight: 1.3 };
  if (author?.isVerified || author?.badgeType) return { badge: 'verified', weight: 1 };
  return { badge: 'community', weight: 0.7 };
};

const stripHtmlToText = (html: string) =>
  html
    .replace(/<img[^>]*>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const buildExcerpt = (html: string, maxLength = 200) => stripHtmlToText(html).slice(0, maxLength);

const extractImages = (html: string, maxThumbs = 4) => {
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

/**
 * GET /api/posts/trending
 * 인기 게시글 조회
 *
 * Query Params:
 * - limit: number (default: 10) - 개수
 * - period: 'day' | 'week' | 'month' (default: 'week') - 기간
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(30, Math.max(1, parseInt(searchParams.get('limit') || '10', 10) || 10));
    const periodParam = searchParams.get('period');
    const period = periodParam === 'day' || periodParam === 'week' || periodParam === 'month' ? periodParam : 'week';

    const currentUser = await getSession(request);

    // 기간별 날짜 계산
    let daysAgo = 7; // week
    if (period === 'day') daysAgo = 1;
    else if (period === 'month') daysAgo = 30;

    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - daysAgo);

    const fetchLimit = Math.min(90, limit * 3);
    const contentPreviewLimit = 4000;

    const selectTrendingRows = (from?: Date) => {
      const baseConditions: SQL[] = [inArray(posts.category, ACTIVE_GROUP_PARENT_SLUGS) as SQL];
      if (from) {
        baseConditions.push(gte(posts.createdAt, from));
      }
      const whereClause = baseConditions.length > 1 ? and(...baseConditions) : baseConditions[0];

      return db
        .select({
          id: posts.id,
          authorId: posts.authorId,
          type: posts.type,
          title: posts.title,
          content: sql<string>`left(${posts.content}, ${contentPreviewLimit})`.as('content'),
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
        })
        .from(posts)
        .leftJoin(users, eq(posts.authorId, users.id))
        .where(whereClause)
        .orderBy(
          desc(sql`${posts.likes} * 2 + ${posts.views}`),
          desc(posts.createdAt),
          desc(posts.id)
        )
        .limit(fetchLimit);
    };

    const baseRows = await selectTrendingRows(dateFrom);
    const needsFallback = baseRows.length < limit;
    const fallbackRows = needsFallback ? await selectTrendingRows() : [];
    const seenIds = new Set(baseRows.map((row) => row.id));
    const trendingPosts = needsFallback
      ? [...baseRows, ...fallbackRows.filter((row) => !seenIds.has(row.id))].slice(0, fetchLimit)
      : baseRows;

    const postIds = trendingPosts.map((post) => post.id).filter(Boolean) as string[];
    const [answerCounts, commentCounts, officialAnswerCounts, reviewedAnswerCounts] = postIds.length
      ? await Promise.all([
          db
            .select({ postId: answers.postId, count: sql<number>`count(*)::int` })
            .from(answers)
            .where(inArray(answers.postId, postIds))
            .groupBy(answers.postId),
          db
            .select({ postId: comments.postId, count: sql<number>`count(*)::int` })
            .from(comments)
            .where(and(inArray(comments.postId, postIds), isNull(comments.parentId)))
            .groupBy(comments.postId),
          db
            .select({ postId: answers.postId, count: sql<number>`count(*)::int` })
            .from(answers)
            .where(and(inArray(answers.postId, postIds), eq(answers.isOfficial, true)))
            .groupBy(answers.postId),
          db
            .select({ postId: answers.postId, count: sql<number>`count(*)::int` })
            .from(answers)
            .where(
              and(
                inArray(answers.postId, postIds),
                eq(answers.reviewStatus, 'approved'),
                eq(answers.isOfficial, false)
              )
            )
            .groupBy(answers.postId),
        ])
      : [[], [], [], []];

    const answerCountMap = new Map<string, number>();
    answerCounts.forEach((row) => {
      if (row.postId) answerCountMap.set(row.postId, row.count);
    });

    const commentCountMap = new Map<string, number>();
    commentCounts.forEach((row) => {
      if (row.postId) commentCountMap.set(row.postId, row.count);
    });

    const officialAnswerCountMap = new Map<string, number>();
    officialAnswerCounts.forEach((row) => {
      if (row.postId) officialAnswerCountMap.set(row.postId, row.count);
    });

    const reviewedAnswerCountMap = new Map<string, number>();
    reviewedAnswerCounts.forEach((row) => {
      if (row.postId) reviewedAnswerCountMap.set(row.postId, row.count);
    });

    const followingIdSet = currentUser
      ? await getFollowingIdSet(
          currentUser.id,
          trendingPosts.map((post) => post.authorId)
        )
      : new Set<string>();

    const decorated = trendingPosts.map((post) => {
      const content = typeof post.content === 'string' ? post.content : '';
      const { thumbnail, thumbnails, imageCount } = extractImages(content, 4);
      const trust = resolveTrust(post.author, post.createdAt);
      const baseScore = (post.likes ?? 0) * 2 + (post.views ?? 0);
      const answersCount = answerCountMap.get(post.id) ?? 0;
      const postCommentsCount = commentCountMap.get(post.id) ?? 0;
      const commentsCount = answersCount + postCommentsCount;
      const officialAnswerCount = officialAnswerCountMap.get(post.id) ?? 0;
      const reviewedAnswerCount = reviewedAnswerCountMap.get(post.id) ?? 0;
      const ageDays = dayjs().diff(post.createdAt, 'day', true);
      const recencyWeight = Math.max(0.6, 1 - ageDays / (daysAgo * 1.5));
      const engagementScore = answersCount * 3 + postCommentsCount;
      const excerpt = buildExcerpt(content);

      return {
        id: post.id,
        authorId: post.authorId,
        type: post.type,
        title: post.title,
        excerpt,
        category: post.category,
        subcategory: post.subcategory,
        tags: Array.isArray(post.tags) ? post.tags : [],
        views: post.views ?? 0,
        likes: post.likes ?? 0,
        answersCount,
        postCommentsCount,
        commentsCount,
        officialAnswerCount,
        reviewedAnswerCount,
        isResolved: post.isResolved ?? false,
        adoptedAnswerId: post.adoptedAnswerId ?? null,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        author: post.author
          ? {
              ...post.author,
              isExpert: post.author.isExpert || false,
              isFollowing: currentUser ? followingIdSet.has(post.authorId) : false,
            }
          : post.author,
        trustBadge: trust.badge,
        trustWeight: trust.weight,
        thumbnail,
        thumbnails,
        imageCount,
        score: (baseScore + engagementScore) * trust.weight * recencyWeight,
      };
    });

    const sorted = [...decorated]
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(({ score, ...post }) => post);

    const response = successResponse(sorted);
    response.headers.set(
      'Cache-Control',
      currentUser ? 'private, no-store' : 'public, s-maxage=300, stale-while-revalidate=600'
    );
    return response;
  } catch (error) {
    console.error('GET /api/posts/trending error:', error);
    return serverErrorResponse();
  }
}
