import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { posts, users, answers, comments } from '@/lib/db/schema';
import { setPrivateNoStore, setPublicSWR, successResponse, serverErrorResponse } from '@/lib/api/response';
import { getSession } from '@/lib/api/auth';
import { getFollowingIdSet } from '@/lib/api/follow';
import { and, desc, eq, gte, inArray, isNull, sql, type SQL } from 'drizzle-orm';
import dayjs from 'dayjs';
import { isExpertBadgeType } from '@/lib/constants/badges';
import { ACTIVE_GROUP_PARENT_SLUGS } from '@/lib/constants/category-groups';
import { postListSelect, serializePostPreview } from '@/lib/api/post-list';
import { isE2ETestMode } from '@/lib/e2e/mode';
import { getE2ERequestState } from '@/lib/e2e/request';
import { buildPostPreview } from '@/lib/e2e/posts';

const resolveTrust = (author: any, createdAt: Date | string) => {
  const months = dayjs().diff(createdAt, 'month', true);
  if (months >= 12) return { badge: 'outdated', weight: 0.5 };
  if (author?.isExpert || isExpertBadgeType(author?.badgeType)) return { badge: 'expert', weight: 1.3 };
  if (author?.isVerified || author?.badgeType) return { badge: 'verified', weight: 1 };
  return { badge: 'community', weight: 0.7 };
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

    if (isE2ETestMode()) {
      const { store, userId } = getE2ERequestState(request);
      const items = Array.from(store.posts.values()).sort((a, b) => {
        const scoreA = a.likes * 2 + a.views;
        const scoreB = b.likes * 2 + b.views;
        if (scoreA !== scoreB) return scoreB - scoreA;
        return b.createdAt.localeCompare(a.createdAt);
      });
      const data = items.slice(0, limit).map((post) => buildPostPreview(store, post, userId));
      const response = successResponse(data);
      setPublicSWR(response, 300, 600);
      return response;
    }

    const currentUser = await getSession(request);

    // 기간별 날짜 계산
    let daysAgo = 7; // week
    if (period === 'day') daysAgo = 1;
    else if (period === 'month') daysAgo = 30;

    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - daysAgo);

    const fetchLimit = Math.min(90, limit * 3);
    const selectTrendingRows = (from?: Date) => {
      const baseConditions: SQL[] = [inArray(posts.category, ACTIVE_GROUP_PARENT_SLUGS) as SQL];
      if (from) {
        baseConditions.push(gte(posts.createdAt, from));
      }
      const whereClause = baseConditions.length > 1 ? and(...baseConditions) : baseConditions[0];

      return db
        .select(postListSelect())
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
      const trust = resolveTrust(post.author, post.createdAt);
      const base = serializePostPreview(post, { followingIdSet });
      const baseScore = (post.likes ?? 0) * 2 + (post.views ?? 0);
      const answersCount = answerCountMap.get(post.id) ?? 0;
      const postCommentsCount = commentCountMap.get(post.id) ?? 0;
      const commentsCount = answersCount + postCommentsCount;
      const officialAnswerCount = officialAnswerCountMap.get(post.id) ?? 0;
      const reviewedAnswerCount = reviewedAnswerCountMap.get(post.id) ?? 0;
      const ageDays = dayjs().diff(post.createdAt, 'day', true);
      const recencyWeight = Math.max(0.6, 1 - ageDays / (daysAgo * 1.5));
      const engagementScore = answersCount * 3 + postCommentsCount;

      return {
        ...base,
        answersCount,
        postCommentsCount,
        commentsCount,
        officialAnswerCount,
        reviewedAnswerCount,
        trustBadge: trust.badge,
        trustWeight: trust.weight,
        score: (baseScore + engagementScore) * trust.weight * recencyWeight,
      };
    });

    const sorted = [...decorated]
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(({ score, ...post }) => post);

    const response = successResponse(sorted);
    if (currentUser) {
      setPrivateNoStore(response);
    } else {
      setPublicSWR(response, 300, 600);
    }
    return response;
  } catch (error) {
    console.error('GET /api/posts/trending error:', error);
    return serverErrorResponse();
  }
}
