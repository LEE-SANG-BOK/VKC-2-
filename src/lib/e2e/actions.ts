import type { E2EPost, E2EStore } from '@/lib/e2e/store';

type CreatePayload = {
  type: E2EPost['type'];
  title: string;
  content: string;
  category: string;
  subcategory?: string | null;
  tags?: string[];
};

type UpdatePayload = Partial<Omit<CreatePayload, 'type'>> & { type?: E2EPost['type'] };

const getOrCreateSet = (map: Map<string, Set<string>>, key: string) => {
  const existing = map.get(key);
  if (existing) return existing;
  const created = new Set<string>();
  map.set(key, created);
  return created;
};

export const toggleFollow = (store: E2EStore, followerId: string, targetUserId: string) => {
  const set = getOrCreateSet(store.followsByUserId, followerId);
  if (set.has(targetUserId)) {
    set.delete(targetUserId);
    return false;
  }
  set.add(targetUserId);
  return true;
};

export const togglePostLike = (store: E2EStore, userId: string, postId: string) => {
  const post = store.posts.get(postId);
  if (!post) return null;

  const set = getOrCreateSet(store.likesByUserId, userId);
  const nextIsLiked = !set.has(postId);
  if (nextIsLiked) {
    set.add(postId);
    post.likes = post.likes + 1;
  } else {
    set.delete(postId);
    post.likes = Math.max(0, post.likes - 1);
  }
  post.updatedAt = new Date().toISOString();
  store.posts.set(post.id, post);
  return { isLiked: nextIsLiked, likes: post.likes };
};

export const togglePostBookmark = (store: E2EStore, userId: string, postId: string) => {
  const post = store.posts.get(postId);
  if (!post) return null;

  const set = getOrCreateSet(store.bookmarksByUserId, userId);
  const nextIsBookmarked = !set.has(postId);
  if (nextIsBookmarked) {
    set.add(postId);
  } else {
    set.delete(postId);
  }
  return { isBookmarked: nextIsBookmarked };
};

export const incrementPostView = (store: E2EStore, postId: string) => {
  const post = store.posts.get(postId);
  if (!post) return null;
  post.views = post.views + 1;
  post.updatedAt = new Date().toISOString();
  store.posts.set(post.id, post);
  return { views: post.views };
};

export const createPost = (store: E2EStore, namespace: string, authorId: string, payload: CreatePayload) => {
  const now = new Date().toISOString();
  const id = `${namespace}-post-${store.nextPostNumber}`;
  store.nextPostNumber += 1;
  const post: E2EPost = {
    id,
    authorId,
    type: payload.type,
    title: payload.title,
    content: payload.content,
    category: payload.category,
    subcategory: payload.subcategory ?? null,
    tags: payload.tags ?? [],
    views: 0,
    likes: 0,
    isResolved: false,
    createdAt: now,
    updatedAt: now,
  };
  store.posts.set(post.id, post);
  return post;
};

export const updatePost = (store: E2EStore, postId: string, payload: UpdatePayload) => {
  const post = store.posts.get(postId);
  if (!post) return null;

  const next: E2EPost = {
    ...post,
    ...(payload.type ? { type: payload.type } : null),
    ...(payload.title !== undefined ? { title: payload.title } : null),
    ...(payload.content !== undefined ? { content: payload.content } : null),
    ...(payload.category !== undefined ? { category: payload.category } : null),
    ...(payload.subcategory !== undefined ? { subcategory: payload.subcategory ?? null } : null),
    ...(payload.tags !== undefined ? { tags: payload.tags ?? [] } : null),
    updatedAt: new Date().toISOString(),
  };
  store.posts.set(next.id, next);
  return next;
};

export const deletePost = (store: E2EStore, postId: string) => {
  if (!store.posts.has(postId)) return false;
  store.posts.delete(postId);
  store.likesByUserId.forEach((set) => set.delete(postId));
  store.bookmarksByUserId.forEach((set) => set.delete(postId));
  return true;
};

