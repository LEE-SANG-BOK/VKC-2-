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
 * DELETE /api/notifications/[id]
 * 알림 삭제
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
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

    // 권한 확인 (본인의 알림만 삭제 가능)
    if (!isOwner(user.id, notification.userId)) {
      return forbiddenResponse('알림을 삭제할 권한이 없습니다.');
    }

    // 알림 삭제
    await db.delete(notifications).where(eq(notifications.id, id));

    return successResponse(null, '알림을 삭제했습니다.');
  } catch (error) {
    console.error('DELETE /api/notifications/[id] error:', error);
    return serverErrorResponse();
  }
}
