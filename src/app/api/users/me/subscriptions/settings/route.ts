import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { topicSubscriptions } from '@/lib/db/schema';
import { successResponse, errorResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/api/response';
import { getSession } from '@/lib/api/auth';
import { and, eq, inArray } from 'drizzle-orm';

type NotificationChannel = 'in_app' | 'email' | 'push';
type NotificationFrequency = 'instant' | 'daily' | 'weekly' | 'off';

const channelOptions = new Set<NotificationChannel>(['in_app', 'email', 'push']);
const frequencyOptions = new Set<NotificationFrequency>(['instant', 'daily', 'weekly', 'off']);
const isNotificationChannel = (value: string): value is NotificationChannel =>
  channelOptions.has(value as NotificationChannel);
const isNotificationFrequency = (value: string): value is NotificationFrequency =>
  frequencyOptions.has(value as NotificationFrequency);

type SubscriptionUpdate = {
  categoryId: string;
  notificationChannel?: NotificationChannel;
  notificationFrequency?: NotificationFrequency;
};

type SubscriptionRow = typeof topicSubscriptions.$inferSelect & {
  category?: {
    id: string;
    name: string;
    slug: string;
    parentId: string | null;
    order: number;
  } | null;
};

const normalizeUpdate = (input: unknown): SubscriptionUpdate | null => {
  if (!input || typeof input !== 'object') return null;
  const rawCategoryId = (input as { categoryId?: unknown }).categoryId;
  const categoryId = typeof rawCategoryId === 'string' ? rawCategoryId.trim() : '';
  if (!categoryId) return null;

  const rawChannel = (input as { notificationChannel?: unknown }).notificationChannel;
  const rawFrequency = (input as { notificationFrequency?: unknown }).notificationFrequency;
  const notificationChannel =
    typeof rawChannel === 'string' && isNotificationChannel(rawChannel) ? rawChannel : undefined;
  const notificationFrequency =
    typeof rawFrequency === 'string' && isNotificationFrequency(rawFrequency) ? rawFrequency : undefined;

  if (!notificationChannel && !notificationFrequency) return null;

  return {
    categoryId,
    notificationChannel,
    notificationFrequency,
  };
};

const mapSettings = (rows: SubscriptionRow[]) =>
  rows.map((row) => ({
    id: row.id,
    categoryId: row.categoryId,
    notificationChannel: row.notificationChannel,
    notificationFrequency: row.notificationFrequency,
    category: row.category
      ? {
          id: row.category.id,
          name: row.category.name,
          slug: row.category.slug,
          parentId: row.category.parentId,
          order: row.category.order,
        }
      : null,
  }));

export async function GET(request: NextRequest) {
  try {
    const user = await getSession(request);

    if (!user) {
      return unauthorizedResponse();
    }

    const subscriptions = await db.query.topicSubscriptions.findMany({
      where: eq(topicSubscriptions.userId, user.id),
      with: {
        category: {
          columns: {
            id: true,
            name: true,
            slug: true,
            parentId: true,
            order: true,
          },
        },
      },
    });

    return successResponse(mapSettings(subscriptions));
  } catch (error) {
    console.error('GET /api/users/me/subscriptions/settings error:', error);
    return serverErrorResponse();
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getSession(request);

    if (!user) {
      return unauthorizedResponse();
    }

    const body = await request.json().catch(() => null);
    if (!body) {
      return errorResponse('요청을 확인할 수 없습니다.', 'SUBSCRIPTION_SETTINGS_INVALID_BODY');
    }

    const rawUpdates = Array.isArray((body as { updates?: unknown }).updates)
      ? (body as { updates: unknown[] }).updates
      : [body];
    if (rawUpdates.length === 0) {
      return errorResponse('요청을 확인할 수 없습니다.', 'SUBSCRIPTION_SETTINGS_INVALID_BODY');
    }

    const parsedUpdates = rawUpdates.map(normalizeUpdate);
    if (parsedUpdates.some((update) => !update)) {
      return errorResponse('올바른 설정 값이 아닙니다.', 'SUBSCRIPTION_SETTINGS_INVALID_INPUT');
    }

    const updates = parsedUpdates as SubscriptionUpdate[];
    const categoryIds = updates.map((update) => update.categoryId);

    const existing = await db.query.topicSubscriptions.findMany({
      where: and(eq(topicSubscriptions.userId, user.id), inArray(topicSubscriptions.categoryId, categoryIds)),
      columns: {
        categoryId: true,
      },
    });
    const existingSet = new Set(existing.map((row) => row.categoryId));
    if (existingSet.size !== categoryIds.length) {
      return errorResponse('구독 정보를 찾을 수 없습니다.', 'SUBSCRIPTION_SETTINGS_NOT_FOUND', 404);
    }

    await Promise.all(
      updates.map((update) => {
        const updateData: Partial<typeof topicSubscriptions.$inferInsert> = {};
        if (update.notificationChannel) updateData.notificationChannel = update.notificationChannel;
        if (update.notificationFrequency) updateData.notificationFrequency = update.notificationFrequency;

        return db
          .update(topicSubscriptions)
          .set(updateData)
          .where(and(eq(topicSubscriptions.userId, user.id), eq(topicSubscriptions.categoryId, update.categoryId)));
      })
    );

    const subscriptions = await db.query.topicSubscriptions.findMany({
      where: eq(topicSubscriptions.userId, user.id),
      with: {
        category: {
          columns: {
            id: true,
            name: true,
            slug: true,
            parentId: true,
            order: true,
          },
        },
      },
    });

    return successResponse(mapSettings(subscriptions));
  } catch (error) {
    console.error('PUT /api/users/me/subscriptions/settings error:', error);
    return serverErrorResponse();
  }
}
