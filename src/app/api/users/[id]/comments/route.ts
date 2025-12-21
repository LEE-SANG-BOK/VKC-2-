import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { userPublicColumns } from '@/lib/db/columns';
import { comments, users, likes } from '@/lib/db/schema';
import { setPrivateNoStore, paginatedResponse, notFoundResponse, serverErrorResponse } from '@/lib/api/response';
import { getSession } from '@/lib/api/auth';
import { eq, desc, sql, and, isNotNull, inArray, or, lt, type SQL } from 'drizzle-orm';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10) || 20));
    const cursorParam = searchParams.get('cursor');

    const currentUser = await getSession(request);

    const user = await db.query.users.findFirst({
      where: eq(users.id, id),
      columns: {
        id: true,
      },
    });

    if (!user) {
      return notFoundResponse('사용자를 찾을 수 없습니다.');
    }

    const whereCondition = and(eq(comments.authorId, id), isNotNull(comments.postId));

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
    const useCursorPagination = Boolean(cursorParam && hasValidCursor);

    const cursorPredicate = useCursorPagination
      ? (or(
          lt(comments.createdAt, cursorCreatedAt as Date),
          and(eq(comments.createdAt, cursorCreatedAt as Date), lt(comments.id, decodedCursor?.id || ''))
        ) as SQL)
      : null;

    const total = useCursorPagination
      ? 0
      : (
          (
            await db
              .select({ count: sql<number>`count(*)::int` })
              .from(comments)
              .where(whereCondition)
          )[0]?.count || 0
        );

    const totalPages = Math.ceil(total / limit);
    const queryLimit = limit + 1;

    const userComments = await db.query.comments.findMany({
      where: cursorPredicate ? and(whereCondition, cursorPredicate) : whereCondition,
      columns: {
        id: true,
        authorId: true,
        postId: true,
        content: true,
        createdAt: true,
        likes: true,
      },
      with: {
        author: {
          columns: userPublicColumns,
        },
        post: {
          columns: {
            id: true,
            title: true,
            category: true,
            views: true,
          },
        },
      },
      orderBy: [desc(comments.createdAt), desc(comments.id)],
      limit: queryLimit,
      offset: useCursorPagination ? 0 : (page - 1) * limit,
    });

    const rawHasMore = useCursorPagination ? userComments.length > limit : page < totalPages;
    const pageList = userComments.length > limit ? userComments.slice(0, limit) : userComments;
    const lastComment = pageList[pageList.length - 1];
    const nextCursor =
      rawHasMore && lastComment
        ? encodeCursor({
            createdAt:
              lastComment.createdAt instanceof Date
                ? lastComment.createdAt.toISOString()
                : String(lastComment.createdAt),
            id: String(lastComment.id),
          })
        : null;

    const commentIds = pageList.map((comment) => comment.id).filter(Boolean) as string[];
    const likedCommentIds = new Set<string>();
    if (currentUser && commentIds.length > 0) {
      const likedRows = await db
        .select({ commentId: likes.commentId })
        .from(likes)
        .where(and(eq(likes.userId, currentUser.id), inArray(likes.commentId, commentIds)));
      likedRows.forEach((row) => {
        if (row.commentId) likedCommentIds.add(row.commentId);
      });
    }

    const formattedComments = pageList.map(comment => ({
      id: comment.id,
      type: 'comment' as const,
      title: comment.post?.title || '삭제된 게시글',
      content: comment.content,
      excerpt: comment.content?.replace(/<[^>]*>/g, '').substring(0, 200) || '',
      category: comment.post?.category || '',
      tags: [],
      views: comment.post?.views || 0,
      likes: comment.likes || 0,
      createdAt: comment.createdAt?.toISOString(),
      publishedAt: comment.createdAt?.toISOString(),
      author: {
        id: comment.author?.id,
        name: comment.author?.name || 'User',
        avatar: comment.author?.image || '/avatar-default.jpg',
        isVerified: comment.author?.isVerified || false,
        isExpert: comment.author?.isExpert || false,
        badgeType: comment.author?.badgeType || null,
        followers: 0,
      },
      stats: {
        likes: comment.likes || 0,
        comments: 0,
        shares: 0,
      },
      isLiked: currentUser ? likedCommentIds.has(comment.id) : false,
      isBookmarked: false,
      isQuestion: false,
      isAdopted: false,
      post: {
        id: comment.post?.id,
        title: comment.post?.title,
      },
    }));

    const response = paginatedResponse(formattedComments, page, limit, total, {
      nextCursor,
      hasMore: rawHasMore,
      paginationMode: useCursorPagination ? 'cursor' : 'offset',
    });
    setPrivateNoStore(response);
    return response;
  } catch (error) {
    console.error('GET /api/users/[id]/comments error:', error);
    return serverErrorResponse();
  }
}
