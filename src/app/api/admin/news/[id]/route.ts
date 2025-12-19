import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { news } from '@/lib/db/schema';
import { getAdminSession } from '@/lib/admin/auth';
import { eq } from 'drizzle-orm';

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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminSession(request);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const [newsItem] = await db
      .select()
      .from(news)
      .where(eq(news.id, id))
      .limit(1);

    if (!newsItem) {
      return NextResponse.json({ error: 'News not found' }, { status: 404 });
    }

    return NextResponse.json({ news: newsItem });
  } catch (error) {
    console.error('Failed to fetch news:', error);
    return NextResponse.json({ error: 'Failed to fetch news' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminSession(request);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { title, category, imageUrl, linkUrl, isActive, order, language, content, type, startAt, endAt } = body;

    if (type !== undefined && !['post', 'cardnews', 'shorts'].includes(type)) {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    const [existing] = await db
      .select()
      .from(news)
      .where(eq(news.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: 'News not found' }, { status: 404 });
    }

    const startAtResult = parseDateValue(startAt);
    if (!startAtResult.ok) {
      return NextResponse.json({ error: 'Invalid startAt' }, { status: 400 });
    }

    const endAtResult = parseDateValue(endAt);
    if (!endAtResult.ok) {
      return NextResponse.json({ error: 'Invalid endAt' }, { status: 400 });
    }

    const nextStartAt = startAtResult.value !== undefined ? startAtResult.value : existing.startAt;
    const nextEndAt = endAtResult.value !== undefined ? endAtResult.value : existing.endAt;
    if (nextStartAt && nextEndAt && nextStartAt > nextEndAt) {
      return NextResponse.json({ error: 'startAt must be before endAt' }, { status: 400 });
    }

    const updateData: Partial<typeof news.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (title !== undefined) updateData.title = title;
    if (category !== undefined) updateData.category = category;
    if (language !== undefined) updateData.language = language;
    if (type !== undefined) updateData.type = type;
    if (content !== undefined) updateData.content = content;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (linkUrl !== undefined) updateData.linkUrl = linkUrl;
    if (startAtResult.value !== undefined) updateData.startAt = startAtResult.value;
    if (endAtResult.value !== undefined) updateData.endAt = endAtResult.value;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (order !== undefined) updateData.order = order;

    const [updated] = await db
      .update(news)
      .set(updateData)
      .where(eq(news.id, id))
      .returning();

    return NextResponse.json({ news: updated });
  } catch (error) {
    console.error('Failed to update news:', error);
    return NextResponse.json({ error: 'Failed to update news' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminSession(request);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const [existing] = await db
      .select()
      .from(news)
      .where(eq(news.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: 'News not found' }, { status: 404 });
    }

    await db.delete(news).where(eq(news.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete news:', error);
    return NextResponse.json({ error: 'Failed to delete news' }, { status: 500 });
  }
}
