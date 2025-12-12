import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { comments } from '@/lib/db/schema';
import { getAdminSession } from '@/lib/admin/auth';
import { eq, desc, count } from 'drizzle-orm';

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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    const [countResult, commentsList] = await Promise.all([
      db.select({ count: count() }).from(comments).where(eq(comments.authorId, userId)),
      db.query.comments.findMany({
        where: eq(comments.authorId, userId),
        with: {
          post: {
            columns: {
              id: true,
              title: true,
            },
          },
          likes: true,
        },
        orderBy: [desc(comments.createdAt)],
        limit,
        offset,
      }),
    ]);

    const total = countResult[0]?.count || 0;

    const formattedComments = commentsList.map((comment) => ({
      id: comment.id,
      content: comment.content?.substring(0, 100) || '',
      likesCount: comment.likes?.length || 0,
      postId: comment.postId,
      post: comment.post ? {
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
