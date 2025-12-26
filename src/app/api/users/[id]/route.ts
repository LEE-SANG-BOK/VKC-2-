import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { userMeColumns } from '@/lib/db/columns';
import { users, follows, posts, answers, comments, bookmarks } from '@/lib/db/schema';
import { setNoStore, setPrivateNoStore } from '@/lib/api/response';
import { eq, count, and } from 'drizzle-orm';
import { getSession } from '@/lib/api/auth';
import { DISPLAY_NAME_MIN_LENGTH, generateDisplayNameFromEmail, normalizeDisplayName, sanitizeDisplayName } from '@/lib/utils/profile';
import { isE2ETestMode } from '@/lib/e2e/mode';
import { getE2ERequestState } from '@/lib/e2e/request';
import { countFollowers } from '@/lib/e2e/posts';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (isE2ETestMode()) {
      const { id } = await params;
      const { store, userId } = getE2ERequestState(request);
      const e2eUser = store.users.get(id);

      if (!e2eUser) {
        const response = NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 });
        setNoStore(response);
        return response;
      }

      const isOwnProfile = userId === id;
      const followersCount = countFollowers(store, id);
      const followingCount = store.followsByUserId.get(id)?.size || 0;
      const postsCount = Array.from(store.posts.values()).filter((post) => post.authorId === id).length;
      const bookmarksCount = store.bookmarksByUserId.get(id)?.size || 0;
      const isFollowing = userId ? store.followsByUserId.get(userId)?.has(id) === true : false;

      const username = sanitizeDisplayName(e2eUser.displayName || e2eUser.name, `user-${e2eUser.id.slice(0, 8)}`);
      const displayName = e2eUser.displayName || e2eUser.name || username || 'User';

      const response = NextResponse.json({
        id: e2eUser.id,
        username,
        displayName,
        avatar: e2eUser.image || null,
        email: isOwnProfile ? e2eUser.email : '',
        phone: isOwnProfile ? null : null,
        bio: e2eUser.bio || '',
        joinedAt: e2eUser.createdAt,
        updatedAt: e2eUser.updatedAt,
        isVerified: e2eUser.isVerified,
        isExpert: e2eUser.isExpert,
        badgeType: e2eUser.badgeType,
        verifiedProfileSummary: null,
        verifiedProfileKeywords: null,
        gender: null,
        ageGroup: null,
        nationality: null,
        status: e2eUser.status,
        userType: e2eUser.userType,
        isFollowing,
        ...(isOwnProfile
          ? {
              notifyAnswers: true,
              notifyComments: true,
              notifyReplies: true,
              notifyAdoptions: true,
              notifyFollows: true,
            }
          : {}),
        stats: {
          followers: followersCount,
          following: followingCount,
          posts: postsCount,
          accepted: 0,
          comments: 0,
          bookmarks: bookmarksCount,
        },
      });

      setPrivateNoStore(response);
      return response;
    }

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
      const response = NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 });
      setNoStore(response);
      return response;
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

    const response = NextResponse.json({
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
    setPrivateNoStore(response);
    return response;
  } catch (error) {
    console.error('Error fetching user:', error);
    const response = NextResponse.json({ error: '사용자 정보를 가져오는데 실패했습니다.' }, { status: 500 });
    setNoStore(response);
    return response;
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (isE2ETestMode()) {
      const { id } = await params;
      const { store, userId } = getE2ERequestState(request);
      if (!userId) {
        const response = NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
        setNoStore(response);
        return response;
      }
      if (userId !== id) {
        const response = NextResponse.json({ error: '본인 정보만 수정할 수 있습니다.' }, { status: 403 });
        setNoStore(response);
        return response;
      }

      const body = await request.json().catch(() => ({}));
      const e2eUser = store.users.get(id);
      if (!e2eUser) {
        const response = NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 });
        setNoStore(response);
        return response;
      }

      const displayName = typeof body.displayName === 'string' ? normalizeDisplayName(body.displayName) : undefined;
      const bio = typeof body.bio === 'string' ? body.bio : undefined;
      const image = typeof body.image === 'string' ? body.image : body.image === null ? null : undefined;
      const userType = typeof body.userType === 'string' ? body.userType : undefined;

      const updatedAt = new Date().toISOString();
      store.users.set(id, {
        ...e2eUser,
        ...(displayName ? { displayName, name: displayName } : null),
        ...(bio !== undefined ? { bio } : null),
        ...(image !== undefined ? { image } : null),
        ...(userType !== undefined ? { userType } : null),
        updatedAt,
      });

      const response = NextResponse.json({
        success: true,
        message: '사용자 정보가 업데이트되었습니다.',
      });
      setPrivateNoStore(response);
      return response;
    }

    const { id } = await params;
    const sessionUser = await getSession(request);
    if (!sessionUser) {
      const response = NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
      setNoStore(response);
      return response;
    }
    if (sessionUser.id !== id) {
      const response = NextResponse.json({ error: '본인 정보만 수정할 수 있습니다.' }, { status: 403 });
      setNoStore(response);
      return response;
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
      const response = NextResponse.json({ error: '닉네임은 2자 이상이어야 합니다.' }, { status: 400 });
      setNoStore(response);
      return response;
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

    const response = NextResponse.json({
      success: true,
      message: '사용자 정보가 업데이트되었습니다.',
    });
    setPrivateNoStore(response);
    return response;
  } catch (error) {
    console.error('Error updating user:', error);
    const response = NextResponse.json({ error: '사용자 정보 업데이트에 실패했습니다.' }, { status: 500 });
    setNoStore(response);
    return response;
  }
}
