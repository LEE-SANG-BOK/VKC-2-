import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { posts, users, answers, comments, likes, bookmarks } from '@/lib/db/schema';
import { setPrivateNoStore, paginatedResponse, notFoundResponse, serverErrorResponse } from '@/lib/api/response';
import { getSession } from '@/lib/api/auth';
import { getFollowingIdSet } from '@/lib/api/follow';
import { eq, desc, sql, and, inArray, isNotNull, isNull, or, lt, type SQL } from 'drizzle-orm';
import { ACTIVE_GROUP_PARENT_SLUGS } from '@/lib/constants/category-groups';
import { postListSelect, serializePostPreview } from '@/lib/api/post-list';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10) || 20));
    const type = searchParams.get('type') as 'question' | 'share' | null;
    const cursorParam = searchParams.get('cursor');

    const currentUser = await getSession(request);

    const user = await db.query.users.findFirst({
      where: eq(users.id, id),
      columns: {
        id: true,
      },
    });

    if (!user) {
      return notFoundResponse('사용자를 찾을 수 없습니다.');
    }

    const conditions = [eq(posts.authorId, id), inArray(posts.category, ACTIVE_GROUP_PARENT_SLUGS) as SQL];
    if (type) {
      conditions.push(eq(posts.type, type));
    }

    type CursorPayload = { createdAt: string; id: string };
    const encodeCursor = (payload: CursorPayload) =>
      Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
    const decodeCursor = (raw: string): CursorPayload | null => {
      if (!raw) return null;
      try {
        const json = Buffer.from(raw, 'base64url').toString('utf8');
        const parsed = JSON.parse(json) as Partial<CursorPayload>;
        if (typeof parsed?.createdAt !== 'string' || typeof parsed?.id !== 'string') return null;
        return { createdAt: parsed.createdAt, id: parsed.id };
      } catch {
        return null;
      }
    };

    const decodedCursor = cursorParam ? decodeCursor(cursorParam) : null;
    const cursorCreatedAt = decodedCursor ? new Date(decodedCursor.createdAt) : null;
    const hasValidCursor = Boolean(decodedCursor && cursorCreatedAt && !Number.isNaN(cursorCreatedAt.getTime()));
    const useCursorPagination = Boolean(cursorParam && hasValidCursor);

    if (useCursorPagination) {
      conditions.push(
        or(
          lt(posts.createdAt, cursorCreatedAt as Date),
          and(eq(posts.createdAt, cursorCreatedAt as Date), lt(posts.id, decodedCursor?.id || ''))
        ) as SQL
      );
    }

    const total = useCursorPagination
      ? 0
      : (
          (
            await db
              .select({ count: sql<number>`count(*)::int` })
              .from(posts)
              .where(and(...conditions))
          )[0]?.count || 0
        );

    const totalPages = Math.ceil(total / limit);
    const queryLimit = useCursorPagination ? limit + 1 : limit;

    const userPosts = await db
      .select(postListSelect())
      .from(posts)
      .leftJoin(users, eq(posts.authorId, users.id))
      .where(and(...conditions))
      .orderBy(desc(posts.createdAt), desc(posts.id))
      .offset(useCursorPagination ? 0 : (page - 1) * limit)
      .limit(queryLimit);

    const rawHasMore = useCursorPagination ? userPosts.length > limit : page < totalPages;
    const pageList = useCursorPagination && userPosts.length > limit ? userPosts.slice(0, limit) : userPosts;
    const lastPost = pageList[pageList.length - 1];
    const nextCursor =
      rawHasMore && lastPost
        ? encodeCursor({
            createdAt:
              lastPost.createdAt instanceof Date
                ? lastPost.createdAt.toISOString()
                : String(lastPost.createdAt),
            id: String(lastPost.id),
          })
        : null;

    const postIds = pageList.map((post) => post.id).filter(Boolean) as string[];

    const shouldComputeResponderCounts = !useCursorPagination;
    const emptyResponderRows: Array<{ postId: string | null; authorId: string | null }> = [];

    const [answerCounts, commentCounts, officialAnswerCounts, reviewedAnswerCounts, likedRows, bookmarkedRows, answerResponders, commentResponders] =
      postIds.length > 0
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
            currentUser
              ? db
                  .select({ postId: likes.postId })
                  .from(likes)
                  .where(and(eq(likes.userId, currentUser.id), inArray(likes.postId, postIds)))
              : Promise.resolve([]),
            currentUser
              ? db
                  .select({ postId: bookmarks.postId })
                  .from(bookmarks)
                  .where(and(eq(bookmarks.userId, currentUser.id), inArray(bookmarks.postId, postIds)))
              : Promise.resolve([]),
            shouldComputeResponderCounts
              ? db
                  .select({ postId: answers.postId, authorId: answers.authorId })
                  .from(answers)
                  .where(and(inArray(answers.postId, postIds), isNotNull(answers.authorId)))
                  .groupBy(answers.postId, answers.authorId)
              : Promise.resolve(emptyResponderRows),
            shouldComputeResponderCounts
              ? db
                  .select({ postId: comments.postId, authorId: comments.authorId })
                  .from(comments)
                  .where(and(inArray(comments.postId, postIds), isNotNull(comments.authorId)))
                  .groupBy(comments.postId, comments.authorId)
              : Promise.resolve(emptyResponderRows),
          ])
        : [[], [], [], [], [], [], [], []];

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

    const likedPostIds = new Set<string>();
    likedRows.forEach((row: { postId: string | null }) => {
      if (row.postId) likedPostIds.add(row.postId);
    });

    const bookmarkedPostIds = new Set<string>();
    bookmarkedRows.forEach((row: { postId: string | null }) => {
      if (row.postId) bookmarkedPostIds.add(row.postId);
    });

    const followingIdSet = currentUser
      ? await getFollowingIdSet(
          currentUser.id,
          pageList.map((post) => post.authorId)
        )
      : new Set<string>();

    const responderIds = new Set<string>();
    answerResponders.forEach((row: { authorId: string | null }) => {
      if (row.authorId) responderIds.add(row.authorId);
    });
    commentResponders.forEach((row: { authorId: string | null }) => {
      if (row.authorId) responderIds.add(row.authorId);
    });

    const responders = responderIds.size
      ? await db.query.users.findMany({
          where: inArray(users.id, Array.from(responderIds)),
          columns: {
            id: true,
            isVerified: true,
            isExpert: true,
            badgeType: true,
          },
        })
      : [];

    const responderCertMap = new Map<string, boolean>();
    responders.forEach((responder) => {
      responderCertMap.set(responder.id, Boolean(responder.isVerified || responder.isExpert || responder.badgeType));
    });

    const certifiedRespondersByPost = new Map<string, Set<string>>();
    const otherRespondersByPost = new Map<string, Set<string>>();

    const addResponder = (postId: string | null, authorId: string | null) => {
      if (!postId || !authorId) return;

      const isCertified = responderCertMap.get(authorId) ?? false;
      const targetMap = isCertified ? certifiedRespondersByPost : otherRespondersByPost;
      const existing = targetMap.get(postId);
      if (existing) {
        existing.add(authorId);
        return;
      }
      targetMap.set(postId, new Set([authorId]));
    };

    answerResponders.forEach((row: { postId: string | null; authorId: string | null }) => {
      addResponder(row.postId, row.authorId);
    });
    commentResponders.forEach((row: { postId: string | null; authorId: string | null }) => {
      addResponder(row.postId, row.authorId);
    });

    const formattedPosts = pageList.map(post => {
      const base = serializePostPreview(post, { followingIdSet });
      const createdAt = typeof base.createdAt === 'string' ? base.createdAt : base.createdAt.toISOString();
      const answersCount = answerCountMap.get(post.id) ?? 0;
      const postCommentsCount = commentCountMap.get(post.id) ?? 0;
      const commentsCount = answersCount + postCommentsCount;
      const officialAnswerCount = officialAnswerCountMap.get(post.id) ?? 0;
      const reviewedAnswerCount = reviewedAnswerCountMap.get(post.id) ?? 0;
      
      return {
        id: base.id,
        type: base.type,
        title: base.title,
        excerpt: base.excerpt,
        category: base.category,
        subcategory: base.subcategory || undefined,
        tags: base.tags,
        views: base.views,
        likes: base.likes,
        answersCount,
        postCommentsCount,
        commentsCount,
        officialAnswerCount,
        reviewedAnswerCount,
        isResolved: base.isResolved,
        createdAt,
        publishedAt: createdAt,
        thumbnail: base.thumbnail,
        thumbnails: base.thumbnails,
        imageCount: base.imageCount,
        author: {
          id: base.author?.id || '',
          name: base.author?.displayName || base.author?.name || 'User',
          avatar: base.author?.image || '/avatar-default.jpg',
          isVerified: base.author?.isVerified || false,
          isExpert: base.author?.isExpert || false,
          badgeType: base.author?.badgeType || null,
          followers: 0,
          isFollowing: base.author?.isFollowing || false,
        },
        stats: {
          likes: base.likes,
          comments: commentsCount,
          shares: 0,
        },
        certifiedResponderCount: certifiedRespondersByPost.get(post.id)?.size ?? 0,
        otherResponderCount: otherRespondersByPost.get(post.id)?.size ?? 0,
        isLiked: currentUser ? likedPostIds.has(base.id) : false,
        isBookmarked: currentUser ? bookmarkedPostIds.has(base.id) : false,
        isQuestion: base.type === 'question',
        isAdopted: base.isResolved,
      };
    });

    const response = paginatedResponse(formattedPosts, page, limit, total, {
      nextCursor,
      hasMore: rawHasMore,
      paginationMode: useCursorPagination ? 'cursor' : 'offset',
    });
    setPrivateNoStore(response);
    return response;
  } catch (error) {
    console.error('GET /api/users/[id]/posts error:', error);
    return serverErrorResponse();
  }
}
