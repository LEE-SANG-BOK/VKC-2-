import { db } from '@/lib/db';
import { and, desc, eq, gte } from 'drizzle-orm';

type RateLimitCheck = {
  table: any;
  userColumn: any;
  createdAtColumn: any;
  userId: string;
  windowMs: number;
  max: number;
};

type InMemoryRateLimitCheck = {
  key: string;
  windowMs: number;
  max: number;
};

const memoryRateStore = new Map<string, { count: number; resetAt: number }>();

export async function checkRateLimit({
  table,
  userColumn,
  createdAtColumn,
  userId,
  windowMs,
  max,
}: RateLimitCheck) {
  const now = Date.now();
  const since = new Date(now - windowMs);
  const rows = await db
    .select({ createdAt: createdAtColumn })
    .from(table)
    .where(and(eq(userColumn, userId), gte(createdAtColumn, since)))
    .orderBy(desc(createdAtColumn))
    .limit(max);

  const count = rows.length;
  const oldest = rows[count - 1]?.createdAt;
  const retryAfterSeconds =
    oldest instanceof Date
      ? Math.max(1, Math.ceil((oldest.getTime() + windowMs - now) / 1000))
      : Math.max(1, Math.ceil(windowMs / 1000));

  return {
    allowed: count < max,
    retryAfterSeconds,
    remaining: count < max ? Math.max(0, max - count) : 0,
  };
}

export function checkInMemoryRateLimit({ key, windowMs, max }: InMemoryRateLimitCheck) {
  const now = Date.now();
  const entry = memoryRateStore.get(key);
  if (!entry || now >= entry.resetAt) {
    const resetAt = now + windowMs;
    memoryRateStore.set(key, { count: 1, resetAt });
    return {
      allowed: true,
      retryAfterSeconds: Math.max(1, Math.ceil(windowMs / 1000)),
      remaining: Math.max(0, max - 1),
    };
  }

  if (entry.count >= max) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
      remaining: 0,
    };
  }

  entry.count += 1;
  memoryRateStore.set(key, entry);
  return {
    allowed: true,
    retryAfterSeconds: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
    remaining: Math.max(0, max - entry.count),
  };
}
