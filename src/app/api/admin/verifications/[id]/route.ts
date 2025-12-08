import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verificationRequests, users } from '@/lib/db/schema';
import { getAdminSession } from '@/lib/admin/auth';
import { eq } from 'drizzle-orm';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const session = await getAdminSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;

    const [verification] = await db
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
      .where(eq(verificationRequests.id, id))
      .limit(1);

    if (!verification) {
      return NextResponse.json({ error: 'Verification not found' }, { status: 404 });
    }

    return NextResponse.json({ verification });
  } catch (error) {
    console.error('Failed to fetch verification:', error);
    return NextResponse.json({ error: 'Failed to fetch verification' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const session = await getAdminSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();
    const { status, reason } = body;

    const [verification] = await db
      .select()
      .from(verificationRequests)
      .where(eq(verificationRequests.id, id))
      .limit(1);

    if (!verification) {
      return NextResponse.json({ error: 'Verification not found' }, { status: 404 });
    }

    if (status === 'approved') {
      const badgeType = (() => {
        if (verification.type === 'student') return 'verified_student';
        if (verification.type === 'worker' || verification.type === 'business') return 'verified_worker';
        if (verification.type === 'expert') return 'expert';
        return null;
      })();

      const [updatedVerification] = await db
        .update(verificationRequests)
        .set({
          status: 'approved',
          reason: reason || null,
          reviewedAt: new Date(),
        })
        .where(eq(verificationRequests.id, id))
        .returning();

      const userUpdate: Partial<typeof users.$inferInsert> = {
        isVerified: true,
        verifiedAt: new Date(),
        verifiedRequestId: id,
        updatedAt: new Date(),
      };
      if (badgeType) {
        userUpdate.badgeType = badgeType;
      }
      if (verification.type === 'expert') {
        userUpdate.isExpert = true;
      }

      await db.update(users).set(userUpdate).where(eq(users.id, verification.userId));

      return NextResponse.json({ verification: updatedVerification });
    } else if (status === 'rejected') {
      const [updatedVerification] = await db
        .update(verificationRequests)
        .set({
          status: 'rejected',
          reason: reason || null,
          reviewedAt: new Date(),
        })
        .where(eq(verificationRequests.id, id))
        .returning();

      return NextResponse.json({ verification: updatedVerification });
    } else {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }
  } catch (error) {
    console.error('Admin verification action error:', error);
    return NextResponse.json({ error: 'Failed to update verification' }, { status: 500 });
  }
}
