import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { posts, comments } from '@/lib/db/schema';
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

    const [countResult, postsList] = await Promise.all([
      db.select({ count: count() }).from(posts).where(eq(posts.authorId, userId)),
      db
        .select({
          id: posts.id,
          title: posts.title,
          content: sql<string>`left(${posts.content}, ${contentPreviewLimit})`.as('content'),
          type: posts.type,
          category: posts.category,
          views: posts.views,
          likes: posts.likes,
          isResolved: posts.isResolved,
          createdAt: posts.createdAt,
        })
        .from(posts)
        .where(eq(posts.authorId, userId))
        .orderBy(desc(posts.createdAt))
        .limit(limit)
        .offset(offset),
    ]);

    const total = countResult[0]?.count || 0;

    const postIds = postsList.map((post) => post.id).filter(Boolean) as string[];
    const commentRows = postIds.length
      ? await db
          .select({ postId: comments.postId, count: sql<number>`count(*)::int` })
          .from(comments)
          .where(inArray(comments.postId, postIds))
          .groupBy(comments.postId)
      : [];

    const commentCountMap = new Map<string, number>();
    commentRows.forEach((row) => {
      if (row.postId) commentCountMap.set(row.postId, row.count);
    });

    const formattedPosts = postsList.map((post) => ({
      id: post.id,
      title: post.title,
      content: typeof post.content === 'string' ? post.content : '',
      type: post.type,
      category: post.category,
      views: post.views,
      likesCount: post.likes ?? 0,
      commentsCount: commentCountMap.get(post.id) ?? 0,
      isResolved: post.isResolved,
      createdAt: post.createdAt,
    }));

    return NextResponse.json({
      posts: formattedPosts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Admin user posts error:', error);
    return NextResponse.json({ error: 'Failed to fetch user posts' }, { status: 500 });
  }
}
