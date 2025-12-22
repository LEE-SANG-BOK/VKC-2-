import { NextRequest, NextResponse } from 'next/server';
import { getQueryClient } from '@/lib/db';
import { getAdminSession } from '@/lib/admin/auth';
import { setNoStore, setPrivateNoStore } from '@/lib/api/response';

export async function POST(request: NextRequest) {
  try {
    const session = await getAdminSession(request);
    if (!session) {
      const response = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      setNoStore(response);
      return response;
    }

    const client = getQueryClient();
    const result = await client`
      WITH inserted AS (
        INSERT INTO reports (
          id,
          reporter_id,
          type,
          status,
          reason,
          post_id,
          answer_id,
          comment_id,
          reviewed_by,
          review_note,
          created_at,
          updated_at
        )
        SELECT
          cr.id,
          cr.reporter_id,
          cr.type,
          cr.status,
          cr.reason,
          CASE WHEN cr.target_type = 'post' THEN cr.target_id ELSE NULL END,
          CASE WHEN cr.target_type = 'answer' THEN cr.target_id ELSE NULL END,
          CASE WHEN cr.target_type = 'comment' THEN cr.target_id ELSE NULL END,
          cr.handled_by,
          cr.review_note,
          cr.created_at,
          cr.updated_at
        FROM content_reports cr
        WHERE NOT EXISTS (
          SELECT 1
          FROM reports r
          WHERE r.reporter_id = cr.reporter_id
            AND (
              (cr.target_type = 'post' AND r.post_id = cr.target_id)
              OR (cr.target_type = 'answer' AND r.answer_id = cr.target_id)
              OR (cr.target_type = 'comment' AND r.comment_id = cr.target_id)
            )
        )
        RETURNING 1
      )
      SELECT
        (SELECT COUNT(*)::int FROM inserted) AS inserted_count,
        (SELECT COUNT(*)::int FROM content_reports) AS legacy_total
    `;

    const summaryRow = Array.from(result as Array<{ inserted_count?: unknown; legacy_total?: unknown }>)[0];
    const summary = {
      inserted_count: Number(summaryRow?.inserted_count || 0),
      legacy_total: Number(summaryRow?.legacy_total || 0),
    };

    const response = NextResponse.json({
      success: true,
      data: summary,
    });
    setPrivateNoStore(response);
    return response;
  } catch (error) {
    console.error('POST /api/admin/reports/backfill-content-reports error:', error);
    const response = NextResponse.json({ error: 'Failed to backfill reports' }, { status: 500 });
    setNoStore(response);
    return response;
  }
}
