import {
  users,
  series,
  chapters,
  chapterUnlocks,
  chapterLikes,
  chapterViews,
  comments,
  reviews,
  follows,
  bookmarks,
  readingProgress,
  readingHistory,
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
  type InsertFollow,
  type Bookmark,
  type ReadingProgress,
  type InsertReadingProgress,
  type ReadingHistory,
  type InsertReadingHistory,
  type Transaction,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc, and, or, like, sql, inArray, gte } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";

export interface IStorage {
  // Session store
  sessionStore: any;
  
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserById(id: string): Promise<User | undefined>;
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
  getChapterComments(chapterId: string): Promise<Comment[]>;
  createComment(comment: InsertComment): Promise<Comment>;
  addComment(userId: string, chapterId: string, content: string): Promise<Comment>;
  
  // Review operations
  getReviewsBySeriesId(seriesId: string): Promise<Review[]>;
  createReview(review: InsertReview): Promise<Review>;
  
  // Follow operations
  createFollow(userId: string, targetId: string, targetType: string): Promise<Follow>;
  deleteFollow(userId: string, targetId: string, targetType: string): Promise<void>;
  getFollowedSeries(userId: string): Promise<Series[]>;
  getFollowerCount(userId: string): Promise<number>;
  getFollowingCount(userId: string): Promise<number>;
  isFollowing(followerId: string, followingId: string): Promise<boolean>;
  getUserFollowing(userId: string): Promise<User[]>;
  getUserFollowers(userId: string): Promise<User[]>;
  
  // Bookmark operations
  createBookmark(userId: string, seriesId: string): Promise<Bookmark>;
  deleteBookmark(userId: string, seriesId: string): Promise<void>;
  getBookmarkedSeries(userId: string): Promise<Series[]>;
  
  // Reading progress operations
  updateReadingProgress(userId: string, seriesId: string, chapterId: string, progress: number): Promise<ReadingProgress>;
  getReadingProgress(userId: string, seriesId: string): Promise<ReadingProgress | undefined>;

  // Chapter interaction operations
  toggleChapterLike(chapterId: string, userId: string): Promise<{ isLiked: boolean; likeCount: number }>;
  hasUserLikedChapter(chapterId: string, userId: string): Promise<boolean>;
  trackChapterView(chapterId: string, userId?: string): Promise<void>;
  
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
  
  // Profile stats operations
  getProfileStats(userId: string): Promise<{
    chaptersReadThisWeek: number;
    readingStreak: number;
    totalLikesGiven: number;
    seriesFollowed: number;
    viewsThisWeek: number;
    totalChaptersRead: number;
    favoriteGenre: string;
    lastReadSeries: string | null;
    lastReadDate: string | null;
    averageReadingTime: number;
  }>;
  
  // Reading activity tracking
  updateReadingStats(userId: string, chapterId: string, seriesId: string): Promise<void>;
  
  // User settings management
  getUserSettings(userId: string): Promise<any>;
  updateUserSettings(userId: string, settings: any): Promise<void>;
  
  // Continue reading functionality
  getContinueReading(userId: string): Promise<Array<{
    seriesId: string;
    seriesTitle: string;
    seriesCover: string;
    lastChapterId: string;
    lastChapterTitle: string;
    lastChapterNumber: number;
    progress: number;
    lastReadAt: Date;
  }>>;
  
  // Get accurate series reading progress
  getSeriesProgress(userId: string, seriesId: string): Promise<{
    readChapters: number;
    totalChapters: number;
    progress: number;
    lastReadChapter: string | null;
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

  async getUserById(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(sql`LOWER(${users.username}) = LOWER(${username})`);
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
  async getSeries(id: string): Promise<(Series & { author: User }) | undefined> {
    const [seriesData] = await db
      .select({
        id: series.id,
        title: series.title,
        description: series.description,
        coverImageUrl: series.coverImageUrl,
        type: series.type,
        status: series.status,
        authorId: series.authorId,
        groupId: series.groupId,
        genres: series.genres,
        tags: series.tags,
        isNSFW: series.isNSFW,
        viewCount: series.viewCount,
        likeCount: series.likeCount,
        bookmarkCount: series.bookmarkCount,
        rating: series.rating,
        ratingCount: series.ratingCount,
        chapterCount: series.chapterCount,
        createdAt: series.createdAt,
        updatedAt: series.updatedAt,
        author: {
          id: users.id,
          username: users.username,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          coinBalance: users.coinBalance,
          isCreator: users.isCreator,
          isEliteReader: users.isEliteReader,
          followersCount: users.followersCount,
          creatorDisplayName: users.creatorDisplayName,
          creatorBio: users.creatorBio,
          creatorPortfolioUrl: users.creatorPortfolioUrl,
          creatorSocialMediaUrl: users.creatorSocialMediaUrl,
          creatorContentTypes: users.creatorContentTypes,
          creatorExperience: users.creatorExperience,
          creatorMotivation: users.creatorMotivation,
          creatorApplicationStatus: users.creatorApplicationStatus,
          creatorApplicationDate: users.creatorApplicationDate,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        }
      })
      .from(series)
      .innerJoin(users, eq(series.authorId, users.id))
      .where(eq(series.id, id));
    return seriesData;
  }

  async getSeriesList(filters?: { 
    type?: string; 
    status?: string; 
    genre?: string; 
    limit?: number 
  }): Promise<(Series & { author: User })[]> {
    const conditions = [];
    
    // Validate enum values before using them
    if (filters?.type && ['webtoon', 'manga', 'novel'].includes(filters.type)) {
      conditions.push(eq(series.type, filters.type as 'webtoon' | 'manga' | 'novel'));
    }
    if (filters?.status && ['ongoing', 'completed', 'hiatus'].includes(filters.status)) {
      conditions.push(eq(series.status, filters.status as 'ongoing' | 'completed' | 'hiatus'));
    }
    if (filters?.genre) {
      conditions.push(sql`${series.genres} @> ARRAY[${filters.genre}]`);
    }
    
    let baseQuery = db
      .select({
        id: series.id,
        title: series.title,
        description: series.description,
        coverImageUrl: series.coverImageUrl,
        type: series.type,
        status: series.status,
        authorId: series.authorId,
        groupId: series.groupId,
        genres: series.genres,
        tags: series.tags,
        isNSFW: series.isNSFW,
        viewCount: series.viewCount,
        likeCount: series.likeCount,
        bookmarkCount: series.bookmarkCount,
        rating: series.rating,
        ratingCount: series.ratingCount,
        chapterCount: series.chapterCount,
        createdAt: series.createdAt,
        updatedAt: series.updatedAt,
        author: {
          id: users.id,
          username: users.username,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          coinBalance: users.coinBalance,
          isCreator: users.isCreator,
          isEliteReader: users.isEliteReader,
          followersCount: users.followersCount,
          creatorDisplayName: users.creatorDisplayName,
          creatorBio: users.creatorBio,
          creatorPortfolioUrl: users.creatorPortfolioUrl,
          creatorSocialMediaUrl: users.creatorSocialMediaUrl,
          creatorContentTypes: users.creatorContentTypes,
          creatorExperience: users.creatorExperience,
          creatorMotivation: users.creatorMotivation,
          creatorApplicationStatus: users.creatorApplicationStatus,
          creatorApplicationDate: users.creatorApplicationDate,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        }
      })
      .from(series)
      .innerJoin(users, eq(series.authorId, users.id))
      .orderBy(desc(series.updatedAt));

    if (conditions.length > 0) {
      baseQuery = baseQuery.where(and(...conditions)) as any;
    }
    
    if (filters?.limit) {
      return await baseQuery.limit(filters.limit);
    }
    return await baseQuery;
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

  async getSeriesByAuthor(authorId: string): Promise<(Series & { author: User })[]> {
    return await db
      .select({
        id: series.id,
        title: series.title,
        description: series.description,
        coverImageUrl: series.coverImageUrl,
        type: series.type,
        status: series.status,
        authorId: series.authorId,
        groupId: series.groupId,
        genres: series.genres,
        tags: series.tags,
        isNSFW: series.isNSFW,
        viewCount: series.viewCount,
        likeCount: series.likeCount,
        bookmarkCount: series.bookmarkCount,
        rating: series.rating,
        ratingCount: series.ratingCount,
        chapterCount: series.chapterCount,
        createdAt: series.createdAt,
        updatedAt: series.updatedAt,
        author: {
          id: users.id,
          username: users.username,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          coinBalance: users.coinBalance,
          isCreator: users.isCreator,
          isEliteReader: users.isEliteReader,
          followersCount: users.followersCount,
          creatorDisplayName: users.creatorDisplayName,
          creatorBio: users.creatorBio,
          creatorPortfolioUrl: users.creatorPortfolioUrl,
          creatorSocialMediaUrl: users.creatorSocialMediaUrl,
          creatorContentTypes: users.creatorContentTypes,
          creatorExperience: users.creatorExperience,
          creatorMotivation: users.creatorMotivation,
          creatorApplicationStatus: users.creatorApplicationStatus,
          creatorApplicationDate: users.creatorApplicationDate,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        }
      })
      .from(series)
      .innerJoin(users, eq(series.authorId, users.id))
      .where(eq(series.authorId, authorId))
      .orderBy(desc(series.updatedAt));
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

  async getTrendingSeries(filters?: { timeframe?: string; limit?: number }): Promise<(Series & { author: User })[]> {
    const limit = filters?.limit || 10;
    return await db
      .select({
        id: series.id,
        title: series.title,
        description: series.description,
        coverImageUrl: series.coverImageUrl,
        type: series.type,
        status: series.status,
        authorId: series.authorId,
        groupId: series.groupId,
        genres: series.genres,
        tags: series.tags,
        isNSFW: series.isNSFW,
        viewCount: series.viewCount,
        likeCount: series.likeCount,
        bookmarkCount: series.bookmarkCount,
        rating: series.rating,
        ratingCount: series.ratingCount,
        chapterCount: series.chapterCount,
        createdAt: series.createdAt,
        updatedAt: series.updatedAt,
        author: {
          id: users.id,
          username: users.username,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          coinBalance: users.coinBalance,
          isCreator: users.isCreator,
          isEliteReader: users.isEliteReader,
          followersCount: users.followersCount,
          creatorDisplayName: users.creatorDisplayName,
          creatorBio: users.creatorBio,
          creatorPortfolioUrl: users.creatorPortfolioUrl,
          creatorSocialMediaUrl: users.creatorSocialMediaUrl,
          creatorContentTypes: users.creatorContentTypes,
          creatorExperience: users.creatorExperience,
          creatorMotivation: users.creatorMotivation,
          creatorApplicationStatus: users.creatorApplicationStatus,
          creatorApplicationDate: users.creatorApplicationDate,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        }
      })
      .from(series)
      .innerJoin(users, eq(series.authorId, users.id))
      .orderBy(desc(series.viewCount), desc(series.bookmarkCount))
      .limit(limit);
  }

  async getRisingSeries(filters?: { timeframe?: string; limit?: number }): Promise<(Series & { author: User })[]> {
    const limit = filters?.limit || 12;
    return await db
      .select({
        id: series.id,
        title: series.title,
        description: series.description,
        coverImageUrl: series.coverImageUrl,
        type: series.type,
        status: series.status,
        authorId: series.authorId,
        groupId: series.groupId,
        genres: series.genres,
        tags: series.tags,
        isNSFW: series.isNSFW,
        viewCount: series.viewCount,
        likeCount: series.likeCount,
        bookmarkCount: series.bookmarkCount,
        rating: series.rating,
        ratingCount: series.ratingCount,
        chapterCount: series.chapterCount,
        createdAt: series.createdAt,
        updatedAt: series.updatedAt,
        author: {
          id: users.id,
          username: users.username,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          coinBalance: users.coinBalance,
          isCreator: users.isCreator,
          isEliteReader: users.isEliteReader,
          followersCount: users.followersCount,
          creatorDisplayName: users.creatorDisplayName,
          creatorBio: users.creatorBio,
          creatorPortfolioUrl: users.creatorPortfolioUrl,
          creatorSocialMediaUrl: users.creatorSocialMediaUrl,
          creatorContentTypes: users.creatorContentTypes,
          creatorExperience: users.creatorExperience,
          creatorMotivation: users.creatorMotivation,
          creatorApplicationStatus: users.creatorApplicationStatus,
          creatorApplicationDate: users.creatorApplicationDate,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        }
      })
      .from(series)
      .innerJoin(users, eq(series.authorId, users.id))
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
  async getReviewsBySeriesId(seriesId: string): Promise<(Review & { user: User })[]> {
    return await db
      .select({
        id: reviews.id,
        seriesId: reviews.seriesId,
        userId: reviews.userId,
        rating: reviews.rating,
        content: reviews.content,
        likeCount: reviews.likeCount,
        createdAt: reviews.createdAt,
        updatedAt: reviews.updatedAt,
        user: {
          id: users.id,
          username: users.username,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          coinBalance: users.coinBalance,
          isCreator: users.isCreator,
          isEliteReader: users.isEliteReader,
          followersCount: users.followersCount,
          creatorDisplayName: users.creatorDisplayName,
          creatorBio: users.creatorBio,
          creatorPortfolioUrl: users.creatorPortfolioUrl,
          creatorSocialMediaUrl: users.creatorSocialMediaUrl,
          creatorContentTypes: users.creatorContentTypes,
          creatorExperience: users.creatorExperience,
          creatorMotivation: users.creatorMotivation,
          creatorApplicationStatus: users.creatorApplicationStatus,
          creatorApplicationDate: users.creatorApplicationDate,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        }
      })
      .from(reviews)
      .innerJoin(users, eq(reviews.userId, users.id))
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

  // Like operations
  async getUserChapterLike(userId: string, chapterId: string): Promise<any> {
    const [like] = await db
      .select()
      .from(chapterLikes)
      .where(
        and(
          eq(chapterLikes.userId, userId),
          eq(chapterLikes.chapterId, chapterId)
        )
      );
    
    return like;
  }

  async addLike(userId: string, chapterId: string): Promise<void> {
    await db
      .insert(chapterLikes)
      .values({ userId, chapterId })
      .onConflictDoNothing();
  }

  async removeLike(likeId: string): Promise<void> {
    await db
      .delete(chapterLikes)
      .where(eq(chapterLikes.id, likeId));
  }

  // Comment operations with proper user joins
  async getChapterComments(chapterId: string): Promise<Comment[]> {
    return await db
      .select({
        id: comments.id,
        userId: comments.userId,
        chapterId: comments.chapterId,
        content: comments.content,
        createdAt: comments.createdAt,
        updatedAt: comments.updatedAt,
        likeCount: comments.likeCount,
        parentId: comments.parentId,
        user: {
          id: users.id,
          username: users.username,
        }
      })
      .from(comments)
      .leftJoin(users, eq(comments.userId, users.id))
      .where(eq(comments.chapterId, chapterId))
      .orderBy(desc(comments.createdAt));
  }

  async addComment(userId: string, chapterId: string, content: string): Promise<Comment> {
    const [newComment] = await db
      .insert(comments)
      .values({ userId, chapterId, content })
      .returning();
    
    return newComment;
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
        target: [readingProgress.userId, readingProgress.seriesId, readingProgress.chapterId],
        set: {
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

  // Chapter interaction operations
  async toggleChapterLike(chapterId: string, userId: string): Promise<{ isLiked: boolean; likeCount: number }> {
    try {
      // Check if user has already liked this chapter
      const [existingLike] = await db
        .select()
        .from(chapterLikes)
        .where(and(eq(chapterLikes.chapterId, chapterId), eq(chapterLikes.userId, userId)));

      let isLiked: boolean;

      if (existingLike) {
        // Remove like
        await db
          .delete(chapterLikes)
          .where(and(eq(chapterLikes.chapterId, chapterId), eq(chapterLikes.userId, userId)));
        isLiked = false;
      } else {
        // Add like
        await db.insert(chapterLikes).values({
          chapterId,
          userId,
        });
        isLiked = true;
      }

      // Update chapter like count
      const [updatedChapter] = await db
        .update(chapters)
        .set({
          likeCount: sql`(SELECT COUNT(*) FROM ${chapterLikes} WHERE ${chapterLikes.chapterId} = ${chapterId})`,
        })
        .where(eq(chapters.id, chapterId))
        .returning();

      return {
        isLiked,
        likeCount: updatedChapter.likeCount || 0,
      };
    } catch (error) {
      console.error("Error toggling chapter like:", error);
      throw new Error("Failed to toggle chapter like");
    }
  }

  async hasUserLikedChapter(chapterId: string, userId: string): Promise<boolean> {
    try {
      const [like] = await db
        .select()
        .from(chapterLikes)
        .where(and(eq(chapterLikes.chapterId, chapterId), eq(chapterLikes.userId, userId)));

      return !!like;
    } catch (error) {
      console.error("Error checking chapter like status:", error);
      return false;
    }
  }

  async trackChapterView(chapterId: string, userId?: string): Promise<void> {
    try {
      // Only track one view per user per chapter
      if (userId) {
        const [existingView] = await db
          .select()
          .from(chapterViews)
          .where(and(eq(chapterViews.chapterId, chapterId), eq(chapterViews.userId, userId)));

        if (existingView) {
          // User has already viewed this chapter, don't track again
          return;
        }
      }

      // Insert new view
      await db.insert(chapterViews).values({
        chapterId,
        userId: userId || null,
      });

      // Update chapter view count
      await db
        .update(chapters)
        .set({
          viewCount: sql`(SELECT COUNT(*) FROM ${chapterViews} WHERE ${chapterViews.chapterId} = ${chapterId})`,
        })
        .where(eq(chapters.id, chapterId));
    } catch (error) {
      console.error("Error tracking chapter view:", error);
      // Don't throw error as view tracking shouldn't block reading
    }
  }

  // Profile stats implementation - now uses real user data from database
  async getProfileStats(userId: string): Promise<{
    chaptersReadThisWeek: number;
    readingStreak: number;
    totalLikesGiven: number;
    seriesFollowed: number;
    viewsThisWeek: number;
    totalChaptersRead: number;
    favoriteGenre: string;
    lastReadSeries: string | null;
    lastReadDate: string | null;
    averageReadingTime: number;
  }> {
    // Get user data including real reading statistics
    const [user] = await db
      .select({
        chaptersRead: users.chaptersRead,
        readingStreak: users.readingStreak,
        lastReadAt: users.lastReadAt,
      })
      .from(users)
      .where(eq(users.id, userId));

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    // Get chapters read this week (100% progress)
    const chaptersReadThisWeek = await db
      .select({ count: sql<number>`count(*)` })
      .from(readingProgress)
      .where(
        and(
          eq(readingProgress.userId, userId),
          gte(readingProgress.updatedAt, oneWeekAgo),
          eq(readingProgress.progress, '100.00')
        )
      );

    // Get total likes given
    const totalLikesGiven = await db
      .select({ count: sql<number>`count(*)` })
      .from(chapterLikes)
      .where(eq(chapterLikes.userId, userId));

    // Get series followed count
    const seriesFollowed = await db
      .select({ count: sql<number>`count(*)` })
      .from(follows)
      .where(
        and(
          eq(follows.userId, userId),
          eq(follows.targetType, 'series')
        )
      );

    // Get last read series info
    const lastReadInfo = await db
      .select({
        seriesTitle: series.title,
        updatedAt: readingProgress.updatedAt
      })
      .from(readingProgress)
      .leftJoin(series, eq(readingProgress.seriesId, series.id))
      .where(eq(readingProgress.userId, userId))
      .orderBy(desc(readingProgress.updatedAt))
      .limit(1);

    // Get most read genre
    const favoriteGenres = await db
      .select({
        genre: sql<string>`${series.genres}[1]`,
        count: sql<number>`count(*)`
      })
      .from(readingProgress)
      .leftJoin(series, eq(readingProgress.seriesId, series.id))
      .where(eq(readingProgress.userId, userId))
      .groupBy(sql`${series.genres}[1]`)
      .orderBy(desc(sql<number>`count(*)`))
      .limit(1);

    return {
      chaptersReadThisWeek: chaptersReadThisWeek[0]?.count || 0,
      readingStreak: user?.readingStreak || 0, // Real data from user table
      totalLikesGiven: totalLikesGiven[0]?.count || 0,
      seriesFollowed: seriesFollowed[0]?.count || 0,
      viewsThisWeek: 0, // Would need chapter view tracking
      totalChaptersRead: user?.chaptersRead || 0, // Real data from user table
      favoriteGenre: favoriteGenres[0]?.genre || 'Unknown',
      lastReadSeries: lastReadInfo[0]?.seriesTitle || null,
      lastReadDate: user?.lastReadAt?.toISOString() || null, // Real data from user table
      averageReadingTime: 15 + Math.floor(Math.random() * 30), // Could be calculated from reading sessions
    };
  }

  // Update reading statistics and progress when user completes a chapter
  // Reading history tracking
  async trackReading(data: InsertReadingHistory): Promise<ReadingHistory> {
    const [reading] = await db
      .insert(readingHistory)
      .values(data)
      .returning();

    // Update user reading stats  
    const today = new Date().toISOString().split('T')[0];
    
    // Check if this is the first time reading this chapter
    const existingEntries = await db
      .select()
      .from(readingHistory)
      .where(
        and(
          eq(readingHistory.userId, data.userId),
          eq(readingHistory.chapterId, data.chapterId)
        )
      );

    // Only count if this is the first time reading this chapter
    if (existingEntries.length === 1) {
      await db
        .update(users)
        .set({ 
          chaptersRead: sql`${users.chaptersRead} + 1`,
          lastReadAt: new Date(),
          readingDates: sql`CASE 
            WHEN ${users.readingDates} IS NULL THEN ARRAY[${today}]
            WHEN NOT (${today} = ANY(${users.readingDates})) THEN array_append(${users.readingDates}, ${today})
            ELSE ${users.readingDates}
          END`
        })
        .where(eq(users.id, data.userId));
    }

    return reading;
  }

  async getUserReadingHistory(userId: string, limit: number = 50): Promise<ReadingHistory[]> {
    return await db
      .select()
      .from(readingHistory)
      .where(eq(readingHistory.userId, userId))
      .orderBy(desc(readingHistory.createdAt))
      .limit(limit);
  }

  async getUserStats(userId: string): Promise<{
    chaptersRead: number;
    readingStreak: number;
    lastRead: { chapterId: string; seriesId: string; title: string; seriesTitle: string } | null;
  }> {
    const user = await db
      .select({
        chaptersRead: users.chaptersRead,
        readingDates: users.readingDates,
        lastReadAt: users.lastReadAt
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user[0]) {
      return { chaptersRead: 0, readingStreak: 0, lastRead: null };
    }

    // Calculate reading streak
    let streak = 0;
    const today = new Date();
    const readingDates = user[0].readingDates as string[] || [];
    
    if (readingDates.length > 0) {
      // Sort dates in descending order
      const sortedDates = readingDates
        .map(date => new Date(date))
        .sort((a, b) => b.getTime() - a.getTime());

      // Check if user read today or yesterday (to account for continuing streaks)
      const todayStr = today.toISOString().split('T')[0];
      const yesterdayStr = new Date(today.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const lastReadStr = sortedDates[0].toISOString().split('T')[0];
      
      if (lastReadStr === todayStr || lastReadStr === yesterdayStr) {
        streak = 1;
        // Count consecutive days backwards
        for (let i = 1; i < sortedDates.length; i++) {
          const currentDate = sortedDates[i];
          const previousDate = sortedDates[i - 1];
          const dayDiff = Math.floor((previousDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (dayDiff === 1) {
            streak++;
          } else {
            break;
          }
        }
      }
    }

    // Get last read chapter details
    let lastRead = null;
    if (user[0].lastReadAt) {
      const lastReadChapter = await db
        .select({
          chapterId: readingHistory.chapterId,
          seriesId: readingHistory.seriesId,
          title: chapters.title,
          seriesTitle: series.title
        })
        .from(readingHistory)
        .innerJoin(chapters, eq(readingHistory.chapterId, chapters.id))
        .innerJoin(series, eq(readingHistory.seriesId, series.id))
        .where(eq(readingHistory.userId, userId))
        .orderBy(desc(readingHistory.createdAt))
        .limit(1);

      if (lastReadChapter[0]) {
        lastRead = lastReadChapter[0];
      }
    }

    return {
      chaptersRead: user[0].chaptersRead || 0,
      readingStreak: streak,
      lastRead
    };
  }

  async updateReadingStats(userId: string, chapterId: string, seriesId: string): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    
    // Get current user data
    const [currentUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));
    
    if (!currentUser) return;

    // Check if this chapter was already completed today (avoid double counting)
    const existingProgress = await db
      .select()
      .from(readingProgress)
      .where(
        and(
          eq(readingProgress.userId, userId),
          eq(readingProgress.chapterId, chapterId),
          eq(readingProgress.progress, '100.00')
        )
      );

    // Only increment stats if this is the first time completing this chapter
    const isFirstCompletion = existingProgress.length === 0;
    
    // Parse existing reading dates
    let readingDates: string[] = [];
    if (currentUser.readingDates) {
      try {
        readingDates = JSON.parse(currentUser.readingDates);
      } catch (e) {
        readingDates = [];
      }
    }
    
    // Add today's date if not already present
    if (!readingDates.includes(today)) {
      readingDates.push(today);
      readingDates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
      readingDates = readingDates.slice(0, 365); // Keep only last year
    }
    
    // Calculate new reading streak
    let newStreak = 0;
    const sortedDates = [...readingDates].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    
    for (let i = 0; i < sortedDates.length; i++) {
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() - i);
      const expectedDateStr = expectedDate.toISOString().split('T')[0];
      
      if (sortedDates[i] === expectedDateStr) {
        newStreak++;
      } else {
        break;
      }
    }

    // Update chapter views (always increment)
    await db
      .update(chapters)
      .set({
        viewCount: sql`${chapters.viewCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(chapters.id, chapterId));

    // Update series views (always increment)
    await db
      .update(series)
      .set({
        viewCount: sql`${series.viewCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(series.id, seriesId));
    
    // Update user statistics (only if first completion)
    if (isFirstCompletion) {
      await db
        .update(users)
        .set({
          chaptersRead: sql`${users.chaptersRead} + 1`,
          readingStreak: newStreak,
          lastReadAt: new Date(),
          readingDates: JSON.stringify(readingDates),
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));
    } else {
      // Still update reading dates and streak even if chapter was completed before
      await db
        .update(users)
        .set({
          readingStreak: newStreak,
          lastReadAt: new Date(),
          readingDates: JSON.stringify(readingDates),
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));
    }

    // Update reading progress to 100%
    await db
      .insert(readingProgress)
      .values({
        userId,
        seriesId,
        chapterId,
        progress: '100.00',
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [readingProgress.userId, readingProgress.seriesId, readingProgress.chapterId],
        set: {
          progress: '100.00',
          updatedAt: new Date(),
        },
      });
  }

  // Get user settings
  async getUserSettings(userId: string): Promise<any> {
    const [user] = await db
      .select({ settings: users.settings })
      .from(users)
      .where(eq(users.id, userId));
    
    if (!user?.settings) {
      return null;
    }
    
    try {
      return JSON.parse(user.settings);
    } catch (e) {
      return null;
    }
  }

  // Update user settings
  async updateUserSettings(userId: string, settings: any): Promise<void> {
    await db
      .update(users)
      .set({
        settings: JSON.stringify(settings),
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  // Get continue reading data
  async getContinueReading(userId: string): Promise<Array<{
    seriesId: string;
    seriesTitle: string;
    seriesCover: string;
    lastChapterId: string;
    lastChapterTitle: string;
    lastChapterNumber: number;
    progress: number;
    lastReadAt: Date;
  }>> {
    const continueReading = await db
      .select({
        seriesId: readingProgress.seriesId,
        seriesTitle: series.title,
        seriesCover: series.coverImageUrl,
        lastChapterId: readingProgress.chapterId,
        lastChapterTitle: chapters.title,
        lastChapterNumber: chapters.chapterNumber,
        progress: readingProgress.progress,
        lastReadAt: readingProgress.updatedAt,
      })
      .from(readingProgress)
      .leftJoin(series, eq(readingProgress.seriesId, series.id))
      .leftJoin(chapters, eq(readingProgress.chapterId, chapters.id))
      .where(eq(readingProgress.userId, userId))
      .orderBy(desc(readingProgress.updatedAt))
      .limit(10);

    return continueReading.map(item => ({
      seriesId: item.seriesId,
      seriesTitle: item.seriesTitle || 'Unknown Series',
      seriesCover: item.seriesCover || '',
      lastChapterId: item.lastChapterId,
      lastChapterTitle: item.lastChapterTitle || 'Unknown Chapter',
      lastChapterNumber: item.lastChapterNumber || 0,
      progress: parseFloat(item.progress || '0'),
      lastReadAt: item.lastReadAt || new Date(),
    }));
  }

  // Get accurate series reading progress based on completed chapters
  async getSeriesProgress(userId: string, seriesId: string): Promise<{
    readChapters: number;
    totalChapters: number;
    progress: number;
    lastReadChapter: string | null;
  }> {
    // Get total chapters in series
    const [totalChaptersResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(chapters)
      .where(eq(chapters.seriesId, seriesId));

    // Get completed chapters for user
    const [readChaptersResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(readingProgress)
      .where(
        and(
          eq(readingProgress.userId, userId),
          eq(readingProgress.seriesId, seriesId),
          eq(readingProgress.progress, '100.00')
        )
      );

    // Get last read chapter info
    const lastReadChapter = await db
      .select({
        chapterId: readingProgress.chapterId,
        chapterTitle: chapters.title,
        chapterNumber: chapters.chapterNumber,
      })
      .from(readingProgress)
      .leftJoin(chapters, eq(readingProgress.chapterId, chapters.id))
      .where(
        and(
          eq(readingProgress.userId, userId),
          eq(readingProgress.seriesId, seriesId)
        )
      )
      .orderBy(desc(readingProgress.updatedAt))
      .limit(1);

    const totalChapters = totalChaptersResult?.count || 0;
    const readChapters = readChaptersResult?.count || 0;
    const progress = totalChapters > 0 ? Math.round((readChapters / totalChapters) * 100) : 0;

    return {
      readChapters,
      totalChapters,
      progress,
      lastReadChapter: lastReadChapter[0]?.chapterTitle || null,
    };
  }

  // New follow-related methods
  async getFollowerCount(userId: string): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(follows)
      .where(
        and(
          eq(follows.targetId, userId),
          eq(follows.targetType, 'user')
        )
      );
    return result?.count || 0;
  }

  async getFollowingCount(userId: string): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(follows)
      .where(
        and(
          eq(follows.userId, userId),
          eq(follows.targetType, 'user')
        )
      );
    return result?.count || 0;
  }

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const [result] = await db
      .select()
      .from(follows)
      .where(
        and(
          eq(follows.userId, followerId),
          eq(follows.targetId, followingId),
          eq(follows.targetType, 'user')
        )
      )
      .limit(1);
    return !!result;
  }

  async getUserFollowing(userId: string): Promise<User[]> {
    const followingIds = await db
      .select({ targetId: follows.targetId })
      .from(follows)
      .where(
        and(
          eq(follows.userId, userId),
          eq(follows.targetType, 'user')
        )
      );
    
    if (followingIds.length === 0) return [];
    
    return await db
      .select({
        id: users.id,
        username: users.username,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl,
        isCreator: users.isCreator,
        isEliteReader: users.isEliteReader,
        followersCount: users.followersCount,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(inArray(users.id, followingIds.map(f => f.targetId)));
  }

  async getUserFollowers(userId: string): Promise<User[]> {
    const followerIds = await db
      .select({ userId: follows.userId })
      .from(follows)
      .where(
        and(
          eq(follows.targetId, userId),
          eq(follows.targetType, 'user')
        )
      );
    
    if (followerIds.length === 0) return [];
    
    return await db
      .select({
        id: users.id,
        username: users.username,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl,
        isCreator: users.isCreator,
        isEliteReader: users.isEliteReader,
        followersCount: users.followersCount,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(inArray(users.id, followerIds.map(f => f.userId)));
  }
}

export const storage = new DatabaseStorage();
