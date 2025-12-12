import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { comments, answers } from '@/lib/db/schema';
import { successResponse, errorResponse, notFoundResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/api/response';
import { getSession } from '@/lib/api/auth';
import { eq, asc } from 'drizzle-orm';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id: answerId } = await context.params;

    const answer = await db.query.answers.findFirst({
      where: eq(answers.id, answerId),
    });

    if (!answer) {
      return notFoundResponse('답변을 찾을 수 없습니다.');
    }

    const answerComments = await db.query.comments.findMany({
      where: (c) => eq(c.answerId, answerId),
      with: {
        author: true,
        replies: {
          with: {
            author: true,
          },
          orderBy: [asc(comments.createdAt)],
        },
      },
      orderBy: [asc(comments.createdAt)],
    });

    const topLevelComments = answerComments.filter(c => !c.parentId);

    return successResponse(topLevelComments);
  } catch (error) {
    console.error('GET /api/answers/[id]/comments error:', error);
    return serverErrorResponse();
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const user = await getSession(request);

    if (!user) {
      return unauthorizedResponse();
    }

    const { id: answerId } = await context.params;

    const answer = await db.query.answers.findFirst({
      where: eq(answers.id, answerId),
    });

    if (!answer) {
      return notFoundResponse('답변을 찾을 수 없습니다.');
    }

    const body = await request.json();
    const { content, parentId } = body;

    if (!content || !content.trim()) {
      return errorResponse('댓글 내용을 입력해주세요.');
    }

    if (parentId) {
      const parentComment = await db.query.comments.findFirst({
        where: eq(comments.id, parentId),
      });

      if (!parentComment) {
        return errorResponse('부모 댓글을 찾을 수 없습니다.');
      }

      if (parentComment.answerId !== answerId) {
        return errorResponse('잘못된 요청입니다.');
      }
    }

    const [newComment] = await db.insert(comments).values({
      answerId,
      parentId: parentId || null,
      authorId: user.id,
      content: content.trim(),
    }).returning();

    const commentWithAuthor = await db.query.comments.findFirst({
      where: eq(comments.id, newComment.id),
      with: {
        author: true,
        replies: {
          with: {
            author: true,
          },
        },
      },
    });

    return successResponse(commentWithAuthor, parentId ? '대댓글이 작성되었습니다.' : '댓글이 작성되었습니다.');
  } catch (error) {
    console.error('POST /api/answers/[id]/comments error:', error);
    return serverErrorResponse();
  }
}
