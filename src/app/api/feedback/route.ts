import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
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

const missingFeedbackColumnName = (error: unknown) => {
  const visited = new Set<unknown>();
  let current: unknown = error;
  while (current && !visited.has(current)) {
    visited.add(current);
    const message =
      current instanceof Error
        ? current.message
        : typeof (current as any)?.message === 'string'
          ? String((current as any).message)
          : '';
    const match = message.match(/column \"([^\"]+)\" of relation \"feedbacks\" does not exist/i);
    if (match?.[1]) return match[1];
    current = current instanceof Error ? current.cause : (current as any)?.cause;
  }
  return null;
};

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

  const result = await db.execute(sql`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'feedbacks'
  `);

  const columns = new Set(
    Array.from(result).map((row) => String((row as { column_name?: unknown }).column_name || '').trim()).filter(Boolean)
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

    const columnKeyByName: Record<string, string> = {
      title: 'title',
      steps: 'steps',
      page_url: 'pageUrl',
      contact_email: 'contactEmail',
      ip_address: 'ipAddress',
      user_agent: 'userAgent',
    };

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

    let receivedAt = new Date().toISOString();
    const executeInsert = async (columns: Set<string>) => {
      const usesTitle = columns.has('title');

      const insertValues: Record<string, unknown> = {};
      if (columns.has('user_id')) insertValues.user_id = basePayload.userId;
      if (columns.has('type')) insertValues.type = basePayload.type;
      if (usesTitle) insertValues.title = basePayload.title;
      if (columns.has('description')) {
        insertValues.description = usesTitle ? basePayload.description : basePayload.descriptionWithoutTitle;
      }
      if (columns.has('page_url')) insertValues.page_url = basePayload.pageUrl;
      if (columns.has('contact_email')) insertValues.contact_email = basePayload.contactEmail;
      if (columns.has('ip_address')) insertValues.ip_address = basePayload.ipAddress;
      if (columns.has('user_agent')) insertValues.user_agent = basePayload.userAgent;

      const insertColumns = Object.keys(insertValues);
      if (insertColumns.length === 0) {
        throw new Error('Feedback insert payload is empty');
      }

      const result = await db.execute(sql`
        INSERT INTO feedbacks (
          ${sql.join(insertColumns.map((column) => sql.identifier(column)), sql`, `)}
        ) VALUES (
          ${sql.join(insertColumns.map((column) => sql`${insertValues[column]}`), sql`, `)}
        )
        RETURNING created_at
      `);

      const rows = Array.from(result) as Array<{ created_at?: unknown }>;
      const createdAt = rows[0]?.created_at;
      if (createdAt instanceof Date) {
        receivedAt = createdAt.toISOString();
      } else if (typeof createdAt === 'string') {
        receivedAt = new Date(createdAt).toISOString();
      }
    };

    let columns = await getFeedbackColumns();
    try {
      await executeInsert(columns);
    } catch (error) {
      const columnName = missingFeedbackColumnName(error);
      if (!columnName || !columnKeyByName[columnName]) throw error;
      cachedFeedbackColumns = undefined;
      columns = await getFeedbackColumns();
      await executeInsert(columns);
    }

    return successResponse({ receivedAt }, '피드백이 접수되었습니다.');
  } catch (error) {
    console.error('POST /api/feedback error:', error);
    return serverErrorResponse();
  }
}
