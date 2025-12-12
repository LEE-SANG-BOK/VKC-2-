import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { userPublicColumns } from '@/lib/db/columns';
import { comments } from '@/lib/db/schema';
import { successResponse, errorResponse, notFoundResponse, forbiddenResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/api/response';
import { getSession, isOwner } from '@/lib/api/auth';
import { eq } from 'drizzle-orm';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * PUT /api/comments/[id]
 * 댓글 수정
 *
 * Body:
 * - content: string
 */
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const user = await getSession(request);

    if (!user) {
      return unauthorizedResponse();
    }

    const { id } = await context.params;

    // 댓글 존재 여부 확인
    const comment = await db.query.comments.findFirst({
      where: eq(comments.id, id),
    });

    if (!comment) {
      return notFoundResponse('댓글을 찾을 수 없습니다.');
    }

    // 소유자 확인
    if (!isOwner(user.id, comment.authorId)) {
      return forbiddenResponse('댓글을 수정할 권한이 없습니다.');
    }

    const body = await request.json();
    const { content } = body;

    if (!content || !content.trim()) {
      return errorResponse('댓글 내용을 입력해주세요.');
    }

    // 댓글 수정
    const [updatedComment] = await db
      .update(comments)
      .set({
        content: content.trim(),
        updatedAt: new Date(),
      })
      .where(eq(comments.id, id))
      .returning();

    // 작성자 정보 포함하여 반환
    const commentWithAuthor = await db.query.comments.findFirst({
      where: eq(comments.id, updatedComment.id),
      with: {
        author: {
          columns: userPublicColumns,
        },
      },
    });

    return successResponse(commentWithAuthor, '댓글이 수정되었습니다.');
  } catch (error) {
    console.error('PUT /api/comments/[id] error:', error);
    return serverErrorResponse();
  }
}

/**
 * DELETE /api/comments/[id]
 * 댓글 삭제
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const user = await getSession(request);

    if (!user) {
      return unauthorizedResponse();
    }

    const { id } = await context.params;

    // 댓글 존재 여부 확인
    const comment = await db.query.comments.findFirst({
      where: eq(comments.id, id),
    });

    if (!comment) {
      return notFoundResponse('댓글을 찾을 수 없습니다.');
    }

    // 소유자 확인
    if (!isOwner(user.id, comment.authorId)) {
      return forbiddenResponse('댓글을 삭제할 권한이 없습니다.');
    }

    // 댓글 삭제
    await db.delete(comments).where(eq(comments.id, id));

    return successResponse(null, '댓글이 삭제되었습니다.');
  } catch (error) {
    console.error('DELETE /api/comments/[id] error:', error);
    return serverErrorResponse();
  }
}
