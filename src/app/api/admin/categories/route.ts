import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { categories } from '@/lib/db/schema';
import { getAdminSession } from '@/lib/admin/auth';
import { eq, asc, isNull, ilike, or, and, SQL } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const admin = await getAdminSession(request);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const search = searchParams.get('search') || '';
  const parentId = searchParams.get('parentId');

  try {
    const conditions: SQL[] = [];

    if (search) {
      const searchCondition = or(
        ilike(categories.name, `%${search}%`),
        ilike(categories.slug, `%${search}%`)
      );
      if (searchCondition) conditions.push(searchCondition);
    }

    if (parentId === 'null') {
      conditions.push(isNull(categories.parentId));
    } else if (parentId) {
      conditions.push(eq(categories.parentId, parentId));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const result = await db
      .select()
      .from(categories)
      .where(whereClause)
      .orderBy(asc(categories.order), asc(categories.name));

    const categoriesWithChildren = await Promise.all(
      result.map(async (cat) => {
        const children = await db
          .select()
          .from(categories)
          .where(eq(categories.parentId, cat.id))
          .orderBy(asc(categories.order), asc(categories.name));
        return { ...cat, children };
      })
    );

    return NextResponse.json({ categories: categoriesWithChildren });
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const admin = await getAdminSession(request);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, slug, parentId, order, isActive } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 });
    }

    const existing = await db
      .select()
      .from(categories)
      .where(eq(categories.slug, slug))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json({ error: 'Category with this slug already exists' }, { status: 400 });
    }

    const [newCategory] = await db.insert(categories).values({
      name,
      slug,
      parentId: parentId || null,
      order: order ?? 0,
      isActive: isActive ?? true,
    }).returning();

    return NextResponse.json({ category: newCategory }, { status: 201 });
  } catch (error) {
    console.error('Failed to create category:', error);
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}
