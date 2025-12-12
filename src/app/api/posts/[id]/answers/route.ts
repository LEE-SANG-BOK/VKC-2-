import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { userPublicColumns } from '@/lib/db/columns';
import { answers, posts } from '@/lib/db/schema';
import { successResponse, errorResponse, notFoundResponse, unauthorizedResponse, forbiddenResponse, serverErrorResponse } from '@/lib/api/response';
import { getSession } from '@/lib/api/auth';
import { checkUserStatus } from '@/lib/user-status';
import { eq, desc } from 'drizzle-orm';
import { createAnswerNotification } from '@/lib/notifications/create';
import { hasProhibitedContent } from '@/lib/content-filter';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/posts/[id]/answers
 * 답변 목록 조회
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id: postId } = await context.params;

    // 게시글 존재 여부 확인
    const post = await db.query.posts.findFirst({
      where: eq(posts.id, postId),
    });

    if (!post) {
      return notFoundResponse('게시글을 찾을 수 없습니다.');
    }

    if (post.type !== 'question') {
      return errorResponse('질문 게시글만 답변을 조회할 수 있습니다.', 'INVALID_POST_TYPE');
    }

    // 답변 목록 조회 (작성자 정보 및 댓글 포함)
    const answerList = await db.query.answers.findMany({
      where: eq(answers.postId, postId),
      with: {
        author: {
          columns: userPublicColumns,
        },
        comments: {
          with: {
            author: {
              columns: userPublicColumns,
            },
          },
          orderBy: (comments, { asc }) => [asc(comments.createdAt)],
        },
      },
      orderBy: [
        desc(answers.createdAt),
      ],
    });

    const sorted = [...answerList].sort((a, b) => {
      if (a.isAdopted && !b.isAdopted) return -1;
      if (!a.isAdopted && b.isAdopted) return 1;
      const expertA = !!a.author?.isExpert;
      const expertB = !!b.author?.isExpert;
      if (expertA !== expertB) return expertB ? 1 : -1;
      if ((b.likes || 0) !== (a.likes || 0)) return (b.likes || 0) - (a.likes || 0);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return successResponse(sorted);
  } catch (error) {
    console.error('GET /api/posts/[id]/answers error:', error);
    return serverErrorResponse();
  }
}

/**
 * POST /api/posts/[id]/answers
 * 답변 작성
 *
 * Body:
 * - content: string (HTML content from rich text editor)
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const user = await getSession(request);

    if (!user) {
      return unauthorizedResponse();
    }

    const userStatus = await checkUserStatus(user.id);
    if (!userStatus.isActive) {
      return forbiddenResponse(userStatus.message || 'Account restricted');
    }

    const { id: postId } = await context.params;

    // 게시글 존재 여부 확인
    const post = await db.query.posts.findFirst({
      where: eq(posts.id, postId),
    });

    if (!post) {
      return notFoundResponse('게시글을 찾을 수 없습니다.');
    }

    if (post.type !== 'question') {
      return errorResponse('질문 게시글에만 답변을 작성할 수 있습니다.', 'INVALID_POST_TYPE');
    }

    const body = await request.json();
    const { content } = body;

    if (!content || !content.trim()) {
      return errorResponse('답변 내용을 입력해주세요.');
    }
    if (hasProhibitedContent(content)) {
      return errorResponse('금칙어/광고/연락처가 포함되어 있습니다. 내용을 수정해주세요.');
    }

    // 답변 작성
    const [newAnswer] = await db.insert(answers).values({
      postId,
      authorId: user.id,
      content: content.trim(),
    }).returning();

    // 작성자 정보 포함하여 반환
    const answerWithAuthor = await db.query.answers.findFirst({
      where: eq(answers.id, newAnswer.id),
      with: {
        author: {
          columns: userPublicColumns,
        },
        comments: {
          with: {
            author: {
              columns: userPublicColumns,
            },
          },
        },
      },
    });

    // 알림 생성 (질문 작성자에게)
    if (post.authorId !== user.id) {
      await createAnswerNotification(
        post.authorId,
        user.id,
        user.name || user.email || '사용자',
        postId,
        post.title,
        newAnswer.id
      );
    }

    return successResponse(answerWithAuthor, '답변이 작성되었습니다.');
  } catch (error) {
    console.error('POST /api/posts/[id]/answers error:', error);
    return serverErrorResponse();
  }
}
