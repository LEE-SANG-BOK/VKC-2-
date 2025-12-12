import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { follows, users } from '@/lib/db/schema';
import { successResponse, unauthorizedResponse, notFoundResponse, serverErrorResponse } from '@/lib/api/response';
import { getSession } from '@/lib/api/auth';
import { eq, and } from 'drizzle-orm';
import { createFollowNotification } from '@/lib/notifications/create';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/users/[id]/follow
 * 팔로우 토글 (팔로우/언팔로우)
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const user = await getSession(request);
    if (!user) {
      return unauthorizedResponse();
    }

    const { id: targetUserId } = await context.params;

    // 자기 자신을 팔로우할 수 없음
    if (user.id === targetUserId) {
      return serverErrorResponse('자기 자신을 팔로우할 수 없습니다.');
    }

    // 대상 사용자 존재 여부 확인
    const targetUser = await db.query.users.findFirst({
      where: eq(users.id, targetUserId),
    });

    if (!targetUser) {
      return notFoundResponse('사용자를 찾을 수 없습니다.');
    }

    // 기존 팔로우 관계 확인
    const existingFollow = await db.query.follows.findFirst({
      where: and(
        eq(follows.followerId, user.id),
        eq(follows.followingId, targetUserId)
      ),
    });

    if (existingFollow) {
      // 언팔로우
      await db.delete(follows).where(eq(follows.id, existingFollow.id));

      return successResponse(
        { isFollowing: false },
        '팔로우를 취소했습니다.'
      );
    } else {
      // 팔로우
      await db.insert(follows).values({
        followerId: user.id,
        followingId: targetUserId,
      });

      // 알림 생성
      await createFollowNotification(
        targetUserId,
        user.id,
        user.name || user.email || '사용자'
      );

      return successResponse(
        { isFollowing: true },
        '팔로우했습니다.'
      );
    }
  } catch (error) {
    console.error('POST /api/users/[id]/follow error:', error);
    return serverErrorResponse();
  }
}
