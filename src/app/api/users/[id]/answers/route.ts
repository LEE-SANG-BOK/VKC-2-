import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { userPublicColumns } from '@/lib/db/columns';
import { answers, users, likes } from '@/lib/db/schema';
import { paginatedResponse, notFoundResponse, serverErrorResponse } from '@/lib/api/response';
import { getSession } from '@/lib/api/auth';
import { eq, desc, sql, and, inArray } from 'drizzle-orm';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const adoptedOnly = searchParams.get('adoptedOnly') === 'true';

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

    const [countResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(answers)
      .where(whereCondition);

    const total = countResult?.count || 0;

    const userAnswers = await db.query.answers.findMany({
      where: whereCondition,
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
      orderBy: [desc(answers.isAdopted), desc(answers.createdAt)],
      limit,
      offset: (page - 1) * limit,
    });

    const answerIds = userAnswers.map((answer) => answer.id).filter(Boolean) as string[];
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

    const formattedAnswers = userAnswers.map(answer => ({
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

    return paginatedResponse(formattedAnswers, page, limit, total);
  } catch (error) {
    console.error('GET /api/users/[id]/answers error:', error);
    return serverErrorResponse();
  }
}
