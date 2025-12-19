import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { reports, posts, comments, answers, users } from '@/lib/db/schema';
import { getAdminSession } from '@/lib/admin/auth';
import { desc, eq, count, and, SQL } from 'drizzle-orm';

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

    const offset = (page - 1) * limit;

    const conditions: SQL[] = [];

    if (status && status !== 'all') {
      conditions.push(eq(reports.status, status as 'pending' | 'reviewed' | 'resolved' | 'dismissed'));
    }

    if (type && type !== 'all') {
      conditions.push(eq(reports.type, type as 'spam' | 'harassment' | 'inappropriate' | 'misinformation' | 'other'));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [countResult, reportsList] = await Promise.all([
      db.select({ count: count() }).from(reports).where(whereClause),
      db
        .select({
          id: reports.id,
          type: reports.type,
          status: reports.status,
          action: reports.action,
          reason: reports.reason,
          postId: reports.postId,
          answerId: reports.answerId,
          commentId: reports.commentId,
          reviewNote: reports.reviewNote,
          createdAt: reports.createdAt,
          updatedAt: reports.updatedAt,
          reporter: {
            id: users.id,
            name: users.name,
            displayName: users.displayName,
            email: users.email,
            image: users.image,
          },
        })
        .from(reports)
        .leftJoin(users, eq(reports.reporterId, users.id))
        .where(whereClause)
        .orderBy(desc(reports.createdAt))
        .limit(limit)
        .offset(offset),
    ]);

    const total = countResult[0]?.count || 0;

    const formattedReports = await Promise.all(
      reportsList.map(async (report) => {
        let post = null;
        let answer = null;
        let comment = null;

        if (report.postId) {
          const [postData] = await db
            .select({ id: posts.id, title: posts.title })
            .from(posts)
            .where(eq(posts.id, report.postId))
            .limit(1);
          post = postData || null;
        }

        if (report.answerId) {
          const [answerData] = await db
            .select({ id: answers.id, content: answers.content })
            .from(answers)
            .where(eq(answers.id, report.answerId))
            .limit(1);
          answer = answerData || null;
        }

        if (report.commentId) {
          const [commentData] = await db
            .select({ id: comments.id, content: comments.content })
            .from(comments)
            .where(eq(comments.id, report.commentId))
            .limit(1);
          comment = commentData || null;
        }

        return {
          ...report,
          post,
          answer,
          comment,
        };
      })
    );

    return NextResponse.json({
      reports: formattedReports,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Admin reports list error:', error);
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 });
  }
}
