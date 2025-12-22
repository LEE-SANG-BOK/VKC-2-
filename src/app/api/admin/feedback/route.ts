import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { feedbacks, users } from '@/lib/db/schema';
import { getAdminSession } from '@/lib/admin/auth';
import { desc, eq, ilike, or, and, sql, SQL } from 'drizzle-orm';

const hasMissingFeedbackTitleColumn = (error: unknown) => {
  const visited = new Set<unknown>();
  let current: unknown = error;
  while (current && !visited.has(current)) {
    visited.add(current);
    const message =
      current instanceof Error
        ? current.message
        : typeof (current as any)?.message === 'string'
          ? String((current as any).message)
          : '';
    if (/column \"title\" of relation \"feedbacks\" does not exist/i.test(message)) {
      return true;
    }
    current = current instanceof Error ? current.cause : (current as any)?.cause;
  }
  return false;
};

export async function GET(request: NextRequest) {
  try {
    const session = await getAdminSession(request);
    if (!session) {
      return NextResponse.json({ success: false, message: '인증이 필요합니다.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const limitCandidate = parseInt(searchParams.get('limit') || '20', 10) || 20;
    const limit = Math.min(50, Math.max(1, limitCandidate));
    const type = (searchParams.get('type') || '').trim();
    const search = (searchParams.get('search') || '').trim();

    const offset = (page - 1) * limit;
    const conditions: SQL[] = [];

    if (type === 'feedback' || type === 'bug') {
      conditions.push(eq(feedbacks.type, type));
    }

    if (search) {
      const searchCondition = or(
        ilike(feedbacks.title, `%${search}%`),
        ilike(feedbacks.description, `%${search}%`)
      );
      if (searchCondition) conditions.push(searchCondition);
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const runQuery = async () => {
      const [countResult, feedbackList] = await Promise.all([
        db.select({ count: sql<number>`count(*)::int` }).from(feedbacks).where(whereClause),
        db
          .select({
            id: feedbacks.id,
            type: feedbacks.type,
            title: feedbacks.title,
            description: feedbacks.description,
            steps: feedbacks.steps,
            pageUrl: feedbacks.pageUrl,
            contactEmail: feedbacks.contactEmail,
            ipAddress: feedbacks.ipAddress,
            userAgent: feedbacks.userAgent,
            createdAt: feedbacks.createdAt,
            user: {
              id: users.id,
              name: users.name,
              displayName: users.displayName,
              email: users.email,
              image: users.image,
            },
          })
          .from(feedbacks)
          .leftJoin(users, eq(feedbacks.userId, users.id))
          .where(whereClause)
          .orderBy(desc(feedbacks.createdAt))
          .limit(limit)
          .offset(offset),
      ]);

      return { countResult, feedbackList };
    };

    const runQueryWithoutTitle = async () => {
      const fallbackConditions: SQL[] = [];

      if (type === 'feedback' || type === 'bug') {
        fallbackConditions.push(eq(feedbacks.type, type));
      }

      if (search) {
        fallbackConditions.push(ilike(feedbacks.description, `%${search}%`));
      }

      const fallbackWhereClause = fallbackConditions.length > 0 ? and(...fallbackConditions) : undefined;
      const titleExpr = sql<string>`split_part(${feedbacks.description}, E'\n', 1)`;

      const [countResult, feedbackList] = await Promise.all([
        db.select({ count: sql<number>`count(*)::int` }).from(feedbacks).where(fallbackWhereClause),
        db
          .select({
            id: feedbacks.id,
            type: feedbacks.type,
            title: titleExpr,
            description: feedbacks.description,
            steps: feedbacks.steps,
            pageUrl: feedbacks.pageUrl,
            contactEmail: feedbacks.contactEmail,
            ipAddress: feedbacks.ipAddress,
            userAgent: feedbacks.userAgent,
            createdAt: feedbacks.createdAt,
            user: {
              id: users.id,
              name: users.name,
              displayName: users.displayName,
              email: users.email,
              image: users.image,
            },
          })
          .from(feedbacks)
          .leftJoin(users, eq(feedbacks.userId, users.id))
          .where(fallbackWhereClause)
          .orderBy(desc(feedbacks.createdAt))
          .limit(limit)
          .offset(offset),
      ]);

      return { countResult, feedbackList };
    };

    let countResult: Array<{ count: number }>;
    let feedbackList: Array<any>;
    try {
      ({ countResult, feedbackList } = await runQuery());
    } catch (error) {
      if (!hasMissingFeedbackTitleColumn(error)) {
        throw error;
      }
      ({ countResult, feedbackList } = await runQueryWithoutTitle());
    }

    const total = countResult[0]?.count || 0;

    const formattedFeedbacks = feedbackList.map((feedback) => ({
      id: feedback.id,
      type: feedback.type,
      title: feedback.title,
      description: feedback.description,
      steps: feedback.steps,
      pageUrl: feedback.pageUrl,
      contactEmail: feedback.contactEmail,
      ipAddress: feedback.ipAddress,
      userAgent: feedback.userAgent,
      createdAt: feedback.createdAt,
      user: feedback.user?.id
        ? {
            id: feedback.user.id,
            name: feedback.user.displayName || feedback.user.name || feedback.user.email?.split('@')[0] || null,
            email: feedback.user.email,
            image: feedback.user.image,
          }
        : null,
    }));

    return NextResponse.json({
      feedbacks: formattedFeedbacks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Admin feedback list error:', error);
    return NextResponse.json(
      { success: false, message: '피드백 목록을 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
