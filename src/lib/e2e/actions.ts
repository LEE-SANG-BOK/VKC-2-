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
    adoptedAnswerId: null,
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

  Array.from(store.answers.values()).forEach((answer) => {
    if (answer.postId !== postId) return;
    store.answers.delete(answer.id);
    store.answerLikesByUserId.forEach((set) => set.delete(answer.id));
  });

  Array.from(store.comments.values()).forEach((comment) => {
    if (comment.postId !== postId) return;
    store.comments.delete(comment.id);
    store.commentLikesByUserId.forEach((set) => set.delete(comment.id));
  });

  return true;
};

export const toggleAnswerLike = (store: E2EStore, userId: string, answerId: string) => {
  const answer = store.answers.get(answerId);
  if (!answer) return null;

  const set = getOrCreateSet(store.answerLikesByUserId, userId);
  const nextIsLiked = !set.has(answerId);
  if (nextIsLiked) {
    set.add(answerId);
    answer.likes = answer.likes + 1;
  } else {
    set.delete(answerId);
    answer.likes = Math.max(0, answer.likes - 1);
  }
  answer.updatedAt = new Date().toISOString();
  store.answers.set(answer.id, answer);
  return { isLiked: nextIsLiked, likes: answer.likes };
};

export const toggleCommentLike = (store: E2EStore, userId: string, commentId: string) => {
  const comment = store.comments.get(commentId);
  if (!comment) return null;

  const set = getOrCreateSet(store.commentLikesByUserId, userId);
  const nextIsLiked = !set.has(commentId);
  if (nextIsLiked) {
    set.add(commentId);
    comment.likes = comment.likes + 1;
  } else {
    set.delete(commentId);
    comment.likes = Math.max(0, comment.likes - 1);
  }
  comment.updatedAt = new Date().toISOString();
  store.comments.set(comment.id, comment);
  return { isLiked: nextIsLiked, likes: comment.likes };
};

export const createAnswer = (
  store: E2EStore,
  namespace: string,
  authorId: string,
  postId: string,
  content: string
) => {
  const now = new Date().toISOString();
  const id = `${namespace}-answer-${store.nextAnswerNumber}`;
  store.nextAnswerNumber += 1;

  const answer = {
    id,
    postId,
    authorId,
    content,
    likes: 0,
    isAdopted: false,
    createdAt: now,
    updatedAt: now,
  };

  store.answers.set(answer.id, answer);
  return answer;
};

export const updateAnswer = (store: E2EStore, answerId: string, content: string) => {
  const answer = store.answers.get(answerId);
  if (!answer) return null;
  const next = {
    ...answer,
    content,
    updatedAt: new Date().toISOString(),
  };
  store.answers.set(next.id, next);
  return next;
};

export const deleteAnswer = (store: E2EStore, answerId: string) => {
  const answer = store.answers.get(answerId);
  if (!answer) return false;
  if (answer.isAdopted) return false;

  store.answers.delete(answerId);
  store.answerLikesByUserId.forEach((set) => set.delete(answerId));

  const post = store.posts.get(answer.postId);
  if (post?.adoptedAnswerId === answerId) {
    post.adoptedAnswerId = null;
    post.isResolved = false;
    post.updatedAt = new Date().toISOString();
    store.posts.set(post.id, post);
  }

  Array.from(store.comments.values()).forEach((comment) => {
    if (comment.answerId !== answerId) return;
    store.comments.delete(comment.id);
    store.commentLikesByUserId.forEach((set) => set.delete(comment.id));
  });

  return true;
};

export const adoptAnswer = (store: E2EStore, viewerId: string, answerId: string) => {
  const answer = store.answers.get(answerId);
  if (!answer) return { ok: false as const, code: 'ANSWER_NOT_FOUND' as const };

  const post = store.posts.get(answer.postId);
  if (!post) return { ok: false as const, code: 'POST_NOT_FOUND' as const };

  if (post.authorId !== viewerId) return { ok: false as const, code: 'FORBIDDEN' as const };
  if (answer.authorId === viewerId) return { ok: false as const, code: 'SELF_ADOPT' as const };

  const adoptedAnswerId = post.adoptedAnswerId;
  if (adoptedAnswerId && adoptedAnswerId !== answerId) {
    const prev = store.answers.get(adoptedAnswerId);
    if (prev) {
      prev.isAdopted = false;
      prev.updatedAt = new Date().toISOString();
      store.answers.set(prev.id, prev);
    }
  }

  answer.isAdopted = true;
  answer.updatedAt = new Date().toISOString();
  store.answers.set(answer.id, answer);

  post.adoptedAnswerId = answerId;
  post.isResolved = true;
  post.updatedAt = new Date().toISOString();
  store.posts.set(post.id, post);

  return { ok: true as const, postId: post.id, answerId: answer.id };
};

export const cancelAdoptAnswer = (store: E2EStore, viewerId: string, answerId: string) => {
  const answer = store.answers.get(answerId);
  if (!answer) return { ok: false as const, code: 'ANSWER_NOT_FOUND' as const };

  const post = store.posts.get(answer.postId);
  if (!post) return { ok: false as const, code: 'POST_NOT_FOUND' as const };

  if (post.authorId !== viewerId) return { ok: false as const, code: 'FORBIDDEN' as const };
  if (!answer.isAdopted) return { ok: false as const, code: 'NOT_ADOPTED' as const };

  answer.isAdopted = false;
  answer.updatedAt = new Date().toISOString();
  store.answers.set(answer.id, answer);

  post.adoptedAnswerId = null;
  post.isResolved = false;
  post.updatedAt = new Date().toISOString();
  store.posts.set(post.id, post);

  return { ok: true as const };
};

export const createComment = (
  store: E2EStore,
  namespace: string,
  authorId: string,
  options: { postId: string | null; answerId: string | null; parentId?: string | null },
  content: string
) => {
  const now = new Date().toISOString();
  const id = `${namespace}-comment-${store.nextCommentNumber}`;
  store.nextCommentNumber += 1;

  const comment = {
    id,
    postId: options.postId,
    answerId: options.answerId,
    parentId: options.parentId ?? null,
    authorId,
    content,
    likes: 0,
    createdAt: now,
    updatedAt: now,
  };

  store.comments.set(comment.id, comment);
  return comment;
};

export const updateComment = (store: E2EStore, commentId: string, content: string) => {
  const comment = store.comments.get(commentId);
  if (!comment) return null;
  const next = {
    ...comment,
    content,
    updatedAt: new Date().toISOString(),
  };
  store.comments.set(next.id, next);
  return next;
};

export const deleteComment = (store: E2EStore, commentId: string) => {
  const comment = store.comments.get(commentId);
  if (!comment) return false;

  store.comments.delete(commentId);
  store.commentLikesByUserId.forEach((set) => set.delete(commentId));

  Array.from(store.comments.values()).forEach((child) => {
    if (child.parentId !== commentId) return;
    store.comments.delete(child.id);
    store.commentLikesByUserId.forEach((set) => set.delete(child.id));
  });

  return true;
};

export const createFeedback = (
  store: E2EStore,
  namespace: string,
  userId: string | null,
  payload: {
    type: 'feedback' | 'bug';
    content: string;
    pageUrl: string | null;
    contactEmail: string | null;
    userAgent: string;
  }
) => {
  const now = new Date().toISOString();
  const id = `${namespace}-feedback-${store.nextFeedbackNumber}`;
  store.nextFeedbackNumber += 1;

  const feedback = {
    id,
    userId,
    type: payload.type,
    content: payload.content,
    pageUrl: payload.pageUrl,
    contactEmail: payload.contactEmail,
    userAgent: payload.userAgent,
    createdAt: now,
  };

  store.feedbacks.set(id, feedback);
  return feedback;
};
