import { db } from '@/lib/db';
import { notifications, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

type NotificationType = 'answer' | 'comment' | 'reply' | 'adoption' | 'like' | 'follow';

interface CreateNotificationParams {
  userId: string;
  senderId: string;
  type: NotificationType;
  content: string;
  postId?: string;
  answerId?: string;
  commentId?: string;
}

async function shouldNotify(userId: string, type: NotificationType): Promise<boolean> {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        notifyAnswers: true,
        notifyComments: true,
        notifyReplies: true,
        notifyAdoptions: true,
        notifyFollows: true,
      },
    });

    if (!user) return false;

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
  } catch {
    return true;
  }
}

export async function createNotification(params: CreateNotificationParams) {
  const { userId, senderId, type, content, postId, answerId, commentId } = params;

  if (userId === senderId) {
    return null;
  }

  const canNotify = await shouldNotify(userId, type);
  if (!canNotify) {
    return null;
  }

  try {
    const [notification] = await db.insert(notifications).values({
      userId,
      senderId,
      type,
      content,
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
    content: `${answerAuthorName}님이 "${postTitle}" 질문에 답변을 작성했습니다.`,
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
    content: `${commentAuthorName}님이 "${postTitle}" 게시글에 댓글을 남겼습니다.`,
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
    content: `${replyAuthorName}님이 회원님의 댓글에 답글을 남겼습니다. (${postTitle})`,
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
    content: `${postAuthorName}님이 "${postTitle}" 질문에서 회원님의 답변을 채택했습니다.`,
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
    content: `${followerName}님이 회원님을 팔로우했습니다.`,
  });
}
