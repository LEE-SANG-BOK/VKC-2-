import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { notifications } from '@/lib/db/schema';
import { setPrivateNoStore, successResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/api/response';
import { getSession } from '@/lib/api/auth';
import { and, eq, sql } from 'drizzle-orm';
import { isE2ETestMode } from '@/lib/e2e/mode';

export async function GET(request: NextRequest) {
  try {
    const user = await getSession(request);
    if (!user) {
      return unauthorizedResponse();
    }

    if (isE2ETestMode()) {
      const response = successResponse({ count: 0 });
      setPrivateNoStore(response);
      return response;
    }

    const [row] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(notifications)
      .where(and(eq(notifications.userId, user.id), eq(notifications.isRead, false)));

    const response = successResponse({ count: row?.count || 0 });
    setPrivateNoStore(response);
    return response;
  } catch (error) {
    console.error('GET /api/notifications/unread-count error:', error);
    return serverErrorResponse();
  }
}
