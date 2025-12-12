import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { categories, categorySubscriptions } from '@/lib/db/schema';
import { successResponse, notFoundResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/api/response';
import { getSession } from '@/lib/api/auth';
import { eq, and } from 'drizzle-orm';

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
      return serverErrorResponse('1차 카테고리만 구독할 수 있습니다.');
    }

    const existingSubscription = await db.query.categorySubscriptions.findFirst({
      where: and(
        eq(categorySubscriptions.userId, user.id),
        eq(categorySubscriptions.categoryId, categoryId)
      ),
    });

    if (existingSubscription) {
      await db.delete(categorySubscriptions).where(eq(categorySubscriptions.id, existingSubscription.id));
      return successResponse({ isSubscribed: false }, '구독을 취소했습니다.');
    } else {
      await db.insert(categorySubscriptions).values({
        userId: user.id,
        categoryId,
      });
      return successResponse({ isSubscribed: true }, '구독했습니다.');
    }
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

    const existingSubscription = await db.query.categorySubscriptions.findFirst({
      where: and(
        eq(categorySubscriptions.userId, user.id),
        eq(categorySubscriptions.categoryId, categoryId)
      ),
    });

    return successResponse({ isSubscribed: !!existingSubscription });
  } catch (error) {
    console.error('GET /api/categories/[id]/subscribe error:', error);
    return serverErrorResponse();
  }
}
