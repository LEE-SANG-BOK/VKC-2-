import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAdminSession } from '@/lib/admin/auth';
import { sql, SQL } from 'drizzle-orm';

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

  const result = await db.execute(sql`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'feedbacks'
  `);

  const columns = new Set(
    Array.from(result)
      .map((row) => String((row as { column_name?: unknown }).column_name || '').trim())
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

    const conditions: SQL[] = [];
    if (type === 'feedback' || type === 'bug') {
      conditions.push(sql`${sql.identifier('f')}.${sql.identifier('type')} = ${type}`);
    }

    if (search && bodyColumn) {
      const like = `%${search}%`;
      const bodyExpr = sql`${sql.identifier('f')}.${sql.identifier(bodyColumn)}`;
      if (hasTitle) {
        conditions.push(
          sql`(${sql.identifier('f')}.${sql.identifier('title')} ILIKE ${like} OR ${bodyExpr} ILIKE ${like})`
        );
      } else {
        conditions.push(sql`${bodyExpr} ILIKE ${like}`);
      }
    }

    const whereClause = conditions.length > 0 ? sql`WHERE ${sql.join(conditions, sql` AND `)}` : sql``;

    const countResult = await db.execute(sql`
      SELECT COUNT(*)::int AS count
      FROM feedbacks ${sql.identifier('f')}
      ${whereClause}
    `);
    const total = Number((Array.from(countResult)[0] as { count?: unknown })?.count || 0);

    const descriptionExpr = bodyColumn
      ? sql`${sql.identifier('f')}.${sql.identifier(bodyColumn)}`
      : sql`''`;
    const titleExpr = hasTitle
      ? sql`${sql.identifier('f')}.${sql.identifier('title')}`
      : sql<string>`split_part(${descriptionExpr}, E'\n', 1)`;
    const stepsExpr = columns.has('steps')
      ? sql`${sql.identifier('f')}.${sql.identifier('steps')}`
      : sql`NULL`;

    const feedbackListResult = await db.execute(sql`
      SELECT
        ${sql.identifier('f')}.id AS id,
        ${sql.identifier('f')}.type AS type,
        ${titleExpr} AS title,
        ${descriptionExpr} AS description,
        ${stepsExpr} AS steps,
        ${sql.identifier('f')}.page_url AS page_url,
        ${sql.identifier('f')}.contact_email AS contact_email,
        ${sql.identifier('f')}.ip_address AS ip_address,
        ${sql.identifier('f')}.user_agent AS user_agent,
        ${sql.identifier('f')}.created_at AS created_at,
        ${sql.identifier('u')}.id AS user_id,
        ${sql.identifier('u')}.name AS user_name,
        ${sql.identifier('u')}.display_name AS user_display_name,
        ${sql.identifier('u')}.email AS user_email,
        ${sql.identifier('u')}.image AS user_image
      FROM feedbacks ${sql.identifier('f')}
      LEFT JOIN users ${sql.identifier('u')} ON ${sql.identifier('f')}.user_id = ${sql.identifier('u')}.id
      ${whereClause}
      ORDER BY ${sql.identifier('f')}.created_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `);

    const feedbackRows = Array.from(feedbackListResult) as Array<Record<string, unknown>>;
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
