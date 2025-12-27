import { test, expect } from '@playwright/test';
import crypto from 'crypto';

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

const setGuidelinesSeen = async (page: import('@playwright/test').Page, userId: string) => {
  await page.addInitScript((id) => {
    try {
      window.localStorage.setItem(`vk-guidelines-seen-v1:${id}`, new Date().toISOString());
    } catch {
      void 0;
    }
  }, userId);
};

test.describe('functional flows (E2E_TEST_MODE)', () => {
  test('unauthenticated like opens login prompt', async ({ page, context }) => {
    await setE2ECookies(context, { namespace: createNamespace() });
    await page.goto('/ko?c=popular');

    const firstCard = page.locator('.question-card').first();
    await expect(firstCard).toBeVisible({ timeout: 30_000 });

    await firstCard.getByRole('button', { name: '좋아요' }).click();
    await expect(page.getByTestId('login-prompt')).toBeVisible();
  });

  test('authenticated user can follow, like, and bookmark from feed', async ({ page, context }) => {
    await setE2ECookies(context, { namespace: createNamespace(), userId: 'e2e-user-2' });
    await page.goto('/ko?c=popular');

    const firstCard = page
      .locator('.question-card')
      .filter({ has: page.getByRole('button', { name: /팔로우|팔로잉/ }) })
      .first();
    await expect(firstCard).toBeVisible({ timeout: 30_000 });

    const followButton = firstCard.getByRole('button', { name: /팔로우|팔로잉/ });
    await followButton.click();
    await expect(followButton).toHaveAttribute('aria-pressed', 'true');

    const likeButton = firstCard.getByRole('button', { name: /좋아요/ });
    await likeButton.click();
    await expect(likeButton).toHaveAttribute('aria-pressed', 'true');

    const bookmarkButton = firstCard.getByRole('button', { name: /북마크/ });
    await bookmarkButton.click();
    await expect(bookmarkButton).toHaveAttribute('aria-pressed', 'true');
  });

  test('authenticated user can create, edit, and delete a post (UI)', async ({ page, context }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'interactive editor flow is chromium-only');

    const namespace = createNamespace();
    const userId = 'e2e-user-1';

    await setE2ECookies(context, { namespace, userId });
    await setGuidelinesSeen(page, userId);

    const title = `E2E 질문 생성 ${namespace.slice(0, 8)}`;
    const updatedTitle = `${title} (수정)`;

    await page.goto('/ko/posts/new?type=question');
    await page.selectOption('#parentCategory', { index: 1 });
    const childOptions = await page.locator('#childCategory option').count();
    if (childOptions > 1) {
      await page.selectOption('#childCategory', { index: 1 });
    }
    await page.fill('#title', title);

    const editor = page.locator('.ProseMirror').first();
    await editor.click();
    await page.keyboard.type('E2E 본문 내용입니다. 테스트를 위한 충분한 길이의 문장입니다.');

    await page.locator('form button[type="submit"]').click();
    await page.waitForURL((url) => url.pathname.startsWith('/ko/posts/') && !url.pathname.endsWith('/new'), {
      timeout: 30_000,
    });

    await expect(page.getByRole('heading', { level: 1 })).toContainText(title);

    const article = page.locator('article').first();

    await article.getByRole('button', { name: /수정/ }).click();
    await article.locator('input[type="text"]').first().fill(updatedTitle);

    await article.getByRole('button', { name: /저장/ }).click();
    await expect(page.getByRole('heading', { level: 1 })).toContainText(updatedTitle);

    page.once('dialog', async (dialog) => dialog.accept());
    await article.getByRole('button', { name: /삭제/ }).click();
    await page.waitForURL(/\/ko\/?$/, { timeout: 30_000 });
  });

  test('verified user can create an answer (E2E store)', async ({ page, context }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'interactive editor flow is chromium-only');

    const namespace = createNamespace();
    const userId = 'e2e-user-1';
    const answerText = `E2E 답변 ${namespace.slice(0, 8)}`;

    await setE2ECookies(context, { namespace, userId });
    await setGuidelinesSeen(page, userId);

    await page.goto(`/ko/posts/${namespace}-post-2`);

    const editor = page.locator('.ProseMirror').first();
    await expect(editor).toBeVisible({ timeout: 30_000 });
    await editor.click();
    await page.keyboard.type(answerText);

    const form = editor.locator('xpath=ancestor::form[1]');
    await form.locator('button[type="submit"]').first().click();

    await expect(page.getByText(answerText)).toBeVisible({ timeout: 30_000 });
  });

  test('question author can adopt an answer (E2E store)', async ({ page, context }) => {
    const namespace = createNamespace();
    const userId = 'e2e-user-1';
    const postId = `${namespace}-post-1`;

    await setE2ECookies(context, { namespace, userId });
    await setGuidelinesSeen(page, userId);

    await page.goto(`/ko/posts/${postId}`);

    const adoptButton = page.getByRole('button', { name: '채택하기' }).first();
    await expect(adoptButton).toBeVisible({ timeout: 30_000 });

    const adoptResponsePromise = page.waitForResponse((response) => {
      if (response.request().method() !== 'POST') return false;
      const url = response.url();
      return url.includes('/api/answers/') && url.endsWith('/adopt');
    });

    await adoptButton.click();
    const adoptResponse = await adoptResponsePromise;
    expect(adoptResponse.ok()).toBeTruthy();

    const answersResponse = await page.request.get(`/api/posts/${postId}/answers`);
    expect(answersResponse.ok()).toBeTruthy();
    const answersPayload = await answersResponse.json();
    const answers = Array.isArray(answersPayload?.data) ? answersPayload.data : [];
    expect(answers.some((answer: any) => answer?.isAdopted)).toBeTruthy();

    await expect(page.getByRole('button', { name: '채택하기' })).toHaveCount(0, { timeout: 30_000 });
  });

  test('bottom navigation hides when focusing editor inputs (mobile)', async ({ page, context }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile-chromium', 'bottom navigation is mobile-only');

    const namespace = createNamespace();
    const userId = 'e2e-user-1';

    await setE2ECookies(context, { namespace, userId });
    await setGuidelinesSeen(page, userId);

    await page.goto('/ko/posts/new?type=question');

    const bottomNavVisible = page.locator('[data-testid="bottom-navigation"]:not(.hidden)');
    await expect(bottomNavVisible.first()).toBeVisible({ timeout: 30_000 });

    await page.locator('#title').focus();
    await expect(bottomNavVisible).toHaveCount(0, { timeout: 30_000 });

    const editor = page.locator('.ProseMirror').first();
    await expect(editor).toBeVisible({ timeout: 30_000 });
    await editor.click();
    await expect(bottomNavVisible).toHaveCount(0, { timeout: 30_000 });
  });

  test('bottom navigation hides when focusing answer editor (mobile)', async ({ page, context }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile-chromium', 'bottom navigation is mobile-only');

    const namespace = createNamespace();
    const userId = 'e2e-user-1';

    await setE2ECookies(context, { namespace, userId });
    await setGuidelinesSeen(page, userId);

    await page.goto(`/ko/posts/${namespace}-post-1`);

    const bottomNavVisible = page.locator('[data-testid="bottom-navigation"]:not(.hidden)');
    await expect(bottomNavVisible.first()).toBeVisible({ timeout: 30_000 });

    const editor = page.locator('.ProseMirror').first();
    await expect(editor).toBeVisible({ timeout: 30_000 });
    await editor.scrollIntoViewIfNeeded();
    await editor.click();

    await expect(bottomNavVisible).toHaveCount(0, { timeout: 30_000 });
  });

  test('bottom navigation hides when focusing comment input (mobile)', async ({ page, context }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile-chromium', 'bottom navigation is mobile-only');

    const namespace = createNamespace();
    const userId = 'e2e-user-1';

    await setE2ECookies(context, { namespace, userId });
    await setGuidelinesSeen(page, userId);

    await page.goto(`/ko/posts/${namespace}-post-3`);

    const bottomNavVisible = page.locator('[data-testid="bottom-navigation"]:not(.hidden)');
    await expect(bottomNavVisible.first()).toBeVisible({ timeout: 30_000 });

    const commentBox = page.locator('textarea').first();
    await expect(commentBox).toBeVisible({ timeout: 30_000 });
    await commentBox.scrollIntoViewIfNeeded();
    await commentBox.click();

    await expect(bottomNavVisible).toHaveCount(0, { timeout: 30_000 });
  });

  test('bottom navigation hides when focusing profile edit input (mobile)', async ({ page, context }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile-chromium', 'bottom navigation is mobile-only');

    const namespace = createNamespace();
    const userId = 'e2e-user-1';

    await setE2ECookies(context, { namespace, userId });
    await setGuidelinesSeen(page, userId);

    await page.goto('/ko/profile/edit');

    const bottomNavVisible = page.locator('[data-testid="bottom-navigation"]:not(.hidden)');
    await expect(bottomNavVisible.first()).toBeVisible({ timeout: 30_000 });

    const nameInput = page.locator('#name');
    await expect(nameInput).toBeVisible({ timeout: 30_000 });
    await nameInput.click();

    await expect(bottomNavVisible).toHaveCount(0, { timeout: 30_000 });
  });

  test('bottom navigation hides when focusing verification request input (mobile)', async ({ page, context }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile-chromium', 'bottom navigation is mobile-only');

    const namespace = createNamespace();
    const userId = 'e2e-user-1';

    await setE2ECookies(context, { namespace, userId });
    await setGuidelinesSeen(page, userId);

    await page.goto('/ko/verification/request');

    const bottomNavVisible = page.locator('[data-testid="bottom-navigation"]:not(.hidden)');
    await expect(bottomNavVisible.first()).toBeVisible({ timeout: 30_000 });

    const visaTypeInput = page.locator('#visaType');
    await expect(visaTypeInput).toBeVisible({ timeout: 30_000 });
    await visaTypeInput.scrollIntoViewIfNeeded();
    await visaTypeInput.click();

    await expect(bottomNavVisible).toHaveCount(0, { timeout: 30_000 });
  });

  test('bottom navigation hides when focusing feedback textarea (mobile)', async ({ page, context }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile-chromium', 'bottom navigation is mobile-only');

    const namespace = createNamespace();
    const userId = 'e2e-user-1';

    await setE2ECookies(context, { namespace, userId });
    await setGuidelinesSeen(page, userId);

    await page.goto('/ko/feedback');

    const bottomNavVisible = page.locator('[data-testid="bottom-navigation"]:not(.hidden)');
    await expect(bottomNavVisible.first()).toBeVisible({ timeout: 30_000 });

    const textarea = page.locator('textarea').first();
    await expect(textarea).toBeVisible({ timeout: 30_000 });
    await textarea.scrollIntoViewIfNeeded();
    await textarea.click();

    await expect(bottomNavVisible).toHaveCount(0, { timeout: 30_000 });
  });
});
