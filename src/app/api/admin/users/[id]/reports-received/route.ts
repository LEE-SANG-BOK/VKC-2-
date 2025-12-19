import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { reports, posts, comments, answers, users } from '@/lib/db/schema';
import { getAdminSession } from '@/lib/admin/auth';
import { eq, desc, count, or } from 'drizzle-orm';

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

    const userPosts = await db.select({ id: posts.id }).from(posts).where(eq(posts.authorId, userId));
    const userComments = await db.select({ id: comments.id }).from(comments).where(eq(comments.authorId, userId));
    const userAnswers = await db.select({ id: answers.id }).from(answers).where(eq(answers.authorId, userId));

    const postIds = userPosts.map(p => p.id);
    const commentIds = userComments.map(c => c.id);
    const answerIds = userAnswers.map(a => a.id);

    if (postIds.length === 0 && commentIds.length === 0 && answerIds.length === 0) {
      return NextResponse.json({
        reports: [],
        pagination: { page, limit, total: 0, totalPages: 0 },
      });
    }

    const conditions = [];
    if (postIds.length > 0) {
      for (const postId of postIds) {
        conditions.push(eq(reports.postId, postId));
      }
    }
    if (commentIds.length > 0) {
      for (const commentId of commentIds) {
        conditions.push(eq(reports.commentId, commentId));
      }
    }
    if (answerIds.length > 0) {
      for (const answerId of answerIds) {
        conditions.push(eq(reports.answerId, answerId));
      }
    }

    const whereCondition = conditions.length > 0 ? or(...conditions) : undefined;

    const [countResult, reportsList] = await Promise.all([
      db.select({ count: count() }).from(reports).where(whereCondition),
      db
        .select({
          id: reports.id,
          type: reports.type,
          status: reports.status,
          action: reports.action,
          reason: reports.reason,
          postId: reports.postId,
          commentId: reports.commentId,
          answerId: reports.answerId,
          createdAt: reports.createdAt,
          reporter: {
            id: users.id,
            name: users.name,
            displayName: users.displayName,
            email: users.email,
          },
        })
        .from(reports)
        .leftJoin(users, eq(reports.reporterId, users.id))
        .where(whereCondition)
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
    console.error('Admin user reports received error:', error);
    return NextResponse.json({ error: 'Failed to fetch reports received' }, { status: 500 });
  }
}
