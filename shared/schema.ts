import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
  decimal,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("idx_session_expire").on(table.expire)],
);

// User storage table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: varchar("username").unique().notNull(),
  email: varchar("email").unique().notNull(),
  password: varchar("password").notNull(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  coinBalance: integer("coin_balance").default(0),
  isCreator: boolean("is_creator").default(false),
  isEliteReader: boolean("is_elite_reader").default(false),
  followersCount: integer("followers_count").default(0),
  emailVerified: boolean("email_verified").default(false),
  resetToken: varchar("reset_token"),
  resetTokenExpiry: timestamp("reset_token_expiry"),
  // Creator application fields
  creatorDisplayName: text("creator_display_name"),
  creatorBio: text("creator_bio"),
  creatorPortfolioUrl: text("creator_portfolio_url"),
  creatorSocialMediaUrl: text("creator_social_media_url"),
  creatorContentTypes: text("creator_content_types"), // JSON string array
  creatorExperience: text("creator_experience"),
  creatorMotivation: text("creator_motivation"),
  creatorApplicationStatus: text("creator_application_status"), // 'pending', 'approved', 'rejected'
  creatorApplicationDate: text("creator_application_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Enums
export const seriesTypeEnum = pgEnum('series_type', ['webtoon', 'manga', 'novel']);
export const seriesStatusEnum = pgEnum('series_status', ['ongoing', 'completed', 'hiatus']);
export const chapterStatusEnum = pgEnum('chapter_status', ['free', 'premium', 'scheduled']);

// Series table
export const series = pgTable("series", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  coverImageUrl: text("cover_image_url"),
  type: seriesTypeEnum("type").notNull(),
  status: seriesStatusEnum("status").default('ongoing'),
  authorId: varchar("author_id").notNull().references(() => users.id),
  groupId: varchar("group_id").references(() => groups.id),
  genres: text("genres").array(),
  tags: text("tags").array(),
  isNSFW: boolean("is_nsfw").default(false),
  viewCount: integer("view_count").default(0),
  likeCount: integer("like_count").default(0),
  bookmarkCount: integer("bookmark_count").default(0),
  rating: decimal("rating", { precision: 3, scale: 2 }).default('0.00'),
  ratingCount: integer("rating_count").default(0),
  chapterCount: integer("chapter_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Chapters table
export const chapters = pgTable("chapters", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  seriesId: varchar("series_id").notNull().references(() => series.id),
  title: text("title").notNull(),
  chapterNumber: integer("chapter_number").notNull(),
  content: jsonb("content"), // For novel text or image URLs
  status: chapterStatusEnum("status").default('free'),
  coinPrice: integer("coin_price").default(0),
  viewCount: integer("view_count").default(0),
  likeCount: integer("like_count").default(0),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Chapter unlocks table - tracks premium chapter access
export const chapterUnlocks = pgTable("chapter_unlocks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  chapterId: varchar("chapter_id").notNull().references(() => chapters.id),
  unlockedAt: timestamp("unlocked_at").defaultNow(),
});

// Groups table
export const groups = pgTable("groups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  bannerUrl: text("banner_url"),
  logoUrl: text("logo_url"),
  socialLinks: jsonb("social_links"),
  ownerId: varchar("owner_id").notNull().references(() => users.id),
  memberCount: integer("member_count").default(1),
  seriesCount: integer("series_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Group members table
export const groupMembers = pgTable("group_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  groupId: varchar("group_id").notNull().references(() => groups.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  role: varchar("role").notNull().default('contributor'), // owner, editor, translator, artist, contributor
  joinedAt: timestamp("joined_at").defaultNow(),
});

// Comments table
export const comments = pgTable("comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  chapterId: varchar("chapter_id").notNull().references(() => chapters.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  parentId: varchar("parent_id"),
  likeCount: integer("like_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Reviews table
export const reviews = pgTable("reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  seriesId: varchar("series_id").notNull().references(() => series.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  rating: integer("rating").notNull(), // 1-5 stars
  content: text("content"),
  likeCount: integer("like_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Follows table
export const follows = pgTable("follows", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  targetId: varchar("target_id").notNull(), // Can be user ID or series ID
  targetType: varchar("target_type").notNull(), // 'user' or 'series'
  createdAt: timestamp("created_at").defaultNow(),
});

// Bookmarks table
export const bookmarks = pgTable("bookmarks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  seriesId: varchar("series_id").notNull().references(() => series.id),
  folderId: varchar("folder_id").references(() => bookmarkFolders.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Bookmark folders table
export const bookmarkFolders = pgTable("bookmark_folders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Reading progress table
export const readingProgress = pgTable("reading_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  seriesId: varchar("series_id").notNull().references(() => series.id),
  chapterId: varchar("chapter_id").notNull().references(() => chapters.id),
  progress: decimal("progress", { precision: 5, scale: 2 }).default('0.00'), // 0-100%
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Transactions table
export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: varchar("type").notNull(), // 'purchase', 'unlock', 'reward'
  amount: integer("amount").notNull(),
  chapterId: varchar("chapter_id").references(() => chapters.id),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  series: many(series),
  comments: many(comments),
  reviews: many(reviews),
  follows: many(follows),
  bookmarks: many(bookmarks),
  readingProgress: many(readingProgress),
  transactions: many(transactions),
  ownedGroups: many(groups),
  groupMemberships: many(groupMembers),
}));

export const seriesRelations = relations(series, ({ one, many }) => ({
  author: one(users, {
    fields: [series.authorId],
    references: [users.id],
  }),
  group: one(groups, {
    fields: [series.groupId],
    references: [groups.id],
  }),
  chapters: many(chapters),
  reviews: many(reviews),
  bookmarks: many(bookmarks),
  readingProgress: many(readingProgress),
}));

export const chaptersRelations = relations(chapters, ({ one, many }) => ({
  series: one(series, {
    fields: [chapters.seriesId],
    references: [series.id],
  }),
  comments: many(comments),
  readingProgress: many(readingProgress),
  transactions: many(transactions),
}));

export const groupsRelations = relations(groups, ({ one, many }) => ({
  owner: one(users, {
    fields: [groups.ownerId],
    references: [users.id],
  }),
  members: many(groupMembers),
  series: many(series),
}));

export const commentsRelations = relations(comments, ({ one, many }) => ({
  chapter: one(chapters, {
    fields: [comments.chapterId],
    references: [chapters.id],
  }),
  user: one(users, {
    fields: [comments.userId],
    references: [users.id],
  }),
  parent: one(comments, {
    fields: [comments.parentId],
    references: [comments.id],
  }),
  replies: many(comments),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  series: one(series, {
    fields: [reviews.seriesId],
    references: [series.id],
  }),
  user: one(users, {
    fields: [reviews.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const registerUserSchema = insertUserSchema.pick({
  username: true,
  email: true,
  password: true,
  firstName: true,
  lastName: true,
}).extend({
  password: z.string().min(8, "Password must be at least 8 characters"),
  email: z.string().email("Invalid email address"),
  username: z.string().min(3, "Username must be at least 3 characters"),
});

export const loginUserSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export const insertSeriesSchema = createInsertSchema(series).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertChapterSchema = createInsertSchema(chapters).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCommentSchema = createInsertSchema(comments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type RegisterUser = z.infer<typeof registerUserSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;
export type Series = typeof series.$inferSelect;
export type InsertSeries = z.infer<typeof insertSeriesSchema>;
export type Chapter = typeof chapters.$inferSelect;
export type InsertChapter = z.infer<typeof insertChapterSchema>;
export type Group = typeof groups.$inferSelect;
export type Comment = typeof comments.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Follow = typeof follows.$inferSelect;
export type Bookmark = typeof bookmarks.$inferSelect;
export type ReadingProgress = typeof readingProgress.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
