import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { notifications } from '@/lib/db/schema';
import { successResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/api/response';
import { getSession } from '@/lib/api/auth';
import { and, eq, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const user = await getSession(request);
    if (!user) {
      return unauthorizedResponse();
    }

    const [row] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(notifications)
      .where(and(eq(notifications.userId, user.id), eq(notifications.isRead, false)));

    const response = successResponse({ count: row?.count || 0 });
    response.headers.set('Cache-Control', 'private, no-store');
    return response;
  } catch (error) {
    console.error('GET /api/notifications/unread-count error:', error);
    return serverErrorResponse();
  }
}
