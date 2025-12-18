import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { comments, posts, likes } from '@/lib/db/schema';
import { getAdminSession } from '@/lib/admin/auth';
import { eq, desc, count, inArray, sql } from 'drizzle-orm';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const session = await getAdminSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: userId } = await context.params;
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const limitCandidate = parseInt(searchParams.get('limit') || '10', 10) || 10;
    const limit = Math.min(50, Math.max(1, limitCandidate));
    const offset = (page - 1) * limit;

    const contentPreviewLimit = 100;

    const [countResult, commentsList] = await Promise.all([
      db.select({ count: count() }).from(comments).where(eq(comments.authorId, userId)),
      db
        .select({
          id: comments.id,
          content: sql<string>`left(${comments.content}, ${contentPreviewLimit})`.as('content'),
          postId: comments.postId,
          createdAt: comments.createdAt,
          post: {
            id: posts.id,
            title: posts.title,
          },
        })
        .from(comments)
        .leftJoin(posts, eq(comments.postId, posts.id))
        .where(eq(comments.authorId, userId))
        .orderBy(desc(comments.createdAt))
        .limit(limit)
        .offset(offset),
    ]);

    const total = countResult[0]?.count || 0;

    const commentIds = commentsList.map((comment) => comment.id).filter(Boolean) as string[];
    const likeRows = commentIds.length
      ? await db
          .select({ commentId: likes.commentId, count: sql<number>`count(*)::int` })
          .from(likes)
          .where(inArray(likes.commentId, commentIds))
          .groupBy(likes.commentId)
      : [];

    const likeCountMap = new Map<string, number>();
    likeRows.forEach((row) => {
      if (row.commentId) likeCountMap.set(row.commentId, row.count);
    });

    const formattedComments = commentsList.map((comment) => ({
      id: comment.id,
      content: typeof comment.content === 'string' ? comment.content : '',
      likesCount: likeCountMap.get(comment.id) ?? 0,
      postId: comment.postId,
      post: comment.post?.id ? {
        id: comment.post.id,
        title: comment.post.title,
      } : null,
      createdAt: comment.createdAt,
    }));

    return NextResponse.json({
      comments: formattedComments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Admin user comments error:', error);
    return NextResponse.json({ error: 'Failed to fetch user comments' }, { status: 500 });
  }
}
