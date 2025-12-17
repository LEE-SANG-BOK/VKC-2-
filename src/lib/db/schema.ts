import { pgTable, text, timestamp, integer, boolean, varchar, uuid, pgEnum, index, uniqueIndex, numeric } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const postTypeEnum = pgEnum('post_type', ['question', 'share']);
export const newsTypeEnum = pgEnum('news_type', ['post', 'cardnews', 'shorts']);
export const verificationStatusEnum = pgEnum('verification_status', ['pending', 'approved', 'rejected']);
export const notificationTypeEnum = pgEnum('notification_type', ['answer', 'comment', 'reply', 'adoption', 'like', 'follow']);
export const reportTypeEnum = pgEnum('report_type', ['spam', 'harassment', 'inappropriate', 'misinformation', 'other']);
export const reportStatusEnum = pgEnum('report_status', ['pending', 'reviewed', 'resolved', 'dismissed']);
export const fileTypeEnum = pgEnum('file_type', ['image', 'document', 'video']);
export const contentTargetEnum = pgEnum('content_target', ['post', 'answer', 'comment']);

// Users Table
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }),
  email: varchar('email', { length: 255 }).notNull().unique(),
  emailVerified: timestamp('emailVerified'),
  image: text('image'),
  displayName: varchar('display_name', { length: 100 }),
  bio: text('bio'),
  phone: varchar('phone', { length: 20 }),
  gender: varchar('gender', { length: 10 }),
  ageGroup: varchar('age_group', { length: 20 }),
  nationality: varchar('nationality', { length: 20 }),
  status: varchar('status', { length: 50 }),
  suspendedUntil: timestamp('suspended_until'),
  isVerified: boolean('is_verified').default(false).notNull(),
  verifiedRequestId: uuid('verified_request_id'),
  verifiedAt: timestamp('verified_at'),
  verifiedProfileSummary: text('verified_profile_summary'),
  verifiedProfileKeywords: text('verified_profile_keywords').array(),
  isProfileComplete: boolean('is_profile_complete').default(false).notNull(),
  onboardingCompleted: boolean('onboarding_completed').default(false).notNull(),
  koreanLevel: varchar('korean_level', { length: 20 }),
  emailNotifications: boolean('email_notifications').default(true).notNull(),
  pushNotifications: boolean('push_notifications').default(true).notNull(),
  notifyAnswers: boolean('notify_answers').default(true).notNull(),
  notifyComments: boolean('notify_comments').default(true).notNull(),
  notifyReplies: boolean('notify_replies').default(true).notNull(),
  notifyAdoptions: boolean('notify_adoptions').default(true).notNull(),
  notifyFollows: boolean('notify_follows').default(true).notNull(),
  userType: varchar('user_type', { length: 50 }),
  visaType: varchar('visa_type', { length: 50 }),
  interests: text('interests').array(),
  preferredLanguage: varchar('preferred_language', { length: 5 }).default('vi'),
  badgeType: varchar('badge_type', { length: 50 }),
  trustScore: integer('trust_score').default(0).notNull(),
  helpfulAnswers: integer('helpful_answers').default(0).notNull(),
  adoptionRate: numeric('adoption_rate', { precision: 5, scale: 2 }).default('0').notNull(),
  isExpert: boolean('is_expert').default(false).notNull(),
  lastLoginAt: timestamp('last_login_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  emailIdx: uniqueIndex('email_idx').on(table.email),
  lastLoginAtIdx: index('users_last_login_at_idx').on(table.lastLoginAt),
}));

// NextAuth Tables
export const accounts = pgTable('account', {
  userId: uuid('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 255 }).notNull(),
  provider: varchar('provider', { length: 255 }).notNull(),
  providerAccountId: varchar('providerAccountId', { length: 255 }).notNull(),
  refresh_token: text('refresh_token'),
  access_token: text('access_token'),
  expires_at: integer('expires_at'),
  token_type: varchar('token_type', { length: 255 }),
  scope: varchar('scope', { length: 255 }),
  id_token: text('id_token'),
  session_state: varchar('session_state', { length: 255 }),
}, (table) => ({
  compoundKey: uniqueIndex('account_provider_providerAccountId_idx').on(table.provider, table.providerAccountId),
}));

export const sessions = pgTable('session', {
  sessionToken: varchar('sessionToken', { length: 255 }).notNull().primaryKey(),
  userId: uuid('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires').notNull(),
});

export const verificationTokens = pgTable('verificationToken', {
  identifier: varchar('identifier', { length: 255 }).notNull(),
  token: varchar('token', { length: 255 }).notNull(),
  expires: timestamp('expires').notNull(),
}, (table) => ({
  compoundKey: uniqueIndex('verificationToken_identifier_token_idx').on(table.identifier, table.token),
}));

// Posts Table
export const posts = pgTable('posts', {
  id: uuid('id').defaultRandom().primaryKey(),
  authorId: uuid('author_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  type: postTypeEnum('type').notNull(),
  title: varchar('title', { length: 500 }).notNull(),
  content: text('content').notNull(),
  category: varchar('category', { length: 50 }).notNull(),
  subcategory: varchar('subcategory', { length: 50 }),
  tags: text('tags').array(),
  views: integer('views').default(0).notNull(),
  likes: integer('likes').default(0).notNull(),
  isResolved: boolean('is_resolved').default(false).notNull(),
  adoptedAnswerId: uuid('adopted_answer_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  authorIdx: index('posts_author_idx').on(table.authorId),
  categoryIdx: index('posts_category_idx').on(table.category),
  createdAtIdx: index('posts_created_at_idx').on(table.createdAt),
  typeIdx: index('posts_type_idx').on(table.type),
}));

// Answers Table
export const answers = pgTable('answers', {
  id: uuid('id').defaultRandom().primaryKey(),
  postId: uuid('post_id').references(() => posts.id, { onDelete: 'cascade' }).notNull(),
  authorId: uuid('author_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  content: text('content').notNull(),
  likes: integer('likes').default(0).notNull(),
  isAdopted: boolean('is_adopted').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  postIdx: index('answers_post_idx').on(table.postId),
  authorIdx: index('answers_author_idx').on(table.authorId),
}));

// Comments Table (게시글/답변에 대한 댓글 및 대댓글)
export const comments = pgTable('comments', {
  id: uuid('id').defaultRandom().primaryKey(),
  postId: uuid('post_id').references(() => posts.id, { onDelete: 'cascade' }),
  answerId: uuid('answer_id').references(() => answers.id, { onDelete: 'cascade' }),
  parentId: uuid('parent_id'),
  authorId: uuid('author_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  content: text('content').notNull(),
  likes: integer('likes').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  postIdx: index('comments_post_idx').on(table.postId),
  answerIdx: index('comments_answer_idx').on(table.answerId),
  parentIdx: index('comments_parent_idx').on(table.parentId),
  authorIdx: index('comments_author_idx').on(table.authorId),
}));

// Likes Table (게시글, 답변, 댓글 좋아요)
export const likes = pgTable('likes', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  postId: uuid('post_id').references(() => posts.id, { onDelete: 'cascade' }),
  answerId: uuid('answer_id').references(() => answers.id, { onDelete: 'cascade' }),
  commentId: uuid('comment_id').references(() => comments.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userPostIdx: uniqueIndex('likes_user_post_idx').on(table.userId, table.postId),
  userAnswerIdx: uniqueIndex('likes_user_answer_idx').on(table.userId, table.answerId),
  userCommentIdx: uniqueIndex('likes_user_comment_idx').on(table.userId, table.commentId),
}));

// Bookmarks Table
export const bookmarks = pgTable('bookmarks', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  postId: uuid('post_id').references(() => posts.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userPostIdx: uniqueIndex('bookmarks_user_post_idx').on(table.userId, table.postId),
  userCreatedAtIdx: index('bookmarks_user_created_at_id_idx').on(table.userId, table.createdAt, table.id),
}));

// Verification Requests Table
export const verificationRequests = pgTable('verification_requests', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  type: varchar('type', { length: 50 }).notNull(),
  documentUrls: text('document_urls').array(),
  visaType: varchar('visa_type', { length: 50 }),
  universityName: varchar('university_name', { length: 150 }),
  universityEmail: varchar('university_email', { length: 150 }),
  industry: varchar('industry', { length: 100 }),
  companyName: varchar('company_name', { length: 150 }),
  jobTitle: varchar('job_title', { length: 150 }),
  extraInfo: text('extra_info'),
  status: verificationStatusEnum('status').default('pending').notNull(),
  reason: text('reason'),
  submittedAt: timestamp('submitted_at').defaultNow().notNull(),
  reviewedAt: timestamp('reviewed_at'),
  reviewedBy: uuid('reviewed_by').references(() => users.id),
}, (table) => ({
  userIdx: index('verification_requests_user_idx').on(table.userId),
  statusIdx: index('verification_requests_status_idx').on(table.status),
}));

// Categories Table (카테고리 관리)
export const categories = pgTable('categories', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  description: text('description'),
  icon: text('icon'),
  parentId: uuid('parent_id').references((): any => categories.id, { onDelete: 'cascade' }),
  order: integer('order').default(0).notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  slugIdx: uniqueIndex('categories_slug_idx').on(table.slug),
  parentIdx: index('categories_parent_idx').on(table.parentId),
  orderIdx: index('categories_order_idx').on(table.order),
  sortOrderIdx: index('categories_sort_order_idx').on(table.sortOrder),
}));

// Follows Table (팔로우 시스템)
export const follows = pgTable('follows', {
  id: uuid('id').defaultRandom().primaryKey(),
  followerId: uuid('follower_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  followingId: uuid('following_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  followerFollowingIdx: uniqueIndex('follows_follower_following_idx').on(table.followerId, table.followingId),
  followerIdx: index('follows_follower_idx').on(table.followerId),
  followingIdx: index('follows_following_idx').on(table.followingId),
  followerCreatedAtIdx: index('follows_follower_created_at_id_idx').on(table.followerId, table.createdAt, table.id),
  followingCreatedAtIdx: index('follows_following_created_at_id_idx').on(table.followingId, table.createdAt, table.id),
}));

// Post Views Table (조회수 추적)
export const postViews = pgTable('post_views', {
  id: uuid('id').defaultRandom().primaryKey(),
  postId: uuid('post_id').references(() => posts.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  postIdx: index('post_views_post_idx').on(table.postId),
  userIdx: index('post_views_user_idx').on(table.userId),
  createdAtIdx: index('post_views_created_at_idx').on(table.createdAt),
}));

// Reports Table (신고 시스템)
export const reports = pgTable('reports', {
  id: uuid('id').defaultRandom().primaryKey(),
  reporterId: uuid('reporter_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  type: reportTypeEnum('type').notNull(),
  status: reportStatusEnum('status').default('pending').notNull(),
  reason: text('reason').notNull(),
  postId: uuid('post_id').references(() => posts.id, { onDelete: 'cascade' }),
  answerId: uuid('answer_id').references(() => answers.id, { onDelete: 'cascade' }),
  commentId: uuid('comment_id').references(() => comments.id, { onDelete: 'cascade' }),
  reviewedBy: uuid('reviewed_by').references(() => users.id),
  reviewNote: text('review_note'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  reporterIdx: index('reports_reporter_idx').on(table.reporterId),
  statusIdx: index('reports_status_idx').on(table.status),
  typeIdx: index('reports_type_idx').on(table.type),
}));

export const topicSubscriptions = pgTable('topic_subscriptions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  uniqUserCategoryIdx: uniqueIndex('topic_subscriptions_user_category_idx').on(table.userId, table.categoryId),
  userIdx: index('topic_subscriptions_user_idx').on(table.userId),
  categoryIdx: index('topic_subscriptions_category_idx').on(table.categoryId),
}));

export const visaJobs = pgTable('visa_jobs', {
  id: uuid('id').defaultRandom().primaryKey(),
  code: varchar('code', { length: 50 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  visaType: varchar('visa_type', { length: 20 }).notNull(),
  minSalary: integer('min_salary'),
  locale: varchar('locale', { length: 5 }).default('vi').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  codeLocaleIdx: uniqueIndex('visa_jobs_code_locale_idx').on(table.code, table.locale),
  visaTypeIdx: index('visa_jobs_visa_type_idx').on(table.visaType),
}));

export const visaRequirements = pgTable('visa_requirements', {
  id: uuid('id').defaultRandom().primaryKey(),
  visaType: varchar('visa_type', { length: 20 }).notNull(),
  requirement: text('requirement').notNull(),
  weight: integer('weight').default(0).notNull(),
  locale: varchar('locale', { length: 5 }).default('vi').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  visaTypeIdx: index('visa_requirements_visa_type_idx').on(table.visaType),
  localeIdx: index('visa_requirements_locale_idx').on(table.locale),
}));

export const contentReports = pgTable('content_reports', {
  id: uuid('id').defaultRandom().primaryKey(),
  reporterId: uuid('reporter_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  targetType: contentTargetEnum('target_type').notNull(),
  targetId: uuid('target_id').notNull(),
  type: reportTypeEnum('type').notNull(),
  status: reportStatusEnum('status').default('pending').notNull(),
  reason: text('reason').notNull(),
  handledBy: uuid('handled_by').references(() => users.id),
  handledAt: timestamp('handled_at'),
  reviewNote: text('review_note'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  reporterIdx: index('content_reports_reporter_idx').on(table.reporterId),
  targetIdx: index('content_reports_target_idx').on(table.targetType, table.targetId),
  statusIdx: index('content_reports_status_idx').on(table.status),
  reporterTargetIdx: uniqueIndex('content_reports_reporter_target_idx').on(table.reporterId, table.targetType, table.targetId),
}));

// Files Table (파일 업로드)
export const files = pgTable('files', {
  id: uuid('id').defaultRandom().primaryKey(),
  uploaderId: uuid('uploader_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  type: fileTypeEnum('type').notNull(),
  filename: varchar('filename', { length: 255 }).notNull(),
  originalName: varchar('original_name', { length: 255 }).notNull(),
  mimeType: varchar('mime_type', { length: 100 }).notNull(),
  size: integer('size').notNull(),
  url: text('url').notNull(),
  postId: uuid('post_id').references(() => posts.id, { onDelete: 'cascade' }),
  answerId: uuid('answer_id').references(() => answers.id, { onDelete: 'cascade' }),
  commentId: uuid('comment_id').references(() => comments.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  uploaderIdx: index('files_uploader_idx').on(table.uploaderId),
  postIdx: index('files_post_idx').on(table.postId),
  answerIdx: index('files_answer_idx').on(table.answerId),
  commentIdx: index('files_comment_idx').on(table.commentId),
}));

// Notifications Table
export const notifications = pgTable('notifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  type: notificationTypeEnum('type').notNull(),
  postId: uuid('post_id').references(() => posts.id, { onDelete: 'cascade' }),
  answerId: uuid('answer_id').references(() => answers.id, { onDelete: 'cascade' }),
  commentId: uuid('comment_id').references(() => comments.id, { onDelete: 'cascade' }),
  senderId: uuid('sender_id').references(() => users.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  isRead: boolean('is_read').default(false).notNull(),
  readAt: timestamp('read_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdx: index('notifications_user_idx').on(table.userId),
  isReadIdx: index('notifications_is_read_idx').on(table.isRead),
  createdAtIdx: index('notifications_created_at_idx').on(table.createdAt),
}));

// Category Subscriptions Table (카테고리 구독)
export const categorySubscriptions = pgTable('category_subscriptions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdx: index('category_subscriptions_user_idx').on(table.userId),
  categoryIdx: index('category_subscriptions_category_idx').on(table.categoryId),
  uniqueSubscription: index('category_subscriptions_unique').on(table.userId, table.categoryId),
}));

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  posts: many(posts),
  answers: many(answers),
  comments: many(comments),
  likes: many(likes),
  bookmarks: many(bookmarks),
  verificationRequests: many(verificationRequests),
  verifiedRequest: one(verificationRequests, {
    fields: [users.verifiedRequestId],
    references: [verificationRequests.id],
  }),
  notifications: many(notifications),
  categorySubscriptions: many(categorySubscriptions),
  followers: many(follows, { relationName: 'following' }),
  following: many(follows, { relationName: 'follower' }),
  reports: many(reports),
  files: many(files),
  postViews: many(postViews),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  author: one(users, {
    fields: [posts.authorId],
    references: [users.id],
  }),
  answers: many(answers),
  comments: many(comments),
  likes: many(likes),
  bookmarks: many(bookmarks),
  notifications: many(notifications),
  reports: many(reports),
  files: many(files),
  views: many(postViews),
}));

export const answersRelations = relations(answers, ({ one, many }) => ({
  post: one(posts, {
    fields: [answers.postId],
    references: [posts.id],
  }),
  author: one(users, {
    fields: [answers.authorId],
    references: [users.id],
  }),
  comments: many(comments),
  likes: many(likes),
  notifications: many(notifications),
  reports: many(reports),
  files: many(files),
}));

export const commentsRelations = relations(comments, ({ one, many }) => ({
  post: one(posts, {
    fields: [comments.postId],
    references: [posts.id],
  }),
  answer: one(answers, {
    fields: [comments.answerId],
    references: [answers.id],
  }),
  parent: one(comments, {
    fields: [comments.parentId],
    references: [comments.id],
    relationName: 'replies',
  }),
  replies: many(comments, { relationName: 'replies' }),
  author: one(users, {
    fields: [comments.authorId],
    references: [users.id],
  }),
  likes: many(likes),
  notifications: many(notifications),
  reports: many(reports),
  files: many(files),
}));

export const likesRelations = relations(likes, ({ one }) => ({
  user: one(users, {
    fields: [likes.userId],
    references: [users.id],
  }),
  post: one(posts, {
    fields: [likes.postId],
    references: [posts.id],
  }),
  answer: one(answers, {
    fields: [likes.answerId],
    references: [answers.id],
  }),
  comment: one(comments, {
    fields: [likes.commentId],
    references: [comments.id],
  }),
}));

export const bookmarksRelations = relations(bookmarks, ({ one }) => ({
  user: one(users, {
    fields: [bookmarks.userId],
    references: [users.id],
  }),
  post: one(posts, {
    fields: [bookmarks.postId],
    references: [posts.id],
  }),
}));

export const verificationRequestsRelations = relations(verificationRequests, ({ one }) => ({
  user: one(users, {
    fields: [verificationRequests.userId],
    references: [users.id],
  }),
  reviewer: one(users, {
    fields: [verificationRequests.reviewedBy],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
  sender: one(users, {
    fields: [notifications.senderId],
    references: [users.id],
  }),
  post: one(posts, {
    fields: [notifications.postId],
    references: [posts.id],
  }),
  answer: one(answers, {
    fields: [notifications.answerId],
    references: [answers.id],
  }),
  comment: one(comments, {
    fields: [notifications.commentId],
    references: [comments.id],
  }),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
    relationName: 'parent',
  }),
  children: many(categories, { relationName: 'parent' }),
}));

export const followsRelations = relations(follows, ({ one }) => ({
  follower: one(users, {
    fields: [follows.followerId],
    references: [users.id],
    relationName: 'follower',
  }),
  following: one(users, {
    fields: [follows.followingId],
    references: [users.id],
    relationName: 'following',
  }),
}));

export const postViewsRelations = relations(postViews, ({ one }) => ({
  post: one(posts, {
    fields: [postViews.postId],
    references: [posts.id],
  }),
  user: one(users, {
    fields: [postViews.userId],
    references: [users.id],
  }),
}));

export const reportsRelations = relations(reports, ({ one }) => ({
  reporter: one(users, {
    fields: [reports.reporterId],
    references: [users.id],
  }),
  reviewer: one(users, {
    fields: [reports.reviewedBy],
    references: [users.id],
  }),
  post: one(posts, {
    fields: [reports.postId],
    references: [posts.id],
  }),
  answer: one(answers, {
    fields: [reports.answerId],
    references: [answers.id],
  }),
  comment: one(comments, {
    fields: [reports.commentId],
    references: [comments.id],
  }),
}));

export const filesRelations = relations(files, ({ one }) => ({
  uploader: one(users, {
    fields: [files.uploaderId],
    references: [users.id],
  }),
  post: one(posts, {
    fields: [files.postId],
    references: [posts.id],
  }),
  answer: one(answers, {
    fields: [files.answerId],
    references: [answers.id],
  }),
  comment: one(comments, {
    fields: [files.commentId],
    references: [comments.id],
  }),
}));

export const categorySubscriptionsRelations = relations(categorySubscriptions, ({ one }) => ({
  user: one(users, {
    fields: [categorySubscriptions.userId],
    references: [users.id],
  }),
  category: one(categories, {
    fields: [categorySubscriptions.categoryId],
    references: [categories.id],
  }),
}));

export const topicSubscriptionsRelations = relations(topicSubscriptions, ({ one }) => ({
  user: one(users, {
    fields: [topicSubscriptions.userId],
    references: [users.id],
  }),
  category: one(categories, {
    fields: [topicSubscriptions.categoryId],
    references: [categories.id],
  }),
}));

// News Table (관리자 뉴스)
export const news = pgTable('news', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  category: varchar('category', { length: 50 }).notNull(),
  language: varchar('language', { length: 5 }).default('vi').notNull(),
  type: newsTypeEnum('type').default('post').notNull(),
  content: text('content').default('').notNull(),
  imageUrl: text('image_url'),
  linkUrl: text('link_url'),
  isActive: boolean('is_active').default(true).notNull(),
  order: integer('order').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  isActiveIdx: index('news_is_active_idx').on(table.isActive),
  orderIdx: index('news_order_idx').on(table.order),
  createdAtIdx: index('news_created_at_idx').on(table.createdAt),
}));
