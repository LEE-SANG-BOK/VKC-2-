import { NextRequest, NextResponse } from 'next/server';
import { GET as nextAuthGet, POST as nextAuthPost } from '@/lib/auth';
import { isE2ETestMode } from '@/lib/e2e/mode';
import { buildE2ESessionPayload } from '@/lib/e2e/auth';

export const GET: typeof nextAuthGet = async (...args) => {
  const request = args[0] as NextRequest;
  if (isE2ETestMode() && request.nextUrl.pathname.endsWith('/api/auth/session')) {
    return NextResponse.json(buildE2ESessionPayload(request));
  }
  return nextAuthGet(...args);
};

export const POST = nextAuthPost;
