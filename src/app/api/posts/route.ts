import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { posts, categorySubscriptions, categories, follows, topicSubscriptions } from '@/lib/db/schema';
import { successResponse, errorResponse, paginatedResponse, unauthorizedResponse, forbiddenResponse, serverErrorResponse } from '@/lib/api/response';
import { getSession } from '@/lib/api/auth';
import { checkUserStatus } from '@/lib/user-status';
import { desc, eq, and, or, sql, inArray, SQL } from 'drizzle-orm';
import dayjs from 'dayjs';
import { hasProhibitedContent } from '@/lib/content-filter';

const resolveTrust = (author: any, createdAt: Date | string) => {
  const months = dayjs().diff(createdAt, 'month', true);
  if (months >= 12) return { badge: 'outdated', weight: 0.5 };
  if (author?.isExpert || author?.badgeType === 'expert') return { badge: 'expert', weight: 1.3 };
  if (author?.isVerified || author?.badgeType) return { badge: 'verified', weight: 1 };
  return { badge: 'community', weight: 0.7 };
};

const CATEGORY_GROUP_SLUGS = {
  visa: ['visa-process', 'status-change', 'visa-checklist'],
  students: ['scholarship', 'university-ranking', 'korean-language'],
  career: ['business', 'wage-info', 'legal'],
  living: ['housing', 'cost-of-living', 'healthcare'],
} as const;

const GROUP_PARENT_SLUGS = Object.keys(CATEGORY_GROUP_SLUGS);
const GROUP_CHILD_SLUGS = Object.values(CATEGORY_GROUP_SLUGS).flat();
const CHILD_TO_PARENT: Record<string, string> = GROUP_CHILD_SLUGS.reduce((acc, slug) => {
  const parent = GROUP_PARENT_SLUGS.find((p) =>
    (CATEGORY_GROUP_SLUGS[p as keyof typeof CATEGORY_GROUP_SLUGS] as readonly string[]).includes(slug)
  );
  if (parent) acc[slug] = parent;
  return acc;
}, {} as Record<string, string>);

const isGroupParentSlug = (slug: string) => GROUP_PARENT_SLUGS.includes(slug);
const isGroupChildSlug = (slug: string) => (GROUP_CHILD_SLUGS as readonly string[]).includes(slug);
const getChildrenForParent = (slug: string) =>
  (CATEGORY_GROUP_SLUGS as Record<string, readonly string[]>)[slug] || [];

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

    const conditions: SQL[] = [];

    if (category && category !== 'all') {
      if (isGroupParentSlug(category)) {
        const children = getChildrenForParent(category);
        if (children.length > 0) {
          const allSlugs = [category, ...children];
          conditions.push(or(inArray(posts.category, allSlugs), inArray(posts.subcategory, children)) as SQL);
        } else {
          conditions.push(eq(posts.category, category));
        }
      } else if (isGroupChildSlug(category)) {
        conditions.push(or(eq(posts.subcategory, category), eq(posts.category, category)) as SQL);
      } else {
        conditions.push(eq(posts.category, category));
      }
    } else if (parentCategory && parentCategory !== 'all') {
      if (isGroupChildSlug(parentCategory)) {
        conditions.push(or(eq(posts.subcategory, parentCategory), eq(posts.category, parentCategory)) as SQL);
      } else if (isGroupParentSlug(parentCategory)) {
        const children = getChildrenForParent(parentCategory);
        if (children.length > 0) {
          const allSlugs = [parentCategory, ...children];
          conditions.push(or(inArray(posts.category, allSlugs), inArray(posts.subcategory, children)) as SQL);
        } else {
          conditions.push(eq(posts.category, parentCategory));
        }
      } else {
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
      
      const subscribedIds = [...subscriptions, ...topicSubs]
        .map(s => s.categoryId)
        .filter(Boolean) as string[];
      
      if (subscribedIds.length === 0) {
        return paginatedResponse([], page, limit, 0);
      }

      const subscribedCats = await db.query.categories.findMany({
        where: inArray(categories.id, subscribedIds),
      });
      const subscribedSlugs = subscribedCats.map((c) => c.slug).filter(Boolean) as string[];

      if (subscribedSlugs.length === 0) {
        return paginatedResponse([], page, limit, 0);
      }

      const expanded = new Set<string>();
      subscribedSlugs.forEach((slug) => {
        expanded.add(slug);
        if (isGroupParentSlug(slug)) {
          getChildrenForParent(slug).forEach((child) => expanded.add(child));
        } else if (isGroupChildSlug(slug)) {
          const parent = CHILD_TO_PARENT[slug];
          if (parent) expanded.add(parent);
        }
      });

      const expandedSlugs = Array.from(expanded);
      conditions.push(or(inArray(posts.category, expandedSlugs), inArray(posts.subcategory, expandedSlugs)) as SQL);
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
        const trustA = resolveTrust(a.author, a.createdAt).weight;
        const trustB = resolveTrust(b.author, b.createdAt).weight;
        const scoreA = ((a.likes?.length || 0) * 2 + (a.views || 0) + (a.answers?.length || 0) * 1.5 + (a.comments?.length || 0)) * trustA;
        const scoreB = ((b.likes?.length || 0) * 2 + (b.views || 0) + (b.answers?.length || 0) * 1.5 + (b.comments?.length || 0)) * trustB;
        return scoreB - scoreA;
      });
    }

    const postsWithUserStatus = sortedList.map(post => {
      const imageMatches = Array.from(post.content.matchAll(/<img[^>]+src=["']([^"']+)["']/gi));
      const thumbnails = imageMatches.slice(0, 4).map((match) => match[1]);
      const thumbnail = thumbnails[0] ?? null;
      const imageCount = imageMatches.length;
      const trust = resolveTrust(post.author, post.createdAt);

      return {
        ...post,
        author: post.author
          ? {
              ...post.author,
              isExpert: post.author.isExpert || false,
            }
          : post.author,
        trustBadge: trust.badge,
        trustWeight: trust.weight,
        thumbnail,
        thumbnails,
        imageCount,
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
    console.error('CreatePost payload', {
      type,
      titleLength: title?.length,
      contentLength: content?.length,
      category,
      subcategory,
    });

    // 필수 필드 검증
    if (!type || !title || !content || !category) {
      return errorResponse('필수 필드가 누락되었습니다.');
    }

    // 금칙어/스팸 검증
    if (hasProhibitedContent(`${title} ${content}`)) {
      return errorResponse('금칙어/광고/연락처가 포함되어 있습니다. 내용을 수정해주세요.');
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
