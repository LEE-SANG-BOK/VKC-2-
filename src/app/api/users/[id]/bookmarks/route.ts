import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { userPublicColumns } from '@/lib/db/columns';
import { bookmarks, users } from '@/lib/db/schema';
import { paginatedResponse, notFoundResponse, serverErrorResponse, unauthorizedResponse } from '@/lib/api/response';
import { getSession } from '@/lib/api/auth';
import { eq, desc, sql, inArray } from 'drizzle-orm';

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
      with: {
        post: {
          with: {
            author: {
              columns: userPublicColumns,
            },
            likes: true,
            bookmarks: true,
            answers: true,
            comments: true,
          },
        },
      },
      orderBy: [desc(bookmarks.createdAt)],
      limit,
      offset: (page - 1) * limit,
    });

    const responderIds = new Set<string>();
    userBookmarks.forEach((bookmark) => {
      bookmark.post?.answers?.forEach((answer) => {
        if (answer.authorId) responderIds.add(answer.authorId);
      });
      bookmark.post?.comments?.forEach((comment) => {
        if (comment.authorId) responderIds.add(comment.authorId);
      });
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

    const formattedBookmarks = userBookmarks.map(bookmark => {
      const imgMatch = bookmark.post?.content?.match(/<img[^>]+src=["']([^"']+)["']/i);
      const thumbnail = imgMatch ? imgMatch[1] : null;

      const certifiedResponders = new Set<string>();
      const otherResponders = new Set<string>();
      bookmark.post?.answers?.forEach((answer) => {
        const authorId = answer.authorId;
        if (!authorId) return;
        (responderCertMap.get(authorId) ? certifiedResponders : otherResponders).add(authorId);
      });
      bookmark.post?.comments?.forEach((comment) => {
        const authorId = comment.authorId;
        if (!authorId) return;
        (responderCertMap.get(authorId) ? certifiedResponders : otherResponders).add(authorId);
      });
      
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
        likes: bookmark.post?.likes?.length || 0,
        isResolved: bookmark.post?.isResolved,
        createdAt: bookmark.post?.createdAt?.toISOString(),
        publishedAt: bookmark.post?.createdAt?.toISOString(),
        thumbnail,
        author: {
          id: bookmark.post?.author?.id,
          name: bookmark.post?.author?.displayName || bookmark.post?.author?.name || bookmark.post?.author?.email?.split('@')[0] || 'User',
          avatar: bookmark.post?.author?.image || '/avatar-default.jpg',
          isVerified: bookmark.post?.author?.isVerified || false,
          followers: 0,
        },
        stats: {
          likes: bookmark.post?.likes?.length || 0,
          comments: (bookmark.post?.answers?.length || 0) + (bookmark.post?.comments?.length || 0),
          shares: 0,
        },
        certifiedResponderCount: certifiedResponders.size,
        otherResponderCount: otherResponders.size,
        isLiked: currentUser ? bookmark.post?.likes?.some(like => like.userId === currentUser.id) : false,
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
