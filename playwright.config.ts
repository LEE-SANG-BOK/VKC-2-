import { defineConfig, devices } from '@playwright/test';

const defaultPort = 3000;
const port = Number(process.env.E2E_PORT || process.env.PORT || defaultPort);
const baseURL = process.env.E2E_BASE_URL || `http://localhost:${port}`;
const healthUrl = `${baseURL}/ko/about`;

const shouldStartServer = !process.env.E2E_BASE_URL;

const startCommand = process.env.CI
  ? `npm run start -- -p ${port}`
  : `SKIP_SITEMAP_DB=true npm run build && npm run start -- -p ${port}`;

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-chromium',
      use: { ...devices['iPhone 13'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: shouldStartServer
    ? {
        command: startCommand,
        url: healthUrl,
        reuseExistingServer: true,
        timeout: 120_000,
        env: {
          ...process.env,
          PORT: String(port),
          E2E_TEST_MODE: process.env.E2E_TEST_MODE || '1',
          NEXTAUTH_URL: process.env.NEXTAUTH_URL || baseURL,
          AUTH_TRUST_HOST: process.env.AUTH_TRUST_HOST || 'true',
          NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || 'dummy-nextauth-secret',
          GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || 'dummy-google-client-id',
          GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || 'dummy-google-client-secret',
          NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || baseURL,
          NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || baseURL,
          NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://example.supabase.co',
          NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy',
          SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy',
          SKIP_SITEMAP_DB: process.env.SKIP_SITEMAP_DB || 'true',
          ENABLE_PROBE_ENDPOINTS: process.env.ENABLE_PROBE_ENDPOINTS || 'true',
        },
      }
    : undefined,
});
