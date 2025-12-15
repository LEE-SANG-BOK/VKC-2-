import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { userPublicColumns } from '@/lib/db/columns';
import { posts, follows, answers, comments, likes, bookmarks } from '@/lib/db/schema';
import { successResponse, errorResponse, notFoundResponse, forbiddenResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/api/response';
import { getSession, isOwner } from '@/lib/api/auth';
import { eq, and, sql, isNull } from 'drizzle-orm';
import { hasProhibitedContent } from '@/lib/content-filter';
import { UGC_LIMITS, validateUgcText } from '@/lib/validation/ugc';
import { getChildrenForParent, isGroupParentSlug } from '@/lib/constants/category-groups';
import dayjs from 'dayjs';
import { normalizePostImageSrc } from '@/utils/normalizePostImageSrc';
import { isExpertBadgeType } from '@/lib/constants/badges';

interface RouteContext {
  params: Promise<{ id: string }>;
}

const resolveTrust = (author: any, createdAt: Date | string) => {
  const months = dayjs().diff(createdAt, 'month', true);
  if (months >= 12) return { badge: 'outdated', weight: 0.5 };
  if (author?.isExpert || isExpertBadgeType(author?.badgeType)) return { badge: 'expert', weight: 1.3 };
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
        author: {
          columns: userPublicColumns,
        },
      },
    });

    if (!post) {
      return notFoundResponse('게시글을 찾을 수 없습니다.');
    }

    const imageMatches = Array.from(post.content.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)) as RegExpMatchArray[];
    const thumbnails = imageMatches
      .map((match) => normalizePostImageSrc(match[1]))
      .filter((src): src is string => Boolean(src))
      .slice(0, 4);
    const thumbnail = thumbnails[0] ?? null;

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

    const [answersCountResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(answers)
      .where(eq(answers.postId, post.id));

    const [topLevelCommentsCountResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(comments)
      .where(and(eq(comments.postId, post.id), isNull(comments.parentId)));

    const answersCount = answersCountResult?.count || 0;
    const postCommentsCount = topLevelCommentsCountResult?.count || 0;
    const commentsCount = answersCount + postCommentsCount;

    const [likeRecord, bookmarkRecord] = user
      ? await Promise.all([
          db.query.likes.findFirst({
            where: and(eq(likes.userId, user.id), eq(likes.postId, post.id)),
            columns: { id: true },
          }),
          db.query.bookmarks.findFirst({
            where: and(eq(bookmarks.userId, user.id), eq(bookmarks.postId, post.id)),
            columns: { id: true },
          }),
        ])
      : [null, null];

    const postDetail = {
      ...post,
      author: {
        id: post.author?.id,
        name: post.author?.displayName || post.author?.name || '알 수 없음',
        avatar: post.author?.image || '/avatar-default.jpg',
        followers: 0,
        isFollowing,
        isVerified: post.author?.isVerified || false,
        isExpert: post.author?.isExpert || false,
        badgeType: post.author?.badgeType || null,
      },
      trustBadge: trust.badge,
      trustWeight: trust.weight,
      tags: post.tags || [],
      subcategory: post.subcategory || undefined,
      thumbnail,
      thumbnails,
      imageCount: imageMatches.length,
      stats: {
        likes: post.likes || 0,
        comments: commentsCount,
        shares: 0,
      },
      answersCount,
      postCommentsCount,
      commentsCount,
      publishedAt: formatDate(post.createdAt),
      isLiked: Boolean(likeRecord),
      isBookmarked: Boolean(bookmarkRecord),
      comments: [],
      answers: [],
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

    const finalTitle = title !== undefined ? String(title).trim() : post.title;
    const finalContent = content !== undefined ? String(content).trim() : post.content;
    const finalCategory = category !== undefined ? String(category).trim() : post.category;
    const finalSubcategory = subcategory !== undefined ? (subcategory ? String(subcategory).trim() : '') : post.subcategory || '';

    if (title !== undefined) {
      if (!finalTitle) {
        return errorResponse('제목을 비워둘 수 없습니다.', 'POST_TITLE_REQUIRED');
      }
      const titleValidation = validateUgcText(finalTitle, UGC_LIMITS.postTitle.min, UGC_LIMITS.postTitle.max);
      if (!titleValidation.ok) {
        if (titleValidation.code === 'UGC_TOO_SHORT') {
          return errorResponse('제목이 너무 짧습니다.', 'POST_TITLE_TOO_SHORT');
        }
        if (titleValidation.code === 'UGC_TOO_LONG') {
          return errorResponse('제목이 너무 깁니다.', 'POST_TITLE_TOO_LONG');
        }
        return errorResponse('제목이 너무 단순하거나 반복됩니다.', 'POST_TITLE_LOW_QUALITY');
      }
    }

    if (content !== undefined) {
      if (!finalContent) {
        return errorResponse('내용을 입력해주세요.', 'POST_CONTENT_REQUIRED');
      }
      const contentValidation = validateUgcText(finalContent, UGC_LIMITS.postContent.min, UGC_LIMITS.postContent.max);
      if (!contentValidation.ok) {
        if (contentValidation.code === 'UGC_TOO_SHORT') {
          return errorResponse('내용이 너무 짧습니다.', 'POST_CONTENT_TOO_SHORT');
        }
        if (contentValidation.code === 'UGC_TOO_LONG') {
          return errorResponse('내용이 너무 깁니다.', 'POST_CONTENT_TOO_LONG');
        }
        return errorResponse('내용이 너무 단순하거나 반복됩니다.', 'POST_CONTENT_LOW_QUALITY');
      }
    }

    if (title !== undefined || content !== undefined) {
      if (hasProhibitedContent(`${finalTitle} ${finalContent}`)) {
        return errorResponse('금칙어/광고/연락처가 포함되어 있습니다. 내용을 수정해주세요.', 'CONTENT_PROHIBITED');
      }
    }

    if (!finalCategory) {
      return errorResponse('카테고리를 다시 선택해주세요.', 'POST_INVALID_CATEGORY');
    }

    if (!isGroupParentSlug(finalCategory)) {
      return errorResponse('카테고리를 다시 선택해주세요.', 'POST_INVALID_CATEGORY');
    }

    const childrenForCategory = getChildrenForParent(finalCategory);
    if (childrenForCategory.length > 0) {
      if (!finalSubcategory) {
        return errorResponse('세부분류를 선택해주세요.', 'POST_SUBCATEGORY_REQUIRED');
      }
      if (!childrenForCategory.includes(finalSubcategory)) {
        return errorResponse('세부분류를 다시 선택해주세요.', 'POST_INVALID_SUBCATEGORY');
      }
    }

    const [updatedPost] = await db
      .update(posts)
      .set({
        title: finalTitle,
        content: finalContent,
        category: finalCategory,
        subcategory: childrenForCategory.length > 0 ? finalSubcategory : null,
        tags: Array.isArray(tags) ? tags : post.tags,
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
