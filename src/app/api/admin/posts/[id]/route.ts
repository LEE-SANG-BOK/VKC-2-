import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { userPublicColumns } from '@/lib/db/columns';
import { posts } from '@/lib/db/schema';
import { getAdminSession } from '@/lib/admin/auth';
import { eq } from 'drizzle-orm';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const session = await getAdminSession(request);
    if (!session) {
      return NextResponse.json({ success: false, message: '인증이 필요합니다.' }, { status: 401 });
    }

    const { id } = await context.params;

    const post = await db.query.posts.findFirst({
      where: eq(posts.id, id),
      with: {
        author: {
          columns: userPublicColumns,
        },
        comments: {
          with: {
            author: {
              columns: userPublicColumns,
            },
          },
        },
        answers: {
          with: {
            author: {
              columns: userPublicColumns,
            },
          },
        },
        likes: true,
      },
    });

    if (!post) {
      return NextResponse.json({ success: false, message: '게시물을 찾을 수 없습니다.' }, { status: 404 });
    }

    return NextResponse.json({ post });
  } catch (error) {
    console.error('Admin post detail error:', error);
    return NextResponse.json(
      { success: false, message: '게시물을 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const session = await getAdminSession(request);
    if (!session) {
      return NextResponse.json({ success: false, message: '인증이 필요합니다.' }, { status: 401 });
    }

    const { id } = await context.params;

    const post = await db.query.posts.findFirst({
      where: eq(posts.id, id),
    });

    if (!post) {
      return NextResponse.json({ success: false, message: '게시물을 찾을 수 없습니다.' }, { status: 404 });
    }

    await db.delete(posts).where(eq(posts.id, id));

    return NextResponse.json({ success: true, message: '게시물이 삭제되었습니다.' });
  } catch (error) {
    console.error('Admin post delete error:', error);
    return NextResponse.json(
      { success: false, message: '게시물 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
