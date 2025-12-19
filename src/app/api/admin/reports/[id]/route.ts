import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { reports, posts, comments, answers, users } from '@/lib/db/schema';
import { getAdminSession } from '@/lib/admin/auth';
import { eq, sql } from 'drizzle-orm';

interface RouteContext {
  params: Promise<{ id: string }>;
}

const reportStatusSet = new Set(['pending', 'reviewed', 'resolved', 'dismissed']);
const reportActionSet = new Set(['none', 'warn', 'hide', 'blind', 'delete']);

const resolveStatus = (value: unknown) =>
  typeof value === 'string' && reportStatusSet.has(value) ? (value as typeof reports.$inferSelect.status) : null;

const resolveAction = (value: unknown) =>
  typeof value === 'string' && reportActionSet.has(value) ? (value as typeof reports.$inferSelect.action) : null;

const statusTransitions: Record<string, Set<string>> = {
  pending: new Set(['pending', 'reviewed', 'resolved', 'dismissed']),
  reviewed: new Set(['reviewed', 'resolved', 'dismissed']),
};

const reportActionMessages = {
  hide: {
    postTitle: '숨김 처리됨',
    postContent: '관리자에 의해 숨김 처리된 게시글입니다.',
    answerContent: '관리자에 의해 숨김 처리된 답변입니다.',
    commentContent: '관리자에 의해 숨김 처리된 댓글입니다.',
  },
  blind: {
    postTitle: '블라인드 처리됨',
    postContent: '관리자에 의해 블라인드 처리된 게시글입니다.',
    answerContent: '관리자에 의해 블라인드 처리된 답변입니다.',
    commentContent: '관리자에 의해 블라인드 처리된 댓글입니다.',
  },
};

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
    const { status, reviewNote, deleteTarget, action } = body;

    const [report] = await db
      .select()
      .from(reports)
      .where(eq(reports.id, id))
      .limit(1);

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    if (report.status === 'resolved' || report.status === 'dismissed') {
      return NextResponse.json({ error: 'Report already processed' }, { status: 400 });
    }

    const nextStatus = resolveStatus(status);
    if (!nextStatus) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const transitionSet = statusTransitions[report.status];
    if (!transitionSet || !transitionSet.has(nextStatus)) {
      return NextResponse.json({ error: 'Invalid status transition' }, { status: 400 });
    }

    const actionValue = resolveAction(action);
    const resolvedAction = actionValue || (deleteTarget ? 'delete' : report.action || 'none');
    if (resolvedAction !== 'none' && nextStatus !== 'resolved') {
      return NextResponse.json({ error: 'Action requires resolved status' }, { status: 400 });
    }
    if (nextStatus === 'dismissed' && resolvedAction !== 'none') {
      return NextResponse.json({ error: 'Dismissed reports cannot include actions' }, { status: 400 });
    }

    const resolvedReviewNote = typeof reviewNote === 'string' ? reviewNote.trim() : report.reviewNote;

    const [updatedReport] = await db
      .update(reports)
      .set({
        status: nextStatus,
        action: resolvedAction,
        reviewNote: resolvedReviewNote || null,
        updatedAt: new Date(),
      })
      .where(eq(reports.id, id))
      .returning();

    if (nextStatus === 'resolved' && resolvedAction !== 'none') {
      if (resolvedAction === 'delete') {
        if (report.postId) {
          await db.delete(posts).where(eq(posts.id, report.postId));
        } else if (report.answerId) {
          await db.delete(answers).where(eq(answers.id, report.answerId));
        } else if (report.commentId) {
          await db.delete(comments).where(eq(comments.id, report.commentId));
        }
      }

      if (resolvedAction === 'hide' || resolvedAction === 'blind') {
        const messages = reportActionMessages[resolvedAction];
        if (report.postId) {
          const title = resolvedAction === 'hide' ? messages.postTitle : undefined;
          await db
            .update(posts)
            .set({
              ...(title ? { title } : {}),
              content: messages.postContent,
              updatedAt: new Date(),
            })
            .where(eq(posts.id, report.postId));
        } else if (report.answerId) {
          await db
            .update(answers)
            .set({
              content: messages.answerContent,
              updatedAt: new Date(),
            })
            .where(eq(answers.id, report.answerId));
        } else if (report.commentId) {
          await db
            .update(comments)
            .set({
              content: messages.commentContent,
              updatedAt: new Date(),
            })
            .where(eq(comments.id, report.commentId));
        }
      }
    }

    return NextResponse.json({ report: updatedReport });
  } catch (error) {
    console.error('Admin report action error:', error);
    return NextResponse.json({ error: 'Failed to update report' }, { status: 500 });
  }
}
