import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { userPublicColumns } from '@/lib/db/columns';
import { answers, posts, likes } from '@/lib/db/schema';
import { successResponse, errorResponse, notFoundResponse, unauthorizedResponse, forbiddenResponse, serverErrorResponse, paginatedResponse } from '@/lib/api/response';
import { getSession } from '@/lib/api/auth';
import { checkUserStatus } from '@/lib/user-status';
import { eq, desc, sql, and, inArray } from 'drizzle-orm';
import { createAnswerNotification } from '@/lib/notifications/create';
import { hasProhibitedContent } from '@/lib/content-filter';
import { UGC_LIMITS, validateUgcText } from '@/lib/validation/ugc';

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
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const wantsPagination = searchParams.has('page') || searchParams.has('limit');

    const user = await getSession(request);

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

    const [countResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(answers)
      .where(eq(answers.postId, postId));

    const total = countResult?.count || 0;

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
      orderBy: [desc(answers.isAdopted), desc(answers.likes), desc(answers.createdAt)],
      ...(wantsPagination
        ? {
            limit,
            offset: (page - 1) * limit,
          }
        : {}),
    });

    const answerIds = answerList.map((answer) => answer.id);
    const replyIds = answerList.flatMap((answer) => answer.comments?.map((comment) => comment.id) || []);

    const likedAnswerIds = new Set<string>();
    const likedReplyIds = new Set<string>();

    if (user && answerIds.length > 0) {
      const likedRows = await db
        .select({ answerId: likes.answerId })
        .from(likes)
        .where(and(eq(likes.userId, user.id), inArray(likes.answerId, answerIds)));
      likedRows.forEach((row) => {
        if (row.answerId) likedAnswerIds.add(row.answerId);
      });
    }

    if (user && replyIds.length > 0) {
      const likedRows = await db
        .select({ commentId: likes.commentId })
        .from(likes)
        .where(and(eq(likes.userId, user.id), inArray(likes.commentId, replyIds)));
      likedRows.forEach((row) => {
        if (row.commentId) likedReplyIds.add(row.commentId);
      });
    }

    const formatDate = (date: Date | string) => {
      const d = new Date(date);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `${year}.${month}.${day} ${hours}:${minutes}`;
    };

    const formatted = answerList.map((answer) => ({
      id: answer.id,
      author: {
        id: answer.author?.id,
        name: answer.author?.displayName || answer.author?.name || '알 수 없음',
        avatar: answer.author?.image || '/avatar-default.jpg',
        isVerified: answer.author?.isVerified || false,
        isExpert: answer.author?.isExpert || false,
        badgeType: answer.author?.badgeType || null,
      },
      content: answer.content,
      publishedAt: formatDate(answer.createdAt),
      helpful: answer.likes || 0,
      isHelpful: user ? likedAnswerIds.has(answer.id) : false,
      isAdopted: answer.isAdopted || false,
      replies:
        answer.comments?.map((reply) => ({
          id: reply.id,
          author: {
            id: reply.author?.id,
            name: reply.author?.displayName || reply.author?.name || '알 수 없음',
            avatar: reply.author?.image || '/avatar-default.jpg',
            isVerified: reply.author?.isVerified || false,
            isExpert: reply.author?.isExpert || false,
            badgeType: reply.author?.badgeType || null,
          },
          content: reply.content,
          publishedAt: formatDate(reply.createdAt),
          likes: reply.likes || 0,
          isLiked: user ? likedReplyIds.has(reply.id) : false,
        })) || [],
    }));

    if (!wantsPagination) {
      return successResponse(formatted);
    }

    return paginatedResponse(formatted, page, limit, total);
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

    if (!content || typeof content !== 'string') {
      return errorResponse('답변 내용을 입력해주세요.', 'ANSWER_REQUIRED');
    }

    const normalizedContent = content.trim();
    const validation = validateUgcText(normalizedContent, UGC_LIMITS.answerContent.min, UGC_LIMITS.answerContent.max);
    if (!validation.ok) {
      if (validation.code === 'UGC_TOO_SHORT') {
        return errorResponse('답변이 너무 짧습니다.', 'ANSWER_TOO_SHORT');
      }
      if (validation.code === 'UGC_TOO_LONG') {
        return errorResponse('답변이 너무 깁니다.', 'ANSWER_TOO_LONG');
      }
      return errorResponse('답변 내용이 올바르지 않습니다.', 'ANSWER_LOW_QUALITY');
    }

    if (hasProhibitedContent(normalizedContent)) {
      return errorResponse('금칙어/광고/연락처가 포함되어 있습니다. 내용을 수정해주세요.', 'CONTENT_PROHIBITED');
    }

    // 답변 작성
    const [newAnswer] = await db.insert(answers).values({
      postId,
      authorId: user.id,
      content: normalizedContent,
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
