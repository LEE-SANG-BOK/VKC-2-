import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { posts, follows } from '@/lib/db/schema';
import { successResponse, errorResponse, notFoundResponse, forbiddenResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/api/response';
import { getSession, isOwner } from '@/lib/api/auth';
import { eq, and } from 'drizzle-orm';
import dayjs from 'dayjs';

interface RouteContext {
  params: Promise<{ id: string }>;
}

const resolveTrust = (author: any, createdAt: Date | string) => {
  const months = dayjs().diff(createdAt, 'month', true);
  if (months >= 12) return { badge: 'outdated', weight: 0.5 };
  if (author?.isExpert || author?.badgeType === 'expert') return { badge: 'expert', weight: 1.3 };
  if (author?.isVerified || author?.badgeType) return { badge: 'verified', weight: 1 };
  return { badge: 'community', weight: 0.7 };
};

/**
 * GET /api/posts/[id]
 * 게시글 상세 조회
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const user = await getSession(request);

    const post = await db.query.posts.findFirst({
      where: eq(posts.id, id),
      with: {
        author: true,
        answers: {
          with: {
            author: true,
            likes: true,
            comments: {
              with: {
                author: true,
                likes: true,
              },
              orderBy: (comments, { asc }) => [asc(comments.createdAt)],
            },
          },
          orderBy: (answers, { desc }) => [desc(answers.createdAt)],
        },
        comments: {
          with: {
            author: true,
            likes: true,
            replies: {
              with: {
                author: true,
                likes: true,
              },
              orderBy: (replies, { asc }) => [asc(replies.createdAt)],
            },
          },
          orderBy: (comments, { asc }) => [asc(comments.createdAt)],
        },
        likes: true,
        bookmarks: true,
      },
    });

    if (!post) {
      return notFoundResponse('게시글을 찾을 수 없습니다.');
    }

    let isFollowing = false;
    if (user && post.authorId !== user.id) {
      const followRecord = await db.query.follows.findFirst({
        where: and(
          eq(follows.followerId, user.id),
          eq(follows.followingId, post.authorId)
        ),
      });
      isFollowing = !!followRecord;
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

    const trust = resolveTrust(post.author, post.createdAt);

    const postDetail = {
      id: post.id,
      author: {
        id: post.author?.id,
        name: post.author?.displayName || post.author?.name || '알 수 없음',
        avatar: post.author?.image || '/avatar-default.jpg',
        followers: 0,
        isFollowing,
        isVerified: post.author?.isVerified || false,
        isExpert: post.author?.isExpert || false,
      },
      trustBadge: trust.badge,
      trustWeight: trust.weight,
      title: post.title,
      content: post.content,
      tags: post.tags || [],
      category: post.category,
      stats: {
        likes: post.likes.length,
        comments: (post.answers?.length || 0) + (post.comments?.filter(c => !c.parentId).length || 0),
        shares: 0,
      },
      publishedAt: formatDate(post.createdAt),
      isLiked: user ? post.likes.some(l => l.userId === user.id) : false,
      isBookmarked: user ? post.bookmarks.some(b => b.userId === user.id) : false,
      comments: post.comments
        .filter(c => !c.parentId)
        .map(comment => ({
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
          likes: comment.likes?.length || 0,
          isLiked: user ? comment.likes?.some(l => l.userId === user.id) : false,
          replies:
            comment.replies?.map(reply => ({
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
              likes: reply.likes?.length || 0,
              isLiked: user ? reply.likes?.some(l => l.userId === user.id) : false,
            })) || [],
        })),
      answers: [...post.answers]
        .map(answer => ({
          id: answer.id,
          author: {
            id: answer.author?.id,
            name: answer.author?.displayName || answer.author?.name || '알 수 없음',
            avatar: answer.author?.image || '/avatar-default.jpg',
            isVerified: answer.author?.isVerified || false,
            isExpert: answer.author?.isExpert || false,
          },
          content: answer.content,
          publishedAt: formatDate(answer.createdAt),
          helpful: answer.likes?.length || 0,
          isHelpful: user ? answer.likes?.some(l => l.userId === user.id) : false,
          isAdopted: answer.isAdopted || false,
          replies:
            answer.comments?.map(c => ({
              id: c.id,
              author: {
                id: c.author?.id,
                name: c.author?.displayName || c.author?.name || '알 수 없음',
                avatar: c.author?.image || '/avatar-default.jpg',
                isVerified: c.author?.isVerified || false,
                isExpert: c.author?.isExpert || false,
              },
              content: c.content,
              publishedAt: formatDate(c.createdAt),
              likes: c.likes?.length || 0,
              isLiked: user ? c.likes?.some(l => l.userId === user.id) : false,
            })) || [],
        }))
        .sort((a, b) => {
          if (a.isAdopted && !b.isAdopted) return -1;
          if (!a.isAdopted && b.isAdopted) return 1;
          const expertA = !!a.author?.isExpert;
          const expertB = !!b.author?.isExpert;
          if (expertA !== expertB) return expertB ? 1 : -1;
          if (b.helpful !== a.helpful) return b.helpful - a.helpful;
          return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
        }),
      isQuestion: post.type === 'question',
      isAdopted: post.isResolved || false,
    };

    return successResponse(postDetail);
  } catch (error) {
    console.error('GET /api/posts/[id] error:', error);
    // 커넥션 고갈 등 DB 에러 시 503으로 안내
    return serverErrorResponse('Service temporarily unavailable. Please retry.');
  }
}

/**
 * PUT /api/posts/[id]
 * 게시글 수정
 *
 * Body:
 * - title?: string
 * - content?: string
 * - category?: string
 * - subcategory?: string
 * - tags?: string[]
 */
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const user = await getSession(request);

    if (!user) {
      return unauthorizedResponse();
    }

    const { id } = await context.params;

    // 게시글 존재 여부 확인
    const post = await db.query.posts.findFirst({
      where: eq(posts.id, id),
    });

    if (!post) {
      return notFoundResponse('게시글을 찾을 수 없습니다.');
    }

    // 소유자 확인
    if (!isOwner(user.id, post.authorId)) {
      return forbiddenResponse('게시글을 수정할 권한이 없습니다.');
    }

    const body = await request.json();
    const { title, content, category, subcategory, tags } = body;

    // 게시글 수정
    const [updatedPost] = await db
      .update(posts)
      .set({
        title: title || post.title,
        content: content || post.content,
        category: category || post.category,
        subcategory: subcategory !== undefined ? subcategory : post.subcategory,
        tags: tags || post.tags,
        updatedAt: new Date(),
      })
      .where(eq(posts.id, id))
      .returning();

    return successResponse(updatedPost, '게시글이 수정되었습니다.');
  } catch (error) {
    console.error('PUT /api/posts/[id] error:', error);
    return serverErrorResponse();
  }
}

/**
 * DELETE /api/posts/[id]
 * 게시글 삭제
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const user = await getSession(request);

    if (!user) {
      return unauthorizedResponse();
    }

    const { id } = await context.params;

    // 게시글 존재 여부 확인
    const post = await db.query.posts.findFirst({
      where: eq(posts.id, id),
    });

    if (!post) {
      return notFoundResponse('게시글을 찾을 수 없습니다.');
    }

    // 소유자 확인
    if (!isOwner(user.id, post.authorId)) {
      return forbiddenResponse('게시글을 삭제할 권한이 없습니다.');
    }

    // 게시글 삭제 (cascade로 관련 데이터도 자동 삭제됨)
    await db.delete(posts).where(eq(posts.id, id));

    return successResponse(null, '게시글이 삭제되었습니다.');
  } catch (error) {
    console.error('DELETE /api/posts/[id] error:', error);
    return serverErrorResponse();
  }
}
