import type { NextRequest } from 'next/server';

export type E2EUser = {
  id: string;
  email: string;
  name: string;
  displayName: string;
  image: string | null;
  bio: string;
  isVerified: boolean;
  isExpert: boolean;
  badgeType: string | null;
  status: string | null;
  userType: string | null;
  visaType: string | null;
  interests: string[];
  koreanLevel: string | null;
  onboardingCompleted: boolean;
  isProfileComplete: boolean;
  createdAt: string;
  updatedAt: string;
};

export type E2EPost = {
  id: string;
  authorId: string;
  type: 'question' | 'share';
  title: string;
  content: string;
  category: string;
  subcategory: string | null;
  tags: string[];
  views: number;
  likes: number;
  isResolved: boolean;
  createdAt: string;
  updatedAt: string;
};

export type E2EStore = {
  users: Map<string, E2EUser>;
  posts: Map<string, E2EPost>;
  followsByUserId: Map<string, Set<string>>;
  likesByUserId: Map<string, Set<string>>;
  bookmarksByUserId: Map<string, Set<string>>;
  nextPostNumber: number;
};

type E2EGlobal = {
  stores: Map<string, E2EStore>;
};

const GLOBAL_KEY = '__VK_E2E__';

const getGlobal = () => {
  const globalRef = globalThis as unknown as Record<string, E2EGlobal | undefined>;
  if (!globalRef[GLOBAL_KEY]) {
    globalRef[GLOBAL_KEY] = { stores: new Map() };
  }
  return globalRef[GLOBAL_KEY] as E2EGlobal;
};

export const getE2ENamespace = (request: NextRequest) => {
  const cookieValue = request.cookies.get('vk-e2e-ns')?.value;
  const headerValue = request.headers.get('x-vk-e2e-ns');
  return (cookieValue || headerValue || 'default').slice(0, 80);
};

export const getE2EUserId = (request: NextRequest) => {
  const cookieValue = request.cookies.get('vk-e2e-user')?.value;
  const headerValue = request.headers.get('x-vk-e2e-user');
  const value = cookieValue || headerValue || '';
  return value.trim() ? value.trim().slice(0, 120) : null;
};

const seedStore = (namespace: string, store: E2EStore) => {
  const now = new Date();
  const iso = (d: Date) => d.toISOString();

  const user1: E2EUser = {
    id: 'e2e-user-1',
    email: 'e2e-user-1@example.com',
    name: 'bright-bamboo668',
    displayName: 'bright-bamboo668',
    image: null,
    bio: '',
    isVerified: true,
    isExpert: false,
    badgeType: 'verified_user',
    status: '기초',
    userType: 'student',
    visaType: 'D-2',
    interests: [],
    koreanLevel: 'beginner',
    onboardingCompleted: true,
    isProfileComplete: true,
    createdAt: iso(new Date(now.getTime() - 1000 * 60 * 60 * 24 * 30)),
    updatedAt: iso(now),
  };

  const user2: E2EUser = {
    id: 'e2e-user-2',
    email: 'e2e-user-2@example.com',
    name: 'merry-phoenix823',
    displayName: 'merry-phoenix823',
    image: null,
    bio: '',
    isVerified: false,
    isExpert: false,
    badgeType: null,
    status: '기초',
    userType: 'worker',
    visaType: 'E-7',
    interests: [],
    koreanLevel: 'beginner',
    onboardingCompleted: true,
    isProfileComplete: true,
    createdAt: iso(new Date(now.getTime() - 1000 * 60 * 60 * 24 * 10)),
    updatedAt: iso(now),
  };

  store.users.set(user1.id, user1);
  store.users.set(user2.id, user2);

  const post1: E2EPost = {
    id: `${namespace}-post-1`,
    authorId: user1.id,
    type: 'question',
    title: '한국어능력시험(TOPIK) 6급 공부 방법 공유해주세요 (5)',
    content:
      '<p data-vk-template="1"><strong>모더레이션 템플릿</strong></p><p data-vk-template-spacer="1"></p><p>쓰기 영역이 너무 어렵습니다. 6급 합격하신 분들 팁 좀 알려주세요!</p>',
    category: 'students',
    subcategory: 'korean-learning',
    tags: ['유학·학생', '한국 취업·경력', '한국 아르바이트'],
    views: 120,
    likes: 1,
    isResolved: false,
    createdAt: iso(new Date(now.getTime() - 1000 * 60 * 60 * 24)),
    updatedAt: iso(new Date(now.getTime() - 1000 * 60 * 60 * 24)),
  };

  const post2: E2EPost = {
    id: `${namespace}-post-2`,
    authorId: user2.id,
    type: 'question',
    title: 'E-7 비자 변경 시 필요한 서류가 무엇인가요? (1)',
    content:
      '<p data-vk-template="1"><strong>회사에서 E-7 변경을 준비 중인데 필수 서류 체크리스트가 필요합니다.</strong></p><p>경험 있으신 분들 알려주세요.</p>',
    category: 'visa',
    subcategory: 'visa-change',
    tags: ['비자', '체류'],
    views: 90,
    likes: 0,
    isResolved: false,
    createdAt: iso(new Date(now.getTime() - 1000 * 60 * 60 * 24 * 2)),
    updatedAt: iso(new Date(now.getTime() - 1000 * 60 * 60 * 24 * 2)),
  };

  store.posts.set(post1.id, post1);
  store.posts.set(post2.id, post2);

  store.followsByUserId.set(user1.id, new Set());
  store.followsByUserId.set(user2.id, new Set());
  store.likesByUserId.set(user1.id, new Set());
  store.likesByUserId.set(user2.id, new Set());
  store.bookmarksByUserId.set(user1.id, new Set());
  store.bookmarksByUserId.set(user2.id, new Set());
};

export const getE2EStore = (namespace: string) => {
  const globalState = getGlobal();
  const existing = globalState.stores.get(namespace);
  if (existing) return existing;

  const store: E2EStore = {
    users: new Map(),
    posts: new Map(),
    followsByUserId: new Map(),
    likesByUserId: new Map(),
    bookmarksByUserId: new Map(),
    nextPostNumber: 3,
  };

  seedStore(namespace, store);
  globalState.stores.set(namespace, store);
  return store;
};

