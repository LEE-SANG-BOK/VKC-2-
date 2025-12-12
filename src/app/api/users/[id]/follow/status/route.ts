import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { follows } from '@/lib/db/schema';
import { successResponse, serverErrorResponse } from '@/lib/api/response';
import { getSession } from '@/lib/api/auth';
import { eq, and } from 'drizzle-orm';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const user = await getSession(request);
    if (!user) {
      return successResponse({ isFollowing: false });
    }

    const { id: targetUserId } = await context.params;

    const existingFollow = await db.query.follows.findFirst({
      where: and(
        eq(follows.followerId, user.id),
        eq(follows.followingId, targetUserId)
      ),
    });

    return successResponse({ isFollowing: !!existingFollow });
  } catch (error) {
    console.error('GET /api/users/[id]/follow/status error:', error);
    return serverErrorResponse();
  }
}
