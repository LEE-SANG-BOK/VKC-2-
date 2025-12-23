import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { feedbacks } from '@/lib/db/schema';
import { successResponse, errorResponse, serverErrorResponse, rateLimitResponse } from '@/lib/api/response';
import { getSession } from '@/lib/api/auth';
import { validateUgcText } from '@/lib/validation/ugc';
import { and, eq, gte, sql } from 'drizzle-orm';

const feedbackRateLimitWindowMs = 60 * 60 * 1000;
const feedbackRateLimitMax = 3;
const feedbackContentMax = 2000;

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

    if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
      return errorResponse('올바른 이메일을 입력해주세요.', 'FEEDBACK_EMAIL_INVALID');
    }

    const parts = [
      title ? `[${title}]` : '',
      description,
      steps ? `\n\n${steps}` : '',
    ].filter((value) => typeof value === 'string' && value.trim().length > 0);

    const content = parts.join('\n\n').trim();
    if (!content) {
      return errorResponse('내용을 입력해주세요.', 'FEEDBACK_CONTENT_REQUIRED');
    }

    const contentValidation = validateUgcText(content, 1, feedbackContentMax);
    if (!contentValidation.ok) {
      if (contentValidation.code === 'UGC_TOO_LONG') {
        return errorResponse('내용이 너무 깁니다.', 'FEEDBACK_CONTENT_TOO_LONG');
      }
      return errorResponse('내용이 올바르지 않습니다.', 'FEEDBACK_CONTENT_INVALID');
    }

    const ipAddress = resolveClientIp(request);
    const rateLimitStart = new Date(Date.now() - feedbackRateLimitWindowMs);
    const rateLimitCondition = user?.id ? eq(feedbacks.userId, user.id) : eq(feedbacks.ipAddress, ipAddress);

    const [rateLimitRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(feedbacks)
      .where(and(rateLimitCondition, gte(feedbacks.createdAt, rateLimitStart)));

    if ((rateLimitRow?.count || 0) >= feedbackRateLimitMax) {
      return rateLimitResponse(
        '피드백 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
        'FEEDBACK_RATE_LIMITED',
        Math.max(1, Math.ceil(feedbackRateLimitWindowMs / 1000))
      );
    }

    const [createdRow] = await db
      .insert(feedbacks)
      .values({
        userId: user?.id || null,
        type,
        content,
        pageUrl: pageUrl || null,
        contactEmail: contactEmail || null,
        ipAddress,
        userAgent,
      })
      .returning({ createdAt: feedbacks.createdAt });

    const receivedAt = createdRow?.createdAt ? createdRow.createdAt.toISOString() : new Date().toISOString();

    return successResponse({ receivedAt }, '피드백이 접수되었습니다.');
  } catch (error) {
    console.error('POST /api/feedback error:', error);
    return serverErrorResponse();
  }
}
