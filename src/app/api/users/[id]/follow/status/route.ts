import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { follows } from '@/lib/db/schema';
import { setPrivateNoStore, successResponse, serverErrorResponse } from '@/lib/api/response';
import { getSession } from '@/lib/api/auth';
import { eq, and } from 'drizzle-orm';
import { isE2ETestMode } from '@/lib/e2e/mode';
import { getE2ERequestState } from '@/lib/e2e/request';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    if (isE2ETestMode()) {
      const { id: targetUserId } = await context.params;
      const { store, userId } = getE2ERequestState(request);
      const isFollowing = userId ? store.followsByUserId.get(userId)?.has(targetUserId) === true : false;
      const response = successResponse({ isFollowing });
      setPrivateNoStore(response);
      return response;
    }

    const user = await getSession(request);
    if (!user) {
      const response = successResponse({ isFollowing: false });
      setPrivateNoStore(response);
      return response;
    }

    const { id: targetUserId } = await context.params;

    const existingFollow = await db.query.follows.findFirst({
      where: and(
        eq(follows.followerId, user.id),
        eq(follows.followingId, targetUserId)
      ),
    });

    const response = successResponse({ isFollowing: !!existingFollow });
    setPrivateNoStore(response);
    return response;
  } catch (error) {
    console.error('GET /api/users/[id]/follow/status error:', error);
    return serverErrorResponse();
  }
}
