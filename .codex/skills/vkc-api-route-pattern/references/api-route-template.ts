import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { serverErrorResponse, unauthorizedResponse, errorResponse, successResponse, rateLimitResponse } from '@/lib/api/response';
import { getSession } from '@/lib/api/auth';
import { checkRateLimit } from '@/lib/api/rateLimit';
// import { someTable } from '@/lib/db/schema';
// import { and, eq } from 'drizzle-orm';

// NOTE:
// - This is a reference template. Copy into src/app/api/**/route.ts and adapt.
// - Keep runtime validation explicit (repo doesn't ship Zod by default).

export async function POST(request: NextRequest) {
  try {
    const user = await getSession(request);
    if (!user) return unauthorizedResponse();

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return errorResponse('요청을 확인할 수 없습니다.', 'INVALID_BODY');
    }

    // TODO: extract + validate fields
    // const { ... } = body as { ... }
    // if (!field) return errorResponse('필수 필드가 누락되었습니다.', 'REQUIRED');

    // Optional rate limit
    // const limit = await checkRateLimit({ table: someTable, userColumn: someTable.userId, createdAtColumn: someTable.createdAt, userId: user.id, windowMs: 24*60*60*1000, max: 1 });
    // if (!limit.allowed) return rateLimitResponse('요청이 너무 많습니다.', 'RATE_LIMITED', limit.retryAfterSeconds);

    // TODO: DB writes/reads
    // const [row] = await db.insert(someTable).values({ ... }).returning();

    return successResponse({ ok: true });
  } catch (error) {
    console.error('POST /api/... error:', error);
    return serverErrorResponse();
  }
}

export async function GET(request: NextRequest) {
  try {
    // optional auth
    // const user = await getSession(request);

    // const searchParams = request.nextUrl.searchParams;
    // const page = ...
    // const limit = ...

    return successResponse({ ok: true });
  } catch (error) {
    console.error('GET /api/... error:', error);
    return serverErrorResponse();
  }
}

// Admin variant (use when path is /api/admin/**)
export async function adminGET(request: NextRequest) {
  // Example only; do not export this name in a real route.
  const admin = await getSession(request); // replace with getAdminSession(request)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json({ ok: true });
}

