import type { NextRequest } from 'next/server';
import { getE2ENamespace, getE2EStore, getE2EUserId } from './store';

export const getE2EUserFromRequest = (request: NextRequest) => {
  const namespace = getE2ENamespace(request);
  const store = getE2EStore(namespace);
  const userId = getE2EUserId(request);
  if (!userId) return null;
  return store.users.get(userId) || null;
};

export const buildE2ESessionPayload = (request: NextRequest) => {
  const user = getE2EUserFromRequest(request);
  if (!user) return null;

  return {
    user: {
      id: user.id,
      name: user.displayName || user.name,
      email: user.email,
      image: user.image,
      isVerified: user.isVerified,
      isExpert: user.isExpert,
      isProfileComplete: user.isProfileComplete,
    },
    expires: '2030-01-01T00:00:00.000Z',
  };
};

