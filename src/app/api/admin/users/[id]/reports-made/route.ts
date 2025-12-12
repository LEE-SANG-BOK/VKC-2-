import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { reports, posts, comments, answers } from '@/lib/db/schema';
import { getAdminSession } from '@/lib/admin/auth';
import { eq, desc, count } from 'drizzle-orm';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const session = await getAdminSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: userId } = await context.params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    const [countResult, reportsList] = await Promise.all([
      db.select({ count: count() }).from(reports).where(eq(reports.reporterId, userId)),
      db
        .select({
          id: reports.id,
          type: reports.type,
          status: reports.status,
          reason: reports.reason,
          postId: reports.postId,
          commentId: reports.commentId,
          answerId: reports.answerId,
          createdAt: reports.createdAt,
        })
        .from(reports)
        .where(eq(reports.reporterId, userId))
        .orderBy(desc(reports.createdAt))
        .limit(limit)
        .offset(offset),
    ]);

    const total = countResult[0]?.count || 0;

    const formattedReports = await Promise.all(
      reportsList.map(async (report) => {
        let targetTitle = '';
        let targetType = '';
        let linkedPostId = report.postId;

        if (report.postId) {
          const [post] = await db.select({ title: posts.title }).from(posts).where(eq(posts.id, report.postId)).limit(1);
          targetTitle = post?.title || 'Deleted Post';
          targetType = 'post';
        } else if (report.commentId) {
          const [comment] = await db.select({ content: comments.content, postId: comments.postId }).from(comments).where(eq(comments.id, report.commentId)).limit(1);
          targetTitle = comment?.content?.substring(0, 50) || 'Deleted Comment';
          targetType = 'comment';
          linkedPostId = comment?.postId || null;
        } else if (report.answerId) {
          const [answer] = await db.select({ content: answers.content, postId: answers.postId }).from(answers).where(eq(answers.id, report.answerId)).limit(1);
          targetTitle = answer?.content?.substring(0, 50) || 'Deleted Answer';
          targetType = 'answer';
          linkedPostId = answer?.postId || null;
        }

        return {
          ...report,
          postId: linkedPostId,
          targetTitle,
          targetType,
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
    console.error('Admin user reports made error:', error);
    return NextResponse.json({ error: 'Failed to fetch reports made' }, { status: 500 });
  }
}
