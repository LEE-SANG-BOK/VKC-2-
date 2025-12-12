import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';

export interface SessionUser {
  id: string;
  email: string;
  name?: string;
  image?: string;
  isExpert?: boolean;
  isVerified?: boolean;
}

/**
 * 세션에서 사용자 정보 추출 (NextAuth 연동)
 */
export async function getSession(request?: NextRequest): Promise<SessionUser | null> {
  try {
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

/**
 * 인증 필수 체크
 */
export async function requireAuth(request?: NextRequest): Promise<SessionUser> {
  const user = await getSession(request);

  if (!user) {
    throw new Error('UNAUTHORIZED');
  }

  return user;
}

/**
 * 리소스 소유자 확인
 */
export function isOwner(userId: string, resourceOwnerId: string): boolean {
  return userId === resourceOwnerId;
}
