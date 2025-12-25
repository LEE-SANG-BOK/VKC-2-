import { test, expect, type Locator, type Page } from '@playwright/test';

const isEnabled = process.env.E2E_UI_SNAPSHOTS === '1';

const mockPosts = [
  {
    id: 'e2e-post-1',
    authorId: 'e2e-user-1',
    type: 'question',
    title: '한국어능력시험(TOPIK) 6급 공부 방법 공유해주세요 (5)',
    excerpt: '쓰기 영역이 너무 어렵습니다. 6급 합격하신 분들 팁 좀 알려주세요!',
    content: '<p data-vk-template="1"><strong>모더레이션 템플릿</strong></p><p>쓰기 영역이 너무 어렵습니다.</p>',
    category: 'korean',
    subcategory: 'korean-learning',
    tags: ['유학·학생', '한국 취업·경력', '한국 아르바이트'],
    views: 120,
    likes: 2,
    likesCount: 2,
    isResolved: false,
    createdAt: '2025-12-20T10:00:00.000Z',
    updatedAt: '2025-12-20T10:00:00.000Z',
    certifiedResponderCount: 1,
    otherResponderCount: 0,
    imageCount: 0,
    thumbnail: null,
    thumbnails: [],
    author: {
      id: 'e2e-user-1',
      displayName: 'bright-bamboo668',
      name: 'bright-bamboo668',
      image: null,
      isVerified: true,
      isExpert: false,
      badgeType: null,
      isFollowing: false,
      followers: 12,
    },
  },
  {
    id: 'e2e-post-2',
    authorId: 'e2e-user-2',
    type: 'question',
    title: 'E-7 비자 변경 시 필요한 서류가 무엇인가요? (1)',
    excerpt: '회사에서 E-7 변경을 준비 중인데, 필수 서류 체크리스트가 필요합니다.',
    category: 'visa',
    subcategory: 'visa-change',
    tags: ['비자', '체류'],
    views: 90,
    likes: 0,
    likesCount: 0,
    isResolved: true,
    createdAt: '2025-12-19T08:40:00.000Z',
    updatedAt: '2025-12-19T08:40:00.000Z',
    certifiedResponderCount: 0,
    otherResponderCount: 2,
    imageCount: 1,
    thumbnail: null,
    thumbnails: [
      '/brand-logo.png',
    ],
    author: {
      id: 'e2e-user-2',
      displayName: 'merry-phoenix823',
      name: 'merry-phoenix823',
      image: null,
      isVerified: false,
      isExpert: false,
      badgeType: null,
      isFollowing: false,
      followers: 4,
    },
  },
  {
    id: 'e2e-post-3',
    authorId: 'e2e-user-3',
    type: 'share',
    title: '베트남 IT 인력 수요 급증, 한국기업 진출 확대',
    excerpt: '최근 트렌드와 관련 뉴스 요약입니다.',
    category: 'career',
    subcategory: 'news',
    tags: ['한국 취업·경력', '추천'],
    views: 50,
    likes: 1,
    likesCount: 1,
    isResolved: false,
    createdAt: '2025-12-18T05:20:00.000Z',
    updatedAt: '2025-12-18T05:20:00.000Z',
    certifiedResponderCount: 0,
    otherResponderCount: 0,
    imageCount: 0,
    thumbnail: null,
    thumbnails: [],
    author: {
      id: 'e2e-user-3',
      displayName: 'gentle-bamboo872',
      name: 'gentle-bamboo872',
      image: null,
      isVerified: true,
      isExpert: false,
      badgeType: 'verified_user',
      isFollowing: false,
      followers: 8,
    },
  },
  {
    id: 'e2e-post-4',
    authorId: 'e2e-user-4',
    type: 'question',
    title: '한국 생활비 계산 팁이 있나요?',
    excerpt: '월세, 식비, 교통비 등 평균적인 지출이 궁금합니다.',
    category: 'life',
    subcategory: 'budget',
    tags: ['생활', '정착'],
    views: 42,
    likes: 0,
    likesCount: 0,
    isResolved: false,
    createdAt: '2025-12-17T03:12:00.000Z',
    updatedAt: '2025-12-17T03:12:00.000Z',
    certifiedResponderCount: 0,
    otherResponderCount: 0,
    imageCount: 0,
    thumbnail: null,
    thumbnails: [],
    author: {
      id: 'e2e-user-4',
      displayName: 'brave-pepper512',
      name: 'brave-pepper512',
      image: null,
      isVerified: false,
      isExpert: false,
      badgeType: null,
      isFollowing: false,
      followers: 2,
    },
  },
  {
    id: 'e2e-post-5',
    authorId: 'e2e-user-5',
    type: 'question',
    title: '외국인등록증 재발급 절차가 궁금해요',
    excerpt: '분실해서 재발급하려고 하는데 어디서 신청하나요?',
    category: 'visa',
    subcategory: 'arc',
    tags: ['비자', '서류'],
    views: 66,
    likes: 3,
    likesCount: 3,
    isResolved: false,
    createdAt: '2025-12-16T12:55:00.000Z',
    updatedAt: '2025-12-16T12:55:00.000Z',
    certifiedResponderCount: 1,
    otherResponderCount: 1,
    imageCount: 0,
    thumbnail: null,
    thumbnails: [],
    author: {
      id: 'e2e-user-5',
      displayName: 'mint-coffee116',
      name: 'mint-coffee116',
      image: null,
      isVerified: true,
      isExpert: true,
      badgeType: 'expert_visa',
      isFollowing: false,
      followers: 21,
    },
  },
  {
    id: 'e2e-post-6',
    authorId: 'e2e-user-6',
    type: 'share',
    title: '호치민시 메트로 1호선 2024년 말 개통 예정',
    excerpt: '교통 관련 소식 공유합니다.',
    category: 'culture',
    subcategory: 'transport',
    tags: ['문화', '베트남'],
    views: 12,
    likes: 0,
    likesCount: 0,
    isResolved: false,
    createdAt: '2025-12-15T09:30:00.000Z',
    updatedAt: '2025-12-15T09:30:00.000Z',
    certifiedResponderCount: 0,
    otherResponderCount: 0,
    imageCount: 0,
    thumbnail: null,
    thumbnails: [],
    author: {
      id: 'e2e-user-6',
      displayName: 'lively-phoenix800',
      name: 'lively-phoenix800',
      image: null,
      isVerified: false,
      isExpert: false,
      badgeType: null,
      isFollowing: false,
      followers: 1,
    },
  },
];

const mockRecommendedUsers = [
  {
    id: 'e2e-rec-1',
    displayName: 'Bùi Thanh Tâm',
    image: null,
    isFollowing: false,
    isVerified: true,
    isExpert: false,
    badgeType: null,
    recommendationMeta: [
      { key: 'status', value: '기초' },
      { key: 'userType', value: 'student' },
    ],
    stats: { followers: 12, following: 2, posts: 5 },
  },
  {
    id: 'e2e-rec-2',
    displayName: 'Đặng Quang Huy',
    image: null,
    isFollowing: false,
    isVerified: true,
    isExpert: false,
    badgeType: null,
    recommendationMeta: [
      { key: 'status', value: '기초' },
      { key: 'visaType', value: 'D-2' },
    ],
    stats: { followers: 8, following: 1, posts: 3 },
  },
  {
    id: 'e2e-rec-3',
    displayName: '류재원',
    image: null,
    isFollowing: false,
    isVerified: true,
    isExpert: false,
    badgeType: null,
    recommendationMeta: [
      { key: 'status', value: '기초' },
      { key: 'userType', value: 'worker' },
    ],
    stats: { followers: 5, following: 0, posts: 2 },
  },
];

const mockNewsItems = [
  {
    id: 'e2e-news-1',
    title: '베트남 경제성장률 6.5% 전망, 아세안 최고 수준',
    category: '경제',
    language: 'ko',
    type: 'post',
    content: '최근 경제 동향을 요약합니다.',
    imageUrl: '/brand-logo.png',
    linkUrl: null,
    isActive: true,
    order: 1,
    createdAt: '2025-12-20T00:00:00.000Z',
    updatedAt: '2025-12-20T00:00:00.000Z',
  },
  {
    id: 'e2e-news-2',
    title: '호치민시 메트로 1호선 2024년 말 개통 예정',
    category: '교통',
    language: 'ko',
    type: 'post',
    content: '교통 관련 소식을 공유합니다.',
    imageUrl: '/brand-logo.png',
    linkUrl: null,
    isActive: true,
    order: 2,
    createdAt: '2025-12-19T00:00:00.000Z',
    updatedAt: '2025-12-19T00:00:00.000Z',
  },
];

async function installHomeMocks(page: Page, authenticated: boolean) {
  await page.route(/\/api\/auth\/session(\?.*)?$/, async (route) => {
    if (!authenticated) {
      await route.fulfill({ status: 200, contentType: 'application/json', body: 'null' });
      return;
    }
    const body = JSON.stringify({
      user: {
        id: 'e2e-me',
        name: '테스트-테스트',
        email: 'test@example.com',
        image: null,
      },
      expires: '2030-01-01T00:00:00.000Z',
    });
    await route.fulfill({ status: 200, contentType: 'application/json', body });
  });

  await page.route(/\/api\/notifications\/unread-count(\?.*)?$/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: { count: 0 } }),
    });
  });

  await page.route(/\/api\/hides(\?.*)?$/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: { ids: [] } }),
    });
  });

  await page.route(/\/api\/users\/me\/subscriptions(\?.*)?$/, async (route) => {
    if (!authenticated) {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, error: 'Unauthorized' }),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: [] }),
    });
  });

  await page.route(/\/api\/users\/me(\?.*)?$/, async (route) => {
    if (!authenticated) {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, error: 'Unauthorized' }),
      });
      return;
    }
    const request = route.request();
    if (request.method() === 'POST') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            likedPostIds: [],
            bookmarkedPostIds: [],
          },
        }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          id: 'e2e-me',
          username: 'e2e-me',
          displayName: '테스트-테스트',
          avatar: '/default-avatar.jpg',
          email: 'test@example.com',
          bio: '',
          joinedAt: '2025-01-01T00:00:00.000Z',
          isVerified: true,
          isExpert: false,
          badgeType: null,
          interests: [],
          onboardingCompleted: true,
          isProfileComplete: true,
          stats: {
            followers: 0,
            following: 0,
            posts: 0,
            accepted: 0,
            comments: 0,
            bookmarks: 0,
          },
        },
      }),
    });
  });

  await page.route(/\/api\/users\/recommended(\?.*)?$/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: mockRecommendedUsers,
        pagination: { page: 1, limit: 6, total: mockRecommendedUsers.length, totalPages: 1 },
      }),
    });
  });

  await page.route(/\/api\/categories(\?.*)?$/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: [] }),
    });
  });

  await page.route(/\/api\/news(\?.*)?$/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: mockNewsItems }),
    });
  });

  await page.route(/\/api\/search\/examples(\?.*)?$/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          examples: [
            { id: 'ex-1', title: 'E-7 비자 변경 시 필요한 서류가 무엇인가요?' },
            { id: 'ex-2', title: '외국인등록증 재발급 절차가 궁금해요' },
          ],
        },
      }),
    });
  });

  await page.route('**/api/posts**', async (route) => {
    const url = new URL(route.request().url());
    if (!url.pathname.endsWith('/api/posts')) {
      await route.fallback();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: mockPosts,
        pagination: { page: 1, limit: 20, total: mockPosts.length, totalPages: 1 },
      }),
    });
  });
}

async function takeStableScreenshot(page: Page, locator: Locator, path: string) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await locator.scrollIntoViewIfNeeded();
      await locator.screenshot({ path });
      return;
    } catch (error) {
      if (attempt === 2) throw error;
      await page.waitForTimeout(250);
    }
  }
}

test.describe('ui snapshots', () => {
  test.skip(!isEnabled);
  test.describe.configure({ timeout: 60_000 });

  test('home feed (desktop) captures viewport and first card', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium');

    await installHomeMocks(page, false);
    await page.goto('/ko?c=popular');
    const targetCard = page.locator('.question-card').filter({ hasText: '한국어능력시험(TOPIK) 6급' }).first();
    await expect(targetCard).toBeVisible({ timeout: 30_000 });

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.waitForTimeout(250);

    await page.screenshot({ path: testInfo.outputPath('home-desktop.png') });
    await takeStableScreenshot(page, targetCard, testInfo.outputPath('postcard-desktop.png'));
  });

  test('home feed (mobile) captures viewport and first card', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile-chromium');

    await installHomeMocks(page, false);
    await page.goto('/ko?c=popular');
    const targetCard = page.locator('.question-card').filter({ hasText: '한국어능력시험(TOPIK) 6급' }).first();
    await expect(targetCard).toBeVisible({ timeout: 30_000 });

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.waitForTimeout(250);

    await page.screenshot({ path: testInfo.outputPath('home-mobile.png') });
    await takeStableScreenshot(page, targetCard, testInfo.outputPath('postcard-mobile.png'));
  });
});
