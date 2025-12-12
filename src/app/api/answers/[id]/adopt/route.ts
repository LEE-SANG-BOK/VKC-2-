import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { answers, posts } from '@/lib/db/schema';
import { successResponse, errorResponse, notFoundResponse, forbiddenResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/api/response';
import { getSession, isOwner } from '@/lib/api/auth';
import { eq, and } from 'drizzle-orm';
import { createAdoptionNotification } from '@/lib/notifications/create';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/answers/[id]/adopt
 * 답변 채택
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const user = await getSession(request);

    if (!user) {
      return unauthorizedResponse();
    }

    const { id: answerId } = await context.params;

    // 답변 존재 여부 및 게시글 정보 확인
    const answer = await db.query.answers.findFirst({
      where: eq(answers.id, answerId),
      with: {
        post: true,
      },
    });

    if (!answer) {
      return notFoundResponse('답변을 찾을 수 없습니다.');
    }

    // 질문 작성자만 채택 가능
    if (!isOwner(user.id, answer.post.authorId)) {
      return forbiddenResponse('질문 작성자만 답변을 채택할 수 있습니다.');
    }

    // 이미 채택된 답변이 있는지 확인
    const adoptedAnswer = await db.query.answers.findFirst({
      where: and(
        eq(answers.postId, answer.postId),
        eq(answers.isAdopted, true)
      ),
    });

    if (adoptedAnswer) {
      // 이미 채택된 답변이 있으면 해당 답변의 채택 취소
      if (adoptedAnswer.id === answerId) {
        return errorResponse('이미 채택된 답변입니다.', 'ALREADY_ADOPTED');
      }

      // 기존 채택 취소
      await db
        .update(answers)
        .set({ isAdopted: false })
        .where(eq(answers.id, adoptedAnswer.id));
    }

    // 답변 채택
    const [adoptedAnswerData] = await db
      .update(answers)
      .set({ isAdopted: true })
      .where(eq(answers.id, answerId))
      .returning();

    // 게시글의 채택된 답변 ID 업데이트 및 해결 상태 변경
    await db
      .update(posts)
      .set({
        adoptedAnswerId: answerId,
        isResolved: true,
        updatedAt: new Date(),
      })
      .where(eq(posts.id, answer.postId));

    // 작성자 정보 포함하여 반환
    const answerWithAuthor = await db.query.answers.findFirst({
      where: eq(answers.id, adoptedAnswerData.id),
      with: {
        author: true,
      },
    });

    // 알림 생성 (답변 작성자에게)
    if (answer.authorId !== user.id) {
      await createAdoptionNotification(
        answer.authorId,
        user.id,
        user.name || user.email || '사용자',
        answer.postId,
        answer.post.title,
        answerId
      );
    }

    return successResponse(answerWithAuthor, '답변이 채택되었습니다.');
  } catch (error) {
    console.error('POST /api/answers/[id]/adopt error:', error);
    return serverErrorResponse();
  }
}

/**
 * DELETE /api/answers/[id]/adopt
 * 답변 채택 취소
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const user = await getSession(request);

    if (!user) {
      return unauthorizedResponse();
    }

    const { id: answerId } = await context.params;

    // 답변 존재 여부 및 게시글 정보 확인
    const answer = await db.query.answers.findFirst({
      where: eq(answers.id, answerId),
      with: {
        post: true,
      },
    });

    if (!answer) {
      return notFoundResponse('답변을 찾을 수 없습니다.');
    }

    // 질문 작성자만 채택 취소 가능
    if (!isOwner(user.id, answer.post.authorId)) {
      return forbiddenResponse('질문 작성자만 채택을 취소할 수 있습니다.');
    }

    if (!answer.isAdopted) {
      return errorResponse('채택되지 않은 답변입니다.', 'NOT_ADOPTED');
    }

    // 답변 채택 취소
    await db
      .update(answers)
      .set({ isAdopted: false })
      .where(eq(answers.id, answerId));

    // 게시글의 채택된 답변 ID 제거 및 해결 상태 변경
    await db
      .update(posts)
      .set({
        adoptedAnswerId: null,
        isResolved: false,
        updatedAt: new Date(),
      })
      .where(eq(posts.id, answer.postId));

    return successResponse(null, '답변 채택이 취소되었습니다.');
  } catch (error) {
    console.error('DELETE /api/answers/[id]/adopt error:', error);
    return serverErrorResponse();
  }
}
