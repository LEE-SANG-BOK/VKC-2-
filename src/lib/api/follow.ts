import { db } from '@/lib/db';
import { follows } from '@/lib/db/schema';
import { and, eq, inArray } from 'drizzle-orm';

export async function getFollowingIdSet(
  followerId: string | null | undefined,
  candidateUserIds: Array<string | null | undefined>
): Promise<Set<string>> {
  if (!followerId) {
    return new Set();
  }

  const uniqueCandidateIds = Array.from(new Set(candidateUserIds))
    .filter((value): value is string => Boolean(value))
    .filter((id) => id !== followerId);

  if (uniqueCandidateIds.length === 0) {
    return new Set();
  }

  const rows = await db
    .select({ followingId: follows.followingId })
    .from(follows)
    .where(and(eq(follows.followerId, followerId), inArray(follows.followingId, uniqueCandidateIds)));

  return new Set(rows.map((row) => row.followingId).filter((value): value is string => Boolean(value)));
}
