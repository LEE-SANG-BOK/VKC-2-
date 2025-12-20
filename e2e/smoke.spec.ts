import { test, expect } from '@playwright/test';
import crypto from 'crypto';

test('renders about page (ko)', async ({ page }) => {
  await page.goto('/ko/about');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('소개');
});

test('renders about page (vi)', async ({ page }) => {
  await page.goto('/vi/about');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Giới thiệu');
});

test('renders about page (en)', async ({ page }) => {
  await page.goto('/en/about');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('About');
});

test('language switcher hides en and can switch ko↔vi', async ({ page }) => {
  await page.goto('/ko/about');

  await page.getByTestId('language-switcher-toggle').click();
  await expect(page.getByTestId('language-switcher-menu')).toBeVisible();
  await expect(page.getByTestId('language-option-en')).toHaveCount(0);

  await page.getByTestId('language-option-vi').click();
  await expect(page).toHaveURL(/\/vi\/about$/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Giới thiệu');

  await page.getByTestId('language-switcher-toggle').click();
  await expect(page.getByTestId('language-switcher-menu')).toBeVisible();
  await page.getByTestId('language-option-ko').click();
  await expect(page).toHaveURL(/\/ko\/about$/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('소개');
});

test('rate limit probe returns 429', async ({ request }) => {
  const key = crypto.randomUUID();
  const url = `/api/probe/rate-limit?key=${key}`;

  for (let i = 0; i < 3; i += 1) {
    const res = await request.get(url);
    expect(res.status()).toBe(200);
  }

  const limited = await request.get(url);
  expect(limited.status()).toBe(429);
  const headers = limited.headers();
  expect(headers['retry-after']).toBeTruthy();
});
