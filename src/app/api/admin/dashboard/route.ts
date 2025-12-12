import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, posts, comments, reports, verificationRequests, answers } from '@/lib/db/schema';
import { getAdminSession } from '@/lib/admin/auth';
import { sql, gte, lte, eq, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const session = await getAdminSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      totalPosts,
      totalComments,
      totalAnswers,
      pendingReports,
      pendingVerifications,
      overdueReports,
      overdueVerifications,
      newUsersMonth,
      dauResult,
      wauResult,
      mauResult,
    ] = await Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(users),
      db.select({ count: sql<number>`count(*)::int` }).from(posts),
      db.select({ count: sql<number>`count(*)::int` }).from(comments),
      db.select({ count: sql<number>`count(*)::int` }).from(answers),
      db.select({ count: sql<number>`count(*)::int` }).from(reports).where(eq(reports.status, 'pending')),
      db.select({ count: sql<number>`count(*)::int` }).from(verificationRequests).where(eq(verificationRequests.status, 'pending')),
      db.select({ count: sql<number>`count(*)::int` }).from(reports).where(and(eq(reports.status, 'pending'), lte(reports.createdAt, dayAgo))),
      db.select({ count: sql<number>`count(*)::int` }).from(verificationRequests).where(and(eq(verificationRequests.status, 'pending'), lte(verificationRequests.submittedAt, dayAgo))),
      db.select({ count: sql<number>`count(*)::int` }).from(users).where(gte(users.createdAt, monthAgo)),
      db.select({ count: sql<number>`count(*)::int` })
        .from(users)
        .where(gte(users.lastLoginAt, dayAgo)),
      db.select({ count: sql<number>`count(*)::int` })
        .from(users)
        .where(gte(users.lastLoginAt, weekAgo)),
      db.select({ count: sql<number>`count(*)::int` })
        .from(users)
        .where(gte(users.lastLoginAt, monthAgo)),
    ]);

    const chartData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));
      
      const [dayPosts, dayUsers, dayComments] = await Promise.all([
        db.select({ count: sql<number>`count(*)::int` })
          .from(posts)
          .where(and(gte(posts.createdAt, dayStart), lte(posts.createdAt, dayEnd))),
        db.select({ count: sql<number>`count(*)::int` })
          .from(users)
          .where(and(gte(users.createdAt, dayStart), lte(users.createdAt, dayEnd))),
        db.select({ count: sql<number>`count(*)::int` })
          .from(comments)
          .where(and(gte(comments.createdAt, dayStart), lte(comments.createdAt, dayEnd))),
      ]);

      chartData.push({
        date: dayStart.toISOString().split('T')[0],
        posts: dayPosts[0]?.count || 0,
        users: dayUsers[0]?.count || 0,
        comments: dayComments[0]?.count || 0,
      });
    }

    return NextResponse.json({
      totalUsers: totalUsers[0]?.count || 0,
      totalPosts: totalPosts[0]?.count || 0,
      totalComments: totalComments[0]?.count || 0,
      totalAnswers: totalAnswers[0]?.count || 0,
      pendingReports: pendingReports[0]?.count || 0,
      pendingVerifications: pendingVerifications[0]?.count || 0,
      overdueReports: overdueReports[0]?.count || 0,
      overdueVerifications: overdueVerifications[0]?.count || 0,
      dau: dauResult[0]?.count || 0,
      wau: wauResult[0]?.count || 0,
      mau: mauResult[0]?.count || 0,
      newUsersThisMonth: newUsersMonth[0]?.count || 0,
      chartData,
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    return NextResponse.json(
      { error: 'Failed to load dashboard data' },
      { status: 500 }
    );
  }
}
