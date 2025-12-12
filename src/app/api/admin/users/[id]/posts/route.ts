import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { posts } from '@/lib/db/schema';
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

    const [countResult, postsList] = await Promise.all([
      db.select({ count: count() }).from(posts).where(eq(posts.authorId, userId)),
      db.query.posts.findMany({
        where: eq(posts.authorId, userId),
        with: {
          likes: true,
          comments: true,
        },
        orderBy: [desc(posts.createdAt)],
        limit,
        offset,
      }),
    ]);

    const total = countResult[0]?.count || 0;

    const formattedPosts = postsList.map((post) => ({
      id: post.id,
      title: post.title,
      content: post.content?.substring(0, 100) || '',
      type: post.type,
      category: post.category,
      views: post.views,
      likesCount: post.likes?.length || 0,
      commentsCount: post.comments?.length || 0,
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
