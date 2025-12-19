import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { successResponse, notFoundResponse, serverErrorResponse } from '@/lib/api/response';

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

    const user = await db.query.users.findFirst({
      where: eq(users.id, id),
      columns: {
        id: true,
        trustScore: true,
        helpfulAnswers: true,
        adoptionRate: true,
        isVerified: true,
        isExpert: true,
        badgeType: true,
      },
    });

    if (!user) {
      return notFoundResponse('사용자를 찾을 수 없습니다.');
    }

    const trustScore = Number(user.trustScore ?? 0);
    const helpfulAnswers = Number(user.helpfulAnswers ?? 0);
    const adoptionRate = Number(user.adoptionRate ?? 0);
    const score = trustScore + helpfulAnswers * 5 + adoptionRate;
    const levelInfo = resolveLevel(score);

    const response = successResponse({
      userId: user.id,
      score: Math.max(0, Math.round(score)),
      trustScore,
      helpfulAnswers,
      adoptionRate,
      ...levelInfo,
      badges: {
        isVerified: user.isVerified ?? false,
        isExpert: user.isExpert ?? false,
        badgeType: user.badgeType ?? null,
      },
    });
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    return response;
  } catch (error) {
    console.error('GET /api/users/[id]/score error:', error);
    return serverErrorResponse();
  }
}
