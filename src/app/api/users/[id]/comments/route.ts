import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { userPublicColumns } from '@/lib/db/columns';
import { comments, users, likes } from '@/lib/db/schema';
import { paginatedResponse, notFoundResponse, serverErrorResponse } from '@/lib/api/response';
import { getSession } from '@/lib/api/auth';
import { eq, desc, sql, and, isNotNull, inArray } from 'drizzle-orm';

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

    const user = await db.query.users.findFirst({
      where: eq(users.id, id),
      columns: {
        id: true,
      },
    });

    if (!user) {
      return notFoundResponse('사용자를 찾을 수 없습니다.');
    }

    const whereCondition = and(eq(comments.authorId, id), isNotNull(comments.postId));

    const [countResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(comments)
      .where(whereCondition);

    const total = countResult?.count || 0;

    const userComments = await db.query.comments.findMany({
      where: whereCondition,
      columns: {
        id: true,
        authorId: true,
        postId: true,
        content: true,
        createdAt: true,
        likes: true,
      },
      with: {
        author: {
          columns: userPublicColumns,
        },
        post: {
          columns: {
            id: true,
            title: true,
            category: true,
            views: true,
          },
        },
      },
      orderBy: [desc(comments.createdAt)],
      limit,
      offset: (page - 1) * limit,
    });

    const commentIds = userComments.map((comment) => comment.id).filter(Boolean) as string[];
    const likedCommentIds = new Set<string>();
    if (currentUser && commentIds.length > 0) {
      const likedRows = await db
        .select({ commentId: likes.commentId })
        .from(likes)
        .where(and(eq(likes.userId, currentUser.id), inArray(likes.commentId, commentIds)));
      likedRows.forEach((row) => {
        if (row.commentId) likedCommentIds.add(row.commentId);
      });
    }

    const formattedComments = userComments.map(comment => ({
      id: comment.id,
      type: 'comment' as const,
      title: comment.post?.title || '삭제된 게시글',
      content: comment.content,
      excerpt: comment.content?.replace(/<[^>]*>/g, '').substring(0, 200) || '',
      category: comment.post?.category || '',
      tags: [],
      views: comment.post?.views || 0,
      likes: comment.likes || 0,
      createdAt: comment.createdAt?.toISOString(),
      publishedAt: comment.createdAt?.toISOString(),
      author: {
        id: comment.author?.id,
        name: comment.author?.name || 'User',
        avatar: comment.author?.image || '/avatar-default.jpg',
        isVerified: comment.author?.isVerified || false,
        followers: 0,
      },
      stats: {
        likes: comment.likes || 0,
        comments: 0,
        shares: 0,
      },
      isLiked: currentUser ? likedCommentIds.has(comment.id) : false,
      isBookmarked: false,
      isQuestion: false,
      isAdopted: false,
      post: {
        id: comment.post?.id,
        title: comment.post?.title,
      },
    }));

    return paginatedResponse(formattedComments, page, limit, total);
  } catch (error) {
    console.error('GET /api/users/[id]/comments error:', error);
    return serverErrorResponse();
  }
}
