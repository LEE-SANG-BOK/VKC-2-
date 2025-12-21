import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { and, eq, or, sql } from 'drizzle-orm';
import { setPublicSWR, successResponse, notFoundResponse, serverErrorResponse } from '@/lib/api/response';

interface RouteContext {
  params: Promise<{ id: string }>;
}

const resolveLevel = (score: number) => {
  const safeScore = Math.max(0, Math.round(score));
  const step = 100;
  const level = Math.floor(safeScore / step) + 1;
  const progress = Number(((safeScore % step) / step).toFixed(2));
  return {
    level,
    levelProgress: progress,
    nextLevelScore: level * step,
  };
};

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    const scoreExpr = sql<number>`(${users.trustScore} + ${users.helpfulAnswers} * 5 + ${users.adoptionRate})::float`;

    const [user] = await db
      .select({
        id: users.id,
        trustScore: users.trustScore,
        helpfulAnswers: users.helpfulAnswers,
        adoptionRate: users.adoptionRate,
        isVerified: users.isVerified,
        isExpert: users.isExpert,
        badgeType: users.badgeType,
        createdAt: users.createdAt,
        score: scoreExpr,
      })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!user) {
      return notFoundResponse('사용자를 찾을 수 없습니다.');
    }

    const trustScore = Number(user.trustScore ?? 0);
    const helpfulAnswers = Number(user.helpfulAnswers ?? 0);
    const adoptionRate = Number(user.adoptionRate ?? 0);
    const scoreValue = Number(user.score ?? 0);
    const levelInfo = resolveLevel(scoreValue);
    const createdAtValue = user.createdAt instanceof Date ? user.createdAt.toISOString() : user.createdAt;
    const [{ count: higherCount } = { count: 0 }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(
        or(
          sql`${scoreExpr} > ${scoreValue}`,
          and(sql`${scoreExpr} = ${scoreValue}`, sql`${users.createdAt} > ${createdAtValue}`),
          and(sql`${scoreExpr} = ${scoreValue}`, sql`${users.createdAt} = ${createdAtValue}`, sql`${users.id} > ${user.id}`)
        )
      );
    const rank = Number(higherCount || 0) + 1;

    const response = successResponse({
      userId: user.id,
      score: Math.max(0, Math.round(scoreValue)),
      trustScore,
      helpfulAnswers,
      adoptionRate,
      rank,
      ...levelInfo,
      badges: {
        isVerified: user.isVerified ?? false,
        isExpert: user.isExpert ?? false,
        badgeType: user.badgeType ?? null,
      },
    });
    setPublicSWR(response, 300, 600);
    return response;
  } catch (error) {
    console.error('GET /api/users/[id]/score error:', error);
    return serverErrorResponse();
  }
}
