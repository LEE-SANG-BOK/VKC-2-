import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { feedbacks } from '@/lib/db/schema';
import { successResponse, errorResponse, serverErrorResponse } from '@/lib/api/response';
import { getSession } from '@/lib/api/auth';
import { validateUgcText } from '@/lib/validation/ugc';
import { and, eq, gte, sql } from 'drizzle-orm';

const feedbackRateLimitWindowMs = 60 * 60 * 1000;
const feedbackRateLimitMax = 3;
const feedbackTitleMin = 3;
const feedbackTitleMax = 200;
const feedbackDescriptionMin = 10;
const feedbackDescriptionMax = 2000;
const feedbackStepsMin = 5;
const feedbackStepsMax = 2000;

const resolveClientIp = (request: NextRequest) => {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0]?.trim() || 'unknown';
  }
  return request.headers.get('x-real-ip') || 'unknown';
};

export async function POST(request: NextRequest) {
  try {
    const user = await getSession(request);
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return errorResponse('요청을 확인할 수 없습니다.', 'FEEDBACK_INVALID_BODY');
    }

    const rawType = typeof body.type === 'string' ? body.type.trim().toLowerCase() : '';
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const description = typeof body.description === 'string' ? body.description.trim() : '';
    const steps = typeof body.steps === 'string' ? body.steps.trim() : '';
    const contactEmail = typeof body.email === 'string' ? body.email.trim() : '';
    const pageUrl = typeof body.pageUrl === 'string' ? body.pageUrl.trim() : '';
    const userAgent =
      (typeof body.userAgent === 'string' ? body.userAgent.trim() : '') || request.headers.get('user-agent') || '';

    if (!rawType) {
      return errorResponse('올바르지 않은 유형입니다.', 'FEEDBACK_INVALID_TYPE');
    }

    const allowedTypes = new Set(['feedback', 'bug']);
    const type = allowedTypes.has(rawType) ? rawType : null;
    if (!type) {
      return errorResponse('올바르지 않은 유형입니다.', 'FEEDBACK_INVALID_TYPE');
    }

    if (!title) {
      return errorResponse('요약을 입력해주세요.', 'FEEDBACK_TITLE_REQUIRED');
    }

    const titleValidation = validateUgcText(title, feedbackTitleMin, feedbackTitleMax);
    if (!titleValidation.ok) {
      if (titleValidation.code === 'UGC_TOO_SHORT') {
        return errorResponse('요약이 너무 짧습니다.', 'FEEDBACK_TITLE_TOO_SHORT');
      }
      if (titleValidation.code === 'UGC_TOO_LONG') {
        return errorResponse('요약이 너무 깁니다.', 'FEEDBACK_TITLE_TOO_LONG');
      }
      return errorResponse('요약 내용이 올바르지 않습니다.', 'FEEDBACK_TITLE_INVALID');
    }

    if (!description) {
      return errorResponse('상세 내용을 입력해주세요.', 'FEEDBACK_DESCRIPTION_REQUIRED');
    }

    const descriptionValidation = validateUgcText(
      description,
      feedbackDescriptionMin,
      feedbackDescriptionMax
    );
    if (!descriptionValidation.ok) {
      if (descriptionValidation.code === 'UGC_TOO_SHORT') {
        return errorResponse('상세 내용이 너무 짧습니다.', 'FEEDBACK_DESCRIPTION_TOO_SHORT');
      }
      if (descriptionValidation.code === 'UGC_TOO_LONG') {
        return errorResponse('상세 내용이 너무 깁니다.', 'FEEDBACK_DESCRIPTION_TOO_LONG');
      }
      return errorResponse('상세 내용이 올바르지 않습니다.', 'FEEDBACK_DESCRIPTION_INVALID');
    }

    if (steps) {
      const stepsValidation = validateUgcText(steps, feedbackStepsMin, feedbackStepsMax);
      if (!stepsValidation.ok) {
        if (stepsValidation.code === 'UGC_TOO_SHORT') {
          return errorResponse('재현 단계가 너무 짧습니다.', 'FEEDBACK_STEPS_TOO_SHORT');
        }
        if (stepsValidation.code === 'UGC_TOO_LONG') {
          return errorResponse('재현 단계가 너무 깁니다.', 'FEEDBACK_STEPS_TOO_LONG');
        }
        return errorResponse('재현 단계가 올바르지 않습니다.', 'FEEDBACK_STEPS_INVALID');
      }
    }

    if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
      return errorResponse('올바른 이메일을 입력해주세요.', 'FEEDBACK_EMAIL_INVALID');
    }

    const ipAddress = resolveClientIp(request);
    const rateLimitStart = new Date(Date.now() - feedbackRateLimitWindowMs);
    const rateLimitCondition = user?.id ? eq(feedbacks.userId, user.id) : eq(feedbacks.ipAddress, ipAddress);

    const [rateLimitRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(feedbacks)
      .where(and(rateLimitCondition, gte(feedbacks.createdAt, rateLimitStart)));

    if ((rateLimitRow?.count || 0) >= feedbackRateLimitMax) {
      return errorResponse('피드백 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.', 'FEEDBACK_RATE_LIMITED', 429);
    }

    const [createdFeedback] = await db
      .insert(feedbacks)
      .values({
        userId: user?.id || null,
        type,
        title,
        description,
        steps: steps || null,
        pageUrl: pageUrl || null,
        contactEmail: contactEmail || null,
        ipAddress,
        userAgent,
      })
      .returning();

    const receivedAt =
      createdFeedback?.createdAt instanceof Date
        ? createdFeedback.createdAt.toISOString()
        : new Date().toISOString();

    return successResponse({ receivedAt }, '피드백이 접수되었습니다.');
  } catch (error) {
    console.error('POST /api/feedback error:', error);
    return serverErrorResponse();
  }
}
