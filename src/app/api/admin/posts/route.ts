import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { posts } from '@/lib/db/schema';
import { getAdminSession } from '@/lib/admin/auth';
import { sql, desc, ilike, or, eq, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const session = await getAdminSession(request);
    if (!session) {
      return NextResponse.json({ success: false, message: '인증이 필요합니다.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type') as 'question' | 'share' | null;

    const offset = (page - 1) * limit;

    const conditions = [];

    if (search) {
      conditions.push(
        or(
          ilike(posts.title, `%${search}%`),
          ilike(posts.content, `%${search}%`)
        )
      );
    }

    if (type) {
      conditions.push(eq(posts.type, type));
    }

    const whereCondition = conditions.length > 0 ? and(...conditions) : undefined;

    const [countResult, postsList] = await Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(posts).where(whereCondition),
      db.query.posts.findMany({
        where: whereCondition,
        with: {
          author: {
            columns: {
              id: true,
              name: true,
              displayName: true,
              email: true,
              image: true,
            },
          },
          comments: true,
          likes: true,
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
      content: post.content?.substring(0, 200) || '',
      type: post.type,
      category: post.category,
      views: post.views,
      likesCount: post.likes?.length || 0,
      commentsCount: post.comments?.length || 0,
      isResolved: post.isResolved,
      createdAt: post.createdAt,
      author: post.author ? {
        id: post.author.id,
        name: post.author.displayName || post.author.name || post.author.email?.split('@')[0],
        email: post.author.email,
        image: post.author.image,
      } : null,
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
    console.error('Admin posts list error:', error);
    return NextResponse.json(
      { success: false, message: '게시물 목록을 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
