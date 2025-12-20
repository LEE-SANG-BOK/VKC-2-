import { NextRequest } from 'next/server';
import { createHash } from 'crypto';
import { db } from '@/lib/db';
import { eventLogs } from '@/lib/db/schema';
import { getSession } from '@/lib/api/auth';
import { successResponse, errorResponse, serverErrorResponse } from '@/lib/api/response';

const allowedEventTypes = new Set(['view', 'search', 'post', 'like', 'answer', 'comment', 'bookmark', 'follow', 'report', 'share']);
const allowedEntityTypes = new Set(['post', 'answer', 'comment', 'user', 'search']);
const allowedLocales = new Set(['ko', 'en', 'vi']);
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const resolveClientIp = (request: NextRequest) => {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0]?.trim() || '';
  }
  return request.headers.get('x-real-ip') || '';
};

const hashIp = (ip: string) => {
  if (!ip) return null;
  const salt = process.env.LOG_HASH_SALT || '';
  return createHash('sha256').update(`${salt}:${ip}`).digest('hex');
};

export async function POST(request: NextRequest) {
  try {
    const user = await getSession(request);
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return errorResponse('요청을 확인할 수 없습니다.', 'EVENT_INVALID_BODY');
    }

    const eventType = typeof body.eventType === 'string' ? body.eventType.trim().toLowerCase() : '';
    const entityType = typeof body.entityType === 'string' ? body.entityType.trim().toLowerCase() : '';
    const entityId = typeof body.entityId === 'string' ? body.entityId.trim() : '';
    const sessionId = typeof body.sessionId === 'string' ? body.sessionId.trim() : '';
    const locale = typeof body.locale === 'string' ? body.locale.trim().toLowerCase() : '';
    const referrer = typeof body.referrer === 'string' ? body.referrer.trim() : '';
    const metadata =
      body.metadata && typeof body.metadata === 'object' ? body.metadata : null;

    if (!allowedEventTypes.has(eventType)) {
      return errorResponse('올바르지 않은 이벤트입니다.', 'EVENT_INVALID_TYPE');
    }

    if (!allowedEntityTypes.has(entityType)) {
      return errorResponse('올바르지 않은 대상입니다.', 'EVENT_INVALID_ENTITY');
    }

    if (eventType !== 'search' && !entityId) {
      return errorResponse('대상 ID가 필요합니다.', 'EVENT_ENTITY_REQUIRED');
    }

    if (eventType === 'search' && entityType !== 'search') {
      return errorResponse('검색 이벤트 대상이 올바르지 않습니다.', 'EVENT_INVALID_ENTITY');
    }

    if (entityId && !uuidRegex.test(entityId)) {
      return errorResponse('올바르지 않은 대상 ID입니다.', 'EVENT_ENTITY_ID_INVALID');
    }

    const ipHash = hashIp(resolveClientIp(request));
    const safeLocale = allowedLocales.has(locale) ? locale : null;
    const resolvedReferrer = referrer || request.headers.get('referer') || '';

    const [created] = await db
      .insert(eventLogs)
      .values({
        eventType,
        entityType,
        entityId: entityId || null,
        userId: user?.id || null,
        sessionId: sessionId || null,
        ipHash,
        locale: safeLocale,
        referrer: resolvedReferrer || null,
        metadata,
      })
      .returning({ id: eventLogs.id });

    return successResponse({ id: created?.id || null });
  } catch (error) {
    console.error('POST /api/events error:', error);
    return serverErrorResponse();
  }
}
