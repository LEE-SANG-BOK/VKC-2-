import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { answers, likes } from '@/lib/db/schema';
import { successResponse, notFoundResponse, unauthorizedResponse, serverErrorResponse, rateLimitResponse } from '@/lib/api/response';
import { getSession } from '@/lib/api/auth';
import { eq, and, sql } from 'drizzle-orm';
import { isE2ETestMode } from '@/lib/e2e/mode';
import { getE2ERequestState } from '@/lib/e2e/request';
import { toggleAnswerLike } from '@/lib/e2e/actions';
import { checkInMemoryRateLimit } from '@/lib/api/rateLimit';

interface RouteContext {
  params: Promise<{ id: string }>;
}

const answerLikeRateLimitWindowMs = 60_000;
const answerLikeRateLimitMax = 60;
const answerLikeRateLimitE2EWindowMs = 10_000;
const answerLikeRateLimitE2EMax = 5;

/**
 * POST /api/answers/[id]/like
 * 답변 좋아요 토글 (도움됨 기능)
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const user = await getSession(request);

    if (!user) {
      return unauthorizedResponse();
    }

    const { id: answerId } = await context.params;

    if (isE2ETestMode()) {
      const { store, namespace } = getE2ERequestState(request);
      const alreadyLiked = store.answerLikesByUserId.get(user.id)?.has(answerId) === true;
      if (!alreadyLiked) {
        const rateLimit = checkInMemoryRateLimit({
          key: `${namespace}:${user.id}:answer-like`,
          windowMs: answerLikeRateLimitE2EWindowMs,
          max: answerLikeRateLimitE2EMax,
        });
        if (!rateLimit.allowed) {
          return rateLimitResponse(
            '도움됨 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
            'ANSWER_LIKE_RATE_LIMITED',
            rateLimit.retryAfterSeconds
          );
        }
      }
      const result = toggleAnswerLike(store, user.id, answerId);
      if (!result) {
        return notFoundResponse('답변을 찾을 수 없습니다.');
      }
      if (result.isLiked) {
        return successResponse({ isLiked: true, isHelpful: true }, '도움됨을 눌렀습니다.');
      }
      return successResponse({ isLiked: false, isHelpful: false }, '도움됨을 취소했습니다.');
    }

    // 답변 존재 여부 확인
    const answer = await db.query.answers.findFirst({
      where: eq(answers.id, answerId),
    });

    if (!answer) {
      return notFoundResponse('답변을 찾을 수 없습니다.');
    }

    // 기존 좋아요 확인
    const existingLike = await db.query.likes.findFirst({
      where: and(
        eq(likes.userId, user.id),
        eq(likes.answerId, answerId)
      ),
    });

    if (existingLike) {
      // 좋아요 취소
      await db.delete(likes).where(eq(likes.id, existingLike.id));

      // 답변 좋아요 수 감소
      await db
        .update(answers)
        .set({ likes: sql`${answers.likes} - 1` })
        .where(eq(answers.id, answerId));

      return successResponse({ isLiked: false, isHelpful: false }, '도움됨을 취소했습니다.');
    } else {
      const rateLimit = checkInMemoryRateLimit({
        key: `${user.id}:answer-like`,
        windowMs: answerLikeRateLimitWindowMs,
        max: answerLikeRateLimitMax,
      });
      if (!rateLimit.allowed) {
        return rateLimitResponse(
          '도움됨 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
          'ANSWER_LIKE_RATE_LIMITED',
          rateLimit.retryAfterSeconds
        );
      }

      // 좋아요 추가
      await db.insert(likes).values({
        userId: user.id,
        answerId,
      });

      // 답변 좋아요 수 증가
      await db
        .update(answers)
        .set({ likes: sql`${answers.likes} + 1` })
        .where(eq(answers.id, answerId));

      return successResponse({ isLiked: true, isHelpful: true }, '도움됨을 눌렀습니다.');
    }
  } catch (error) {
    console.error('POST /api/answers/[id]/like error:', error);
    return serverErrorResponse();
  }
}
