import { db } from './db';
import { users } from './db/schema';
import { eq } from 'drizzle-orm';

export type UserStatusResult = {
  isActive: boolean;
  status: 'active' | 'suspended' | 'banned';
  suspendedUntil?: Date | null;
  message?: string;
};

export async function checkUserStatus(userId: string): Promise<UserStatusResult> {
  const [user] = await db
    .select({
      status: users.status,
      suspendedUntil: users.suspendedUntil,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    return { isActive: false, status: 'banned', message: 'User not found' };
  }

  if (user.status === 'banned') {
    return { isActive: false, status: 'banned', message: 'Your account has been permanently banned' };
  }

  if (user.status === 'suspended') {
    if (user.suspendedUntil) {
      const now = new Date();
      if (now >= user.suspendedUntil) {
        await db
          .update(users)
          .set({ status: null, suspendedUntil: null, updatedAt: new Date() })
          .where(eq(users.id, userId));
        return { isActive: true, status: 'active' };
      }
      return {
        isActive: false,
        status: 'suspended',
        suspendedUntil: user.suspendedUntil,
        message: `Your account is suspended until ${user.suspendedUntil.toLocaleDateString()}`,
      };
    }
    return { isActive: false, status: 'suspended', message: 'Your account is suspended' };
  }

  return { isActive: true, status: 'active' };
}

export function checkUserStatusFromSession(
  status?: string | null,
  suspendedUntil?: Date | null
): UserStatusResult {
  if (status === 'banned') {
    return { isActive: false, status: 'banned', message: 'Your account has been permanently banned' };
  }

  if (status === 'suspended') {
    if (suspendedUntil) {
      const now = new Date();
      const suspendDate = new Date(suspendedUntil);
      if (now >= suspendDate) {
        return { isActive: true, status: 'active' };
      }
      return {
        isActive: false,
        status: 'suspended',
        suspendedUntil: suspendDate,
        message: `Your account is suspended until ${suspendDate.toLocaleDateString()}`,
      };
    }
    return { isActive: false, status: 'suspended', message: 'Your account is suspended' };
  }

  return { isActive: true, status: 'active' };
}
