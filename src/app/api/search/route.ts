import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { userPublicColumns } from '@/lib/db/columns';
import { posts, users } from '@/lib/db/schema';
import { successResponse, errorResponse, serverErrorResponse } from '@/lib/api/response';
import { getSession } from '@/lib/api/auth';
import { getFollowingIdSet } from '@/lib/api/follow';
import { and, or, ilike, desc, eq, inArray } from 'drizzle-orm';
import { ACTIVE_GROUP_PARENT_SLUGS } from '@/lib/constants/category-groups';
import { postListSelect, serializePostPreview } from '@/lib/api/post-list';


/**
 * GET /api/search
 * 통합 검색 (게시글 + 사용자)
 *
 * Query Params:
 * - q: string (required) - 검색어
 * - limit: number (default: 20) - 결과 개수
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = (searchParams.get('q') || '').trim();
    const modeParam = searchParams.get('mode');
    const mode = modeParam === 'posts' || modeParam === 'users' || modeParam === 'all' ? modeParam : 'all';
    const limitCandidate = Number.parseInt(searchParams.get('limit') || '20', 10);
    const limit = Math.min(20, Math.max(1, Number.isNaN(limitCandidate) ? 20 : limitCandidate));

    if (!query) {
      return errorResponse('검색어를 입력해주세요.', 'SEARCH_QUERY_REQUIRED');
    }

    if (query.length > 80) {
      return errorResponse('검색어가 너무 깁니다.', 'SEARCH_QUERY_TOO_LONG');
    }

    const currentUser = await getSession(request);

    const shouldSearchPosts = mode !== 'users';
    const shouldSearchUsers = mode !== 'posts';

    // 게시글 검색
    const postsLimit = Math.min(limit, 10);

    const postsResult = shouldSearchPosts
      ? await db
          .select(postListSelect())
          .from(posts)
          .leftJoin(users, eq(posts.authorId, users.id))
          .where(
            and(
              inArray(posts.category, ACTIVE_GROUP_PARENT_SLUGS),
              or(ilike(posts.title, `%${query}%`), ilike(posts.content, `%${query}%`))
            )
          )
          .orderBy(desc(posts.createdAt), desc(posts.id))
          .limit(postsLimit)
      : [];

    // 사용자 검색
    const usersResult = shouldSearchUsers
      ? await db.query.users.findMany({
          where: or(
            ilike(users.name, `%${query}%`),
            ilike(users.displayName, `%${query}%`),
            ilike(users.bio, `%${query}%`)
          ),
          columns: userPublicColumns,
          orderBy: [desc(users.createdAt)],
          limit: Math.min(limit, 10),
        })
      : [];

    const followingIdSet =
      currentUser && (usersResult.length > 0 || postsResult.length > 0)
        ? await getFollowingIdSet(currentUser.id, [
            ...usersResult.map((user) => user.id),
            ...postsResult.map((post) => post.authorId),
          ])
        : new Set<string>();

    const trimmedPosts = postsResult.map((post) => {
      const base = serializePostPreview(post, { followingIdSet });

      return {
        id: base.id,
        authorId: base.authorId,
        type: base.type,
        title: base.title,
        excerpt: base.excerpt,
        category: base.category,
        subcategory: base.subcategory,
        tags: base.tags,
        createdAt: base.createdAt,
        thumbnail: base.thumbnail,
        thumbnails: base.thumbnails,
        imageCount: base.imageCount,
        author: base.author,
      };
    });

    const decoratedUsers = usersResult.map((user) => ({
      ...user,
      isFollowing: currentUser ? followingIdSet.has(user.id) : false,
    }));

    const response = successResponse({
      posts: trimmedPosts,
      users: decoratedUsers,
      total: {
        posts: trimmedPosts.length,
        users: decoratedUsers.length,
      },
    });

    response.headers.set(
      'Cache-Control',
      currentUser ? 'private, no-store' : 'public, s-maxage=120, stale-while-revalidate=600'
    );
    return response;
  } catch (error) {
    console.error('GET /api/search error:', error);
    return serverErrorResponse();
  }
}
