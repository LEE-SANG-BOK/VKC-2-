import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { userPublicColumns } from '@/lib/db/columns';
import { answers } from '@/lib/db/schema';
import { successResponse, errorResponse, notFoundResponse, forbiddenResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/api/response';
import { getSession, isOwner } from '@/lib/api/auth';
import { eq } from 'drizzle-orm';
import { hasProhibitedContent } from '@/lib/content-filter';
import { UGC_LIMITS, validateUgcText } from '@/lib/validation/ugc';
import { validateUgcExternalLinks } from '@/lib/validation/ugc-links';
import { sanitizeUgcHtml } from '@/lib/validation/ugc-sanitize';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * PUT /api/answers/[id]
 * 답변 수정
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

    // 답변 존재 여부 확인
    const answer = await db.query.answers.findFirst({
      where: eq(answers.id, id),
    });

    if (!answer) {
      return notFoundResponse('답변을 찾을 수 없습니다.');
    }

    // 소유자 확인
    if (!isOwner(user.id, answer.authorId)) {
      return forbiddenResponse('답변을 수정할 권한이 없습니다.');
    }

    // 채택된 답변은 수정 불가
    if (answer.isAdopted) {
      return errorResponse('채택된 답변은 수정할 수 없습니다.', 'ADOPTED_ANSWER');
    }

    const body = await request.json();
    const { content } = body;

    if (!content || typeof content !== 'string') {
      return errorResponse('답변 내용을 입력해주세요.', 'ANSWER_REQUIRED');
    }

    const normalizedContent = sanitizeUgcHtml(content);
    if (!normalizedContent) {
      return errorResponse('답변 내용을 입력해주세요.', 'ANSWER_REQUIRED');
    }

    const validation = validateUgcText(normalizedContent, UGC_LIMITS.answerContent.min, UGC_LIMITS.answerContent.max);
    if (!validation.ok) {
      if (validation.code === 'UGC_TOO_SHORT') {
        return errorResponse('답변이 너무 짧습니다.', 'ANSWER_TOO_SHORT');
      }
      if (validation.code === 'UGC_TOO_LONG') {
        return errorResponse('답변이 너무 깁니다.', 'ANSWER_TOO_LONG');
      }
      return errorResponse('답변 내용이 올바르지 않습니다.', 'ANSWER_LOW_QUALITY');
    }

    if (hasProhibitedContent(normalizedContent)) {
      return errorResponse('금칙어/광고/연락처가 포함되어 있습니다. 내용을 수정해주세요.', 'CONTENT_PROHIBITED');
    }

    const linkValidation = validateUgcExternalLinks(normalizedContent);
    if (!linkValidation.ok) {
      return errorResponse('공식 출처 도메인만 사용할 수 있습니다.', 'UGC_EXTERNAL_LINK_BLOCKED');
    }

    // 답변 수정
    const [updatedAnswer] = await db
      .update(answers)
      .set({
        content: normalizedContent,
        updatedAt: new Date(),
      })
      .where(eq(answers.id, id))
      .returning();

    // 작성자 정보 포함하여 반환
    const answerWithAuthor = await db.query.answers.findFirst({
      where: eq(answers.id, updatedAnswer.id),
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
      },
    });

    return successResponse(answerWithAuthor, '답변이 수정되었습니다.');
  } catch (error) {
    console.error('PUT /api/answers/[id] error:', error);
    return serverErrorResponse();
  }
}

/**
 * DELETE /api/answers/[id]
 * 답변 삭제
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const user = await getSession(request);

    if (!user) {
      return unauthorizedResponse();
    }

    const { id } = await context.params;

    // 답변 존재 여부 확인
    const answer = await db.query.answers.findFirst({
      where: eq(answers.id, id),
    });

    if (!answer) {
      return notFoundResponse('답변을 찾을 수 없습니다.');
    }

    // 소유자 확인
    if (!isOwner(user.id, answer.authorId)) {
      return forbiddenResponse('답변을 삭제할 권한이 없습니다.');
    }

    // 채택된 답변은 삭제 불가
    if (answer.isAdopted) {
      return errorResponse('채택된 답변은 삭제할 수 없습니다.', 'ADOPTED_ANSWER');
    }

    // 답변 삭제 (cascade로 관련 댓글도 자동 삭제됨)
    await db.delete(answers).where(eq(answers.id, id));

    return successResponse(null, '답변이 삭제되었습니다.');
  } catch (error) {
    console.error('DELETE /api/answers/[id] error:', error);
    return serverErrorResponse();
  }
}
