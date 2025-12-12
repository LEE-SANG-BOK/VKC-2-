import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { notifications, users } from '@/lib/db/schema';
import { getAdminSession } from '@/lib/admin/auth';
import { eq, desc, ilike, count, and, SQL } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const admin = await getAdminSession(request);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const search = searchParams.get('search') || '';
  const type = searchParams.get('type') || '';
  const isRead = searchParams.get('isRead');

  const offset = (page - 1) * limit;

  try {
    const conditions: SQL[] = [];

    if (search) {
      conditions.push(ilike(notifications.content, `%${search}%`));
    }

    if (type) {
      conditions.push(eq(notifications.type, type as 'answer' | 'comment' | 'reply' | 'adoption' | 'like' | 'follow'));
    }

    if (isRead === 'true') {
      conditions.push(eq(notifications.isRead, true));
    } else if (isRead === 'false') {
      conditions.push(eq(notifications.isRead, false));
    }

    const whereClause = conditions.length > 0 
      ? and(...conditions)
      : undefined;

    const [notificationsList, totalResult] = await Promise.all([
      db
        .select({
          id: notifications.id,
          userId: notifications.userId,
          type: notifications.type,
          postId: notifications.postId,
          answerId: notifications.answerId,
          commentId: notifications.commentId,
          senderId: notifications.senderId,
          content: notifications.content,
          isRead: notifications.isRead,
          readAt: notifications.readAt,
          createdAt: notifications.createdAt,
          user: {
            id: users.id,
            name: users.name,
            displayName: users.displayName,
            email: users.email,
            image: users.image,
          },
        })
        .from(notifications)
        .leftJoin(users, eq(notifications.userId, users.id))
        .where(whereClause)
        .orderBy(desc(notifications.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: count() })
        .from(notifications)
        .where(whereClause),
    ]);

    const total = totalResult[0]?.count || 0;

    return NextResponse.json({
      notifications: notificationsList,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Failed to fetch notifications:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const admin = await getAdminSession(request);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { userId, userIds, type, content, postId } = body;

    if (!content || !type) {
      return NextResponse.json({ error: 'Content and type are required' }, { status: 400 });
    }

    if (userIds && userIds.length > 0) {
      const notificationsData = userIds.map((uid: string) => ({
        userId: uid,
        type,
        content,
        postId: postId || null,
      }));

      await db.insert(notifications).values(notificationsData);

      return NextResponse.json({ 
        success: true, 
        message: `Notifications sent to ${userIds.length} users` 
      }, { status: 201 });
    } else if (userId) {
      const [newNotification] = await db.insert(notifications).values({
        userId,
        type,
        content,
        postId: postId || null,
      }).returning();

      return NextResponse.json({ notification: newNotification }, { status: 201 });
    } else {
      const allUsers = await db.select({ id: users.id }).from(users);
      const notificationsData = allUsers.map((u) => ({
        userId: u.id,
        type,
        content,
        postId: postId || null,
      }));

      await db.insert(notifications).values(notificationsData);

      return NextResponse.json({ 
        success: true, 
        message: `Notifications sent to all ${allUsers.length} users` 
      }, { status: 201 });
    }
  } catch (error) {
    console.error('Failed to create notification:', error);
    return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 });
  }
}
