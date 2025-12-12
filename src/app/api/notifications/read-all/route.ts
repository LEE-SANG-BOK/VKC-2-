import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { notifications } from '@/lib/db/schema';
import { successResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/api/response';
import { getSession } from '@/lib/api/auth';
import { eq, and } from 'drizzle-orm';

/**
 * PUT /api/notifications/read-all
 * 모든 알림 읽음 처리
 */
export async function PUT(request: NextRequest) {
  try {
    const user = await getSession(request);
    if (!user) {
      return unauthorizedResponse();
    }

    // 읽지 않은 알림만 업데이트
    const result = await db
      .update(notifications)
      .set({
        isRead: true,
        readAt: new Date(),
      })
      .where(
        and(
          eq(notifications.userId, user.id),
          eq(notifications.isRead, false)
        )
      );

    return successResponse(
      { updated: result.length || 0 },
      '모든 알림을 읽음 처리했습니다.'
    );
  } catch (error) {
    console.error('PUT /api/notifications/read-all error:', error);
    return serverErrorResponse();
  }
}
