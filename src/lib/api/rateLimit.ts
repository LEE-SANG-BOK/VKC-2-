import { db } from '@/lib/db';
import { and, eq, gte, sql } from 'drizzle-orm';

type RateLimitCheck = {
  table: any;
  userColumn: any;
  createdAtColumn: any;
  userId: string;
  windowMs: number;
  max: number;
};

export async function checkRateLimit({
  table,
  userColumn,
  createdAtColumn,
  userId,
  windowMs,
  max,
}: RateLimitCheck) {
  const since = new Date(Date.now() - windowMs);
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(table)
    .where(and(eq(userColumn, userId), gte(createdAtColumn, since)));
  const count = row?.count || 0;
  return {
    allowed: count < max,
    retryAfterSeconds: Math.max(1, Math.ceil(windowMs / 1000)),
  };
}
