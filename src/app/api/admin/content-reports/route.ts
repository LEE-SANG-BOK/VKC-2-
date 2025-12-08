import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { contentReports, posts, answers, comments, users } from '@/lib/db/schema';
import { getAdminSession } from '@/lib/admin/auth';
import { and, count, desc, eq, SQL } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const session = await getAdminSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status') || '';
    const type = searchParams.get('type') || '';
    const targetType = searchParams.get('targetType') || '';

    const offset = (page - 1) * limit;
    const conditions: SQL[] = [];

    if (status && status !== 'all') {
      conditions.push(eq(contentReports.status, status as 'pending' | 'reviewed' | 'resolved' | 'dismissed'));
    }
    if (type && type !== 'all') {
      conditions.push(eq(contentReports.type, type as 'spam' | 'harassment' | 'inappropriate' | 'misinformation' | 'other'));
    }
    if (targetType && targetType !== 'all') {
      conditions.push(eq(contentReports.targetType, targetType as 'post' | 'answer' | 'comment'));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [countResult, list] = await Promise.all([
      db.select({ count: count() }).from(contentReports).where(whereClause),
      db
        .select({
          id: contentReports.id,
          targetType: contentReports.targetType,
          targetId: contentReports.targetId,
          type: contentReports.type,
          status: contentReports.status,
          reason: contentReports.reason,
          reviewNote: contentReports.reviewNote,
          handledBy: contentReports.handledBy,
          handledAt: contentReports.handledAt,
          createdAt: contentReports.createdAt,
          updatedAt: contentReports.updatedAt,
          reporter: {
            id: users.id,
            name: users.name,
            displayName: users.displayName,
            email: users.email,
            image: users.image,
          },
        })
        .from(contentReports)
        .leftJoin(users, eq(contentReports.reporterId, users.id))
        .where(whereClause)
        .orderBy(desc(contentReports.createdAt))
        .limit(limit)
        .offset(offset),
    ]);

    const total = countResult[0]?.count || 0;

    const enriched = await Promise.all(
      list.map(async (report) => {
        let target: { id: string; title?: string | null; content?: string | null } | null = null;
        if (report.targetType === 'post') {
          const [p] = await db.select({ id: posts.id, title: posts.title }).from(posts).where(eq(posts.id, report.targetId)).limit(1);
          target = p || null;
        } else if (report.targetType === 'answer') {
          const [a] = await db.select({ id: answers.id, content: answers.content }).from(answers).where(eq(answers.id, report.targetId)).limit(1);
          target = a || null;
        } else if (report.targetType === 'comment') {
          const [c] = await db.select({ id: comments.id, content: comments.content }).from(comments).where(eq(comments.id, report.targetId)).limit(1);
          target = c || null;
        }

        return { ...report, target };
      })
    );

    return NextResponse.json({
      reports: enriched,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Admin content-reports list error:', error);
    return NextResponse.json({ error: 'Failed to fetch content reports' }, { status: 500 });
  }
}
