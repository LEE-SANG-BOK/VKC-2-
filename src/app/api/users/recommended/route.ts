import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { users, follows, posts } from '@/lib/db/schema';
import { isExpertBadgeType } from '@/lib/constants/badges';
import { eq, ne, notInArray, sql, desc, and } from 'drizzle-orm';
import { successResponse, errorResponse } from '@/lib/api/response';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return errorResponse('인증이 필요합니다.', 'UNAUTHORIZED', 401);
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number.parseInt(searchParams.get('page') || '1', 10) || 1);
    const limitCandidate = Number.parseInt(searchParams.get('limit') || '8', 10) || 8;
    const limit = Math.min(12, Math.max(1, limitCandidate));
    const offset = (page - 1) * limit;

    const currentUser = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
      columns: {
        interests: true,
      },
    });

    const normalizeInterest = (value: string | null | undefined) =>
      typeof value === 'string' ? value.trim().toLowerCase() : '';

    const currentInterestSet = new Set(
      (currentUser?.interests || [])
        .map((interest) => normalizeInterest(interest))
        .filter(Boolean)
    );

    // Get users that current user is already following
    const followingUsers = await db
      .select({ followingId: follows.followingId })
      .from(follows)
      .where(eq(follows.followerId, session.user.id));

    const followingIds = followingUsers.map(f => f.followingId);

    // Get recommended users (exclude self and already following)
    const whereConditions = [
      ne(users.id, session.user.id),
    ];

    if (followingIds.length > 0) {
      whereConditions.push(notInArray(users.id, followingIds));
    }

    // Get total count
    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(and(...whereConditions));

    const total = Number(totalResult[0]?.count || 0);

    // Get recommended users with stats
    const recommendedUsers = await db
      .select({
        id: users.id,
        name: users.name,
        displayName: users.displayName,
        image: users.image,
        avatar: users.image,
        bio: users.bio,
        isVerified: users.isVerified,
        isExpert: users.isExpert,
        badgeType: users.badgeType,
        status: users.status,
        userType: users.userType,
        interests: users.interests,
        adoptionRate: users.adoptionRate,
        trustScore: users.trustScore,
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
      .orderBy(desc(users.isVerified), desc(sql`
        (SELECT COUNT(*) FROM ${follows} WHERE ${follows.followingId} = ${users.id})
      `))
      .limit(limit)
      .offset(offset);

    const resolveBadgeLevel = (user: { isExpert: boolean; isVerified: boolean; badgeType?: string | null }) => {
      if (user.isExpert || isExpertBadgeType(user.badgeType)) return 'expert';
      if (user.isVerified || user.badgeType) return 'verified';
      return 'community';
    };

    const resolveInterestMatchRate = (interestList?: string[] | null) => {
      if (!interestList || interestList.length === 0 || currentInterestSet.size === 0) return 0;
      const matchCount = interestList.reduce((count, interest) => {
        const normalized = normalizeInterest(interest);
        return normalized && currentInterestSet.has(normalized) ? count + 1 : count;
      }, 0);
      return Math.round((matchCount / currentInterestSet.size) * 100);
    };

    const formattedUsers = recommendedUsers.map(user => {
      const adoptionRateValue = Number(user.adoptionRate ?? 0);
      const adoptionRate = Number.isFinite(adoptionRateValue) ? adoptionRateValue : 0;

      return {
      id: user.id,
      name: user.name,
      displayName: user.displayName,
      avatar: user.avatar,
      image: user.image,
      bio: user.bio,
      isVerified: user.isVerified,
      status: user.status,
      userType: user.userType,
      isFollowing: false,
      recommendationMeta: [
        {
          key: 'badge',
          value: resolveBadgeLevel(user),
        },
        {
          key: 'adoptionRate',
          value: adoptionRate,
        },
        {
          key: 'interestMatchRate',
          value: resolveInterestMatchRate(user.interests),
        },
      ],
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
    response.headers.set('Cache-Control', 'private, no-store');
    return response;
  } catch (error) {
    console.error('Get recommended users error:', error);
    return errorResponse('추천 유저 조회 실패', 'INTERNAL_SERVER_ERROR', 500);
  }
}
