import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { categorySubscriptions, categories, topicSubscriptions } from '@/lib/db/schema';
import { successResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/api/response';
import { getSession } from '@/lib/api/auth';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const user = await getSession(request);

    if (!user) {
      return unauthorizedResponse();
    }

    const subscriptions = await db.query.categorySubscriptions.findMany({
      where: eq(categorySubscriptions.userId, user.id),
      with: {
        category: true,
      },
    });

    const topicSubs = await db.query.topicSubscriptions.findMany({
      where: eq(topicSubscriptions.userId, user.id),
      with: {
        category: true,
      },
    });

    const mergedCategories = [...subscriptions, ...topicSubs]
      .map(sub => sub.category)
      .filter(cat => cat && !cat.parentId);

    const unique = new Map<string, typeof mergedCategories[number]>();
    mergedCategories.forEach(cat => {
      if (cat && !unique.has(cat.id)) {
        unique.set(cat.id, cat);
      }
    });

    return successResponse(Array.from(unique.values()));
  } catch (error) {
    console.error('GET /api/users/me/subscriptions error:', error);
    return serverErrorResponse();
  }
}
