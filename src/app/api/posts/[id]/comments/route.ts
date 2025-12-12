import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { comments, posts } from '@/lib/db/schema';
import { successResponse, errorResponse, notFoundResponse, unauthorizedResponse, forbiddenResponse, serverErrorResponse } from '@/lib/api/response';
import { getSession } from '@/lib/api/auth';
import { checkUserStatus } from '@/lib/user-status';
import { eq, asc } from 'drizzle-orm';
import { createCommentNotification, createReplyNotification } from '@/lib/notifications/create';
import { hasProhibitedContent } from '@/lib/content-filter';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id: postId } = await context.params;

    const post = await db.query.posts.findFirst({
      where: eq(posts.id, postId),
    });

    if (!post) {
      return notFoundResponse('게시글을 찾을 수 없습니다.');
    }

    const postComments = await db.query.comments.findMany({
      where: (c) => eq(c.postId, postId),
      with: {
        author: true,
        replies: {
          with: {
            author: true,
          },
          orderBy: [asc(comments.createdAt)],
        },
      },
      orderBy: [asc(comments.createdAt)],
    });

    const topLevelComments = postComments.filter(c => !c.parentId);

    return successResponse(topLevelComments);
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

    if (!content || !content.trim()) {
      return errorResponse('댓글 내용을 입력해주세요.');
    }

    if (hasProhibitedContent(content)) {
      return errorResponse('금칙어/광고/연락처가 포함되어 있습니다. 내용을 수정해주세요.');
    }

    if (parentId) {
      const parentComment = await db.query.comments.findFirst({
        where: eq(comments.id, parentId),
      });

      if (!parentComment) {
        return errorResponse('부모 댓글을 찾을 수 없습니다.');
      }

      if (parentComment.postId !== postId) {
        return errorResponse('잘못된 요청입니다.');
      }
    }

    const [newComment] = await db.insert(comments).values({
      postId,
      parentId: parentId || null,
      authorId: user.id,
      content: content.trim(),
    }).returning();

    const commentWithAuthor = await db.query.comments.findFirst({
      where: eq(comments.id, newComment.id),
      with: {
        author: true,
        replies: {
          with: {
            author: true,
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
