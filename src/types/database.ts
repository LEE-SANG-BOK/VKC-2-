import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import * as schema from '@/lib/db/schema';

// Select Types (DB에서 조회할 때)
export type User = InferSelectModel<typeof schema.users>;
export type Post = InferSelectModel<typeof schema.posts>;
export type Answer = InferSelectModel<typeof schema.answers>;
export type Comment = InferSelectModel<typeof schema.comments>;
export type Like = InferSelectModel<typeof schema.likes>;
export type Bookmark = InferSelectModel<typeof schema.bookmarks>;
export type VerificationRequest = InferSelectModel<typeof schema.verificationRequests>;
export type Notification = InferSelectModel<typeof schema.notifications>;
export type Follow = InferSelectModel<typeof schema.follows>;
export type PostView = InferSelectModel<typeof schema.postViews>;
export type Report = InferSelectModel<typeof schema.reports>;
export type File = InferSelectModel<typeof schema.files>;

// Insert Types (DB에 삽입할 때)
export type InsertUser = InferInsertModel<typeof schema.users>;
export type InsertPost = InferInsertModel<typeof schema.posts>;
export type InsertAnswer = InferInsertModel<typeof schema.answers>;
export type InsertComment = InferInsertModel<typeof schema.comments>;
export type InsertLike = InferInsertModel<typeof schema.likes>;
export type InsertBookmark = InferInsertModel<typeof schema.bookmarks>;
export type InsertVerificationRequest = InferInsertModel<typeof schema.verificationRequests>;
export type InsertNotification = InferInsertModel<typeof schema.notifications>;
export type InsertFollow = InferInsertModel<typeof schema.follows>;
export type InsertPostView = InferInsertModel<typeof schema.postViews>;
export type InsertReport = InferInsertModel<typeof schema.reports>;
export type InsertFile = InferInsertModel<typeof schema.files>;

// Extended Types (관계 포함)
export type PostWithAuthor = Post & {
  author: User;
};

export type PostWithDetails = Post & {
  author: User;
  answers: Answer[];
  _count: {
    answers: number;
    likes: number;
  };
};

export type AnswerWithAuthor = Answer & {
  author: User;
};

export type AnswerWithDetails = Answer & {
  author: User;
  comments: CommentWithAuthor[];
  _count: {
    comments: number;
    likes: number;
  };
};

export type CommentWithAuthor = Comment & {
  author: User;
};

export type NotificationWithDetails = Notification & {
  fromUser: User | null;
  post: Post | null;
  answer: Answer | null;
  comment: Comment | null;
};

export type UserWithStats = User & {
  _count: {
    posts: number;
    answers: number;
    followers: number;
    following: number;
  };
};

export type ReportWithDetails = Report & {
  reporter: User;
  reviewer: User | null;
  post: Post | null;
  answer: Answer | null;
  comment: Comment | null;
};

export type FileWithDetails = File & {
  uploader: User;
  post: Post | null;
  answer: Answer | null;
  comment: Comment | null;
};
