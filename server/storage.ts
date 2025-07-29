import {
  users,
  series,
  chapters,
  chapterUnlocks,
  comments,
  reviews,
  follows,
  bookmarks,
  readingProgress,
  transactions,
  groups,
  groupMembers,
  type User,
  type UpsertUser,
  type InsertUser,
  type Series,
  type InsertSeries,
  type Chapter,
  type InsertChapter,
  type Comment,
  type InsertComment,
  type Review,
  type InsertReview,
  type Group,
  type Follow,
  type Bookmark,
  type ReadingProgress,
  type Transaction,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc, and, or, like, sql, inArray } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";

export interface IStorage {
  // Session store
  sessionStore: any;
  
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Series operations
  getSeries(id: string): Promise<Series | undefined>;
  getSeriesList(filters?: { type?: string; status?: string; genre?: string; limit?: number }): Promise<Series[]>;
  createSeries(series: InsertSeries): Promise<Series>;
  updateSeries(id: string, updates: Partial<InsertSeries>): Promise<Series>;
  getSeriesByAuthor(authorId: string): Promise<Series[]>;
  getTrendingSeries(filters?: { timeframe?: string; limit?: number }): Promise<Series[]>;
  getRisingSeries(filters?: { timeframe?: string; limit?: number }): Promise<Series[]>;
  getTrendingCreators(filters?: { timeframe?: string; limit?: number }): Promise<User[]>;
  searchSeries(query: string, filters?: { type?: string; status?: string; genre?: string }): Promise<Series[]>;
  searchCreators(query: string): Promise<User[]>;
  
  // Chapter operations
  getChapter(id: string): Promise<Chapter | undefined>;
  getChaptersBySeriesId(seriesId: string): Promise<Chapter[]>;
  createChapter(chapter: InsertChapter): Promise<Chapter>;
  updateChapter(id: string, updates: Partial<InsertChapter>): Promise<Chapter>;
  
  // Comment operations
  getCommentsByChapterId(chapterId: string): Promise<Comment[]>;
  createComment(comment: InsertComment): Promise<Comment>;
  
  // Review operations
  getReviewsBySeriesId(seriesId: string): Promise<Review[]>;
  createReview(review: InsertReview): Promise<Review>;
  
  // Follow operations
  createFollow(userId: string, targetId: string, targetType: string): Promise<Follow>;
  deleteFollow(userId: string, targetId: string, targetType: string): Promise<void>;
  getFollowedSeries(userId: string): Promise<Series[]>;
  
  // Bookmark operations
  createBookmark(userId: string, seriesId: string): Promise<Bookmark>;
  deleteBookmark(userId: string, seriesId: string): Promise<void>;
  getBookmarkedSeries(userId: string): Promise<Series[]>;
  
  // Reading progress operations
  updateReadingProgress(userId: string, seriesId: string, chapterId: string, progress: number): Promise<ReadingProgress>;
  getReadingProgress(userId: string, seriesId: string): Promise<ReadingProgress | undefined>;
  
  // Transaction operations
  createTransaction(transaction: Omit<Transaction, 'id' | 'createdAt'>): Promise<Transaction>;
  getUserTransactions(userId: string): Promise<Transaction[]>;
  
  // Group operations
  getGroup(id: string): Promise<Group | undefined>;
  getGroupsList(): Promise<Group[]>;
  createGroup(group: Omit<Group, 'id' | 'createdAt' | 'updatedAt'>): Promise<Group>;
  
  // Analytics operations
  getCreatorAnalytics(userId: string): Promise<{
    totalViews: number;
    followers: number;
    coinsEarned: number;
    activeSeries: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  sessionStore: any;

  constructor() {
    const PostgresSessionStore = connectPg(session);
    this.sessionStore = new PostgresSessionStore({
      conString: process.env.DATABASE_URL,
      createTableIfMissing: true,
    });
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Series operations
  async getSeries(id: string): Promise<Series | undefined> {
    const [seriesData] = await db.select().from(series).where(eq(series.id, id));
    return seriesData;
  }

  async getSeriesList(filters?: { 
    type?: string; 
    status?: string; 
    genre?: string; 
    limit?: number 
  }): Promise<Series[]> {
    const conditions = [];
    if (filters?.type) {
      conditions.push(eq(series.type, filters.type as any));
    }
    if (filters?.status) {
      conditions.push(eq(series.status, filters.status as any));
    }
    if (filters?.genre) {
      conditions.push(sql`${series.genres} @> ARRAY[${filters.genre}]`);
    }
    
    if (conditions.length > 0) {
      let query = db.select().from(series).where(and(...conditions)).orderBy(desc(series.updatedAt));
      if (filters?.limit) {
        return await query.limit(filters.limit);
      }
      return await query;
    } else {
      let query = db.select().from(series).orderBy(desc(series.updatedAt));
      if (filters?.limit) {
        return await query.limit(filters.limit);
      }
      return await query;
    }
  }

  async createSeries(seriesData: InsertSeries): Promise<Series> {
    const [newSeries] = await db.insert(series).values(seriesData).returning();
    return newSeries;
  }

  async updateSeries(id: string, updates: Partial<InsertSeries>): Promise<Series> {
    const [updatedSeries] = await db
      .update(series)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(series.id, id))
      .returning();
    return updatedSeries;
  }

  async getSeriesByAuthor(authorId: string): Promise<Series[]> {
    return await db.select().from(series).where(eq(series.authorId, authorId));
  }

  // Premium chapter unlock operations
  async isChapterUnlocked(userId: string, chapterId: string): Promise<boolean> {
    const [unlock] = await db.select().from(chapterUnlocks)
      .where(and(eq(chapterUnlocks.userId, userId), eq(chapterUnlocks.chapterId, chapterId)));
    return !!unlock;
  }

  async unlockChapter(userId: string, chapterId: string): Promise<void> {
    await db.insert(chapterUnlocks).values({
      userId,
      chapterId,
    }).onConflictDoNothing();
  }

  async getTrendingSeries(filters?: { timeframe?: string; limit?: number }): Promise<Series[]> {
    const limit = filters?.limit || 10;
    return await db
      .select()
      .from(series)
      .orderBy(desc(series.viewCount), desc(series.bookmarkCount))
      .limit(limit);
  }

  async getRisingSeries(filters?: { timeframe?: string; limit?: number }): Promise<Series[]> {
    const limit = filters?.limit || 12;
    return await db
      .select()
      .from(series)
      .where(
        and(
          sql`${series.createdAt} >= NOW() - INTERVAL '30 days'`,
          sql`${series.viewCount} > 100`
        )
      )
      .orderBy(desc(series.viewCount), desc(series.createdAt))
      .limit(limit);
  }

  async getTrendingCreators(filters?: { timeframe?: string; limit?: number }): Promise<User[]> {
    const limit = filters?.limit || 12;
    return await db
      .select()
      .from(users)
      .where(eq(users.isCreator, true))
      .orderBy(desc(users.followersCount))
      .limit(limit);
  }

  async searchSeries(query: string, filters?: { type?: string; status?: string; genre?: string }): Promise<Series[]> {
    let whereConditions = or(
      like(series.title, `%${query}%`),
      like(series.description, `%${query}%`)
    );

    // Add filters if provided
    if (filters?.type) {
      whereConditions = and(whereConditions, sql`${series.type} = ${filters.type}`);
    }
    if (filters?.status) {
      whereConditions = and(whereConditions, sql`${series.status} = ${filters.status}`);
    }
    if (filters?.genre) {
      whereConditions = and(whereConditions, like(series.genres, `%${filters.genre}%`));
    }

    return await db
      .select()
      .from(series)
      .where(whereConditions)
      .orderBy(desc(series.viewCount))
      .limit(20);
  }

  async searchCreators(query: string): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.isCreator, true),
          or(
            like(users.username, `%${query}%`),
            like(users.firstName, `%${query}%`),
            like(users.lastName, `%${query}%`),
            like(users.creatorDisplayName, `%${query}%`),
            like(users.creatorBio, `%${query}%`)
          )
        )
      )
      .orderBy(desc(users.followersCount))
      .limit(20);
  }

  // Chapter operations
  async getChapter(id: string): Promise<Chapter | undefined> {
    const [chapter] = await db.select().from(chapters).where(eq(chapters.id, id));
    return chapter;
  }

  async getChaptersBySeriesId(seriesId: string): Promise<Chapter[]> {
    return await db
      .select()
      .from(chapters)
      .where(eq(chapters.seriesId, seriesId))
      .orderBy(asc(chapters.chapterNumber));
  }

  async createChapter(chapterData: InsertChapter): Promise<Chapter> {
    const [newChapter] = await db.insert(chapters).values(chapterData).returning();
    
    // Update series chapter count
    await db
      .update(series)
      .set({ 
        chapterCount: sql`${series.chapterCount} + 1`,
        updatedAt: new Date()
      })
      .where(eq(series.id, chapterData.seriesId));
    
    return newChapter;
  }

  async updateChapter(id: string, updates: Partial<InsertChapter>): Promise<Chapter> {
    const [updatedChapter] = await db
      .update(chapters)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(chapters.id, id))
      .returning();
    return updatedChapter;
  }

  // Comment operations
  async getCommentsByChapterId(chapterId: string): Promise<Comment[]> {
    const result = await db
      .select()
      .from(comments)
      .where(eq(comments.chapterId, chapterId))
      .orderBy(desc(comments.createdAt));
    return result;
  }

  async createComment(commentData: InsertComment): Promise<Comment> {
    const [newComment] = await db.insert(comments).values(commentData).returning();
    return newComment;
  }

  // Review operations
  async getReviewsBySeriesId(seriesId: string): Promise<Review[]> {
    return await db
      .select()
      .from(reviews)
      .where(eq(reviews.seriesId, seriesId))
      .orderBy(desc(reviews.createdAt));
  }

  async createReview(reviewData: InsertReview): Promise<Review> {
    const [newReview] = await db.insert(reviews).values(reviewData).returning();
    
    // Update series rating
    const allReviews = await this.getReviewsBySeriesId(reviewData.seriesId);
    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
    
    await db
      .update(series)
      .set({
        rating: avgRating.toFixed(2),
        ratingCount: allReviews.length,
        updatedAt: new Date()
      })
      .where(eq(series.id, reviewData.seriesId));
    
    return newReview;
  }

  // Follow operations
  async createFollow(userId: string, targetId: string, targetType: string): Promise<Follow> {
    const [newFollow] = await db
      .insert(follows)
      .values({ userId, targetId, targetType })
      .returning();
    
    // Update follower count if following a user
    if (targetType === 'user') {
      await db
        .update(users)
        .set({ followersCount: sql`${users.followersCount} + 1` })
        .where(eq(users.id, targetId));
    }
    
    return newFollow;
  }

  async deleteFollow(userId: string, targetId: string, targetType: string): Promise<void> {
    await db
      .delete(follows)
      .where(
        and(
          eq(follows.userId, userId),
          eq(follows.targetId, targetId),
          eq(follows.targetType, targetType)
        )
      );
    
    // Update follower count if unfollowing a user
    if (targetType === 'user') {
      await db
        .update(users)
        .set({ followersCount: sql`${users.followersCount} - 1` })
        .where(eq(users.id, targetId));
    }
  }

  async getFollowedSeries(userId: string): Promise<Series[]> {
    const followedSeriesIds = await db
      .select({ seriesId: follows.targetId })
      .from(follows)
      .where(
        and(
          eq(follows.userId, userId),
          eq(follows.targetType, 'series')
        )
      );
    
    if (followedSeriesIds.length === 0) return [];
    
    return await db
      .select()
      .from(series)
      .where(inArray(series.id, followedSeriesIds.map(f => f.seriesId)));
  }

  // Bookmark operations
  async createBookmark(userId: string, seriesId: string): Promise<Bookmark> {
    const [newBookmark] = await db
      .insert(bookmarks)
      .values({ userId, seriesId })
      .returning();
    
    // Update series bookmark count
    await db
      .update(series)
      .set({ bookmarkCount: sql`${series.bookmarkCount} + 1` })
      .where(eq(series.id, seriesId));
    
    return newBookmark;
  }

  async deleteBookmark(userId: string, seriesId: string): Promise<void> {
    await db
      .delete(bookmarks)
      .where(
        and(
          eq(bookmarks.userId, userId),
          eq(bookmarks.seriesId, seriesId)
        )
      );
    
    // Update series bookmark count
    await db
      .update(series)
      .set({ bookmarkCount: sql`${series.bookmarkCount} - 1` })
      .where(eq(series.id, seriesId));
  }

  async getBookmarkedSeries(userId: string): Promise<Series[]> {
    const bookmarkedSeriesIds = await db
      .select({ seriesId: bookmarks.seriesId })
      .from(bookmarks)
      .where(eq(bookmarks.userId, userId));
    
    if (bookmarkedSeriesIds.length === 0) return [];
    
    return await db
      .select()
      .from(series)
      .where(inArray(series.id, bookmarkedSeriesIds.map(b => b.seriesId)));
  }

  // Reading progress operations
  async updateReadingProgress(
    userId: string,
    seriesId: string,
    chapterId: string,
    progressValue: number
  ): Promise<ReadingProgress> {
    const [updatedProgress] = await db
      .insert(readingProgress)
      .values({ userId, seriesId, chapterId, progress: progressValue.toString() })
      .onConflictDoUpdate({
        target: [readingProgress.userId, readingProgress.seriesId],
        set: {
          chapterId,
          progress: progressValue.toString(),
          updatedAt: new Date(),
        },
      })
      .returning();
    
    return updatedProgress;
  }

  async getReadingProgress(userId: string, seriesId: string): Promise<ReadingProgress | undefined> {
    const [progress] = await db
      .select()
      .from(readingProgress)
      .where(
        and(
          eq(readingProgress.userId, userId),
          eq(readingProgress.seriesId, seriesId)
        )
      );
    
    return progress;
  }

  // Transaction operations
  async createTransaction(transactionData: Omit<Transaction, 'id' | 'createdAt'>): Promise<Transaction> {
    const [newTransaction] = await db
      .insert(transactions)
      .values(transactionData)
      .returning();
    
    // Update user coin balance
    await db
      .update(users)
      .set({ coinBalance: sql`${users.coinBalance} + ${transactionData.amount}` })
      .where(eq(users.id, transactionData.userId));
    
    return newTransaction;
  }

  async getUserTransactions(userId: string): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.createdAt));
  }

  // Group operations
  async getGroup(id: string): Promise<Group | undefined> {
    const [group] = await db.select().from(groups).where(eq(groups.id, id));
    return group;
  }

  async getGroupsList(): Promise<Group[]> {
    return await db
      .select()
      .from(groups)
      .orderBy(desc(groups.memberCount));
  }

  async createGroup(groupData: Omit<Group, 'id' | 'createdAt' | 'updatedAt'>): Promise<Group> {
    const [newGroup] = await db.insert(groups).values(groupData).returning();
    
    // Add owner as member
    await db
      .insert(groupMembers)
      .values({
        groupId: newGroup.id,
        userId: groupData.ownerId,
        role: 'owner',
      });
    
    return newGroup;
  }

  // Analytics operations
  async getCreatorAnalytics(userId: string): Promise<{
    totalViews: number;
    followers: number;
    coinsEarned: number;
    activeSeries: number;
  }> {
    // Get user data for followers
    const user = await this.getUser(userId);
    
    // Get series by this creator
    const creatorSeries = await this.getSeriesByAuthor(userId);
    
    // Calculate total views from all series
    const totalViews = creatorSeries.reduce((sum, s) => sum + (s.viewCount || 0), 0);
    
    // Get coins earned from transactions
    const userTransactions = await this.getUserTransactions(userId);
    const coinsEarned = userTransactions
      .filter(t => t.type === 'unlock' && t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);
    
    return {
      totalViews,
      followers: user?.followersCount || 0,
      coinsEarned,
      activeSeries: creatorSeries.filter(s => s.status === 'ongoing').length,
    };
  }
}

export const storage = new DatabaseStorage();
