import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { posts, users, answers, comments, likes, bookmarks } from '@/lib/db/schema';
import { paginatedResponse, notFoundResponse, serverErrorResponse } from '@/lib/api/response';
import { getSession } from '@/lib/api/auth';
import { getFollowingIdSet } from '@/lib/api/follow';
import { eq, desc, sql, and, inArray, isNotNull, isNull, or, lt, type SQL } from 'drizzle-orm';

interface RouteContext {
  params: Promise<{ id: string }>;
}

const stripHtmlToText = (html: string) =>
  html
    .replace(/<img[^>]*>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const buildExcerpt = (html: string, maxLength = 200) => stripHtmlToText(html).slice(0, maxLength);

const extractImages = (html: string, maxThumbs = 4) => {
  if (!html) return { thumbnails: [] as string[], thumbnail: null as string | null, imageCount: 0 };
  const regex = /<img[^>]+src=["']([^"']+)["']/gi;
  const thumbnails: string[] = [];
  let match: RegExpExecArray | null;
  let imageCount = 0;
  while ((match = regex.exec(html))) {
    imageCount += 1;
    if (thumbnails.length < maxThumbs) thumbnails.push(match[1]);
  }
  return { thumbnails, thumbnail: thumbnails[0] ?? null, imageCount };
};

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10) || 20));
    const type = searchParams.get('type') as 'question' | 'share' | null;
    const cursorParam = searchParams.get('cursor');
    const include = (searchParams.get('include') || '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);
    const includeContent = include.includes('content');

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

    const conditions = [eq(posts.authorId, id)];
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

    const contentPreviewLimit = 4000;
    const userPosts = await db
      .select({
        id: posts.id,
        authorId: posts.authorId,
        type: posts.type,
        title: posts.title,
        content: includeContent
          ? posts.content
          : sql<string>`left(${posts.content}, ${contentPreviewLimit})`.as('content'),
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

    const [answerCounts, commentCounts, likedRows, bookmarkedRows, answerResponders, commentResponders] =
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
        : [[], [], [], [], [], []];

    const answerCountMap = new Map<string, number>();
    answerCounts.forEach((row) => {
      if (row.postId) answerCountMap.set(row.postId, row.count);
    });

    const commentCountMap = new Map<string, number>();
    commentCounts.forEach((row) => {
      if (row.postId) commentCountMap.set(row.postId, row.count);
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
      const content = typeof post.content === 'string' ? post.content : '';
      const { thumbnail, thumbnails, imageCount } = extractImages(content, 4);
      const excerpt = buildExcerpt(content);

      const answersCount = answerCountMap.get(post.id) ?? 0;
      const postCommentsCount = commentCountMap.get(post.id) ?? 0;
      const commentsCount = answersCount + postCommentsCount;
      
      return {
        id: post.id,
        type: post.type,
        title: post.title,
        content: includeContent ? content : '',
        excerpt,
        category: post.category,
        subcategory: post.subcategory,
        tags: post.tags || [],
        views: post.views,
        likes: post.likes || 0,
        answersCount,
        postCommentsCount,
        commentsCount,
        isResolved: post.isResolved,
        createdAt: post.createdAt?.toISOString(),
        publishedAt: post.createdAt?.toISOString(),
        thumbnail,
        thumbnails,
        imageCount,
        author: {
          id: post.author?.id,
          name: post.author?.displayName || post.author?.name || 'User',
          avatar: post.author?.image || '/avatar-default.jpg',
          isVerified: post.author?.isVerified || false,
          isExpert: post.author?.isExpert || false,
          badgeType: post.author?.badgeType || null,
          followers: 0,
          isFollowing: currentUser ? followingIdSet.has(post.authorId) : false,
        },
        stats: {
          likes: post.likes || 0,
          comments: commentsCount,
          shares: 0,
        },
        certifiedResponderCount: certifiedRespondersByPost.get(post.id)?.size ?? 0,
        otherResponderCount: otherRespondersByPost.get(post.id)?.size ?? 0,
        isLiked: currentUser ? likedPostIds.has(post.id) : false,
        isBookmarked: currentUser ? bookmarkedPostIds.has(post.id) : false,
        isQuestion: post.type === 'question',
        isAdopted: post.isResolved,
      };
    });

    return paginatedResponse(formattedPosts, page, limit, total, {
      nextCursor,
      hasMore: rawHasMore,
      paginationMode: useCursorPagination ? 'cursor' : 'offset',
    });
  } catch (error) {
    console.error('GET /api/users/[id]/posts error:', error);
    return serverErrorResponse();
  }
}
