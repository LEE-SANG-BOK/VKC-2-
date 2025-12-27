import { test, expect } from '@playwright/test';
import crypto from 'crypto';

const shouldRun = process.env.E2E_UI_SNAPSHOTS !== '0';

const defaultPort = 3000;
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

    const main = page.getByRole('main');
    const recommendedRail = main.getByTestId('recommended-content-rail').first();
    await expect(recommendedRail).toBeVisible({ timeout: 30_000 });

    const recommendedCarousel = recommendedRail.getByTestId('recommended-content-carousel');
    await expect(recommendedCarousel).toBeVisible();
    const recommendedCards = recommendedCarousel.getByTestId('recommended-content-card');
    await expect(recommendedCards.first()).toBeVisible();
    if ((await recommendedCards.count()) >= 2) {
      const firstBox = await recommendedCards.nth(0).boundingBox();
      const secondBox = await recommendedCards.nth(1).boundingBox();
      expect(firstBox).not.toBeNull();
      expect(secondBox).not.toBeNull();
      if (firstBox && secondBox) {
        expect(Math.abs(firstBox.y - secondBox.y)).toBeLessThanOrEqual(2);
      }
    }

    const bottomNav = page.getByTestId('bottom-navigation');
    await expect(bottomNav).toBeVisible({ timeout: 30_000 });

    const firstCard = page.locator('.question-card').first();
    await expect(firstCard).toBeVisible({ timeout: 30_000 });

    const cardWithMedia = page.locator('.question-card').filter({ has: page.locator('.question-card-media') }).first();
    const cardWithoutMedia = page
      .locator('.question-card')
      .filter({ hasNot: page.locator('.question-card-media') })
      .first();
    if ((await cardWithMedia.count()) > 0 && (await cardWithoutMedia.count()) > 0) {
      const hideButtonWithMedia = cardWithMedia.getByRole('button', { name: /숨김|숨기기/i }).first();
      const hideButtonWithoutMedia = cardWithoutMedia.getByRole('button', { name: /숨김|숨기기/i }).first();
      await expect(hideButtonWithMedia).toBeVisible();
      await expect(hideButtonWithoutMedia).toBeVisible();

      const cardWithBox = await cardWithMedia.boundingBox();
      const cardWithoutBox = await cardWithoutMedia.boundingBox();
      const hideWithBox = await hideButtonWithMedia.boundingBox();
      const hideWithoutBox = await hideButtonWithoutMedia.boundingBox();
      expect(cardWithBox).not.toBeNull();
      expect(cardWithoutBox).not.toBeNull();
      expect(hideWithBox).not.toBeNull();
      expect(hideWithoutBox).not.toBeNull();

      if (cardWithBox && cardWithoutBox && hideWithBox && hideWithoutBox) {
        const relWith = hideWithBox.y - cardWithBox.y;
        const relWithout = hideWithoutBox.y - cardWithoutBox.y;
        expect(Math.abs(relWith - relWithout)).toBeLessThanOrEqual(12);
      }
    }
    await expect(page).toHaveScreenshot('home-mobile-top.png', { animations: 'disabled' });

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

    await expect(page).toHaveScreenshot('home-mobile-bottom.png', { animations: 'disabled' });
  });

  test('mobile vi home feed keeps layout and avoids clipping', async ({ page, context }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile-chromium', 'mobile snapshot is mobile-chromium only');

    await setE2ECookies(context, { namespace: createNamespace(), userId: 'e2e-user-1' });

    await page.goto('/vi?c=popular');

    const main = page.getByRole('main');
    const recommendedRail = main.getByTestId('recommended-content-rail').first();
    await expect(recommendedRail).toBeVisible({ timeout: 30_000 });

    const recommendedCarousel = recommendedRail.getByTestId('recommended-content-carousel');
    await expect(recommendedCarousel).toBeVisible();
    const recommendedCards = recommendedCarousel.getByTestId('recommended-content-card');
    await expect(recommendedCards.first()).toBeVisible();
    if ((await recommendedCards.count()) >= 2) {
      const firstBox = await recommendedCards.nth(0).boundingBox();
      const secondBox = await recommendedCards.nth(1).boundingBox();
      expect(firstBox).not.toBeNull();
      expect(secondBox).not.toBeNull();
      if (firstBox && secondBox) {
        expect(Math.abs(firstBox.y - secondBox.y)).toBeLessThanOrEqual(2);
      }
    }

    const bottomNav = page.getByTestId('bottom-navigation');
    await expect(bottomNav).toBeVisible({ timeout: 30_000 });

    const firstCard = page.locator('.question-card').first();
    await expect(firstCard).toBeVisible({ timeout: 30_000 });

    await expect(page).toHaveScreenshot('home-mobile-vi-top.png', { animations: 'disabled' });

    const endMessage = page.getByTestId('feed-end-message');
    if ((await endMessage.count()) > 0) {
      await endMessage.scrollIntoViewIfNeeded();
    }

    await expect(page).toHaveScreenshot('home-mobile-vi-bottom.png', { animations: 'disabled' });
  });

  test('mobile leaderboard top rankers stay horizontal', async ({ page, context }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile-chromium', 'leaderboard snapshot is mobile-chromium only');

    await setE2ECookies(context, { namespace: createNamespace(), userId: 'e2e-user-1' });

    await page.goto('/ko/leaderboard');

    const carousel = page.getByTestId('leaderboard-top-carousel');
    await expect(carousel).toBeVisible({ timeout: 30_000 });

    const cards = carousel.getByTestId('leaderboard-top-card');
    await expect(cards.first()).toBeVisible({ timeout: 30_000 });
    if ((await cards.count()) >= 2) {
      const firstBox = await cards.nth(0).boundingBox();
      const secondBox = await cards.nth(1).boundingBox();
      expect(firstBox).not.toBeNull();
      expect(secondBox).not.toBeNull();
      if (firstBox && secondBox) {
        expect(Math.abs(firstBox.y - secondBox.y)).toBeLessThanOrEqual(2);
      }
    }

    await expect(page).toHaveScreenshot('leaderboard-mobile.png', { animations: 'disabled' });
  });
});
