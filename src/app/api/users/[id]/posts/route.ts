import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { userPublicColumns } from '@/lib/db/columns';
import { posts, users, answers, comments, likes, bookmarks } from '@/lib/db/schema';
import { paginatedResponse, notFoundResponse, serverErrorResponse } from '@/lib/api/response';
import { getSession } from '@/lib/api/auth';
import { eq, desc, sql, and, inArray, isNotNull } from 'drizzle-orm';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const type = searchParams.get('type') as 'question' | 'share' | null;

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

    const [countResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(posts)
      .where(and(...conditions));

    const total = countResult?.count || 0;

    const userPosts = await db.query.posts.findMany({
      where: and(...conditions),
      with: {
        author: {
          columns: userPublicColumns,
        },
      },
      orderBy: [desc(posts.createdAt)],
      limit,
      offset: (page - 1) * limit,
    });

    const postIds = userPosts.map((post) => post.id).filter(Boolean) as string[];

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
              .where(inArray(comments.postId, postIds))
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
            db
              .select({ postId: answers.postId, authorId: answers.authorId })
              .from(answers)
              .where(and(inArray(answers.postId, postIds), isNotNull(answers.authorId))),
            db
              .select({ postId: comments.postId, authorId: comments.authorId })
              .from(comments)
              .where(and(inArray(comments.postId, postIds), isNotNull(comments.authorId))),
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

    const formattedPosts = userPosts.map(post => {
      const imgMatch = post.content?.match(/<img[^>]+src=["']([^"']+)["']/i);
      const thumbnail = imgMatch ? imgMatch[1] : null;

      const answersCount = answerCountMap.get(post.id) ?? 0;
      const postCommentsCount = commentCountMap.get(post.id) ?? 0;
      const commentsCount = answersCount + postCommentsCount;
      
      return {
        id: post.id,
        type: post.type,
        title: post.title,
        content: post.content,
        excerpt: post.content?.replace(/<img[^>]*>/gi, '(사진)').replace(/<[^>]*>/g, '').substring(0, 200) || '',
        category: post.category,
        subcategory: post.subcategory,
        tags: post.tags || [],
        views: post.views,
        likes: post.likes || 0,
        isResolved: post.isResolved,
        createdAt: post.createdAt?.toISOString(),
        publishedAt: post.createdAt?.toISOString(),
        thumbnail,
        author: {
          id: post.author?.id,
          name: post.author?.displayName || post.author?.name || 'User',
          avatar: post.author?.image || '/avatar-default.jpg',
          isVerified: post.author?.isVerified || false,
          isExpert: post.author?.isExpert || false,
          badgeType: post.author?.badgeType || null,
          followers: 0,
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

    return paginatedResponse(formattedPosts, page, limit, total);
  } catch (error) {
    console.error('GET /api/users/[id]/posts error:', error);
    return serverErrorResponse();
  }
}
