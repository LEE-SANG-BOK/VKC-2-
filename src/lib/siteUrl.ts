export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.NEXTAUTH_URL ||
  'https://example.com';

export const buildAbsoluteUrl = (path: string = '/') => {
  return new URL(path, SITE_URL).toString();
};
