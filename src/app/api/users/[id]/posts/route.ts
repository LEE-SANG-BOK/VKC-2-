import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { posts, users } from '@/lib/db/schema';
import { paginatedResponse, notFoundResponse, serverErrorResponse } from '@/lib/api/response';
import { getSession } from '@/lib/api/auth';
import { eq, desc, sql, and, inArray } from 'drizzle-orm';

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
        author: true,
        likes: true,
        bookmarks: true,
        answers: true,
        comments: true,
      },
      orderBy: [desc(posts.createdAt)],
      limit,
      offset: (page - 1) * limit,
    });

    const responderIds = new Set<string>();
    userPosts.forEach((post) => {
      post.answers?.forEach((answer) => {
        if (answer.authorId) responderIds.add(answer.authorId);
      });
      post.comments?.forEach((comment) => {
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

    const formattedPosts = userPosts.map(post => {
      const imgMatch = post.content?.match(/<img[^>]+src=["']([^"']+)["']/i);
      const thumbnail = imgMatch ? imgMatch[1] : null;

      const certifiedResponders = new Set<string>();
      const otherResponders = new Set<string>();
      post.answers?.forEach((answer) => {
        const authorId = answer.authorId;
        if (!authorId) return;
        (responderCertMap.get(authorId) ? certifiedResponders : otherResponders).add(authorId);
      });
      post.comments?.forEach((comment) => {
        const authorId = comment.authorId;
        if (!authorId) return;
        (responderCertMap.get(authorId) ? certifiedResponders : otherResponders).add(authorId);
      });
      
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
        likes: post.likes?.length || 0,
        isResolved: post.isResolved,
        createdAt: post.createdAt?.toISOString(),
        publishedAt: post.createdAt?.toISOString(),
        thumbnail,
        author: {
          id: post.author?.id,
          name: post.author?.displayName || post.author?.name || post.author?.email?.split('@')[0] || 'User',
          avatar: post.author?.image || '/avatar-default.jpg',
          isVerified: post.author?.isVerified || false,
          followers: 0,
        },
        stats: {
          likes: post.likes?.length || 0,
          comments: (post.answers?.length || 0) + (post.comments?.length || 0),
          shares: 0,
        },
        certifiedResponderCount: certifiedResponders.size,
        otherResponderCount: otherResponders.size,
        isLiked: currentUser ? post.likes?.some(like => like.userId === currentUser.id) : false,
        isBookmarked: currentUser ? post.bookmarks?.some(bookmark => bookmark.userId === currentUser.id) : false,
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
