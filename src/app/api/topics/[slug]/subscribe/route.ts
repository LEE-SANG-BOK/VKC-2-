import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { categories, topicSubscriptions } from '@/lib/db/schema';
import { successResponse, notFoundResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/api/response';
import { getSession } from '@/lib/api/auth';
import { eq, and } from 'drizzle-orm';

interface RouteContext {
  params: Promise<{ slug: string }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const user = await getSession(request);
    if (!user) {
      return unauthorizedResponse();
    }

    const { slug } = await context.params;

    const topic = await db.query.categories.findFirst({
      where: eq(categories.slug, slug),
    });

    if (!topic) {
      return notFoundResponse('토픽을 찾을 수 없습니다.');
    }

    const existing = await db.query.topicSubscriptions.findFirst({
      where: and(eq(topicSubscriptions.userId, user.id), eq(topicSubscriptions.categoryId, topic.id)),
    });

    if (existing) {
      await db.delete(topicSubscriptions).where(eq(topicSubscriptions.id, existing.id));
      return successResponse({ isSubscribed: false }, '구독을 취소했습니다.');
    }

    await db.insert(topicSubscriptions).values({
      userId: user.id,
      categoryId: topic.id,
    });

    return successResponse({ isSubscribed: true }, '구독했습니다.');
  } catch (error) {
    console.error('POST /api/topics/[slug]/subscribe error:', error);
    return serverErrorResponse();
  }
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const user = await getSession(request);
    if (!user) {
      return successResponse({ isSubscribed: false });
    }

    const { slug } = await context.params;

    const topic = await db.query.categories.findFirst({
      where: eq(categories.slug, slug),
    });

    if (!topic) {
      return notFoundResponse('토픽을 찾을 수 없습니다.');
    }

    const existing = await db.query.topicSubscriptions.findFirst({
      where: and(eq(topicSubscriptions.userId, user.id), eq(topicSubscriptions.categoryId, topic.id)),
    });

    return successResponse({ isSubscribed: !!existing });
  } catch (error) {
    console.error('GET /api/topics/[slug]/subscribe error:', error);
    return serverErrorResponse();
  }
}
