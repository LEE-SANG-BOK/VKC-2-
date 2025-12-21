import { NextRequest } from 'next/server';
import { notFoundResponse, rateLimitResponse, successResponse } from '@/lib/api/response';

type Bucket = { windowStart: number; count: number };

const globalForProbe = globalThis as unknown as { vkProbeRateLimit?: Map<string, Bucket> };

const windowMs = 10_000;
const maxRequests = 3;

const getClientKey = (request: NextRequest, key?: string | null) => {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
  return `${ip}:${key || 'default'}`;
};

export async function GET(request: NextRequest) {
  if (process.env.ENABLE_PROBE_ENDPOINTS !== 'true') {
    return notFoundResponse();
  }

  const url = new URL(request.url);
  const key = url.searchParams.get('key');
  const bucketKey = getClientKey(request, key);

  const buckets = globalForProbe.vkProbeRateLimit ?? new Map<string, Bucket>();
  globalForProbe.vkProbeRateLimit = buckets;

  const now = Date.now();
  const current = buckets.get(bucketKey);
  const windowStart = current?.windowStart ?? now;
  const count = current?.count ?? 0;

  if (now - windowStart >= windowMs) {
    buckets.set(bucketKey, { windowStart: now, count: 1 });
    return successResponse({ ok: true, remaining: maxRequests - 1 });
  }

  if (count >= maxRequests) {
    const retryAfterSeconds = Math.max(1, Math.ceil((windowMs - (now - windowStart)) / 1000));
    return rateLimitResponse('Too many requests (probe).', 'PROBE_RATE_LIMITED', retryAfterSeconds);
  }

  buckets.set(bucketKey, { windowStart, count: count + 1 });
  return successResponse({ ok: true, remaining: Math.max(0, maxRequests - (count + 1)) });
}

