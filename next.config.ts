import path from 'path';
import type { NextConfig } from 'next';
import withPWAInit from '@ducanh2912/next-pwa';

const isPwaDisabled =
  process.env.DISABLE_PWA === 'true' ||
  (process.env.ENABLE_PWA !== 'true' && process.env.NODE_ENV === 'production');

const withPWA = withPWAInit({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development' || isPwaDisabled,
  register: true,
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  workboxOptions: {
    skipWaiting: true,
    clientsClaim: true,
  },
});

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },
  outputFileTracingRoot: path.join(__dirname),
  turbopack: {},
};

export default withPWA(nextConfig);
