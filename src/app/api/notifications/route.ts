import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { userPublicColumns } from '@/lib/db/columns';
import { notifications } from '@/lib/db/schema';
import { paginatedResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/api/response';
import { getSession } from '@/lib/api/auth';
import { eq, desc, sql, and } from 'drizzle-orm';
import { isE2ETestMode } from '@/lib/e2e/mode';

/**
 * GET /api/notifications
 * 알림 목록 조회
 *
 * Query Params:
 * - page: number (default: 1)
 * - limit: number (default: 20)
 * - unreadOnly: boolean (default: false) - 읽지 않은 알림만 조회
 * - type: string (optional) - 알림 타입 필터
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getSession(request);
    if (!user) {
      return unauthorizedResponse();
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const type = searchParams.get('type');

    if (isE2ETestMode()) {
      return paginatedResponse([], page, limit, 0);
    }

    // 전체 개수 조회
    let countCondition = eq(notifications.userId, user.id);
    if (unreadOnly) {
      countCondition = and(countCondition, eq(notifications.isRead, false))!;
    }

    const [countResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(notifications)
      .where(countCondition);

    const total = countResult?.count || 0;

    // 알림 목록 조회 (발신자 정보 포함)
    const notificationList = await db.query.notifications.findMany({
      where: (n, { eq, and: andOp }) => {
        let condition = eq(n.userId, user.id);
        if (unreadOnly) {
          condition = andOp(condition, eq(n.isRead, false))!;
        }
        return condition;
      },
      with: {
        sender: {
          columns: userPublicColumns,
        },
        post: {
          columns: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: [desc(notifications.createdAt)],
      limit,
      offset: (page - 1) * limit,
    });

    // 프론트엔드에 맞게 포맷팅
    const formattedNotifications = notificationList.map(n => ({
      id: n.id,
      type: n.type,
      title: getNotificationTitle(n.type),
      message: n.content,
      postTitle: n.post?.title || '',
      postId: n.postId || '',
      author: {
        name: n.sender?.displayName || n.sender?.name || '사용자',
        avatar: n.sender?.image || '/avatar-default.jpg',
      },
      createdAt: formatRelativeTime(n.createdAt),
      isRead: n.isRead,
    }));

    // 타입 필터 적용 (클라이언트 사이드)
    const filteredNotifications = type && type !== 'all'
      ? formattedNotifications.filter(n => n.type === type)
      : formattedNotifications;

    return paginatedResponse(filteredNotifications, page, limit, total);
  } catch (error) {
    console.error('GET /api/notifications error:', error);
    return serverErrorResponse();
  }
}

function getNotificationTitle(type: string): string {
  switch (type) {
    case 'answer':
      return '새 답변';
    case 'comment':
      return '새 댓글';
    case 'reply':
      return '새 답글';
    case 'adoption':
      return '답변 채택';
    case 'like':
      return '좋아요';
    case 'follow':
      return '새 팔로워';
    default:
      return '알림';
  }
}

function formatRelativeTime(date: Date | null): string {
  if (!date) return '';
  
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return '방금 전';
  if (diffMins < 60) return `${diffMins}분 전`;
  if (diffHours < 24) return `${diffHours}시간 전`;
  if (diffDays < 7) return `${diffDays}일 전`;
  return date.toLocaleDateString('ko-KR');
}
