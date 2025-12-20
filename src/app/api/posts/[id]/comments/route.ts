import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { userPublicColumns } from '@/lib/db/columns';
import { comments, posts, likes } from '@/lib/db/schema';
import { successResponse, errorResponse, notFoundResponse, unauthorizedResponse, forbiddenResponse, serverErrorResponse, paginatedResponse, rateLimitResponse } from '@/lib/api/response';
import { getSession } from '@/lib/api/auth';
import { checkRateLimit } from '@/lib/api/rateLimit';
import { checkUserStatus } from '@/lib/user-status';
import { eq, asc, and, sql, isNull, inArray, or, gt, type SQL } from 'drizzle-orm';
import { createCommentNotification, createReplyNotification } from '@/lib/notifications/create';
import { hasProhibitedContent } from '@/lib/content-filter';
import { UGC_LIMITS, validateUgcText } from '@/lib/validation/ugc';
import { validateUgcExternalLinks } from '@/lib/validation/ugc-links';

const commentRateLimitWindowMs = 60 * 60 * 1000;
const commentRateLimitMax = 40;

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id: postId } = await context.params;
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10) || 20));
    const cursorParam = searchParams.get('cursor');
    const wantsPagination = searchParams.has('page') || searchParams.has('limit') || searchParams.has('cursor');

    const user = await getSession(request);

    const post = await db.query.posts.findFirst({
      where: eq(posts.id, postId),
    });

    if (!post) {
      return notFoundResponse('게시글을 찾을 수 없습니다.');
    }

    type CursorPayload = { createdAt: string; id: string };
    const encodeCursor = (payload: CursorPayload) =>
      Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
    const decodeCursor = (raw: string): CursorPayload | null => {
      if (!raw) return null;
      try {
        const json = Buffer.from(raw, 'base64url').toString('utf8');
        const parsed = JSON.parse(json) as Partial<CursorPayload>;
        if (typeof parsed?.createdAt !== 'string' || typeof parsed?.id !== 'string') return null;
        return { createdAt: parsed.createdAt, id: parsed.id };
      } catch {
        return null;
      }
    };

    const decodedCursor = cursorParam ? decodeCursor(cursorParam) : null;
    const cursorCreatedAt = decodedCursor ? new Date(decodedCursor.createdAt) : null;
    const hasValidCursor = Boolean(decodedCursor && cursorCreatedAt && !Number.isNaN(cursorCreatedAt.getTime()));
    const useCursorPagination = Boolean(wantsPagination && cursorParam && hasValidCursor);

    const total =
      wantsPagination && !useCursorPagination
        ? (
            (
              await db
                .select({ count: sql<number>`count(*)::int` })
                .from(comments)
                .where(and(eq(comments.postId, postId), isNull(comments.parentId)))
            )[0]?.count || 0
          )
        : 0;

    const totalPages = wantsPagination && !useCursorPagination ? Math.ceil(total / limit) : 0;
    const queryLimit = useCursorPagination ? limit + 1 : limit;

    const cursorPredicate = useCursorPagination
      ? (or(
          gt(comments.createdAt, cursorCreatedAt as Date),
          and(eq(comments.createdAt, cursorCreatedAt as Date), gt(comments.id, decodedCursor?.id || ''))
        ) as SQL)
      : null;

    const topLevelComments = await db.query.comments.findMany({
      where: cursorPredicate
        ? and(eq(comments.postId, postId), isNull(comments.parentId), cursorPredicate)
        : and(eq(comments.postId, postId), isNull(comments.parentId)),
      columns: {
        id: true,
        content: true,
        createdAt: true,
        likes: true,
        authorId: true,
      },
      with: {
        author: {
          columns: userPublicColumns,
        },
        replies: {
          columns: {
            id: true,
            content: true,
            createdAt: true,
            likes: true,
            authorId: true,
            parentId: true,
          },
          with: {
            author: {
              columns: userPublicColumns,
            },
          },
          orderBy: [asc(comments.createdAt), asc(comments.id)],
        },
      },
      orderBy: [asc(comments.createdAt), asc(comments.id)],
      ...(wantsPagination
        ? {
            limit: queryLimit,
            offset: useCursorPagination ? 0 : (page - 1) * limit,
          }
        : {}),
    });

    const rawHasMore = wantsPagination ? (useCursorPagination ? topLevelComments.length > limit : page < totalPages) : false;
    const pageList =
      wantsPagination && useCursorPagination && topLevelComments.length > limit
        ? topLevelComments.slice(0, limit)
        : topLevelComments;
    const lastComment = wantsPagination ? pageList[pageList.length - 1] : null;
    const nextCursor =
      wantsPagination && rawHasMore && lastComment
        ? encodeCursor({
            createdAt:
              lastComment.createdAt instanceof Date
                ? lastComment.createdAt.toISOString()
                : String(lastComment.createdAt),
            id: String(lastComment.id),
          })
        : null;

    const replyIds = pageList.flatMap((comment) => comment.replies?.map((reply) => reply.id) || []);
    const commentIds = pageList.map((comment) => comment.id);
    const likeTargetIds = [...commentIds, ...replyIds];

    const likedCommentIds = new Set<string>();
    if (user && likeTargetIds.length > 0) {
      const likedRows = await db
        .select({ commentId: likes.commentId })
        .from(likes)
        .where(and(eq(likes.userId, user.id), inArray(likes.commentId, likeTargetIds)));
      likedRows.forEach((row) => {
        if (row.commentId) likedCommentIds.add(row.commentId);
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

    const formatted = pageList.map((comment) => ({
      id: comment.id,
      author: {
        id: comment.author?.id,
        name: comment.author?.displayName || comment.author?.name || '알 수 없음',
        avatar: comment.author?.image || '/avatar-default.jpg',
        isVerified: comment.author?.isVerified || false,
        isExpert: comment.author?.isExpert || false,
        badgeType: comment.author?.badgeType || null,
      },
      content: comment.content,
      publishedAt: formatDate(comment.createdAt),
      likes: comment.likes || 0,
      isLiked: user ? likedCommentIds.has(comment.id) : false,
      replies:
        comment.replies?.map((reply) => ({
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
          isLiked: user ? likedCommentIds.has(reply.id) : false,
        })) || [],
    }));

    if (!wantsPagination) {
      const response = successResponse(formatted);
      response.headers.set('Cache-Control', 'private, no-store');
      return response;
    }

    const response = paginatedResponse(formatted, page, limit, total, {
      nextCursor,
      hasMore: rawHasMore,
      paginationMode: useCursorPagination ? 'cursor' : 'offset',
    });
    response.headers.set('Cache-Control', 'private, no-store');
    return response;
  } catch (error) {
    console.error('GET /api/posts/[id]/comments error:', error);
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

    const { id: postId } = await context.params;

    const post = await db.query.posts.findFirst({
      where: eq(posts.id, postId),
    });

    if (!post) {
      return notFoundResponse('게시글을 찾을 수 없습니다.');
    }

    const body = await request.json();
    const { content, parentId } = body;

    if (!content || typeof content !== 'string') {
      return errorResponse('댓글 내용을 입력해주세요.', 'COMMENT_REQUIRED');
    }

    const normalizedContent = content.trim();
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

      if (parentComment.postId !== postId) {
        return errorResponse('잘못된 요청입니다.', 'COMMENT_PARENT_MISMATCH');
      }
    }

    const [newComment] = await db.insert(comments).values({
      postId,
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

    // 알림 생성
    const userName = user.name || user.email || '사용자';
    if (parentId) {
      // 대댓글: 부모 댓글 작성자에게 알림
      const parentComment = await db.query.comments.findFirst({
        where: eq(comments.id, parentId),
      });
      if (parentComment && parentComment.authorId !== user.id) {
        await createReplyNotification(
          parentComment.authorId,
          user.id,
          userName,
          postId,
          post.title,
          newComment.id
        );
      }
    } else {
      // 일반 댓글: 게시글 작성자에게 알림
      if (post.authorId !== user.id) {
        await createCommentNotification(
          post.authorId,
          user.id,
          userName,
          postId,
          post.title,
          newComment.id
        );
      }
    }

    return successResponse(commentWithAuthor, parentId ? '대댓글이 작성되었습니다.' : '댓글이 작성되었습니다.');
  } catch (error) {
    console.error('POST /api/posts/[id]/comments error:', error);
    return serverErrorResponse();
  }
}
