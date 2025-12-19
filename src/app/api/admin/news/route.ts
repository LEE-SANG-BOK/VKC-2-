import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { news } from '@/lib/db/schema';
import { getAdminSession } from '@/lib/admin/auth';
import { desc, ilike, or, SQL, and, count, eq } from 'drizzle-orm';

const parseDateValue = (value: unknown) => {
  if (value === undefined) {
    return { ok: true, value: undefined as Date | null | undefined };
  }
  if (value === null || value === '') {
    return { ok: true, value: null };
  }
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) {
    return { ok: false, value: undefined };
  }
  return { ok: true, value: date };
};

export async function GET(request: NextRequest) {
  const admin = await getAdminSession(request);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const search = searchParams.get('search') || '';
  const language = searchParams.get('language') || '';

  try {
    const conditions: SQL[] = [];

    if (search) {
      const searchCondition = or(
        ilike(news.title, `%${search}%`),
        ilike(news.category, `%${search}%`)
      );
      if (searchCondition) conditions.push(searchCondition);
    }

    if (language) {
      conditions.push(eq(news.language, language));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [totalResult] = await db
      .select({ count: count() })
      .from(news)
      .where(whereClause);

    const total = totalResult.count;

    const result = await db
      .select()
      .from(news)
      .where(whereClause)
      .orderBy(desc(news.order), desc(news.createdAt))
      .limit(limit)
      .offset((page - 1) * limit);

    return NextResponse.json({
      news: result,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Failed to fetch news:', error);
    return NextResponse.json({ error: 'Failed to fetch news' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const admin = await getAdminSession(request);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, category, imageUrl, linkUrl, isActive, order, language, content, type, startAt, endAt } = body;

    const startAtResult = parseDateValue(startAt);
    if (!startAtResult.ok) {
      return NextResponse.json({ error: 'Invalid startAt' }, { status: 400 });
    }

    const endAtResult = parseDateValue(endAt);
    if (!endAtResult.ok) {
      return NextResponse.json({ error: 'Invalid endAt' }, { status: 400 });
    }

    const resolvedStartAt = startAtResult.value ?? null;
    const resolvedEndAt = endAtResult.value ?? null;
    if (resolvedStartAt && resolvedEndAt && resolvedStartAt > resolvedEndAt) {
      return NextResponse.json({ error: 'startAt must be before endAt' }, { status: 400 });
    }

    const normalizedType = type || 'post';
    if (!['post', 'cardnews', 'shorts'].includes(normalizedType)) {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    if (!title || !category) {
      return NextResponse.json({ error: 'Title and category are required' }, { status: 400 });
    }

    const [newNews] = await db.insert(news).values({
      title,
      category,
      language: language || 'vi',
      type: normalizedType,
      content: content || '',
      imageUrl: imageUrl || null,
      linkUrl: linkUrl || null,
      startAt: resolvedStartAt,
      endAt: resolvedEndAt,
      isActive: isActive ?? true,
      order: order ?? 0,
    }).returning();

    return NextResponse.json({ news: newNews }, { status: 201 });
  } catch (error) {
    console.error('Failed to create news:', error);
    return NextResponse.json({ error: 'Failed to create news' }, { status: 500 });
  }
}
