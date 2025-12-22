import { NextRequest, NextResponse } from 'next/server';
import { getQueryClient } from '@/lib/db';
import { getAdminSession } from '@/lib/admin/auth';

const feedbackColumnsCacheTtlMs = 5 * 60 * 1000;
let cachedFeedbackColumns:
  | {
      fetchedAt: number;
      columns: Set<string>;
    }
  | undefined;

const getFeedbackColumns = async () => {
  if (cachedFeedbackColumns && Date.now() - cachedFeedbackColumns.fetchedAt < feedbackColumnsCacheTtlMs) {
    return cachedFeedbackColumns.columns;
  }

  const client = getQueryClient();
  const result = await client`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'feedbacks'
  `;
  const columns = new Set(
    (result as Array<{ column_name?: unknown }>)
      .map((row) => String(row?.column_name || '').trim())
      .filter(Boolean)
  );

  cachedFeedbackColumns = { fetchedAt: Date.now(), columns };
  return columns;
};

export async function GET(request: NextRequest) {
  try {
    const session = await getAdminSession(request);
    if (!session) {
      return NextResponse.json({ success: false, message: '인증이 필요합니다.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const limitCandidate = parseInt(searchParams.get('limit') || '20', 10) || 20;
    const limit = Math.min(50, Math.max(1, limitCandidate));
    const type = (searchParams.get('type') || '').trim();
    const search = (searchParams.get('search') || '').trim();

    const offset = (page - 1) * limit;
    const columns = await getFeedbackColumns();
    const hasTitle = columns.has('title');
    const hasDescription = columns.has('description');
    const hasContent = columns.has('content');
    const bodyColumn = hasDescription ? 'description' : hasContent ? 'content' : null;

    const conditions: string[] = [];
    const params: unknown[] = [];
    if (type === 'feedback' || type === 'bug') {
      params.push(type);
      conditions.push(`f.type = $${params.length}`);
    }

    if (search && bodyColumn) {
      const like = `%${search}%`;
      if (hasTitle) {
        params.push(like);
        const placeholder = `$${params.length}`;
        conditions.push(`(f.title ILIKE ${placeholder} OR f.${bodyColumn} ILIKE ${placeholder})`);
      } else {
        params.push(like);
        conditions.push(`f.${bodyColumn} ILIKE $${params.length}`);
      }
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const client = getQueryClient();

    const [countRow] = await client.unsafe<Array<{ count?: unknown }>>(
      `
        SELECT COUNT(*)::int AS count
        FROM feedbacks f
        ${whereClause}
      `,
      params as any[]
    );
    const total = Number(countRow?.count || 0);

    const descriptionExpr = bodyColumn ? `f.${bodyColumn}` : `''`;
    const titleExpr = hasTitle ? 'f.title' : `split_part(${descriptionExpr}, E'\\n', 1)`;
    const stepsExpr = columns.has('steps') ? 'f.steps' : 'NULL';

    const listParams = [...params, limit, offset];
    const limitPlaceholder = `$${listParams.length - 1}`;
    const offsetPlaceholder = `$${listParams.length}`;

    const feedbackRows = await client.unsafe<Array<Record<string, unknown>>>(
      `
        SELECT
          f.id AS id,
          f.type AS type,
          ${titleExpr} AS title,
          ${descriptionExpr} AS description,
          ${stepsExpr} AS steps,
          f.page_url AS page_url,
          f.contact_email AS contact_email,
          f.ip_address AS ip_address,
          f.user_agent AS user_agent,
          f.created_at AS created_at,
          u.id AS user_id,
          u.name AS user_name,
          u.display_name AS user_display_name,
          u.email AS user_email,
          u.image AS user_image
        FROM feedbacks f
        LEFT JOIN users u ON f.user_id = u.id
        ${whereClause}
        ORDER BY f.created_at DESC
        LIMIT ${limitPlaceholder}
        OFFSET ${offsetPlaceholder}
      `,
      listParams as any[]
    );
    const formattedFeedbacks = feedbackRows.map((row) => {
      const createdAt = row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at;
      const userId = typeof row.user_id === 'string' ? row.user_id : null;
      const userEmail = typeof row.user_email === 'string' ? row.user_email : null;
      const userDisplayName = typeof row.user_display_name === 'string' ? row.user_display_name : null;
      const userName = typeof row.user_name === 'string' ? row.user_name : null;
      const nameFallback = userEmail ? userEmail.split('@')[0] : null;

      return {
        id: row.id,
        type: row.type,
        title: row.title,
        description: row.description,
        steps: row.steps,
        pageUrl: row.page_url,
        contactEmail: row.contact_email,
        ipAddress: row.ip_address,
        userAgent: row.user_agent,
        createdAt,
        user: userId
          ? {
              id: userId,
              name: userDisplayName || userName || nameFallback,
              email: userEmail,
              image: row.user_image,
            }
          : null,
      };
    });

    return NextResponse.json({
      feedbacks: formattedFeedbacks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Admin feedback list error:', error);
    return NextResponse.json(
      { success: false, message: '피드백 목록을 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
