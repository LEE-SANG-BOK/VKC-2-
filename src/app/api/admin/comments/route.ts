import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { comments } from '@/lib/db/schema';
import { getAdminSession } from '@/lib/admin/auth';
import { sql, desc, ilike } from 'drizzle-orm';

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

    const offset = (page - 1) * limit;

    const whereCondition = search ? ilike(comments.content, `%${search}%`) : undefined;

    const [countResult, commentsList] = await Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(comments).where(whereCondition),
      db.query.comments.findMany({
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
          post: {
            columns: {
              id: true,
              title: true,
            },
          },
        },
        orderBy: [desc(comments.createdAt)],
        limit,
        offset,
      }),
    ]);

    const total = countResult[0]?.count || 0;

    const formattedComments = commentsList.map((comment) => ({
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt,
      post: comment.post ? {
        id: comment.post.id,
        title: comment.post.title,
      } : null,
      author: comment.author ? {
        id: comment.author.id,
        name: comment.author.displayName || comment.author.name || comment.author.email?.split('@')[0],
        email: comment.author.email,
        image: comment.author.image,
      } : null,
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
    console.error('Admin comments list error:', error);
    return NextResponse.json(
      { success: false, message: '댓글 목록을 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
