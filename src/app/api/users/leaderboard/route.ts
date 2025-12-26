import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { users, answers } from '@/lib/db/schema';
import { desc, sql, count } from 'drizzle-orm';
import { setPublicSWR, paginatedResponse, serverErrorResponse } from '@/lib/api/response';
import { isE2ETestMode } from '@/lib/e2e/mode';
import { getE2ERequestState } from '@/lib/e2e/request';
import { countFollowers } from '@/lib/e2e/posts';

const resolveTemperature = (score: number) => {
  const safeScore = Math.max(0, score);
  const base = 36.5;
  const multiplier = 2;
  const temperature = base + Math.log10(safeScore + 1) * multiplier;
  return Number(temperature.toFixed(1));
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const limitCandidate = parseInt(searchParams.get('limit') || '10', 10) || 10;
    const limit = Math.min(20, Math.max(1, limitCandidate));
    const offset = (page - 1) * limit;

    if (isE2ETestMode()) {
      const { store } = getE2ERequestState(request);
      const allUsers = Array.from(store.users.values());
      const total = allUsers.length;
      const sorted = allUsers
        .map((user) => {
          const followers = countFollowers(store, user.id);
          const weeklyAnswers = 0;
          const helpfulAnswers = 0;
          const adoptionRate = 0;
          const score = followers * 2 + (user.isVerified ? 5 : 0) + (user.isExpert ? 5 : 0);
          return { user, score, followers, weeklyAnswers, helpfulAnswers, adoptionRate };
        })
        .sort((a, b) => b.score - a.score);

      const pageRows = sorted.slice(offset, offset + limit);
      const leaderboard = pageRows.map((row, index) => ({
        id: row.user.id,
        name: row.user.name ?? null,
        displayName: row.user.displayName ?? row.user.name ?? 'User',
        avatar: row.user.image ?? null,
        image: row.user.image ?? null,
        isVerified: row.user.isVerified,
        isExpert: row.user.isExpert,
        badgeType: row.user.badgeType ?? null,
        score: Math.max(0, Math.round(row.score)),
        temperature: resolveTemperature(row.score),
        helpfulAnswers: row.helpfulAnswers,
        adoptionRate: row.adoptionRate,
        weeklyAnswers: row.weeklyAnswers,
        rank: offset + index + 1,
      }));

      const response = paginatedResponse(leaderboard, page, limit, total);
      setPublicSWR(response, 120, 600);
      return response;
    }

    const weeklyAnswersExpr = sql<number>`COALESCE((
      SELECT COUNT(*)::int
      FROM ${answers}
      WHERE ${answers.authorId} = ${users.id}
        AND ${answers.createdAt} >= (NOW() - INTERVAL '7 days')
    ), 0)`;

    const scoreExpr = sql<number>`(${users.helpfulAnswers} * 5 + ${users.adoptionRate} + (${weeklyAnswersExpr} * 3))::float`;

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
          helpfulAnswers: users.helpfulAnswers,
          adoptionRate: users.adoptionRate,
          weeklyAnswers: weeklyAnswersExpr,
          score: scoreExpr,
        })
        .from(users)
        .orderBy(desc(scoreExpr), desc(weeklyAnswersExpr), desc(users.createdAt), desc(users.id))
        .limit(limit)
        .offset(offset),
    ]);

    const total = countRows[0]?.count || 0;

    const leaderboard = rows.map((row, index) => {
      const scoreValue = Number(row.score ?? 0);
      const helpfulAnswers = Number(row.helpfulAnswers ?? 0);
      const adoptionRate = Number(row.adoptionRate ?? 0);
      const weeklyAnswers = Number(row.weeklyAnswers ?? 0);
      const temperature = resolveTemperature(scoreValue);

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
        temperature,
        helpfulAnswers,
        adoptionRate,
        weeklyAnswers,
        rank: offset + index + 1,
      };
    });

    const response = paginatedResponse(leaderboard, page, limit, total);
    setPublicSWR(response, 120, 600);
    return response;
  } catch (error) {
    console.error('GET /api/users/leaderboard error:', error);
    return serverErrorResponse();
  }
}
