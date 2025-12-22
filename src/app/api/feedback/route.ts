import { NextRequest } from 'next/server';
import { db, getQueryClient } from '@/lib/db';
import { feedbacks } from '@/lib/db/schema';
import { successResponse, errorResponse, serverErrorResponse, rateLimitResponse } from '@/lib/api/response';
import { getSession } from '@/lib/api/auth';
import { validateUgcText } from '@/lib/validation/ugc';
import { and, eq, gte, sql } from 'drizzle-orm';

const feedbackRateLimitWindowMs = 60 * 60 * 1000;
const feedbackRateLimitMax = 3;
const feedbackTitleMax = 200;
const feedbackDescriptionMin = 1;
const feedbackDescriptionMax = 2000;
const feedbackColumnsCacheTtlMs = 5 * 60 * 1000;

let cachedFeedbackColumns:
  | {
      fetchedAt: number;
      columns: Set<string>;
    }
  | undefined;

const resolveClientIp = (request: NextRequest) => {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0]?.trim() || 'unknown';
  }
  return request.headers.get('x-real-ip') || 'unknown';
};

const getFeedbackColumns = async () => {
  if (cachedFeedbackColumns && Date.now() - cachedFeedbackColumns.fetchedAt < feedbackColumnsCacheTtlMs) {
    return cachedFeedbackColumns.columns;
  }

  const client = getQueryClient();
  const result = await client`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'feedbacks'
  `;
  const columns = new Set(
    (result as Array<{ column_name?: unknown }>).map((row) => String(row?.column_name || '').trim()).filter(Boolean)
  );

  cachedFeedbackColumns = { fetchedAt: Date.now(), columns };
  return columns;
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

    if (title) {
      const titleValidation = validateUgcText(title, 1, feedbackTitleMax);
      if (!titleValidation.ok) {
        if (titleValidation.code === 'UGC_TOO_LONG') {
          return errorResponse('요약이 너무 깁니다.', 'FEEDBACK_TITLE_TOO_LONG');
        }
        return errorResponse('요약 내용이 올바르지 않습니다.', 'FEEDBACK_TITLE_INVALID');
      }
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
      return rateLimitResponse(
        '피드백 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
        'FEEDBACK_RATE_LIMITED',
        Math.max(1, Math.ceil(feedbackRateLimitWindowMs / 1000))
      );
    }

    const autoTitle = title || description.slice(0, 80);
    const descriptionWithoutTitle = title && title !== description ? `${title}\n\n${description}` : description;

    const basePayload = {
      userId: user?.id || null,
      type,
      title: autoTitle,
      description,
      descriptionWithoutTitle,
      pageUrl: pageUrl || null,
      contactEmail: contactEmail || null,
      ipAddress,
      userAgent,
    };

    const columns = await getFeedbackColumns();
    const insertPayload: Record<string, unknown> = { type: basePayload.type };

    if (columns.has('user_id')) insertPayload.user_id = basePayload.userId;
    if (columns.has('page_url')) insertPayload.page_url = basePayload.pageUrl;
    if (columns.has('contact_email')) insertPayload.contact_email = basePayload.contactEmail;
    if (columns.has('ip_address')) insertPayload.ip_address = basePayload.ipAddress;
    if (columns.has('user_agent')) insertPayload.user_agent = basePayload.userAgent;
    const hasTitle = columns.has('title');
    const hasDescription = columns.has('description');
    const hasContent = columns.has('content');

    if (hasTitle) insertPayload.title = basePayload.title;
    if (hasDescription) insertPayload.description = basePayload.description;
    if (columns.has('steps')) insertPayload.steps = null;

    if (!hasDescription && hasContent) {
      insertPayload.content = hasTitle ? basePayload.description : basePayload.descriptionWithoutTitle;
    }

    if (!hasTitle && !hasDescription && hasContent && !('content' in insertPayload)) {
      insertPayload.content = basePayload.descriptionWithoutTitle;
    }

    const filteredEntries = Object.entries(insertPayload).filter(([, value]) => value !== undefined);
    if (filteredEntries.length === 0) {
      throw new Error('Feedback insert payload is empty');
    }

    const fields = filteredEntries.map(([key]) => `"${key}"`).join(', ');
    const values = filteredEntries.map(([, value]) => value);
    const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');

    const client = getQueryClient();
    const [createdRow] = await client.unsafe<{ created_at?: unknown }[]>(
      `INSERT INTO feedbacks (${fields}) VALUES (${placeholders}) RETURNING created_at`,
      values as any[]
    );

    const createdAt = createdRow?.created_at;
    const receivedAt = createdAt instanceof Date
      ? createdAt.toISOString()
      : typeof createdAt === 'string'
        ? new Date(createdAt).toISOString()
        : new Date().toISOString();

    return successResponse({ receivedAt }, '피드백이 접수되었습니다.');
  } catch (error) {
    console.error('POST /api/feedback error:', error);
    return serverErrorResponse();
  }
}
