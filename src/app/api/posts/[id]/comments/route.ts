import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { userPublicColumns } from '@/lib/db/columns';
import { comments, posts, likes } from '@/lib/db/schema';
import { successResponse, errorResponse, notFoundResponse, unauthorizedResponse, forbiddenResponse, serverErrorResponse, paginatedResponse } from '@/lib/api/response';
import { getSession } from '@/lib/api/auth';
import { checkUserStatus } from '@/lib/user-status';
import { eq, asc, and, sql, isNull, inArray } from 'drizzle-orm';
import { createCommentNotification, createReplyNotification } from '@/lib/notifications/create';
import { hasProhibitedContent } from '@/lib/content-filter';
import { UGC_LIMITS, validateUgcText } from '@/lib/validation/ugc';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id: postId } = await context.params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const wantsPagination = searchParams.has('page') || searchParams.has('limit');

    const user = await getSession(request);

    const post = await db.query.posts.findFirst({
      where: eq(posts.id, postId),
    });

    if (!post) {
      return notFoundResponse('게시글을 찾을 수 없습니다.');
    }

    const [countResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(comments)
      .where(and(eq(comments.postId, postId), isNull(comments.parentId)));

    const total = countResult?.count || 0;

    const topLevelComments = await db.query.comments.findMany({
      where: and(eq(comments.postId, postId), isNull(comments.parentId)),
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
      ...(wantsPagination
        ? {
            limit,
            offset: (page - 1) * limit,
          }
        : {}),
    });

    const replyIds = topLevelComments.flatMap((comment) => comment.replies?.map((reply) => reply.id) || []);
    const commentIds = topLevelComments.map((comment) => comment.id);
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

    const formatted = topLevelComments.map((comment) => ({
      id: comment.id,
      author: {
        id: comment.author?.id,
        name: comment.author?.displayName || comment.author?.name || '알 수 없음',
        avatar: comment.author?.image || '/avatar-default.jpg',
        isVerified: comment.author?.isVerified || false,
        isExpert: comment.author?.isExpert || false,
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
          },
          content: reply.content,
          publishedAt: formatDate(reply.createdAt),
          likes: reply.likes || 0,
          isLiked: user ? likedCommentIds.has(reply.id) : false,
        })) || [],
    }));

    if (!wantsPagination) {
      return successResponse(formatted);
    }

    return paginatedResponse(formatted, page, limit, total);
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
