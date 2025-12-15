import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { categories, categorySubscriptions, topicSubscriptions } from '@/lib/db/schema';
import { successResponse, notFoundResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/api/response';
import { getSession } from '@/lib/api/auth';
import { eq, and, inArray } from 'drizzle-orm';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/categories/[id]/subscribe
 * 카테고리 구독 토글
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const user = await getSession(request);

    if (!user) {
      return unauthorizedResponse();
    }

    const { id: categoryId } = await context.params;

    const category = await db.query.categories.findFirst({
      where: eq(categories.id, categoryId),
    });

    if (!category) {
      return notFoundResponse('카테고리를 찾을 수 없습니다.');
    }

    if (category.parentId) {
      const existingSubscription = await db.query.topicSubscriptions.findFirst({
        where: and(eq(topicSubscriptions.userId, user.id), eq(topicSubscriptions.categoryId, categoryId)),
      });

      if (existingSubscription) {
        await db.delete(topicSubscriptions).where(eq(topicSubscriptions.id, existingSubscription.id));
        return successResponse({ isSubscribed: false }, '구독을 취소했습니다.');
      }

      await db.insert(topicSubscriptions).values({
        userId: user.id,
        categoryId,
      });
      return successResponse({ isSubscribed: true }, '구독했습니다.');
    }

    const children = await db.query.categories.findMany({
      where: eq(categories.parentId, categoryId),
      columns: {
        id: true,
      },
    });

    if (children.length === 0) {
      const existingSubscription = await db.query.categorySubscriptions.findFirst({
        where: and(eq(categorySubscriptions.userId, user.id), eq(categorySubscriptions.categoryId, categoryId)),
      });

      if (existingSubscription) {
        await db.delete(categorySubscriptions).where(eq(categorySubscriptions.id, existingSubscription.id));
        return successResponse({ isSubscribed: false }, '구독을 취소했습니다.');
      }

      await db.insert(categorySubscriptions).values({
        userId: user.id,
        categoryId,
      });
      return successResponse({ isSubscribed: true }, '구독했습니다.');
    }

    const childIds = children.map((child) => child.id);
    const existingChildSubs = await db.query.topicSubscriptions.findMany({
      where: and(eq(topicSubscriptions.userId, user.id), inArray(topicSubscriptions.categoryId, childIds)),
      columns: {
        id: true,
        categoryId: true,
      },
    });

    const existingIds = new Set(existingChildSubs.map((sub) => sub.categoryId));
    const isAllSubscribed = existingIds.size === childIds.length;

    if (isAllSubscribed) {
      await db
        .delete(topicSubscriptions)
        .where(and(eq(topicSubscriptions.userId, user.id), inArray(topicSubscriptions.categoryId, childIds)));
      await db
        .delete(categorySubscriptions)
        .where(and(eq(categorySubscriptions.userId, user.id), eq(categorySubscriptions.categoryId, categoryId)));
      return successResponse({ isSubscribed: false }, '구독을 취소했습니다.');
    }

    const toInsert = childIds
      .filter((id) => !existingIds.has(id))
      .map((id) => ({
        userId: user.id,
        categoryId: id,
      }));

    if (toInsert.length > 0) {
      await db
        .insert(topicSubscriptions)
        .values(toInsert)
        .onConflictDoNothing({
          target: [topicSubscriptions.userId, topicSubscriptions.categoryId],
        });
    }

    await db
      .delete(categorySubscriptions)
      .where(and(eq(categorySubscriptions.userId, user.id), eq(categorySubscriptions.categoryId, categoryId)));
    return successResponse({ isSubscribed: true }, '구독했습니다.');
  } catch (error) {
    console.error('POST /api/categories/[id]/subscribe error:', error);
    return serverErrorResponse();
  }
}

/**
 * GET /api/categories/[id]/subscribe
 * 구독 상태 확인
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const user = await getSession(request);

    if (!user) {
      return successResponse({ isSubscribed: false });
    }

    const { id: categoryId } = await context.params;

    const category = await db.query.categories.findFirst({
      where: eq(categories.id, categoryId),
    });

    if (!category) {
      return notFoundResponse('카테고리를 찾을 수 없습니다.');
    }

    if (category.parentId) {
      const existingSubscription = await db.query.topicSubscriptions.findFirst({
        where: and(eq(topicSubscriptions.userId, user.id), eq(topicSubscriptions.categoryId, categoryId)),
      });
      return successResponse({ isSubscribed: !!existingSubscription });
    }

    const children = await db.query.categories.findMany({
      where: eq(categories.parentId, categoryId),
      columns: {
        id: true,
      },
    });

    if (children.length === 0) {
      const existingSubscription = await db.query.categorySubscriptions.findFirst({
        where: and(eq(categorySubscriptions.userId, user.id), eq(categorySubscriptions.categoryId, categoryId)),
      });
      return successResponse({ isSubscribed: !!existingSubscription });
    }

    const childIds = children.map((child) => child.id);
    const existingSubs = await db.query.topicSubscriptions.findMany({
      where: and(eq(topicSubscriptions.userId, user.id), inArray(topicSubscriptions.categoryId, childIds)),
      columns: {
        id: true,
      },
    });

    return successResponse({ isSubscribed: existingSubs.length === childIds.length });
  } catch (error) {
    console.error('GET /api/categories/[id]/subscribe error:', error);
    return serverErrorResponse();
  }
}
