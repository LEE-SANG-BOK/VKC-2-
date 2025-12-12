import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { comments, answers } from '@/lib/db/schema';
import { getAdminSession } from '@/lib/admin/auth';
import { eq, desc } from 'drizzle-orm';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const session = await getAdminSession(request);
    if (!session) {
      return NextResponse.json({ success: false, message: '인증이 필요합니다.' }, { status: 401 });
    }

    const { id: postId } = await context.params;

    const [postComments, postAnswers] = await Promise.all([
      db.query.comments.findMany({
        where: eq(comments.postId, postId),
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
        },
        orderBy: [desc(comments.createdAt)],
      }),
      db.query.answers.findMany({
        where: eq(answers.postId, postId),
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
        },
        orderBy: [desc(answers.createdAt)],
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        comments: postComments.map((c) => ({
          id: c.id,
          content: c.content,
          createdAt: c.createdAt,
          author: c.author ? {
            id: c.author.id,
            name: c.author.displayName || c.author.name || c.author.email?.split('@')[0],
            email: c.author.email,
            image: c.author.image,
          } : null,
        })),
        answers: postAnswers.map((a) => ({
          id: a.id,
          content: a.content,
          isAdopted: a.isAdopted,
          createdAt: a.createdAt,
          author: a.author ? {
            id: a.author.id,
            name: a.author.displayName || a.author.name || a.author.email?.split('@')[0],
            email: a.author.email,
            image: a.author.image,
          } : null,
        })),
      },
    });
  } catch (error) {
    console.error('Admin post comments error:', error);
    return NextResponse.json(
      { success: false, message: '댓글 목록을 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
