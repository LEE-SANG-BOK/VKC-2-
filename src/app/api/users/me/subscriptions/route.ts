import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { categorySubscriptions, categories, topicSubscriptions } from '@/lib/db/schema';
import { successResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/api/response';
import { getSession } from '@/lib/api/auth';
import { eq, inArray } from 'drizzle-orm';

const MAIN_GROUP_SLUGS = new Set(['visa', 'students', 'career', 'living']);

export async function GET(request: NextRequest) {
  try {
    const user = await getSession(request);

    if (!user) {
      return unauthorizedResponse();
    }

    const [subscriptions, topicSubs] = await Promise.all([
      db.query.categorySubscriptions.findMany({
        where: eq(categorySubscriptions.userId, user.id),
        with: {
          category: true,
        },
      }),
      db.query.topicSubscriptions.findMany({
        where: eq(topicSubscriptions.userId, user.id),
        with: {
          category: true,
        },
      }),
    ]);

    const groupParentSubs = subscriptions.filter((sub) => {
      const slug = sub.category?.slug;
      if (!slug) return false;
      return MAIN_GROUP_SLUGS.has(slug);
    });

    const remainingCategorySubs = subscriptions.filter((sub) => !groupParentSubs.includes(sub));

    const mergedCategories = [
      ...remainingCategorySubs.map((sub) => sub.category).filter(Boolean),
      ...topicSubs.map((sub) => sub.category).filter(Boolean),
    ];

    if (groupParentSubs.length > 0) {
      const parentIds = groupParentSubs.map((sub) => sub.category?.id).filter(Boolean) as string[];
      if (parentIds.length > 0) {
        const childCategories = await db.query.categories.findMany({
          where: inArray(categories.parentId, parentIds),
        });

        if (childCategories.length > 0) {
          await db
            .insert(topicSubscriptions)
            .values(
              childCategories.map((child) => ({
                userId: user.id,
                categoryId: child.id,
              }))
            )
            .onConflictDoNothing({
              target: [topicSubscriptions.userId, topicSubscriptions.categoryId],
            });

          mergedCategories.push(...childCategories);
        }
      }

      const subIds = groupParentSubs.map((sub) => sub.id);
      if (subIds.length > 0) {
        await db.delete(categorySubscriptions).where(inArray(categorySubscriptions.id, subIds));
      }
    }

    const unique = new Map<string, typeof mergedCategories[number]>();
    mergedCategories.forEach((cat) => {
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
