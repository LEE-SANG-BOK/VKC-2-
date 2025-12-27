import dayjs from 'dayjs';
import type { E2EAnswer, E2EComment, E2EStore } from './store';

export const formatE2EDate = (value: string) => dayjs(value).format('YYYY.MM.DD HH:mm');

export const buildE2EAuthor = (store: E2EStore, authorId: string) => {
  const user = store.users.get(authorId);
  return {
    id: authorId,
    name: user?.displayName || user?.name || '알 수 없음',
    displayName: user?.displayName || user?.name || undefined,
    image: user?.image || undefined,
    isVerified: user?.isVerified || false,
    isExpert: user?.isExpert || false,
  };
};

export const buildE2ECommentTree = (store: E2EStore, items: E2EComment[]) => {
  const byParent = new Map<string | null, E2EComment[]>();
  items.forEach((comment) => {
    const key = comment.parentId ?? null;
    const list = byParent.get(key) || [];
    list.push(comment);
    byParent.set(key, list);
  });

  byParent.forEach((list) => {
    list.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  });

  const build = (parentId: string | null): any[] => {
    const list = byParent.get(parentId) || [];
    return list.map((comment) => ({
      id: comment.id,
      postId: comment.postId || undefined,
      answerId: comment.answerId || undefined,
      parentId: comment.parentId || undefined,
      authorId: comment.authorId,
      content: comment.content,
      likes: comment.likes,
      createdAt: formatE2EDate(comment.createdAt),
      updatedAt: formatE2EDate(comment.updatedAt),
      author: buildE2EAuthor(store, comment.authorId),
      replies: build(comment.id),
    }));
  };

  return build(null);
};

export const buildE2EAnswer = (store: E2EStore, answer: E2EAnswer, options?: { includeComments?: boolean }) => {
  const comments = options?.includeComments
    ? buildE2ECommentTree(
        store,
        Array.from(store.comments.values()).filter((comment) => comment.answerId === answer.id)
      )
    : undefined;

  return {
    id: answer.id,
    postId: answer.postId,
    authorId: answer.authorId,
    content: answer.content,
    likes: answer.likes,
    isAdopted: answer.isAdopted,
    isOfficial: false,
    reviewStatus: 'approved' as const,
    createdAt: formatE2EDate(answer.createdAt),
    updatedAt: formatE2EDate(answer.updatedAt),
    author: buildE2EAuthor(store, answer.authorId),
    comments,
  };
};

