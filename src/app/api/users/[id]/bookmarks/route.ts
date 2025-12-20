import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { bookmarks, users, answers, comments, likes, posts } from '@/lib/db/schema';
import { paginatedResponse, notFoundResponse, serverErrorResponse, unauthorizedResponse } from '@/lib/api/response';
import { getSession } from '@/lib/api/auth';
import { getFollowingIdSet } from '@/lib/api/follow';
import { eq, desc, sql, inArray, and, isNotNull, isNull, or, lt, type SQL } from 'drizzle-orm';
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
    const cursorParam = searchParams.get('cursor');

    const currentUser = await getSession(request);
    if (!currentUser || currentUser.id !== id) {
      return unauthorizedResponse('북마크는 본인만 조회할 수 있습니다.');
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, id),
      columns: {
        id: true,
      },
    });

    if (!user) {
      return notFoundResponse('사용자를 찾을 수 없습니다.');
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

    const conditions = [
      eq(bookmarks.userId, id),
      inArray(posts.category, ACTIVE_GROUP_PARENT_SLUGS) as SQL,
    ];
    if (useCursorPagination) {
      conditions.push(
        or(
          lt(bookmarks.createdAt, cursorCreatedAt as Date),
          and(eq(bookmarks.createdAt, cursorCreatedAt as Date), lt(bookmarks.id, decodedCursor?.id || ''))
        ) as SQL
      );
    }

    const total = useCursorPagination
      ? 0
      : (
          (
            await db
              .select({ count: sql<number>`count(*)::int` })
              .from(bookmarks)
              .where(eq(bookmarks.userId, id))
          )[0]?.count || 0
        );

    const totalPages = Math.ceil(total / limit);
    const queryLimit = useCursorPagination ? limit + 1 : limit;

    const bookmarkRows = await db
      .select({
        bookmarkId: bookmarks.id,
        bookmarkCreatedAt: bookmarks.createdAt,
        ...postListSelect(),
      })
      .from(bookmarks)
      .innerJoin(posts, eq(bookmarks.postId, posts.id))
      .leftJoin(users, eq(posts.authorId, users.id))
      .where(and(...conditions))
      .orderBy(desc(bookmarks.createdAt), desc(bookmarks.id))
      .offset(useCursorPagination ? 0 : (page - 1) * limit)
      .limit(queryLimit);

    const rawHasMore = useCursorPagination ? bookmarkRows.length > limit : page < totalPages;
    const pageList = useCursorPagination && bookmarkRows.length > limit ? bookmarkRows.slice(0, limit) : bookmarkRows;
    const lastBookmark = pageList[pageList.length - 1];
    const nextCursor =
      rawHasMore && lastBookmark
        ? encodeCursor({
            createdAt:
              lastBookmark.bookmarkCreatedAt instanceof Date
                ? lastBookmark.bookmarkCreatedAt.toISOString()
                : String(lastBookmark.bookmarkCreatedAt),
            id: String(lastBookmark.bookmarkId),
          })
        : null;

    const postIds = pageList.map((bookmark) => bookmark.id).filter(Boolean) as string[];

    const shouldComputeResponderCounts = !useCursorPagination;
    const emptyResponderRows: Array<{ postId: string | null; authorId: string | null }> = [];

    const [answerCounts, commentCounts, officialAnswerCounts, reviewedAnswerCounts, likedRows, answerResponders, commentResponders] =
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
            db
              .select({ postId: likes.postId })
              .from(likes)
              .where(and(eq(likes.userId, currentUser.id), inArray(likes.postId, postIds))),
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
        : [[], [], [], [], [], [], []];

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

    const followingIdSet = currentUser
      ? await getFollowingIdSet(
          currentUser.id,
          pageList.map((bookmark) => bookmark.authorId)
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

    const formattedBookmarks = pageList.map(bookmark => {
      const base = serializePostPreview(bookmark, { followingIdSet });
      const createdAt = typeof base.createdAt === 'string' ? base.createdAt : base.createdAt.toISOString();
      const postId = bookmark.id;
      const answersCount = postId ? (answerCountMap.get(postId) ?? 0) : 0;
      const postCommentsCount = postId ? (commentCountMap.get(postId) ?? 0) : 0;
      const commentsCount = answersCount + postCommentsCount;
      const officialAnswerCount = postId ? (officialAnswerCountMap.get(postId) ?? 0) : 0;
      const reviewedAnswerCount = postId ? (reviewedAnswerCountMap.get(postId) ?? 0) : 0;
      
      return {
        id: base.id,
        type: base.type,
        title: base.title || '',
        excerpt: base.excerpt,
        category: base.category || '',
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
        certifiedResponderCount: postId ? (certifiedRespondersByPost.get(postId)?.size ?? 0) : 0,
        otherResponderCount: postId ? (otherRespondersByPost.get(postId)?.size ?? 0) : 0,
        isLiked: postId ? likedPostIds.has(postId) : false,
        isBookmarked: true,
        isQuestion: base.type === 'question',
        isAdopted: base.isResolved,
        bookmarkedAt: bookmark.bookmarkCreatedAt?.toISOString(),
      };
    });

    const response = paginatedResponse(formattedBookmarks, page, limit, total, {
      nextCursor,
      hasMore: rawHasMore,
      paginationMode: useCursorPagination ? 'cursor' : 'offset',
    });
    response.headers.set('Cache-Control', 'private, no-store');
    return response;
  } catch (error) {
    console.error('GET /api/users/[id]/bookmarks error:', error);
    return serverErrorResponse();
  }
}
