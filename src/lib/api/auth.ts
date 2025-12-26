import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { isE2ETestMode } from '@/lib/e2e/mode';
import { getE2EUserFromRequest } from '@/lib/e2e/auth';

export interface SessionUser {
  id: string;
  email: string;
  name?: string;
  image?: string;
  isExpert?: boolean;
  isVerified?: boolean;
}

export async function getSession(request?: NextRequest): Promise<SessionUser | null> {
  try {
    if (request && isE2ETestMode()) {
      const e2eUser = getE2EUserFromRequest(request);
      if (!e2eUser) return null;

      return {
        id: e2eUser.id,
        email: e2eUser.email,
        name: e2eUser.displayName || e2eUser.name || undefined,
        image: e2eUser.image || undefined,
        isExpert: e2eUser.isExpert,
        isVerified: e2eUser.isVerified,
      };
    }

    const session = await auth();

    if (!session || !session.user || !session.user.id) {
      return null;
    }

    return {
      id: session.user.id,
      email: session.user.email || '',
      name: session.user.name || undefined,
      image: session.user.image || undefined,
      isExpert: (session.user as any).isExpert ?? undefined,
      isVerified: (session.user as any).isVerified ?? undefined,
    };
  } catch (error) {
    console.error('getSession error:', error);
    return null;
  }
}

export async function requireAuth(request?: NextRequest): Promise<SessionUser> {
  const user = await getSession(request);

  if (!user) {
    throw new Error('UNAUTHORIZED');
  }

  return user;
}

export function isOwner(userId: string, resourceOwnerId: string): boolean {
  return userId === resourceOwnerId;
}
