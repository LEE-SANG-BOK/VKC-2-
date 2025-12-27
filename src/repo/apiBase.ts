const FALLBACK_BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

export const resolveServerApiBase = () => {
  if (process.env.E2E_TEST_MODE === '1' || process.env.E2E_TEST_MODE === 'true') {
    const port = process.env.PORT || '3000';
    return `http://localhost:${port}`;
  }
  return FALLBACK_BASE_URL;
};

export const apiUrl = (path: string) => {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  if (typeof window === 'undefined') {
    return `${resolveServerApiBase()}${normalized}`;
  }
  return normalized;
};
