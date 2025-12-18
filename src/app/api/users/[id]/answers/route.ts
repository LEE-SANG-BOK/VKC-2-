import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { userPublicColumns } from '@/lib/db/columns';
import { answers, users, likes } from '@/lib/db/schema';
import { paginatedResponse, notFoundResponse, serverErrorResponse } from '@/lib/api/response';
import { getSession } from '@/lib/api/auth';
import { eq, desc, sql, and, inArray, or, lt, type SQL } from 'drizzle-orm';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10) || 20));
    const adoptedOnly = searchParams.get('adoptedOnly') === 'true';
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

    const whereCondition = adoptedOnly
      ? and(eq(answers.authorId, id), eq(answers.isAdopted, true))
      : eq(answers.authorId, id);

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
    const supportsCursorPagination = adoptedOnly;
    const useCursorPagination = Boolean(supportsCursorPagination && cursorParam && hasValidCursor);

    const cursorPredicate = useCursorPagination
      ? (or(
          lt(answers.createdAt, cursorCreatedAt as Date),
          and(eq(answers.createdAt, cursorCreatedAt as Date), lt(answers.id, decodedCursor?.id || ''))
        ) as SQL)
      : null;

    const total = useCursorPagination
      ? 0
      : (
          (
            await db
              .select({ count: sql<number>`count(*)::int` })
              .from(answers)
              .where(whereCondition)
          )[0]?.count || 0
        );

    const totalPages = Math.ceil(total / limit);
    const queryLimit = limit + 1;

    const userAnswers = await db.query.answers.findMany({
      where: cursorPredicate ? and(whereCondition, cursorPredicate) : whereCondition,
      columns: {
        id: true,
        authorId: true,
        postId: true,
        content: true,
        createdAt: true,
        isAdopted: true,
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
            tags: true,
            views: true,
          },
        },
      },
      orderBy: [desc(answers.isAdopted), desc(answers.createdAt), desc(answers.id)],
      limit: queryLimit,
      offset: useCursorPagination ? 0 : (page - 1) * limit,
    });

    const rawHasMore = useCursorPagination ? userAnswers.length > limit : page < totalPages;
    const pageList = userAnswers.length > limit ? userAnswers.slice(0, limit) : userAnswers;
    const lastAnswer = pageList[pageList.length - 1];
    const nextCursor =
      supportsCursorPagination && rawHasMore && lastAnswer
        ? encodeCursor({
            createdAt:
              lastAnswer.createdAt instanceof Date
                ? lastAnswer.createdAt.toISOString()
                : String(lastAnswer.createdAt),
            id: String(lastAnswer.id),
          })
        : null;

    const answerIds = pageList.map((answer) => answer.id).filter(Boolean) as string[];
    const likedAnswerIds = new Set<string>();
    if (currentUser && answerIds.length > 0) {
      const likedRows = await db
        .select({ answerId: likes.answerId })
        .from(likes)
        .where(and(eq(likes.userId, currentUser.id), inArray(likes.answerId, answerIds)));
      likedRows.forEach((row) => {
        if (row.answerId) likedAnswerIds.add(row.answerId);
      });
    }

    const formattedAnswers = pageList.map(answer => ({
      id: answer.id,
      type: 'answer' as const,
      title: answer.post?.title || '',
      content: answer.content,
      excerpt: answer.content?.replace(/<[^>]*>/g, '').substring(0, 200) || '',
      category: answer.post?.category || '',
      tags: answer.post?.tags || [],
      views: answer.post?.views || 0,
      likes: answer.likes || 0,
      isResolved: answer.isAdopted,
      createdAt: answer.createdAt?.toISOString(),
      publishedAt: answer.createdAt?.toISOString(),
      author: {
        id: answer.author?.id,
        name: answer.author?.name || 'User',
        avatar: answer.author?.image || '/avatar-default.jpg',
        isVerified: answer.author?.isVerified || false,
        isExpert: answer.author?.isExpert || false,
        badgeType: answer.author?.badgeType || null,
        followers: 0,
      },
      stats: {
        likes: answer.likes || 0,
        comments: 0,
        shares: 0,
      },
      isLiked: currentUser ? likedAnswerIds.has(answer.id) : false,
      isBookmarked: false,
      isQuestion: false,
      isAdopted: answer.isAdopted,
      post: {
        id: answer.post?.id,
        title: answer.post?.title,
      },
    }));

    const response = paginatedResponse(formattedAnswers, page, limit, total, {
      nextCursor,
      hasMore: rawHasMore,
      paginationMode: useCursorPagination ? 'cursor' : 'offset',
    });
    response.headers.set('Cache-Control', 'private, no-store');
    return response;
  } catch (error) {
    console.error('GET /api/users/[id]/answers error:', error);
    return serverErrorResponse();
  }
}
