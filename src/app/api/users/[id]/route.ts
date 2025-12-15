import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { userMeColumns } from '@/lib/db/columns';
import { users, follows, posts, answers, comments, bookmarks } from '@/lib/db/schema';
import { eq, count, and } from 'drizzle-orm';
import { getSession } from '@/lib/api/auth';
import { DISPLAY_NAME_MIN_LENGTH, generateDisplayNameFromEmail, normalizeDisplayName, sanitizeDisplayName } from '@/lib/utils/profile';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const currentUser = await getSession(request);
    const isOwnProfile = currentUser?.id === id;

    const userProfileColumns = {
      ...userMeColumns,
      verifiedProfileSummary: true,
      verifiedProfileKeywords: true,
    } as const;

    let user;

    try {
      user = await db.query.users.findFirst({
        where: eq(users.id, id),
        columns: userProfileColumns,
      });
    } catch (error) {
      const code = (error as { cause?: { code?: string } })?.cause?.code;
      if (code !== '42703') {
        throw error;
      }

      user = await db.query.users.findFirst({
        where: eq(users.id, id),
        columns: userMeColumns,
      });
    }

    if (!user) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const queries: Promise<any>[] = [
      db.select({ count: count() }).from(follows).where(eq(follows.followingId, id)),
      db.select({ count: count() }).from(follows).where(eq(follows.followerId, id)),
      db.select({ count: count() }).from(posts).where(eq(posts.authorId, id)),
      db.select({ count: count() }).from(answers).where(and(eq(answers.authorId, id), eq(answers.isAdopted, true))),
      db.select({ count: count() }).from(comments).where(eq(comments.authorId, id)),
      db.select({ count: count() }).from(bookmarks).where(eq(bookmarks.userId, id)),
    ];

    if (currentUser) {
      queries.push(
        db.query.follows.findFirst({
          where: and(eq(follows.followerId, currentUser.id), eq(follows.followingId, id)),
        })
      );
    }

    const results = await Promise.all(queries);
    const [
      followersResult,
      followingResult,
      postsResult,
      adoptedAnswersResult,
      commentsResult,
      bookmarksResult,
    ] = results;
    
    const isFollowing = currentUser ? !!results[6] : false;

    const username = sanitizeDisplayName(user.displayName || user.name, `user-${user.id.slice(0, 8)}`);
    const displayName = user.displayName || user.name || username || 'User';

    return NextResponse.json({
      id: user.id,
      username,
      displayName,
      avatar: user.image || null,
      email: isOwnProfile ? user.email || '' : '',
      phone: isOwnProfile ? user.phone || null : null,
      bio: user.bio || '',
      joinedAt: user.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: user.updatedAt?.toISOString() || user.createdAt?.toISOString() || new Date().toISOString(),
      isVerified: user.isVerified || false,
      isExpert: user.isExpert || false,
      badgeType: user.badgeType || null,
      verifiedProfileSummary: (user as { verifiedProfileSummary?: string | null }).verifiedProfileSummary ?? null,
      verifiedProfileKeywords: (user as { verifiedProfileKeywords?: string[] | null }).verifiedProfileKeywords ?? null,
      gender: user.gender || null,
      ageGroup: user.ageGroup || null,
      nationality: user.nationality || null,
      status: user.status || null,
      userType: user.userType || null,
      isFollowing,
      ...(isOwnProfile
        ? {
            notifyAnswers: user.notifyAnswers,
            notifyComments: user.notifyComments,
            notifyReplies: user.notifyReplies,
            notifyAdoptions: user.notifyAdoptions,
            notifyFollows: user.notifyFollows,
          }
        : {}),
      stats: {
        followers: followersResult[0]?.count || 0,
        following: followingResult[0]?.count || 0,
        posts: postsResult[0]?.count || 0,
        accepted: adoptedAnswersResult[0]?.count || 0,
        comments: commentsResult[0]?.count || 0,
        bookmarks: bookmarksResult[0]?.count || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: '사용자 정보를 가져오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sessionUser = await getSession(request);
    if (!sessionUser) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }
    if (sessionUser.id !== id) {
      return NextResponse.json({ error: '본인 정보만 수정할 수 있습니다.' }, { status: 403 });
    }

    const body = await request.json();

    const {
      gender,
      ageGroup,
      nationality,
      phone,
      bio,
      displayName,
      image,
      name,
      isProfileComplete,
      userType,
    } = body;

    const normalizedDisplayName = displayName ? normalizeDisplayName(displayName) : undefined;
    if (displayName !== undefined && (normalizedDisplayName || '').length < DISPLAY_NAME_MIN_LENGTH) {
      return NextResponse.json({ error: '닉네임은 2자 이상이어야 합니다.' }, { status: 400 });
    }

    const updatePayload: Record<string, unknown> = {
      gender,
      ageGroup,
      nationality,
      phone,
      bio,
      userType,
      updatedAt: new Date(),
    };

    if (normalizedDisplayName) {
      updatePayload.displayName = normalizedDisplayName;
      updatePayload.name = normalizedDisplayName;
    } else if (name) {
      const safeName = sanitizeDisplayName(name, generateDisplayNameFromEmail(sessionUser.email));
      updatePayload.displayName = safeName;
      updatePayload.name = safeName;
    }

    if (image !== undefined) {
      updatePayload.image = image || null;
    }

    if (isProfileComplete !== undefined) {
      updatePayload.isProfileComplete = Boolean(isProfileComplete);
    } else {
      updatePayload.isProfileComplete = true;
    }

    await db.update(users).set(updatePayload).where(eq(users.id, id));

    return NextResponse.json({
      success: true,
      message: '사용자 정보가 업데이트되었습니다.',
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: '사용자 정보 업데이트에 실패했습니다.' },
      { status: 500 }
    );
  }
}
