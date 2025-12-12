import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { users, posts, answers, follows, comments, bookmarks } from '@/lib/db/schema';
import { successResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/api/response';
import { getSession } from '@/lib/api/auth';
import { eq, sql, and } from 'drizzle-orm';
import { generateDisplayNameFromEmail, sanitizeDisplayName } from '@/lib/utils/profile';

export async function GET(request: NextRequest) {
  try {
    const user = await getSession(request);
    if (!user) {
      return unauthorizedResponse();
    }

    const currentUser = await db.query.users.findFirst({
      where: eq(users.id, user.id),
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

    return successResponse(userWithStats);
  } catch (error) {
    console.error('GET /api/users/me error:', error);
    return serverErrorResponse();
  }
}

export async function PUT(request: NextRequest) {
  try {
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
      status,
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
    if (status !== undefined) updateData.status = status;
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
      const normalized = sanitizeDisplayName(displayName, generateDisplayNameFromEmail(user.email));
      updateData.displayName = normalized;
      updateData.name = normalized;
    }

    const hasProfileData = name || displayName || bio || phone || gender || ageGroup;
    if (hasProfileData) {
      updateData.isProfileComplete = true;
    }

    const [updatedUser] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, user.id))
      .returning();

    return successResponse(updatedUser, '프로필이 업데이트되었습니다.');
  } catch (error) {
    console.error('PUT /api/users/me error:', error);
    return serverErrorResponse();
  }
}
