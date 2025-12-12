import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { userMeColumns } from '@/lib/db/columns';
import { users } from '@/lib/db/schema';
import { getAdminSession } from '@/lib/admin/auth';
import { eq } from 'drizzle-orm';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const session = await getAdminSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;

    const user = await db.query.users.findFirst({
      where: eq(users.id, id),
      columns: userMeColumns,
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Failed to fetch user:', error);
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const session = await getAdminSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();
    const { status, suspendDays } = body;

    const user = await db.query.users.findFirst({
      where: eq(users.id, id),
      columns: {
        id: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let suspendedUntil: Date | null = null;
    if (status === 'suspended' && suspendDays) {
      suspendedUntil = new Date();
      suspendedUntil.setDate(suspendedUntil.getDate() + suspendDays);
    }

    await db.update(users).set({
      status,
      suspendedUntil,
      updatedAt: new Date(),
    }).where(eq(users.id, id));

    const updatedUser = await db.query.users.findFirst({
      where: eq(users.id, id),
      columns: userMeColumns,
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error('Admin user action error:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const session = await getAdminSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;

    const user = await db.query.users.findFirst({
      where: eq(users.id, id),
      columns: {
        id: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    await db.delete(users).where(eq(users.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin user delete error:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
