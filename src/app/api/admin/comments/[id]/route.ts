import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { comments } from '@/lib/db/schema';
import { getAdminSession } from '@/lib/admin/auth';
import { eq } from 'drizzle-orm';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const session = await getAdminSession(request);
    if (!session) {
      return NextResponse.json({ success: false, message: '인증이 필요합니다.' }, { status: 401 });
    }

    const { id } = await context.params;

    const comment = await db.query.comments.findFirst({
      where: eq(comments.id, id),
    });

    if (!comment) {
      return NextResponse.json({ success: false, message: '댓글을 찾을 수 없습니다.' }, { status: 404 });
    }

    await db.delete(comments).where(eq(comments.id, id));

    return NextResponse.json({ success: true, message: '댓글이 삭제되었습니다.' });
  } catch (error) {
    console.error('Admin comment delete error:', error);
    return NextResponse.json(
      { success: false, message: '댓글 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
