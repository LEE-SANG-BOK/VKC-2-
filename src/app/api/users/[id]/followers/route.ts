import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { follows, users } from '@/lib/db/schema';
import { paginatedResponse, notFoundResponse, serverErrorResponse } from '@/lib/api/response';
import { getSession } from '@/lib/api/auth';
import { getFollowingIdSet } from '@/lib/api/follow';
import { eq, desc, sql, and, or, lt, type SQL } from 'drizzle-orm';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/users/[id]/followers
 * 팔로워 목록 조회
 *
 * Query Params:
 * - page: number (default: 1)
 * - limit: number (default: 20)
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10) || 20));
    const cursorParam = searchParams.get('cursor');

    const currentUser = await getSession(request);

    // 사용자 존재 여부 확인
    const user = await db.query.users.findFirst({
      where: eq(users.id, id),
      columns: {
        id: true,
      },
    });

    if (!user) {
      return notFoundResponse('사용자를 찾을 수 없습니다.');
    }

    type CursorPayload = { createdAt: string; id: string };
    const encodeCursor = (payload: CursorPayload) =>
      Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
    const decodeCursor = (raw: string): CursorPayload | null => {
      if (!raw) return null;
      try {
        const json = Buffer.from(raw, 'base64url').toString('utf8');
        const parsed = JSON.parse(json) as Partial<CursorPayload>;
        if (typeof parsed?.createdAt !== 'string' || typeof parsed?.id !== 'string') return null;
        return { createdAt: parsed.createdAt, id: parsed.id };
      } catch {
        return null;
      }
    };

    const decodedCursor = cursorParam ? decodeCursor(cursorParam) : null;
    const cursorCreatedAt = decodedCursor ? new Date(decodedCursor.createdAt) : null;
    const hasValidCursor = Boolean(decodedCursor && cursorCreatedAt && !Number.isNaN(cursorCreatedAt.getTime()));
    const useCursorPagination = Boolean(cursorParam && hasValidCursor);

    const conditions = [eq(follows.followingId, id)];
    if (useCursorPagination) {
      conditions.push(
        or(
          lt(follows.createdAt, cursorCreatedAt as Date),
          and(eq(follows.createdAt, cursorCreatedAt as Date), lt(follows.id, decodedCursor?.id || ''))
        ) as SQL
      );
    }

    const total = useCursorPagination
      ? 0
      : (
          (
            await db
              .select({ count: sql<number>`count(*)::int` })
              .from(follows)
              .where(eq(follows.followingId, id))
          )[0]?.count || 0
        );

    const totalPages = Math.ceil(total / limit);
    const queryLimit = useCursorPagination ? limit + 1 : limit;

    const rows = await db
      .select({
        followId: follows.id,
        followedAt: follows.createdAt,
        follower: {
          id: users.id,
          name: users.name,
          displayName: users.displayName,
          image: users.image,
          isVerified: users.isVerified,
          isExpert: users.isExpert,
          badgeType: users.badgeType,
        },
      })
      .from(follows)
      .innerJoin(users, eq(follows.followerId, users.id))
      .where(and(...conditions))
      .orderBy(desc(follows.createdAt), desc(follows.id))
      .offset(useCursorPagination ? 0 : (page - 1) * limit)
      .limit(queryLimit);

    const rawHasMore = useCursorPagination ? rows.length > limit : page < totalPages;
    const pageList = useCursorPagination && rows.length > limit ? rows.slice(0, limit) : rows;
    const lastRow = pageList[pageList.length - 1];
    const nextCursor =
      rawHasMore && lastRow
        ? encodeCursor({
            createdAt:
              lastRow.followedAt instanceof Date
                ? lastRow.followedAt.toISOString()
                : String(lastRow.followedAt),
            id: String(lastRow.followId),
          })
        : null;

    const followerUserIds = pageList.map((row) => row.follower.id).filter(Boolean) as string[];
    const followingIdSet = currentUser
      ? await getFollowingIdSet(currentUser.id, followerUserIds)
      : new Set<string>();

    const followers = pageList.map((row) => ({
      ...row.follower,
      isFollowing: currentUser ? followingIdSet.has(row.follower.id) : false,
      followedAt: row.followedAt,
    }));

    const response = paginatedResponse(followers, page, limit, total, {
      nextCursor,
      hasMore: rawHasMore,
      paginationMode: useCursorPagination ? 'cursor' : 'offset',
    });
    response.headers.set('Cache-Control', 'private, no-store');
    return response;
  } catch (error) {
    console.error('GET /api/users/[id]/followers error:', error);
    return serverErrorResponse();
  }
}
