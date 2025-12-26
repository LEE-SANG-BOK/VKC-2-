import type { NextRequest } from 'next/server';
import { getE2ENamespace, getE2EStore, getE2EUserId } from './store';

export const getE2ERequestState = (request: NextRequest) => {
  const namespace = getE2ENamespace(request);
  const store = getE2EStore(namespace);
  const userId = getE2EUserId(request);
  return { namespace, store, userId };
};

