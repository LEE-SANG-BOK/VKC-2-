import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { news } from '@/lib/db/schema';
import { getAdminSession } from '@/lib/admin/auth';
import { desc, ilike, or, SQL, and, count, eq } from 'drizzle-orm';

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
    const { title, category, imageUrl, linkUrl, isActive, order, language, content } = body;

    if (!title || !category) {
      return NextResponse.json({ error: 'Title and category are required' }, { status: 400 });
    }

    const [newNews] = await db.insert(news).values({
      title,
      category,
      language: language || 'vi',
      content: content || '',
      imageUrl: imageUrl || null,
      linkUrl: linkUrl || null,
      isActive: isActive ?? true,
      order: order ?? 0,
    }).returning();

    return NextResponse.json({ news: newNews }, { status: 201 });
  } catch (error) {
    console.error('Failed to create news:', error);
    return NextResponse.json({ error: 'Failed to create news' }, { status: 500 });
  }
}
