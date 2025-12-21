import path from 'path';
import type { NextConfig } from 'next';
import withPWAInit from '@ducanh2912/next-pwa';

const toHostname = (value: string | undefined) => {
  if (!value) return null;
  try {
    return new URL(value).hostname;
  } catch {
    return null;
  }
};

const supabaseHostname = toHostname(process.env.NEXT_PUBLIC_SUPABASE_URL);
const siteHostname =
  toHostname(process.env.NEXT_PUBLIC_SITE_URL) ||
  toHostname(process.env.NEXT_PUBLIC_APP_URL) ||
  toHostname(process.env.NEXTAUTH_URL);

const isPwaDisabled =
  process.env.DISABLE_PWA === 'true' ||
  (process.env.ENABLE_PWA !== 'true' && process.env.NODE_ENV === 'production');

const withPWA = withPWAInit({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development' || isPwaDisabled,
  register: true,
  cacheOnFrontEndNav: false,
  aggressiveFrontEndNavCaching: false,
  workboxOptions: {
    skipWaiting: true,
    clientsClaim: true,
  },
});

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      ...(supabaseHostname
        ? [
            {
              protocol: 'https' as const,
              hostname: supabaseHostname,
              pathname: '/storage/v1/object/**',
            },
          ]
        : []),
      ...(siteHostname
        ? [
            {
              protocol: 'https' as const,
              hostname: siteHostname,
              pathname: '/**',
            },
          ]
        : []),
      {
        protocol: 'https' as const,
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'https' as const,
        hostname: 'lh4.googleusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'https' as const,
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https' as const,
        hostname: 'ui-avatars.com',
        pathname: '/api/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },
  outputFileTracingRoot: path.join(__dirname),
  turbopack: {},
};

export default withPWA(nextConfig);
