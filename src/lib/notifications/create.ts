import { db } from '@/lib/db';
import { notifications, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

type NotificationType = 'answer' | 'comment' | 'reply' | 'adoption' | 'like' | 'follow';
type NotificationLocale = 'ko' | 'vi';

interface CreateNotificationParams {
  userId: string;
  senderId: string;
  type: NotificationType;
  content: string | ((locale: NotificationLocale) => string);
  postId?: string;
  answerId?: string;
  commentId?: string;
}

const resolveNotificationLocale = (preferredLanguage: string | null | undefined): NotificationLocale => {
  if (preferredLanguage === 'vi') return 'vi';
  return 'ko';
};

const notificationTemplates = {
  ko: {
    answer: ({ authorName, postTitle }: { authorName: string; postTitle: string }) =>
      `${authorName}님이 "${postTitle}" 질문에 답변을 작성했습니다.`,
    comment: ({ authorName, postTitle }: { authorName: string; postTitle: string }) =>
      `${authorName}님이 "${postTitle}" 게시글에 댓글을 남겼습니다.`,
    reply: ({ authorName, postTitle }: { authorName: string; postTitle: string }) =>
      `${authorName}님이 회원님의 댓글에 답글을 남겼습니다. (${postTitle})`,
    adoption: ({ authorName, postTitle }: { authorName: string; postTitle: string }) =>
      `${authorName}님이 "${postTitle}" 질문에서 회원님의 답변을 채택했습니다.`,
    follow: ({ authorName }: { authorName: string }) =>
      `${authorName}님이 회원님을 팔로우했습니다.`,
  },
  vi: {
    answer: ({ authorName, postTitle }: { authorName: string; postTitle: string }) =>
      `${authorName} đã trả lời câu hỏi “${postTitle}”.`,
    comment: ({ authorName, postTitle }: { authorName: string; postTitle: string }) =>
      `${authorName} đã bình luận về bài viết “${postTitle}”.`,
    reply: ({ authorName, postTitle }: { authorName: string; postTitle: string }) =>
      `${authorName} đã trả lời bình luận của bạn. (${postTitle})`,
    adoption: ({ authorName, postTitle }: { authorName: string; postTitle: string }) =>
      `${authorName} đã chọn câu trả lời của bạn cho câu hỏi “${postTitle}”.`,
    follow: ({ authorName }: { authorName: string }) =>
      `${authorName} đã theo dõi bạn.`,
  },
} as const;

async function getNotificationPreferences(userId: string, type: NotificationType): Promise<{ canNotify: boolean; locale: NotificationLocale }> {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        notifyAnswers: true,
        notifyComments: true,
        notifyReplies: true,
        notifyAdoptions: true,
        notifyFollows: true,
        preferredLanguage: true,
      },
    });

    if (!user) {
      return { canNotify: false, locale: 'vi' };
    }

    const locale = resolveNotificationLocale(user.preferredLanguage || null);
    const canNotify = (() => {
      switch (type) {
      case 'answer':
          return user.notifyAnswers;
      case 'comment':
          return user.notifyComments;
      case 'reply':
          return user.notifyReplies;
      case 'adoption':
          return user.notifyAdoptions;
      case 'follow':
          return user.notifyFollows;
      default:
          return true;
      }
    })();

    return { canNotify, locale };
  } catch {
    return { canNotify: true, locale: 'vi' };
  }
}

export async function createNotification(params: CreateNotificationParams) {
  const { userId, senderId, type, content, postId, answerId, commentId } = params;

  if (userId === senderId) {
    return null;
  }

  const preferences = await getNotificationPreferences(userId, type);
  if (!preferences.canNotify) {
    return null;
  }

  try {
    const resolvedContent = typeof content === 'function' ? content(preferences.locale) : content;
    const [notification] = await db.insert(notifications).values({
      userId,
      senderId,
      type,
      content: resolvedContent,
      postId: postId || null,
      answerId: answerId || null,
      commentId: commentId || null,
    }).returning();

    return notification;
  } catch (error) {
    console.error('Failed to create notification:', error);
    return null;
  }
}

export async function createAnswerNotification(
  postAuthorId: string,
  answerAuthorId: string,
  answerAuthorName: string,
  postId: string,
  postTitle: string,
  answerId: string
) {
  return createNotification({
    userId: postAuthorId,
    senderId: answerAuthorId,
    type: 'answer',
    content: (locale) => notificationTemplates[locale].answer({ authorName: answerAuthorName, postTitle }),
    postId,
    answerId,
  });
}

export async function createCommentNotification(
  postAuthorId: string,
  commentAuthorId: string,
  commentAuthorName: string,
  postId: string,
  postTitle: string,
  commentId: string
) {
  return createNotification({
    userId: postAuthorId,
    senderId: commentAuthorId,
    type: 'comment',
    content: (locale) => notificationTemplates[locale].comment({ authorName: commentAuthorName, postTitle }),
    postId,
    commentId,
  });
}

export async function createReplyNotification(
  parentCommentAuthorId: string,
  replyAuthorId: string,
  replyAuthorName: string,
  postId: string,
  postTitle: string,
  commentId: string
) {
  return createNotification({
    userId: parentCommentAuthorId,
    senderId: replyAuthorId,
    type: 'reply',
    content: (locale) => notificationTemplates[locale].reply({ authorName: replyAuthorName, postTitle }),
    postId,
    commentId,
  });
}

export async function createAdoptionNotification(
  answerAuthorId: string,
  postAuthorId: string,
  postAuthorName: string,
  postId: string,
  postTitle: string,
  answerId: string
) {
  return createNotification({
    userId: answerAuthorId,
    senderId: postAuthorId,
    type: 'adoption',
    content: (locale) => notificationTemplates[locale].adoption({ authorName: postAuthorName, postTitle }),
    postId,
    answerId,
  });
}

export async function createFollowNotification(
  targetUserId: string,
  followerId: string,
  followerName: string
) {
  return createNotification({
    userId: targetUserId,
    senderId: followerId,
    type: 'follow',
    content: (locale) => notificationTemplates[locale].follow({ authorName: followerName }),
  });
}
