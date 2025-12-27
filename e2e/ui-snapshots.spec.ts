import { test, expect } from '@playwright/test';
import crypto from 'crypto';

const shouldRun = process.env.CI === 'true' || process.env.E2E_UI_SNAPSHOTS === '1';

const defaultPort = process.env.CI ? 3000 : 3100;
const port = Number(process.env.E2E_PORT || process.env.PORT || defaultPort);
const baseURL = process.env.E2E_BASE_URL || `http://localhost:${port}`;

const createNamespace = () => crypto.randomUUID();

const setE2ECookies = async (
  context: import('@playwright/test').BrowserContext,
  options: { namespace: string; userId?: string }
) => {
  const cookies = [
    {
      name: 'vk-e2e-ns',
      value: options.namespace,
      url: baseURL,
    },
  ];

  if (options.userId) {
    cookies.push({
      name: 'vk-e2e-user',
      value: options.userId,
      url: baseURL,
    });
  }

  await context.addCookies(cookies);
};

test.describe('visual smoke (E2E_TEST_MODE)', () => {
  test.skip(!shouldRun, 'visual checks disabled');

  test('desktop home feed renders with stable cards', async ({ page, context }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'desktop snapshot is chromium-only');

    await setE2ECookies(context, { namespace: createNamespace(), userId: 'e2e-user-1' });

    await page.goto('/ko?c=popular');
    const firstCard = page.locator('.question-card').first();
    await expect(firstCard).toBeVisible({ timeout: 30_000 });

    const screenshotPath = testInfo.outputPath('home-desktop.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    await testInfo.attach('home-desktop', { path: screenshotPath, contentType: 'image/png' });
  });

  test('mobile home feed does not overlap bottom navigation', async ({ page, context }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile-chromium', 'mobile snapshot is mobile-chromium only');

    await setE2ECookies(context, { namespace: createNamespace(), userId: 'e2e-user-1' });

    await page.goto('/ko?c=popular');

    const bottomNav = page.getByTestId('bottom-navigation');
    await expect(bottomNav).toBeVisible({ timeout: 30_000 });

    const firstCard = page.locator('.question-card').first();
    await expect(firstCard).toBeVisible({ timeout: 30_000 });

    const footer = firstCard.locator('.question-card-footer-fixed');
    await expect(footer).toBeVisible();
    await footer.scrollIntoViewIfNeeded();

    const footerBox = await footer.boundingBox();
    const navBox = await bottomNav.boundingBox();
    expect(footerBox).not.toBeNull();
    expect(navBox).not.toBeNull();

    if (footerBox && navBox) {
      expect(footerBox.y + footerBox.height).toBeLessThanOrEqual(navBox.y + 1);
    }

    const endMessage = page.getByTestId('feed-end-message');
    if ((await endMessage.count()) > 0 && navBox) {
      await endMessage.scrollIntoViewIfNeeded();
      const endBox = await endMessage.boundingBox();
      expect(endBox).not.toBeNull();
      if (endBox) {
        expect(endBox.y + endBox.height).toBeLessThanOrEqual(navBox.y + 1);
      }
    }

    const screenshotPath = testInfo.outputPath('home-mobile.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    await testInfo.attach('home-mobile', { path: screenshotPath, contentType: 'image/png' });
  });
});
