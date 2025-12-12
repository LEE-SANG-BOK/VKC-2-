import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { getAdminSession } from '@/lib/admin/auth';
import { desc, ilike, or, eq, count, and, SQL, isNull } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const session = await getAdminSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status');

    const offset = (page - 1) * limit;

    const conditions: SQL[] = [];

    if (search) {
      const searchCondition = or(
        ilike(users.name, `%${search}%`),
        ilike(users.email, `%${search}%`),
        ilike(users.displayName, `%${search}%`)
      );
      if (searchCondition) conditions.push(searchCondition);
    }

    if (status === 'suspended') {
      conditions.push(eq(users.status, 'suspended'));
    } else if (status === 'banned') {
      conditions.push(eq(users.status, 'banned'));
    } else if (status === 'active') {
      const activeCondition = or(
        eq(users.status, 'active'),
        isNull(users.status)
      );
      if (activeCondition) conditions.push(activeCondition);
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [countResult, usersList] = await Promise.all([
      db.select({ count: count() }).from(users).where(whereClause),
      db.select({
        id: users.id,
        name: users.name,
        displayName: users.displayName,
        email: users.email,
        image: users.image,
        bio: users.bio,
        phone: users.phone,
        isVerified: users.isVerified,
        isProfileComplete: users.isProfileComplete,
        status: users.status,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
        .from(users)
        .where(whereClause)
        .orderBy(desc(users.createdAt))
        .limit(limit)
        .offset(offset),
    ]);

    const total = countResult[0]?.count || 0;

    return NextResponse.json({
      users: usersList,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Admin users list error:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}
