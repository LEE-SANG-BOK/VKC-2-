import { db } from '@/lib/db';
import { visaRequirements } from '@/lib/db/schema';
import { successResponse, serverErrorResponse } from '@/lib/api/response';
import { and, eq } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const visaType = searchParams.get('visaType') || '';
    const locale = searchParams.get('locale') || 'vi';

    const conditions = [eq(visaRequirements.locale, locale)];
    if (visaType) {
      conditions.push(eq(visaRequirements.visaType, visaType));
    }

    const items = await db.query.visaRequirements.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      orderBy: (req, { desc }) => desc(req.weight),
    });

    return successResponse({ items });
  } catch (error) {
    console.error('GET /api/visa/checklist error:', error);
    return serverErrorResponse();
  }
}
