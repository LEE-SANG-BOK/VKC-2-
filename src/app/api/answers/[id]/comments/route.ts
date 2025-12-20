import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { userPublicColumns } from '@/lib/db/columns';
import { comments, answers } from '@/lib/db/schema';
import { successResponse, errorResponse, notFoundResponse, unauthorizedResponse, forbiddenResponse, serverErrorResponse, rateLimitResponse } from '@/lib/api/response';
import { getSession } from '@/lib/api/auth';
import { checkRateLimit } from '@/lib/api/rateLimit';
import { checkUserStatus } from '@/lib/user-status';
import { eq, asc } from 'drizzle-orm';
import { hasProhibitedContent } from '@/lib/content-filter';
import { UGC_LIMITS, validateUgcText } from '@/lib/validation/ugc';
import { validateUgcExternalLinks } from '@/lib/validation/ugc-links';
import { sanitizeUgcHtml } from '@/lib/validation/ugc-sanitize';

const commentRateLimitWindowMs = 60 * 60 * 1000;
const commentRateLimitMax = 40;

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id: answerId } = await context.params;

    const answer = await db.query.answers.findFirst({
      where: eq(answers.id, answerId),
    });

    if (!answer) {
      return notFoundResponse('답변을 찾을 수 없습니다.');
    }

    const answerComments = await db.query.comments.findMany({
      where: (c) => eq(c.answerId, answerId),
      with: {
        author: {
          columns: userPublicColumns,
        },
        replies: {
          with: {
            author: {
              columns: userPublicColumns,
            },
          },
          orderBy: [asc(comments.createdAt)],
        },
      },
      orderBy: [asc(comments.createdAt)],
    });

    const topLevelComments = answerComments.filter(c => !c.parentId);

    return successResponse(topLevelComments);
  } catch (error) {
    console.error('GET /api/answers/[id]/comments error:', error);
    return serverErrorResponse();
  }
}

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

    const rateLimit = await checkRateLimit({
      table: comments,
      userColumn: comments.authorId,
      createdAtColumn: comments.createdAt,
      userId: user.id,
      windowMs: commentRateLimitWindowMs,
      max: commentRateLimitMax,
    });
    if (!rateLimit.allowed) {
      return rateLimitResponse(
        '댓글 작성 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
        'COMMENT_RATE_LIMITED',
        rateLimit.retryAfterSeconds
      );
    }

    const { id: answerId } = await context.params;

    const answer = await db.query.answers.findFirst({
      where: eq(answers.id, answerId),
    });

    if (!answer) {
      return notFoundResponse('답변을 찾을 수 없습니다.');
    }

    const body = await request.json();
    const { content, parentId } = body;

    if (!content || typeof content !== 'string') {
      return errorResponse('댓글 내용을 입력해주세요.', 'COMMENT_REQUIRED');
    }

    const normalizedContent = sanitizeUgcHtml(content);
    const validation = validateUgcText(normalizedContent, UGC_LIMITS.commentContent.min, UGC_LIMITS.commentContent.max);
    if (!validation.ok) {
      if (validation.code === 'UGC_TOO_SHORT') {
        return errorResponse('댓글이 너무 짧습니다.', 'COMMENT_TOO_SHORT');
      }
      if (validation.code === 'UGC_TOO_LONG') {
        return errorResponse('댓글이 너무 깁니다.', 'COMMENT_TOO_LONG');
      }
      return errorResponse('댓글 내용이 올바르지 않습니다.', 'COMMENT_LOW_QUALITY');
    }

    if (hasProhibitedContent(normalizedContent)) {
      return errorResponse('금칙어/광고/연락처가 포함되어 있습니다. 내용을 수정해주세요.', 'CONTENT_PROHIBITED');
    }

    const linkValidation = validateUgcExternalLinks(normalizedContent);
    if (!linkValidation.ok) {
      return errorResponse('공식 출처 도메인만 사용할 수 있습니다.', 'UGC_EXTERNAL_LINK_BLOCKED');
    }

    if (parentId) {
      const parentComment = await db.query.comments.findFirst({
        where: eq(comments.id, parentId),
      });

      if (!parentComment) {
        return errorResponse('부모 댓글을 찾을 수 없습니다.', 'COMMENT_PARENT_NOT_FOUND');
      }

      if (parentComment.answerId !== answerId) {
        return errorResponse('잘못된 요청입니다.', 'COMMENT_PARENT_MISMATCH');
      }
    }

    const [newComment] = await db.insert(comments).values({
      answerId,
      parentId: parentId || null,
      authorId: user.id,
      content: normalizedContent,
    }).returning();

    const commentWithAuthor = await db.query.comments.findFirst({
      where: eq(comments.id, newComment.id),
      with: {
        author: {
          columns: userPublicColumns,
        },
        replies: {
          with: {
            author: {
              columns: userPublicColumns,
            },
          },
        },
      },
    });

    return successResponse(commentWithAuthor, parentId ? '대댓글이 작성되었습니다.' : '댓글이 작성되었습니다.');
  } catch (error) {
    console.error('POST /api/answers/[id]/comments error:', error);
    return serverErrorResponse();
  }
}
