import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { userMeColumns } from '@/lib/db/columns';
import { users, posts, answers, follows, comments, bookmarks, likes } from '@/lib/db/schema';
import { setPrivateNoStore, successResponse, unauthorizedResponse, serverErrorResponse, errorResponse } from '@/lib/api/response';
import { getSession } from '@/lib/api/auth';
import { eq, sql, and, inArray } from 'drizzle-orm';
import { DISPLAY_NAME_MIN_LENGTH, normalizeDisplayName } from '@/lib/utils/profile';
import { isE2ETestMode } from '@/lib/e2e/mode';
import { getE2ERequestState } from '@/lib/e2e/request';
import { countFollowers } from '@/lib/e2e/posts';

const MAX_POST_IDS = 100;

export async function GET(request: NextRequest) {
  try {
    if (isE2ETestMode()) {
      const { store, userId } = getE2ERequestState(request);
      if (!userId) {
        return unauthorizedResponse();
      }
      const currentUser = store.users.get(userId);
      if (!currentUser) {
        return unauthorizedResponse('사용자 정보를 찾을 수 없습니다.');
      }

      const postsCount = Array.from(store.posts.values()).filter((post) => post.authorId === userId).length;
      const bookmarksCount = store.bookmarksByUserId.get(userId)?.size || 0;
      const followingCount = store.followsByUserId.get(userId)?.size || 0;
      const followersCount = countFollowers(store, userId);

      const response = successResponse({
        ...currentUser,
        _count: {
          posts: postsCount,
          accepted: 0,
          followers: followersCount,
          following: followingCount,
          comments: 0,
          bookmarks: bookmarksCount,
        },
      });
      setPrivateNoStore(response);
      return response;
    }

    const user = await getSession(request);
    if (!user) {
      return unauthorizedResponse();
    }

    const currentUser = await db.query.users.findFirst({
      where: eq(users.id, user.id),
      columns: userMeColumns,
    });

    if (!currentUser) {
      return unauthorizedResponse('사용자 정보를 찾을 수 없습니다.');
    }

    const [
      postsCount,
      adoptedAnswersCount,
      followersCount,
      followingCount,
      commentsCount,
      bookmarksCount,
    ] = await Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(posts).where(eq(posts.authorId, user.id)),
      db.select({ count: sql<number>`count(*)::int` }).from(answers).where(and(eq(answers.authorId, user.id), eq(answers.isAdopted, true))),
      db.select({ count: sql<number>`count(*)::int` }).from(follows).where(eq(follows.followingId, user.id)),
      db.select({ count: sql<number>`count(*)::int` }).from(follows).where(eq(follows.followerId, user.id)),
      db.select({ count: sql<number>`count(*)::int` }).from(comments).where(eq(comments.authorId, user.id)),
      db.select({ count: sql<number>`count(*)::int` }).from(bookmarks).where(eq(bookmarks.userId, user.id)),
    ]);

    const userWithStats = {
      ...currentUser,
      _count: {
        posts: postsCount[0]?.count || 0,
        accepted: adoptedAnswersCount[0]?.count || 0,
        followers: followersCount[0]?.count || 0,
        following: followingCount[0]?.count || 0,
        comments: commentsCount[0]?.count || 0,
        bookmarks: bookmarksCount[0]?.count || 0,
      },
    };

    const response = successResponse(userWithStats);
    setPrivateNoStore(response);
    return response;
  } catch (error) {
    console.error('GET /api/users/me error:', error);
    return serverErrorResponse();
  }
}

export async function POST(request: NextRequest) {
  try {
    if (isE2ETestMode()) {
      const { store, userId } = getE2ERequestState(request);
      if (!userId) {
        return unauthorizedResponse();
      }

      const body = (await request.json().catch(() => null)) as { action?: unknown; postIds?: unknown } | null;
      if (!body || body.action !== 'post_interactions' || !Array.isArray(body.postIds)) {
        return errorResponse('요청 데이터가 올바르지 않습니다.', 'INVALID_BODY');
      }

      const postIds = Array.from(
        new Set(
          body.postIds
            .filter((value): value is string => typeof value === 'string')
            .map((value) => value.trim())
            .filter(Boolean)
        )
      ).slice(0, MAX_POST_IDS);

      const likesSet = store.likesByUserId.get(userId) || new Set<string>();
      const bookmarksSet = store.bookmarksByUserId.get(userId) || new Set<string>();

      const likedPostIds = postIds.filter((postId) => likesSet.has(postId));
      const bookmarkedPostIds = postIds.filter((postId) => bookmarksSet.has(postId));

      const response = successResponse({ likedPostIds, bookmarkedPostIds });
      setPrivateNoStore(response);
      return response;
    }

    const user = await getSession(request);
    if (!user) {
      return unauthorizedResponse();
    }

    const body = (await request.json().catch(() => null)) as { action?: unknown; postIds?: unknown } | null;
    if (!body || body.action !== 'post_interactions' || !Array.isArray(body.postIds)) {
      return errorResponse('요청 데이터가 올바르지 않습니다.', 'INVALID_BODY');
    }

    const postIds = Array.from(
      new Set(
        body.postIds
          .filter((value): value is string => typeof value === 'string')
          .map((value) => value.trim())
          .filter(Boolean)
      )
    ).slice(0, MAX_POST_IDS);

    if (postIds.length === 0) {
      const response = successResponse({ likedPostIds: [], bookmarkedPostIds: [] });
      setPrivateNoStore(response);
      return response;
    }

    const [likedRows, bookmarkedRows] = await Promise.all([
      db
        .select({ postId: likes.postId })
        .from(likes)
        .where(and(eq(likes.userId, user.id), inArray(likes.postId, postIds))),
      db
        .select({ postId: bookmarks.postId })
        .from(bookmarks)
        .where(and(eq(bookmarks.userId, user.id), inArray(bookmarks.postId, postIds))),
    ]);

    const likedPostIds = likedRows.map((row) => row.postId).filter(Boolean) as string[];
    const bookmarkedPostIds = bookmarkedRows.map((row) => row.postId).filter(Boolean) as string[];

    const response = successResponse({ likedPostIds, bookmarkedPostIds });
    setPrivateNoStore(response);
    return response;
  } catch (error) {
    console.error('POST /api/users/me error:', error);
    return serverErrorResponse();
  }
}

export async function PUT(request: NextRequest) {
  try {
    if (isE2ETestMode()) {
      const { store, userId } = getE2ERequestState(request);
      if (!userId) {
        return unauthorizedResponse();
      }
      const currentUser = store.users.get(userId);
      if (!currentUser) {
        return unauthorizedResponse('사용자 정보를 찾을 수 없습니다.');
      }

      const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
      if (!body || typeof body !== 'object') {
        return errorResponse('요청 데이터가 올바르지 않습니다.', 'INVALID_BODY');
      }

      const next = { ...currentUser };
      if (typeof body.displayName === 'string') {
        const normalized = normalizeDisplayName(body.displayName);
        if (normalized.length < DISPLAY_NAME_MIN_LENGTH) {
          return errorResponse('닉네임은 2자 이상이어야 합니다.', 'PROFILE_DISPLAY_NAME_TOO_SHORT');
        }
        next.displayName = normalized;
        next.name = normalized;
      }
      if (typeof body.bio === 'string') next.bio = body.bio;
      if (typeof body.image === 'string') next.image = body.image;
      if (typeof body.status === 'string') next.status = body.status;
      if (typeof body.userType === 'string') next.userType = body.userType;
      if (typeof body.visaType === 'string') next.visaType = body.visaType;
      if (Array.isArray(body.interests)) {
        next.interests = body.interests.filter((value): value is string => typeof value === 'string');
      }
      if (typeof body.koreanLevel === 'string') next.koreanLevel = body.koreanLevel;
      if (typeof body.onboardingCompleted === 'boolean') next.onboardingCompleted = body.onboardingCompleted;

      next.updatedAt = new Date().toISOString();
      next.isProfileComplete = true;
      store.users.set(userId, next);

      const response = successResponse(next, '프로필이 업데이트되었습니다.');
      setPrivateNoStore(response);
      return response;
    }

    const user = await getSession(request);
    if (!user) {
      return unauthorizedResponse();
    }

    const body = await request.json();
    const {
      name,
      displayName,
      bio,
      phone,
      gender,
      ageGroup,
      nationality,
      image,
      notifyAnswers,
      notifyComments,
      notifyReplies,
      notifyAdoptions,
      notifyFollows,
      userType,
      visaType,
      interests,
      preferredLanguage,
      onboardingCompleted,
      koreanLevel,
    } = body;

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (name !== undefined) updateData.name = name;
    if (displayName !== undefined) updateData.displayName = displayName;
    if (bio !== undefined) updateData.bio = bio;
    if (phone !== undefined) updateData.phone = phone;
    if (gender !== undefined) updateData.gender = gender;
    if (ageGroup !== undefined) updateData.ageGroup = ageGroup;
    if (nationality !== undefined) updateData.nationality = nationality;
    if (image !== undefined) updateData.image = image;
    if (notifyAnswers !== undefined) updateData.notifyAnswers = notifyAnswers;
    if (notifyComments !== undefined) updateData.notifyComments = notifyComments;
    if (notifyReplies !== undefined) updateData.notifyReplies = notifyReplies;
    if (notifyAdoptions !== undefined) updateData.notifyAdoptions = notifyAdoptions;
    if (notifyFollows !== undefined) updateData.notifyFollows = notifyFollows;
    if (userType !== undefined) updateData.userType = userType;
    if (visaType !== undefined) updateData.visaType = visaType;
    if (interests !== undefined) updateData.interests = interests;
    if (preferredLanguage !== undefined) updateData.preferredLanguage = preferredLanguage;
    if (onboardingCompleted !== undefined) updateData.onboardingCompleted = onboardingCompleted;
    if (koreanLevel !== undefined) updateData.koreanLevel = koreanLevel;
    if (displayName !== undefined) {
      const normalized = normalizeDisplayName(displayName);
      if (normalized.length < DISPLAY_NAME_MIN_LENGTH) {
        return errorResponse('닉네임은 2자 이상이어야 합니다.', 'PROFILE_DISPLAY_NAME_TOO_SHORT');
      }
      updateData.displayName = normalized;
      updateData.name = normalized;
    }

    const hasProfileData = name || displayName || bio || phone || gender || ageGroup;
    if (hasProfileData) {
      updateData.isProfileComplete = true;
    }

    await db.update(users).set(updateData).where(eq(users.id, user.id));

    const updatedUser = await db.query.users.findFirst({
      where: eq(users.id, user.id),
      columns: userMeColumns,
    });

    if (!updatedUser) {
      return unauthorizedResponse('사용자 정보를 찾을 수 없습니다.');
    }

    const response = successResponse(updatedUser, '프로필이 업데이트되었습니다.');
    setPrivateNoStore(response);
    return response;
  } catch (error) {
    console.error('PUT /api/users/me error:', error);
    return serverErrorResponse();
  }
}
