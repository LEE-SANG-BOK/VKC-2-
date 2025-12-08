import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { contentReports } from '@/lib/db/schema';
import { getAdminSession } from '@/lib/admin/auth';
import { eq } from 'drizzle-orm';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const session = await getAdminSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();
    const { status, reviewNote } = body as {
      status?: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
      reviewNote?: string;
    };

    if (!status) {
      return NextResponse.json({ error: 'status is required' }, { status: 400 });
    }

    const [report] = await db
      .update(contentReports)
      .set({
        status,
        reviewNote: reviewNote ?? null,
        handledBy: session.user.id,
        handledAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(contentReports.id, id))
      .returning();

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    return NextResponse.json({ report });
  } catch (error) {
    console.error('PATCH /api/admin/content-reports/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update report' }, { status: 500 });
  }
}
