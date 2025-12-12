import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { notifications } from '@/lib/db/schema';
import { successResponse, unauthorizedResponse, notFoundResponse, forbiddenResponse, serverErrorResponse } from '@/lib/api/response';
import { getSession, isOwner } from '@/lib/api/auth';
import { eq } from 'drizzle-orm';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * PUT /api/notifications/[id]/read
 * 알림 읽음 처리
 */
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const user = await getSession(request);
    if (!user) {
      return unauthorizedResponse();
    }

    const { id } = await context.params;

    // 알림 조회
    const notification = await db.query.notifications.findFirst({
      where: eq(notifications.id, id),
    });

    if (!notification) {
      return notFoundResponse('알림을 찾을 수 없습니다.');
    }

    // 권한 확인 (본인의 알림만 읽음 처리 가능)
    if (!isOwner(user.id, notification.userId)) {
      return forbiddenResponse('알림을 읽을 권한이 없습니다.');
    }

    // 이미 읽은 알림
    if (notification.isRead) {
      return successResponse(notification, '이미 읽은 알림입니다.');
    }

    // 읽음 처리
    const [updatedNotification] = await db
      .update(notifications)
      .set({
        isRead: true,
        readAt: new Date(),
      })
      .where(eq(notifications.id, id))
      .returning();

    return successResponse(updatedNotification, '알림을 읽음 처리했습니다.');
  } catch (error) {
    console.error('PUT /api/notifications/[id]/read error:', error);
    return serverErrorResponse();
  }
}
