import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { reports, posts, comments, answers, users } from '@/lib/db/schema';
import { getAdminSession } from '@/lib/admin/auth';
import { eq, sql } from 'drizzle-orm';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const session = await getAdminSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;

    const [report] = await db
      .select()
      .from(reports)
      .where(eq(reports.id, id))
      .limit(1);

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    const [reporter] = await db
      .select({
        id: users.id,
        name: users.name,
        displayName: users.displayName,
        email: users.email,
        image: users.image,
      })
      .from(users)
      .where(eq(users.id, report.reporterId))
      .limit(1);

    let targetContent = null;
    let reportedUser = null;
    let linkedPostId = null;

    if (report.postId) {
      const [postData] = await db
        .select({
          id: posts.id,
          title: posts.title,
          content: posts.content,
          authorId: posts.authorId,
          createdAt: posts.createdAt,
        })
        .from(posts)
        .where(eq(posts.id, report.postId))
        .limit(1);

      if (postData) {
        targetContent = { type: 'post' as const, ...postData };
        linkedPostId = postData.id;

        const [author] = await db
          .select({
            id: users.id,
            name: users.name,
            displayName: users.displayName,
            email: users.email,
            image: users.image,
            status: users.status,
            suspendedUntil: users.suspendedUntil,
            isVerified: users.isVerified,
            createdAt: users.createdAt,
          })
          .from(users)
          .where(eq(users.id, postData.authorId))
          .limit(1);
        reportedUser = author || null;
      }
    }

    if (report.answerId) {
      const [answerData] = await db
        .select({
          id: answers.id,
          content: answers.content,
          authorId: answers.authorId,
          postId: answers.postId,
          createdAt: answers.createdAt,
        })
        .from(answers)
        .where(eq(answers.id, report.answerId))
        .limit(1);

      if (answerData) {
        targetContent = { type: 'answer' as const, ...answerData };
        linkedPostId = answerData.postId;

        const [author] = await db
          .select({
            id: users.id,
            name: users.name,
            displayName: users.displayName,
            email: users.email,
            image: users.image,
            status: users.status,
            suspendedUntil: users.suspendedUntil,
            isVerified: users.isVerified,
            createdAt: users.createdAt,
          })
          .from(users)
          .where(eq(users.id, answerData.authorId))
          .limit(1);
        reportedUser = author || null;
      }
    }

    if (report.commentId) {
      const [commentData] = await db
        .select({
          id: comments.id,
          content: comments.content,
          authorId: comments.authorId,
          postId: comments.postId,
          createdAt: comments.createdAt,
        })
        .from(comments)
        .where(eq(comments.id, report.commentId))
        .limit(1);

      if (commentData) {
        targetContent = { type: 'comment' as const, ...commentData };
        linkedPostId = commentData.postId;

        const [author] = await db
          .select({
            id: users.id,
            name: users.name,
            displayName: users.displayName,
            email: users.email,
            image: users.image,
            status: users.status,
            suspendedUntil: users.suspendedUntil,
            isVerified: users.isVerified,
            createdAt: users.createdAt,
          })
          .from(users)
          .where(eq(users.id, commentData.authorId))
          .limit(1);
        reportedUser = author || null;
      }
    }

    let reportedUserStats = null;
    if (reportedUser) {
      const [[postCount], [reportCount]] = await Promise.all([
        db.select({ count: sql<number>`count(*)::int` }).from(posts).where(eq(posts.authorId, reportedUser.id)),
        db.select({ count: sql<number>`count(*)::int` }).from(reports).where(
          sql`${reports.postId} IN (SELECT id FROM posts WHERE author_id = ${reportedUser.id})
              OR ${reports.answerId} IN (SELECT id FROM answers WHERE author_id = ${reportedUser.id})
              OR ${reports.commentId} IN (SELECT id FROM comments WHERE author_id = ${reportedUser.id})`
        ),
      ]);
      reportedUserStats = {
        postsCount: postCount?.count || 0,
        reportsReceivedCount: reportCount?.count || 0,
      };
    }

    return NextResponse.json({
      report: {
        ...report,
        reporter,
        reportedUser: reportedUser ? { ...reportedUser, stats: reportedUserStats } : null,
        targetContent,
        linkedPostId,
      },
    });
  } catch (error) {
    console.error('Failed to fetch report:', error);
    return NextResponse.json({ error: 'Failed to fetch report' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const session = await getAdminSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();
    const { status, reviewNote, deleteTarget } = body;

    const [report] = await db
      .select()
      .from(reports)
      .where(eq(reports.id, id))
      .limit(1);

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    if (status === 'resolved' || status === 'dismissed') {
      const [updatedReport] = await db.update(reports).set({
        status: status as 'resolved' | 'dismissed',
        reviewNote: reviewNote || null,
        updatedAt: new Date(),
      }).where(eq(reports.id, id)).returning();

      if (deleteTarget && status === 'resolved') {
        if (report.postId) {
          await db.delete(posts).where(eq(posts.id, report.postId));
        } else if (report.answerId) {
          await db.delete(answers).where(eq(answers.id, report.answerId));
        } else if (report.commentId) {
          await db.delete(comments).where(eq(comments.id, report.commentId));
        }
      }

      return NextResponse.json({ report: updatedReport });
    } else {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }
  } catch (error) {
    console.error('Admin report action error:', error);
    return NextResponse.json({ error: 'Failed to update report' }, { status: 500 });
  }
}
