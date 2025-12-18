import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { userPublicColumns } from '@/lib/db/columns';
import { posts, users, categorySubscriptions, categories, follows, topicSubscriptions, answers, comments, likes, bookmarks } from '@/lib/db/schema';
import { successResponse, errorResponse, paginatedResponse, unauthorizedResponse, forbiddenResponse, serverErrorResponse } from '@/lib/api/response';
import { getSession } from '@/lib/api/auth';
import { checkUserStatus } from '@/lib/user-status';
import { desc, eq, and, or, sql, inArray, SQL, lt, isNull } from 'drizzle-orm';
import dayjs from 'dayjs';
import { hasProhibitedContent } from '@/lib/content-filter';
import { UGC_LIMITS, validateUgcText } from '@/lib/validation/ugc';
import { getChildrenForParent, isGroupChildSlug, isGroupParentSlug } from '@/lib/constants/category-groups';
import { isExpertBadgeType } from '@/lib/constants/badges';
import { getFollowingIdSet } from '@/lib/api/follow';

const resolveTrust = (author: any, createdAt: Date | string) => {
  const months = dayjs().diff(createdAt, 'month', true);
  if (months >= 12) return { badge: 'outdated', weight: 0.5 };
  if (author?.isExpert || isExpertBadgeType(author?.badgeType)) return { badge: 'expert', weight: 1.3 };
  if (author?.isVerified || author?.badgeType) return { badge: 'verified', weight: 1 };
  return { badge: 'community', weight: 0.7 };
};

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
    const search = (searchParams.get('search') || '').trim();
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10) || 20));
    const type = searchParams.get('type') as 'question' | 'share' | null;
    const sort = searchParams.get('sort') || 'latest';
    const filter = searchParams.get('filter');
    const include = (searchParams.get('include') || '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);
    const includeContent = include.includes('content');

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

    const typeCondition = type ? eq(posts.type, type) : null;
    if (typeCondition) {
      conditions.push(typeCondition);
    }

    const conditionsBeforeSearch = [...conditions];

    const tokenizeSearch = (input: string) => {
      const normalized = input
        .toLowerCase()
        .replace(/[^\p{L}\p{N}]+/gu, ' ')
        .trim();
      const tokens = normalized.split(/\s+/).map((t) => t.trim()).filter(Boolean);
      return Array.from(new Set(tokens)).slice(0, 8);
    };

    const hasSearch = search.length > 0;
    if (hasSearch && search.length > 80) {
      return errorResponse('검색어가 너무 깁니다.', 'SEARCH_QUERY_TOO_LONG');
    }

    const searchTokens = hasSearch ? tokenizeSearch(search) : [];

    const tokenToLike = (token: string) => `%${token}%`;

    const overlapScore = hasSearch && searchTokens.length > 0
      ? searchTokens.reduce<SQL<number>>((acc, token) => {
        const hit = sql<number>`CASE WHEN (${posts.title} ILIKE ${tokenToLike(token)} OR ${posts.content} ILIKE ${tokenToLike(token)}) THEN 1 ELSE 0 END`;
        return sql<number>`${acc} + ${hit}`;
      }, sql<number>`0`)
      : null;

    if (hasSearch) {
      if (searchTokens.length === 0) {
        conditions.push(
          sql`(${posts.title} ILIKE ${`%${search}%`} OR ${posts.content} ILIKE ${`%${search}%`})`
        );
      } else {
        const tokenConditions = searchTokens.map(
          (token) => sql`(${posts.title} ILIKE ${tokenToLike(token)} OR ${posts.content} ILIKE ${tokenToLike(token)})`
        );
        const searchCondition = tokenConditions.length === 1 ? tokenConditions[0] : (or(...tokenConditions) as SQL);
        conditions.push(searchCondition);
      }
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

      const subscribedParentSlugs = new Set<string>();
      const subscribedTopicSlugs = new Set<string>();

      subscribedSlugs.forEach((slug) => {
        if (isGroupParentSlug(slug)) {
          subscribedParentSlugs.add(slug);
          getChildrenForParent(slug).forEach((child) => subscribedTopicSlugs.add(child));
          return;
        }
        subscribedTopicSlugs.add(slug);
      });

      const parentSlugs = Array.from(subscribedParentSlugs);
      const topicSlugs = Array.from(subscribedTopicSlugs);

      const followingConditions: SQL[] = [];

      if (parentSlugs.length > 0) {
        followingConditions.push(inArray(posts.category, parentSlugs) as SQL);
      }

      if (topicSlugs.length > 0) {
        followingConditions.push(or(inArray(posts.subcategory, topicSlugs), inArray(posts.category, topicSlugs)) as SQL);
      }

      if (followingConditions.length === 0) {
        return paginatedResponse([], page, limit, 0);
      }

      conditions.push(followingConditions.length === 1 ? followingConditions[0] : (or(...followingConditions) as SQL));
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

    const cursorParam = searchParams.get('cursor');
    const decodedCursor = cursorParam ? decodeCursor(cursorParam) : null;
    const cursorCreatedAt = decodedCursor ? new Date(decodedCursor.createdAt) : null;
    const hasValidCursor = Boolean(decodedCursor && cursorCreatedAt && !Number.isNaN(cursorCreatedAt.getTime()));
    const useCursorPagination = Boolean(cursorParam && hasValidCursor && !hasSearch);

    const total = useCursorPagination
      ? 0
      : (
          (
            await db
              .select({ count: sql<number>`count(*)::int` })
              .from(posts)
              .where(conditions.length > 0 ? and(...conditions) : undefined)
          )[0]?.count || 0
        );

    const stripHtmlToText = (html: string) =>
      html
        .replace(/<img[^>]*>/gi, '')
        .replace(/<[^>]*>/g, '')
        .replace(/\s+/g, ' ')
        .trim();

    const buildExcerpt = (html: string, maxLength = 200) => stripHtmlToText(html).slice(0, maxLength);

    const extractImages = (html: string, maxThumbs = 4) => {
      if (!html) return { thumbnails: [] as string[], thumbnail: null as string | null, imageCount: 0 };
      const regex = /<img[^>]+src=["']([^"']+)["']/gi;
      const thumbnails: string[] = [];
      let match: RegExpExecArray | null;
      let imageCount = 0;
      while ((match = regex.exec(html))) {
        imageCount += 1;
        if (thumbnails.length < maxThumbs) thumbnails.push(match[1]);
      }
      return { thumbnails, thumbnail: thumbnails[0] ?? null, imageCount };
    };

    const contentPreviewLimit = 4000;
    const postSelect = {
      id: posts.id,
      authorId: posts.authorId,
      type: posts.type,
      title: posts.title,
      content: includeContent
        ? posts.content
        : sql<string>`left(${posts.content}, ${contentPreviewLimit})`.as('content'),
      category: posts.category,
      subcategory: posts.subcategory,
      tags: posts.tags,
      views: posts.views,
      likes: posts.likes,
      isResolved: posts.isResolved,
      adoptedAnswerId: posts.adoptedAnswerId,
      createdAt: posts.createdAt,
      updatedAt: posts.updatedAt,
      author: {
        id: users.id,
        name: users.name,
        displayName: users.displayName,
        image: users.image,
        isVerified: users.isVerified,
        isExpert: users.isExpert,
        badgeType: users.badgeType,
      },
    };

    if (useCursorPagination) {
      conditions.push(
        or(
          lt(posts.createdAt, cursorCreatedAt as Date),
          and(eq(posts.createdAt, cursorCreatedAt as Date), lt(posts.id, decodedCursor?.id || ''))
        ) as SQL
      );
    }

    const decoratePosts = async (list: any[]) => {
      const postIds = list.map((post) => post.id).filter(Boolean) as string[];
      if (postIds.length === 0) return [];

      const shouldComputeResponderCounts = !useCursorPagination;
      const emptyResponderRows: Array<{ postId: string | null; authorId: string | null }> = [];

      const [answerCounts, commentCounts, answerResponders, commentResponders, likedRows, bookmarkedRows] = await Promise.all([
        db
          .select({ postId: answers.postId, count: sql<number>`count(*)::int` })
          .from(answers)
          .where(inArray(answers.postId, postIds))
          .groupBy(answers.postId),
        db
          .select({ postId: comments.postId, count: sql<number>`count(*)::int` })
          .from(comments)
          .where(and(inArray(comments.postId, postIds), isNull(comments.parentId)))
          .groupBy(comments.postId),
        shouldComputeResponderCounts
          ? db
              .select({ postId: answers.postId, authorId: answers.authorId })
              .from(answers)
              .where(inArray(answers.postId, postIds))
              .groupBy(answers.postId, answers.authorId)
          : Promise.resolve(emptyResponderRows),
        shouldComputeResponderCounts
          ? db
              .select({ postId: comments.postId, authorId: comments.authorId })
              .from(comments)
              .where(inArray(comments.postId, postIds))
              .groupBy(comments.postId, comments.authorId)
          : Promise.resolve(emptyResponderRows),
        user
          ? db
              .select({ postId: likes.postId })
              .from(likes)
              .where(and(eq(likes.userId, user.id), inArray(likes.postId, postIds)))
          : Promise.resolve([]),
        user
          ? db
              .select({ postId: bookmarks.postId })
              .from(bookmarks)
              .where(and(eq(bookmarks.userId, user.id), inArray(bookmarks.postId, postIds)))
          : Promise.resolve([]),
      ]);

      const responderIds = new Set<string>();
      [...answerResponders, ...commentResponders].forEach((row) => {
        if (row.authorId) responderIds.add(row.authorId);
      });

      const responders = responderIds.size
        ? await db.query.users.findMany({
            where: inArray(users.id, Array.from(responderIds)),
            columns: {
              id: true,
              isVerified: true,
              isExpert: true,
              badgeType: true,
            },
          })
        : [];

      const responderCertMap = new Map<string, boolean>();
      responders.forEach((responder) => {
        responderCertMap.set(responder.id, Boolean(responder.isVerified || responder.isExpert || responder.badgeType));
      });

      const certifiedRespondersByPostId = new Map<string, Set<string>>();
      const otherRespondersByPostId = new Map<string, Set<string>>();

      const addResponder = (postId: string | null, authorId: string | null) => {
        if (!postId || !authorId) return;
        if (responderCertMap.get(authorId)) {
          const certifiedSet = certifiedRespondersByPostId.get(postId) || new Set<string>();
          certifiedSet.add(authorId);
          certifiedRespondersByPostId.set(postId, certifiedSet);
          const otherSet = otherRespondersByPostId.get(postId);
          if (otherSet?.has(authorId)) otherSet.delete(authorId);
          return;
        }

        const certifiedSet = certifiedRespondersByPostId.get(postId);
        if (certifiedSet?.has(authorId)) return;

        const otherSet = otherRespondersByPostId.get(postId) || new Set<string>();
        otherSet.add(authorId);
        otherRespondersByPostId.set(postId, otherSet);
      };

      answerResponders.forEach((row) => addResponder(row.postId, row.authorId));
      commentResponders.forEach((row) => addResponder(row.postId, row.authorId));

      const answerCountMap = new Map<string, number>();
      answerCounts.forEach((row) => {
        if (row.postId) answerCountMap.set(row.postId, row.count);
      });

      const commentCountMap = new Map<string, number>();
      commentCounts.forEach((row) => {
        if (row.postId) commentCountMap.set(row.postId, row.count);
      });

      const likedPostIds = new Set<string>();
      likedRows.forEach((row) => {
        if (row.postId) likedPostIds.add(row.postId);
      });

      const bookmarkedPostIds = new Set<string>();
      bookmarkedRows.forEach((row) => {
        if (row.postId) bookmarkedPostIds.add(row.postId);
      });

      const followingIdSet = user
        ? await getFollowingIdSet(
            user.id,
            list.map((post) => post.authorId)
          )
        : new Set<string>();

      return list.map((post) => {
        const content = typeof post.content === 'string' ? post.content : '';
        const { thumbnail, thumbnails, imageCount } = extractImages(content, 4);
        const trust = resolveTrust(post.author, post.createdAt);
        const excerpt = buildExcerpt(content);

        const answersCount = answerCountMap.get(post.id) ?? 0;
        const postCommentsCount = commentCountMap.get(post.id) ?? 0;
        const certifiedResponderCount = certifiedRespondersByPostId.get(post.id)?.size ?? 0;
        const otherResponderCount = otherRespondersByPostId.get(post.id)?.size ?? 0;

        return {
          id: post.id,
          authorId: post.authorId,
          type: post.type,
          title: post.title,
          ...(includeContent ? { content: post.content } : {}),
          excerpt,
          category: post.category,
          subcategory: post.subcategory,
          tags: Array.isArray(post.tags) ? post.tags : [],
          views: post.views ?? 0,
          likes: post.likes ?? 0,
          isResolved: post.isResolved ?? false,
          adoptedAnswerId: post.adoptedAnswerId ?? null,
          createdAt: post.createdAt,
          updatedAt: post.updatedAt,
          author: post.author
            ? {
                ...post.author,
                isExpert: post.author.isExpert || false,
                isFollowing: user ? followingIdSet.has(post.authorId) : false,
              }
            : post.author,
          trustBadge: trust.badge,
          trustWeight: trust.weight,
          thumbnail,
          thumbnails,
          imageCount,
          isLiked: user ? likedPostIds.has(post.id) : false,
          isBookmarked: user ? bookmarkedPostIds.has(post.id) : false,
          likesCount: post.likes ?? 0,
          answersCount,
          postCommentsCount,
          commentsCount: answersCount + postCommentsCount,
          certifiedResponderCount,
          otherResponderCount,
        };
      });
    };

    if (hasSearch && total === 0) {
      const fallbackConditions = [
        ...conditionsBeforeSearch.filter((c) => (typeCondition ? c !== typeCondition : true)),
        eq(posts.type, 'question'),
      ];

      const [fallbackCountResult] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(posts)
        .where(fallbackConditions.length > 0 ? and(...fallbackConditions) : undefined);

      const fallbackTotal = fallbackCountResult?.count || 0;

      const fallbackList = await db
        .select(postSelect)
        .from(posts)
        .leftJoin(users, eq(posts.authorId, users.id))
        .where(fallbackConditions.length > 0 ? and(...fallbackConditions) : undefined)
        .orderBy(desc(posts.likes), desc(posts.views), desc(posts.createdAt), desc(posts.id))
        .offset((page - 1) * limit)
        .limit(limit);

      const decoratedFallback = await decoratePosts(fallbackList);

      const fallbackTotalPages = Math.ceil(fallbackTotal / limit);
      const fallbackHasMore = page < fallbackTotalPages;
      const fallbackLast = fallbackList[fallbackList.length - 1];
      const fallbackNextCursor =
        fallbackHasMore && fallbackLast
          ? encodeCursor({
              createdAt:
                fallbackLast.createdAt instanceof Date
                  ? fallbackLast.createdAt.toISOString()
                  : String(fallbackLast.createdAt),
              id: String(fallbackLast.id),
            })
          : null;

      const response = NextResponse.json({
        success: true,
        data: decoratedFallback,
        pagination: {
          page,
          limit,
          total: fallbackTotal,
          totalPages: fallbackTotalPages,
        },
        meta: {
          isFallback: true,
          reason: 'no_matches',
          query: search,
          tokens: searchTokens,
          nextCursor: fallbackNextCursor,
          hasMore: fallbackHasMore,
          paginationMode: 'offset',
        },
      });

      response.headers.set('Cache-Control', 'no-store');
      return response;
    }

    const queryLimit = useCursorPagination ? limit + 1 : limit;

    const orderByClauses = hasSearch && overlapScore
      ? [
          desc(overlapScore),
          desc(sql<number>`CASE WHEN ${posts.type} = 'question' THEN 1 ELSE 0 END`),
          desc(posts.isResolved),
          desc(posts.likes),
          desc(posts.views),
          desc(posts.createdAt),
          desc(posts.id),
        ]
      : [desc(posts.createdAt), desc(posts.id)];

    const baseQuery = db
      .select(postSelect)
      .from(posts)
      .leftJoin(users, eq(posts.authorId, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(...orderByClauses);

    const rawList = await (useCursorPagination
      ? baseQuery.limit(queryLimit)
      : baseQuery.offset((page - 1) * limit).limit(queryLimit));

    const totalPages = Math.ceil(total / limit);
    const rawHasMore = useCursorPagination ? rawList.length > limit : page < totalPages;
    const pageList = useCursorPagination && rawList.length > limit ? rawList.slice(0, limit) : rawList;
    const lastPost = pageList[pageList.length - 1];
    const nextCursor =
      rawHasMore && lastPost
        ? encodeCursor({
            createdAt:
              lastPost.createdAt instanceof Date
                ? lastPost.createdAt.toISOString()
                : String(lastPost.createdAt),
            id: String(lastPost.id),
          })
        : null;

    const decoratedPosts = await decoratePosts(pageList);

    // 인기순일 경우 클라이언트에서 재정렬
    let sortedList = decoratedPosts;
    if (sort === 'popular' && !hasSearch) {
      sortedList = [...decoratedPosts].sort((a, b) => {
        const trustA = a.trustWeight || 1;
        const trustB = b.trustWeight || 1;
        const scoreA = ((a.likesCount ?? a.likes ?? 0) * 2 + (a.views || 0) + ((a as any).answersCount || 0) * 1.5 + ((a as any).postCommentsCount || 0)) * trustA;
        const scoreB = ((b.likesCount ?? b.likes ?? 0) * 2 + (b.views || 0) + ((b as any).answersCount || 0) * 1.5 + ((b as any).postCommentsCount || 0)) * trustB;
        return scoreB - scoreA;
      });
    }

    const response = NextResponse.json({
      success: true,
      data: sortedList,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
      meta: {
        nextCursor,
        hasMore: rawHasMore,
        paginationMode: useCursorPagination ? 'cursor' : 'offset',
      },
    });

    const shouldCachePublic = !user && !filter && !hasSearch;
    response.headers.set(
      'Cache-Control',
      shouldCachePublic
        ? 'public, s-maxage=60, stale-while-revalidate=300'
        : 'private, no-store'
    );

    return response;
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

    if (!type || typeof type !== 'string') {
      return errorResponse('필수 필드가 누락되었습니다.', 'POST_REQUIRED_FIELDS');
    }

    if (type !== 'question' && type !== 'share') {
      return errorResponse('게시글 타입이 올바르지 않습니다.', 'POST_INVALID_TYPE');
    }

    const postType: 'question' | 'share' = type;

    if (!title || typeof title !== 'string') {
      return errorResponse('필수 필드가 누락되었습니다.', 'POST_REQUIRED_FIELDS');
    }

    if (!content || typeof content !== 'string') {
      return errorResponse('필수 필드가 누락되었습니다.', 'POST_REQUIRED_FIELDS');
    }

    if (!category || typeof category !== 'string') {
      return errorResponse('필수 필드가 누락되었습니다.', 'POST_REQUIRED_FIELDS');
    }

    const normalizedTitle = title.trim();
    const normalizedContent = content.trim();
    const normalizedCategory = category.trim();
    const normalizedSubcategory = typeof subcategory === 'string' ? subcategory.trim() : '';

    if (!isGroupParentSlug(normalizedCategory)) {
      return errorResponse('카테고리를 다시 선택해주세요.', 'POST_INVALID_CATEGORY');
    }

    const childrenForCategory = getChildrenForParent(normalizedCategory);
    if (childrenForCategory.length > 0) {
      if (!normalizedSubcategory) {
        return errorResponse('세부분류를 선택해주세요.', 'POST_SUBCATEGORY_REQUIRED');
      }
      if (!childrenForCategory.includes(normalizedSubcategory)) {
        return errorResponse('세부분류를 다시 선택해주세요.', 'POST_INVALID_SUBCATEGORY');
      }
    }

    const titleValidation = validateUgcText(normalizedTitle, UGC_LIMITS.postTitle.min, UGC_LIMITS.postTitle.max);
    if (!titleValidation.ok) {
      if (titleValidation.code === 'UGC_TOO_SHORT') {
        return errorResponse('제목이 너무 짧습니다.', 'POST_TITLE_TOO_SHORT');
      }
      if (titleValidation.code === 'UGC_TOO_LONG') {
        return errorResponse('제목이 너무 깁니다.', 'POST_TITLE_TOO_LONG');
      }
      return errorResponse('제목이 올바르지 않습니다.', 'POST_TITLE_LOW_QUALITY');
    }

    const contentValidation = validateUgcText(normalizedContent, UGC_LIMITS.postContent.min, UGC_LIMITS.postContent.max);
    if (!contentValidation.ok) {
      if (contentValidation.code === 'UGC_TOO_SHORT') {
        return errorResponse('내용이 너무 짧습니다.', 'POST_CONTENT_TOO_SHORT');
      }
      if (contentValidation.code === 'UGC_TOO_LONG') {
        return errorResponse('내용이 너무 깁니다.', 'POST_CONTENT_TOO_LONG');
      }
      return errorResponse('내용이 올바르지 않습니다.', 'POST_CONTENT_LOW_QUALITY');
    }

    if (hasProhibitedContent(`${normalizedTitle} ${normalizedContent}`)) {
      return errorResponse('금칙어/광고/연락처가 포함되어 있습니다. 내용을 수정해주세요.', 'CONTENT_PROHIBITED');
    }

    const normalizeTag = (raw: unknown) => {
      if (typeof raw !== 'string') return null;
      const trimmed = raw.trim().replace(/^#+/, '');
      if (!trimmed) return null;
      const normalized = trimmed.replace(/\s+/g, ' ').trim();
      const cleaned = normalized.replace(/[^\p{L}\p{N} _-]+/gu, '').trim();
      if (!cleaned) return null;
      if (/^\d+$/u.test(cleaned)) return null;
      return cleaned.length > 24 ? cleaned.slice(0, 24) : cleaned;
    };

    const sanitizeTags = (value: unknown) => {
      if (!Array.isArray(value)) return [] as string[];
      const result: string[] = [];
      const seen = new Set<string>();
      value.forEach((item) => {
        const normalized = normalizeTag(item);
        if (!normalized) return;
        if (hasProhibitedContent(normalized)) return;
        const key = normalized.toLowerCase();
        if (seen.has(key)) return;
        seen.add(key);
        result.push(normalized);
      });
      return result;
    };

    const autoTagsByCategory: Record<string, readonly string[]> = {
      visa: ['비자', '연장', '체류'],
      'visa-process': ['비자', '서류', '가이드'],
      'status-change': ['비자', '체류', '서류'],
      'visa-checklist': ['비자', '서류', '가이드'],
      students: ['학업', '장학금', '수업'],
      scholarship: ['학업', '장학금', '정보'],
      'university-ranking': ['학업', '정보', '가이드'],
      'korean-language': ['한국어', '토픽', '수업'],
      career: ['취업', '채용', '면접'],
      business: ['비즈니스', '창업', '서류'],
      'wage-info': ['취업', '정보', '가이드'],
      legal: ['법률', '계약', '신고'],
      living: ['생활', '주거', '교통'],
      housing: ['생활', '주거', '정보'],
      'cost-of-living': ['생활', '금융', '정보'],
      healthcare: ['의료', '보험', '병원'],
    };

    const resolveAutoTags = () => {
      const sub = normalizedSubcategory || '';
      const base = autoTagsByCategory[sub] || autoTagsByCategory[normalizedCategory] || ['정보', '가이드', '추천'];
      const picked = base.map((tag) => normalizeTag(tag)).filter(Boolean) as string[];
      return picked.length > 0 ? picked : ['정보', '가이드', '추천'];
    };

    const userTags = sanitizeTags(tags);
    const autoTags = resolveAutoTags();

    const keywordHints: string[] = [];
    const tagHintText = `${normalizedTitle} ${normalizedContent}`.toLowerCase();
    if (/\b(d|e|f)-\d/iu.test(tagHintText) || tagHintText.includes('비자')) {
      keywordHints.push('비자');
    }
    if (tagHintText.includes('topik') || tagHintText.includes('토픽')) {
      keywordHints.push('토픽');
    }
    if (tagHintText.includes('korean') || tagHintText.includes('한국어')) {
      keywordHints.push('한국어');
    }
    if (tagHintText.includes('interview') || tagHintText.includes('면접')) {
      keywordHints.push('면접');
    }
    if (tagHintText.includes('contract') || tagHintText.includes('계약')) {
      keywordHints.push('계약');
    }
    if (tagHintText.includes('insurance') || tagHintText.includes('보험')) {
      keywordHints.push('보험');
    }
    if (tagHintText.includes('hospital') || tagHintText.includes('병원')) {
      keywordHints.push('병원');
    }
    if (tagHintText.includes('housing') || tagHintText.includes('월세') || tagHintText.includes('전세') || tagHintText.includes('주거')) {
      keywordHints.push('주거');
    }
    if (tagHintText.includes('remittance') || tagHintText.includes('송금') || tagHintText.includes('transfer')) {
      keywordHints.push('송금');
    }
    const merged: string[] = [];
    const pushUnique = (tag: string) => {
      const normalized = normalizeTag(tag);
      if (!normalized) return;
      if (hasProhibitedContent(normalized)) return;
      const key = normalized.toLowerCase();
      if (merged.some((t) => t.toLowerCase() === key)) return;
      merged.push(normalized);
    };

    userTags.forEach(pushUnique);
    keywordHints.forEach(pushUnique);
    autoTags.forEach(pushUnique);
    ['정보', '가이드', '추천'].forEach(pushUnique);

    const finalTags = merged.slice(0, 3);

    // 게시글 작성
    const [newPost] = await db.insert(posts).values({
      authorId: user.id,
      type: postType,
      title: normalizedTitle,
      content: normalizedContent,
      category: normalizedCategory,
      subcategory: childrenForCategory.length > 0 ? normalizedSubcategory : null,
      tags: finalTags,
    }).returning();

    // 작성자 정보 포함하여 반환
    const postWithAuthor = await db.query.posts.findFirst({
      where: eq(posts.id, newPost.id),
      with: {
        author: {
          columns: userPublicColumns,
        },
      },
    });

    return successResponse(postWithAuthor, '게시글이 작성되었습니다.');
  } catch (error) {
    console.error('POST /api/posts error:', error);
    return serverErrorResponse();
  }
}
