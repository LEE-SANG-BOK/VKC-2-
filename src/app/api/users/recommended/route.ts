import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { users, follows, posts, categories } from '@/lib/db/schema';
import { eq, ne, notInArray, sql, desc, and, inArray } from 'drizzle-orm';
import { setPrivateNoStore, errorResponse } from '@/lib/api/response';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return errorResponse('인증이 필요합니다.', 'UNAUTHORIZED', 401);
    }

    const { searchParams } = new URL(req.url);
    const pageCandidate = Number.parseInt(searchParams.get('page') || '1', 10);
    const page = Math.min(100, Math.max(1, Number.isNaN(pageCandidate) ? 1 : pageCandidate));
    const limitCandidate = Number.parseInt(searchParams.get('limit') || '8', 10) || 8;
    const limit = Math.min(12, Math.max(1, limitCandidate));
    const offset = (page - 1) * limit;

    const viewer = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
      columns: {
        userType: true,
        visaType: true,
        koreanLevel: true,
        interests: true,
      },
    });

    const viewerUserType = viewer?.userType || null;
    const viewerVisaType = viewer?.visaType || null;
    const viewerKoreanLevel = viewer?.koreanLevel || null;
    const viewerInterests = (viewer?.interests || []).filter((value) => typeof value === 'string' && value.trim().length > 0);
    const viewerUserTypeSql = viewerUserType ? sql`${viewerUserType}::text` : null;
    const viewerVisaTypeSql = viewerVisaType ? sql`${viewerVisaType}::text` : null;
    const viewerKoreanLevelSql = viewerKoreanLevel ? sql`${viewerKoreanLevel}::text` : null;
    const viewerInterestsArray = viewerInterests.length > 0
      ? sql`ARRAY[${sql.join(viewerInterests.map((value) => sql`${value}::text`), sql`, `)}]::text[]`
      : sql`ARRAY[]::text[]`;

    const followingUsers = await db
      .select({ followingId: follows.followingId })
      .from(follows)
      .where(eq(follows.followerId, session.user.id));

    const followingIds = followingUsers.map((row) => row.followingId).filter(Boolean) as string[];
    const followingIdSet = new Set(followingIds);

    const whereConditions = [
      ne(users.id, session.user.id),
    ];

    if (followingIds.length > 0) {
      whereConditions.push(notInArray(users.id, followingIds));
    }

    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(and(...whereConditions));

    const total = Number(totalResult[0]?.count || 0);

    const matchScoreParts = [
      viewerUserTypeSql ? sql`(CASE WHEN ${users.userType} = ${viewerUserTypeSql} THEN 4 ELSE 0 END)` : sql`0`,
      viewerVisaTypeSql ? sql`(CASE WHEN ${users.visaType} = ${viewerVisaTypeSql} THEN 3 ELSE 0 END)` : sql`0`,
      viewerKoreanLevelSql ? sql`(CASE WHEN ${users.koreanLevel} = ${viewerKoreanLevelSql} THEN 1 ELSE 0 END)` : sql`0`,
      viewerInterests.length > 0
        ? sql`(CASE WHEN COALESCE(${users.interests} && ${viewerInterestsArray}, false) THEN 3 ELSE 0 END)`
        : sql`0`,
      sql`(CASE WHEN ${users.isVerified} THEN 1 ELSE 0 END)`,
      sql`(CASE WHEN ${users.isExpert} THEN 1 ELSE 0 END)`,
      sql`(CASE WHEN ${users.badgeType} IS NOT NULL THEN 1 ELSE 0 END)`,
    ];
    const matchScore = sql<number>`${sql.join(matchScoreParts, sql` + `)}`;

    const recommendedUsers = await db
      .select({
        id: users.id,
        name: users.name,
        displayName: users.displayName,
        image: users.image,
        bio: users.bio,
        isVerified: users.isVerified,
        isExpert: users.isExpert,
        badgeType: users.badgeType,
        badgeExpiresAt: users.badgeExpiresAt,
        status: users.status,
        nationality: users.nationality,
        userType: users.userType,
        interests: users.interests,
        visaType: users.visaType,
        koreanLevel: users.koreanLevel,
        followersCount: sql<number>`(
          SELECT COUNT(*)::int
          FROM ${follows}
          WHERE ${follows.followingId} = ${users.id}
        )`,
        followingCount: sql<number>`(
          SELECT COUNT(*)::int 
          FROM ${follows} 
          WHERE ${follows.followerId} = ${users.id}
        )`,
        postsCount: sql<number>`(
          SELECT COUNT(*)::int
          FROM ${posts}
          WHERE ${posts.authorId} = ${users.id}
        )`,
      })
      .from(users)
      .where(and(...whereConditions))
      .orderBy(
        desc(matchScore),
        desc(sql`COALESCE(${users.lastLoginAt}, ${users.createdAt})`),
        desc(users.isVerified),
        desc(sql`(SELECT COUNT(*) FROM ${follows} WHERE ${follows.followingId} = ${users.id})`)
      )
      .limit(limit)
      .offset(offset);

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const interestIds = Array.from(
      new Set(
        recommendedUsers
          .flatMap((user) => user.interests || [])
          .filter((value): value is string => typeof value === 'string' && uuidRegex.test(value))
      )
    );

    const categoryRows = interestIds.length
      ? await db
          .select({ id: categories.id, slug: categories.slug })
          .from(categories)
          .where(inArray(categories.id, interestIds))
      : [];
    const categorySlugById = new Map(categoryRows.map((row) => [row.id, row.slug] as const));

    const resolveInterest = (value: string) => {
      const trimmed = value.trim();
      if (!trimmed) return '';
      if (uuidRegex.test(trimmed)) return categorySlugById.get(trimmed) || '';
      return trimmed;
    };

    const pickInterest = (interestList: string[]) => {
      if (interestList.length === 0) return '';
      return interestList[0] || '';
    };

      const formattedUsers = recommendedUsers.map((user) => {
      const resolvedInterests = (user.interests || [])
        .map((value) => (typeof value === 'string' ? resolveInterest(value) : ''))
        .filter((value) => value.length > 0);

      const recommendationMeta = [
        { key: 'userType', value: user.userType || '' },
        { key: 'visaType', value: user.visaType || '' },
        { key: 'interest', value: pickInterest(resolvedInterests) },
        { key: 'nationality', value: user.nationality || '' },
        { key: 'koreanLevel', value: user.koreanLevel || '' },
      ]
        .filter((item) => typeof item.value === 'string' && item.value.trim().length > 0)
        .slice(0, 3);

      return {
        id: user.id,
        name: user.name,
        displayName: user.displayName,
        avatar: user.image,
        image: user.image,
        bio: user.bio,
        isVerified: user.isVerified,
        isExpert: user.isExpert,
        badgeType: user.badgeType,
        badgeExpiresAt: user.badgeExpiresAt,
        status: user.status,
        userType: user.userType,
        visaType: user.visaType,
        koreanLevel: user.koreanLevel,
        interests: resolvedInterests,
        isFollowing: followingIdSet.has(user.id),
        recommendationMeta,
        stats: {
          followers: user.followersCount,
          following: user.followingCount,
          posts: user.postsCount,
        },
      };
    });

    const response = NextResponse.json({
      success: true,
      data: formattedUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
    setPrivateNoStore(response);
    return response;
  } catch (error) {
    console.error('Get recommended users error:', error);
    return errorResponse('추천 유저 조회 실패', 'INTERNAL_SERVER_ERROR', 500);
  }
}
