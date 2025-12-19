import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { userPublicColumns } from '@/lib/db/columns';
import { posts, users } from '@/lib/db/schema';
import { successResponse, errorResponse, serverErrorResponse } from '@/lib/api/response';
import { getSession } from '@/lib/api/auth';
import { getFollowingIdSet } from '@/lib/api/follow';
import { and, or, ilike, desc, eq, sql, inArray } from 'drizzle-orm';
import { ACTIVE_GROUP_PARENT_SLUGS } from '@/lib/constants/category-groups';

const stripHtmlToText = (html: string) =>
  html
    .replace(/<img[^>]*>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const buildExcerpt = (html: string, maxLength = 200) => stripHtmlToText(html).slice(0, maxLength);

const extractImages = (html: string, maxThumbs = 4) => {
  if (!html) return { thumbnails: [] as string[], thumbnail: null as string | null, imageCount: 0 };
  const regex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  const thumbnails: string[] = [];
  let match: RegExpExecArray | null;
  let imageCount = 0;
  let selected: string | null = null;
  while ((match = regex.exec(html))) {
    imageCount += 1;
    const src = match[1];
    if (!selected && /data-thumbnail\s*=\s*['"]?true['"]?/i.test(match[0])) {
      selected = src;
    }
    if (thumbnails.length < maxThumbs) thumbnails.push(src);
  }
  if (selected) {
    const ordered = [selected, ...thumbnails.filter((src) => src !== selected)];
    return { thumbnails: ordered.slice(0, maxThumbs), thumbnail: selected, imageCount };
  }
  return { thumbnails, thumbnail: thumbnails[0] ?? null, imageCount };
};

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
    const contentPreviewLimit = 4000;
    const postsLimit = Math.min(limit, 10);

    const postsResult = shouldSearchPosts
      ? await db
          .select({
            id: posts.id,
            authorId: posts.authorId,
            type: posts.type,
            title: posts.title,
            content: sql<string>`left(${posts.content}, ${contentPreviewLimit})`.as('content'),
            category: posts.category,
            subcategory: posts.subcategory,
            tags: posts.tags,
            createdAt: posts.createdAt,
            author: {
              id: users.id,
              name: users.name,
              displayName: users.displayName,
              image: users.image,
              isVerified: users.isVerified,
              isExpert: users.isExpert,
              badgeType: users.badgeType,
            },
          })
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
      const preview = typeof post.content === 'string' ? post.content : '';
      const excerpt = buildExcerpt(preview);
      const { thumbnail, thumbnails, imageCount } = extractImages(preview, 4);

      return {
        id: post.id,
        authorId: post.authorId,
        type: post.type,
        title: post.title,
        excerpt,
        category: post.category,
        subcategory: post.subcategory,
        tags: Array.isArray(post.tags) ? post.tags : [],
        createdAt: post.createdAt,
        thumbnail,
        thumbnails,
        imageCount,
        author: post.author
          ? {
              ...post.author,
              isExpert: post.author.isExpert || false,
              isFollowing: currentUser ? followingIdSet.has(post.authorId) : false,
            }
          : post.author,
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

    response.headers.set('Cache-Control', 'private, no-store');
    return response;
  } catch (error) {
    console.error('GET /api/search error:', error);
    return serverErrorResponse();
  }
}
