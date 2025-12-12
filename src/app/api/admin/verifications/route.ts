import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verificationRequests, users } from '@/lib/db/schema';
import { getAdminSession } from '@/lib/admin/auth';
import { desc, eq, count } from 'drizzle-orm';
import { createSignedUrl } from '@/lib/supabase/storage';

export async function GET(request: NextRequest) {
  try {
    const session = await getAdminSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status') || '';

    const offset = (page - 1) * limit;

    const whereCondition = status && status !== 'all' 
      ? eq(verificationRequests.status, status as 'pending' | 'approved' | 'rejected') 
      : undefined;

    const [countResult, verificationsList] = await Promise.all([
      db.select({ count: count() }).from(verificationRequests).where(whereCondition),
      db
        .select({
          id: verificationRequests.id,
          type: verificationRequests.type,
          status: verificationRequests.status,
          documentUrls: verificationRequests.documentUrls,
          reason: verificationRequests.reason,
          visaType: verificationRequests.visaType,
          universityName: verificationRequests.universityName,
          universityEmail: verificationRequests.universityEmail,
          industry: verificationRequests.industry,
          companyName: verificationRequests.companyName,
          jobTitle: verificationRequests.jobTitle,
          extraInfo: verificationRequests.extraInfo,
          submittedAt: verificationRequests.submittedAt,
          reviewedAt: verificationRequests.reviewedAt,
          user: {
            id: users.id,
            name: users.name,
            displayName: users.displayName,
            email: users.email,
            image: users.image,
          },
        })
        .from(verificationRequests)
        .leftJoin(users, eq(verificationRequests.userId, users.id))
        .where(whereCondition)
        .orderBy(desc(verificationRequests.submittedAt))
        .limit(limit)
        .offset(offset),
    ]);

    const total = countResult[0]?.count || 0;

    const verifications = await Promise.all(
      verificationsList.map(async (verification) => {
        const documentPaths = Array.isArray(verification.documentUrls) ? verification.documentUrls : [];
        if (verification.status !== 'pending' || documentPaths.length === 0) {
          return { ...verification, documentUrls: [] };
        }

        const signedUrls = await Promise.all(
          documentPaths.map(async (path) => {
            if (!path) return '';
            if (path.startsWith('http://') || path.startsWith('https://')) return path;
            const signed = await createSignedUrl('documents', path, 600);
            return signed.success && signed.url ? signed.url : '';
          })
        );

        return { ...verification, documentUrls: signedUrls.filter(Boolean) };
      })
    );

    return NextResponse.json({
      verifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Admin verifications list error:', error);
    return NextResponse.json({ error: 'Failed to fetch verifications' }, { status: 500 });
  }
}
