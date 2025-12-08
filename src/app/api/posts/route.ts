import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { posts, categorySubscriptions, categories, follows, topicSubscriptions } from '@/lib/db/schema';
import { successResponse, errorResponse, paginatedResponse, unauthorizedResponse, forbiddenResponse, serverErrorResponse } from '@/lib/api/response';
import { getSession } from '@/lib/api/auth';
import { checkUserStatus } from '@/lib/user-status';
import { desc, eq, and, sql, inArray } from 'drizzle-orm';

/**
 * GET /api/posts
 * 게시글 목록 조회
 *
 * Query Params:
 * - parentCategory: string (optional) - 1차 카테고리 필터
 * - category: string (optional) - 2차 카테고리 필터
 * - search: string (optional) - 검색어
 * - page: number (default: 1) - 페이지 번호
 * - limit: number (default: 20) - 페이지당 개수
 * - type: 'question' | 'share' (optional) - 게시글 타입
 * - sort: 'popular' | 'latest' (default: 'latest') - 정렬 기준
 * - filter: 'following' | 'following-users' (optional) - following: 구독한 카테고리, following-users: 팔로우한 유저
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parentCategory = searchParams.get('parentCategory');
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const type = searchParams.get('type') as 'question' | 'share' | null;
    const sort = searchParams.get('sort') || 'latest';
    const filter = searchParams.get('filter');

    const user = await getSession(request);

    const conditions = [];

    if (category && category !== 'all') {
      conditions.push(eq(posts.category, category));
    } else if (parentCategory && parentCategory !== 'all') {
      const allCategories = await db.query.categories.findMany();
      const childCategoryIds = allCategories
        .filter(cat => cat.parentId === parentCategory)
        .map(cat => cat.id);
      
      if (childCategoryIds.length > 0) {
        conditions.push(inArray(posts.category, childCategoryIds));
      } else {
        conditions.push(eq(posts.category, parentCategory));
      }
    }

    if (type) {
      conditions.push(eq(posts.type, type));
    }

    if (search) {
      conditions.push(
        sql`(${posts.title} ILIKE ${`%${search}%`} OR ${posts.content} ILIKE ${`%${search}%`})`
      );
    }

    if (filter === 'following') {
      if (!user) {
        return paginatedResponse([], page, limit, 0);
      }
      
      const [subscriptions, topicSubs] = await Promise.all([
        db.query.categorySubscriptions.findMany({
          where: eq(categorySubscriptions.userId, user.id),
        }),
        db.query.topicSubscriptions.findMany({
          where: eq(topicSubscriptions.userId, user.id),
        }),
      ]);
      
      const subscribedParentIds = [...subscriptions, ...topicSubs].map(s => s.categoryId);
      
      if (subscribedParentIds.length > 0) {
        const allCategories = await db.query.categories.findMany();
        const childCategoryIds = allCategories
          .filter(cat => cat.parentId && subscribedParentIds.includes(cat.parentId))
          .map(cat => cat.id);
        
        const allCategoryMatches = [...subscribedParentIds, ...childCategoryIds];
        conditions.push(inArray(posts.category, allCategoryMatches));
      } else {
        return paginatedResponse([], page, limit, 0);
      }
    }

    if (filter === 'following-users') {
      if (!user) {
        return paginatedResponse([], page, limit, 0);
      }
      
      const followingList = await db.query.follows.findMany({
        where: eq(follows.followerId, user.id),
      });
      
      const followingUserIds = followingList.map(f => f.followingId);
      
      if (followingUserIds.length > 0) {
        conditions.push(inArray(posts.authorId, followingUserIds));
      } else {
        return paginatedResponse([], page, limit, 0);
      }
    }

    if (filter === 'my-posts' && user) {
      conditions.push(eq(posts.authorId, user.id));
    }

    const [countResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(posts)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const total = countResult?.count || 0;

    const postList = await db.query.posts.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      with: {
        author: true,
        likes: true,
        bookmarks: true,
        answers: true,
        comments: true,
      },
      orderBy: [desc(posts.createdAt)],
      limit,
      offset: (page - 1) * limit,
    });

    // 인기순일 경우 클라이언트에서 재정렬
    let sortedList = postList;
    if (sort === 'popular') {
      sortedList = [...postList].sort((a, b) => {
        const scoreA = (a.likes?.length || 0) + (a.views || 0) + (a.answers?.length || 0) + (a.comments?.length || 0);
        const scoreB = (b.likes?.length || 0) + (b.views || 0) + (b.answers?.length || 0) + (b.comments?.length || 0);
        return scoreB - scoreA;
      });
    }

    const postsWithUserStatus = sortedList.map(post => {
      const imgMatch = post.content.match(/<img[^>]+src=["']([^"']+)["']/i);
      const thumbnail = imgMatch ? imgMatch[1] : null;
      
      return {
        ...post,
        thumbnail,
        isLiked: user ? post.likes.some(like => like.userId === user.id) : false,
        isBookmarked: user ? post.bookmarks.some(bookmark => bookmark.userId === user.id) : false,
        likesCount: post.likes.length,
        commentsCount: (post.answers?.length || 0) + (post.comments?.length || 0),
        likes: undefined,
        bookmarks: undefined,
        answers: undefined,
        comments: undefined,
      };
    });

    return paginatedResponse(postsWithUserStatus, page, limit, total);
  } catch (error) {
    console.error('GET /api/posts error:', error);
    return serverErrorResponse();
  }
}

/**
 * POST /api/posts
 * 게시글 작성
 *
 * Body:
 * - type: 'question' | 'share'
 * - title: string
 * - content: string
 * - category: string
 * - subcategory?: string
 * - tags?: string[]
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getSession(request);

    if (!user) {
      return unauthorizedResponse();
    }

    const userStatus = await checkUserStatus(user.id);
    if (!userStatus.isActive) {
      return forbiddenResponse(userStatus.message || 'Account restricted');
    }

    const body = await request.json();
    const { type, title, content, category, subcategory, tags } = body;

    // 필수 필드 검증
    if (!type || !title || !content || !category) {
      return errorResponse('필수 필드가 누락되었습니다.');
    }

    // 게시글 작성
    const [newPost] = await db.insert(posts).values({
      authorId: user.id,
      type,
      title,
      content,
      category,
      subcategory: subcategory || null,
      tags: tags || [],
    }).returning();

    // 작성자 정보 포함하여 반환
    const postWithAuthor = await db.query.posts.findFirst({
      where: eq(posts.id, newPost.id),
      with: {
        author: true,
      },
    });

    return successResponse(postWithAuthor, '게시글이 작성되었습니다.');
  } catch (error) {
    console.error('POST /api/posts error:', error);
    return serverErrorResponse();
  }
}
