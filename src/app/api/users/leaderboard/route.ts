import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { desc, sql, count } from 'drizzle-orm';
import { paginatedResponse, serverErrorResponse } from '@/lib/api/response';

const resolveLevel = (score: number) => {
  const safeScore = Math.max(0, Math.round(score));
  const step = 100;
  const level = Math.floor(safeScore / step) + 1;
  const progress = Number(((safeScore % step) / step).toFixed(2));
  return {
    level,
    levelProgress: progress,
  };
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const limitCandidate = parseInt(searchParams.get('limit') || '10', 10) || 10;
    const limit = Math.min(20, Math.max(1, limitCandidate));
    const offset = (page - 1) * limit;

    const scoreExpr = sql<number>`(${users.trustScore} + ${users.helpfulAnswers} * 5 + ${users.adoptionRate})::float`;

    const [countRows, rows] = await Promise.all([
      db.select({ count: count() }).from(users),
      db
        .select({
          id: users.id,
          name: users.name,
          displayName: users.displayName,
          image: users.image,
          isVerified: users.isVerified,
          isExpert: users.isExpert,
          badgeType: users.badgeType,
          trustScore: users.trustScore,
          helpfulAnswers: users.helpfulAnswers,
          adoptionRate: users.adoptionRate,
          score: scoreExpr,
        })
        .from(users)
        .orderBy(desc(scoreExpr), desc(users.createdAt), desc(users.id))
        .limit(limit)
        .offset(offset),
    ]);

    const total = countRows[0]?.count || 0;

    const leaderboard = rows.map((row, index) => {
      const scoreValue = Number(row.score ?? 0);
      const trustScore = Number(row.trustScore ?? 0);
      const helpfulAnswers = Number(row.helpfulAnswers ?? 0);
      const adoptionRate = Number(row.adoptionRate ?? 0);
      const { level, levelProgress } = resolveLevel(scoreValue);

      return {
        id: row.id,
        name: row.name ?? null,
        displayName: row.displayName ?? row.name ?? 'User',
        avatar: row.image ?? null,
        image: row.image ?? null,
        isVerified: row.isVerified ?? false,
        isExpert: row.isExpert ?? false,
        badgeType: row.badgeType ?? null,
        score: Math.max(0, Math.round(scoreValue)),
        trustScore,
        helpfulAnswers,
        adoptionRate,
        level,
        levelProgress,
        rank: offset + index + 1,
      };
    });

    const response = paginatedResponse(leaderboard, page, limit, total);
    response.headers.set('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=600');
    return response;
  } catch (error) {
    console.error('GET /api/users/leaderboard error:', error);
    return serverErrorResponse();
  }
}
