import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { users, follows, posts } from '@/lib/db/schema';
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
        status: users.status,
        userType: users.userType,
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

    const formattedUsers = recommendedUsers.map(user => ({
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
      stats: {
        followers: user.followersCount,
        following: user.followingCount,
        posts: user.postsCount,
      },
    }));

    return NextResponse.json({
      success: true,
      data: formattedUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get recommended users error:', error);
    return errorResponse('추천 유저 조회 실패', 'INTERNAL_SERVER_ERROR', 500);
  }
}
