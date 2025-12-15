import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { userPublicColumns } from '@/lib/db/columns';
import { bookmarks, users, answers, comments, likes } from '@/lib/db/schema';
import { paginatedResponse, notFoundResponse, serverErrorResponse, unauthorizedResponse } from '@/lib/api/response';
import { getSession } from '@/lib/api/auth';
import { eq, desc, sql, inArray, and, isNotNull } from 'drizzle-orm';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

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

    const [countResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(bookmarks)
      .where(eq(bookmarks.userId, id));

    const total = countResult?.count || 0;

    const userBookmarks = await db.query.bookmarks.findMany({
      where: eq(bookmarks.userId, id),
      columns: {
        createdAt: true,
      },
      with: {
        post: {
          with: {
            author: {
              columns: userPublicColumns,
            },
          },
        },
      },
      orderBy: [desc(bookmarks.createdAt)],
      limit,
      offset: (page - 1) * limit,
    });

    const postIds = userBookmarks.map((bookmark) => bookmark.post?.id).filter(Boolean) as string[];

    const [answerCounts, commentCounts, likedRows, answerResponders, commentResponders] =
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
              .where(inArray(comments.postId, postIds))
              .groupBy(comments.postId),
            db
              .select({ postId: likes.postId })
              .from(likes)
              .where(and(eq(likes.userId, currentUser.id), inArray(likes.postId, postIds))),
            db
              .select({ postId: answers.postId, authorId: answers.authorId })
              .from(answers)
              .where(and(inArray(answers.postId, postIds), isNotNull(answers.authorId))),
            db
              .select({ postId: comments.postId, authorId: comments.authorId })
              .from(comments)
              .where(and(inArray(comments.postId, postIds), isNotNull(comments.authorId))),
          ])
        : [[], [], [], [], []];

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

    const formattedBookmarks = userBookmarks.map(bookmark => {
      const imgMatch = bookmark.post?.content?.match(/<img[^>]+src=["']([^"']+)["']/i);
      const thumbnail = imgMatch ? imgMatch[1] : null;

      const postId = bookmark.post?.id;
      const answersCount = postId ? (answerCountMap.get(postId) ?? 0) : 0;
      const postCommentsCount = postId ? (commentCountMap.get(postId) ?? 0) : 0;
      const commentsCount = answersCount + postCommentsCount;
      
      return {
        id: bookmark.post?.id,
        type: bookmark.post?.type,
        title: bookmark.post?.title || '',
        content: bookmark.post?.content || '',
        excerpt: bookmark.post?.content?.replace(/<img[^>]*>/gi, '(사진)').replace(/<[^>]*>/g, '').substring(0, 200) || '',
        category: bookmark.post?.category || '',
        subcategory: bookmark.post?.subcategory,
        tags: bookmark.post?.tags || [],
        views: bookmark.post?.views || 0,
        likes: bookmark.post?.likes || 0,
        isResolved: bookmark.post?.isResolved,
        createdAt: bookmark.post?.createdAt?.toISOString(),
        publishedAt: bookmark.post?.createdAt?.toISOString(),
        thumbnail,
        author: {
          id: bookmark.post?.author?.id,
          name: bookmark.post?.author?.displayName || bookmark.post?.author?.name || 'User',
          avatar: bookmark.post?.author?.image || '/avatar-default.jpg',
          isVerified: bookmark.post?.author?.isVerified || false,
          followers: 0,
        },
        stats: {
          likes: bookmark.post?.likes || 0,
          comments: commentsCount,
          shares: 0,
        },
        certifiedResponderCount: postId ? (certifiedRespondersByPost.get(postId)?.size ?? 0) : 0,
        otherResponderCount: postId ? (otherRespondersByPost.get(postId)?.size ?? 0) : 0,
        isLiked: postId ? likedPostIds.has(postId) : false,
        isBookmarked: true,
        isQuestion: bookmark.post?.type === 'question',
        isAdopted: bookmark.post?.isResolved,
        bookmarkedAt: bookmark.createdAt?.toISOString(),
      };
    });

    return paginatedResponse(formattedBookmarks, page, limit, total);
  } catch (error) {
    console.error('GET /api/users/[id]/bookmarks error:', error);
    return serverErrorResponse();
  }
}
