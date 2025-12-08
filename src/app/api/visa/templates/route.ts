import { db } from '@/lib/db';
import { visaJobs, visaRequirements } from '@/lib/db/schema';
import { successResponse, serverErrorResponse } from '@/lib/api/response';
import { eq, and } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const visaType = searchParams.get('visaType') || undefined;
    const locale = searchParams.get('locale') || 'vi';

    const jobConditions = [];
    const reqConditions = [];

    jobConditions.push(eq(visaJobs.locale, locale));
    reqConditions.push(eq(visaRequirements.locale, locale));

    if (visaType) {
      jobConditions.push(eq(visaJobs.visaType, visaType));
      reqConditions.push(eq(visaRequirements.visaType, visaType));
    }

    const jobs = await db.query.visaJobs.findMany({
      where: jobConditions.length > 0 ? and(...jobConditions) : undefined,
      orderBy: (job, { asc }) => asc(job.code),
    });

    const requirements = await db.query.visaRequirements.findMany({
      where: reqConditions.length > 0 ? and(...reqConditions) : undefined,
      orderBy: (req, { desc }) => desc(req.weight),
    });

    return successResponse({ jobs, requirements });
  } catch (error) {
    console.error('GET /api/visa/templates error:', error);
    return serverErrorResponse();
  }
}
