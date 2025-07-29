import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, requireAuth, optionalAuth } from "./auth";
import { insertSeriesSchema, insertChapterSchema, insertCommentSchema, insertReviewSchema, type Series } from "@shared/schema";
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  dest: uploadDir,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware - setupAuth includes all auth routes
  setupAuth(app);

  // Serve uploaded files
  app.use('/uploads', express.static(uploadDir));

  // Creator application endpoint
  app.post('/api/creator/apply', requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { displayName, bio, portfolioUrl, socialMediaUrl, contentTypes, experience, motivation } = req.body;

      if (!displayName || !bio || !contentTypes || contentTypes.length === 0) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Auto-approve and update user to creator status instantly
      const updatedUser = await storage.updateUser(userId, {
        creatorDisplayName: displayName,
        creatorBio: bio,
        creatorPortfolioUrl: portfolioUrl,
        creatorSocialMediaUrl: socialMediaUrl,
        creatorContentTypes: JSON.stringify(contentTypes),
        creatorExperience: experience,
        creatorMotivation: motivation,
        creatorApplicationStatus: 'approved',
        creatorApplicationDate: new Date().toISOString(),
        isCreator: true, // Auto-approve creator status
      });

      res.json({ message: "Creator application approved! Welcome to the Creator Program!", user: updatedUser });
    } catch (error) {
      console.error("Error submitting creator application:", error);
      res.status(500).json({ message: "Failed to submit application" });
    }
  });

  // Public series routes (no auth required)
  app.get('/api/series', optionalAuth, async (req, res) => {
    try {
      const { type, status, genre, limit } = req.query;
      const series = await storage.getSeriesList({
        type: type as string,
        status: status as string,
        genre: genre as string,
        limit: limit ? parseInt(limit as string) : undefined,
      });
      res.json(series);
    } catch (error) {
      console.error("Error fetching series:", error);
      res.status(500).json({ message: "Failed to fetch series" });
    }
  });

  // Trending series endpoint
  app.get('/api/series/trending', optionalAuth, async (req, res) => {
    try {
      const { timeframe, limit } = req.query;
      const series = await storage.getTrendingSeries({
        timeframe: timeframe as string || 'week',
        limit: limit ? parseInt(limit as string) : 20,
      });
      res.json(series);
    } catch (error) {
      console.error("Error fetching trending series:", error);
      res.status(500).json({ message: "Failed to fetch trending series" });
    }
  });

  // Rising series endpoint
  app.get('/api/series/rising', optionalAuth, async (req, res) => {
    try {
      const { timeframe, limit } = req.query;
      const series = await storage.getRisingSeries({
        timeframe: timeframe as string || 'week',
        limit: limit ? parseInt(limit as string) : 12,
      });
      res.json(series);
    } catch (error) {
      console.error("Error fetching rising series:", error);
      res.status(500).json({ message: "Failed to fetch rising series" });
    }
  });

  // Trending creators endpoint
  app.get('/api/creators/trending', optionalAuth, async (req, res) => {
    try {
      const { timeframe, limit } = req.query;
      const creators = await storage.getTrendingCreators({
        timeframe: timeframe as string || 'week',
        limit: limit ? parseInt(limit as string) : 12,
      });
      res.json(creators);
    } catch (error) {
      console.error("Error fetching trending creators:", error);
      res.status(500).json({ message: "Failed to fetch trending creators" });
    }
  });

  app.get('/api/series/trending', optionalAuth, async (req, res) => {
    try {
      const { limit } = req.query;
      const series = await storage.getTrendingSeries({
        limit: limit ? parseInt(limit as string) : 10
      });
      res.json(series);
    } catch (error) {
      console.error("Error fetching trending series:", error);
      res.status(500).json({ message: "Failed to fetch trending series" });
    }
  });

  app.get('/api/series/search', async (req, res) => {
    try {
      const { q } = req.query;
      if (!q) {
        return res.status(400).json({ message: "Search query is required" });
      }
      const series = await storage.searchSeries(q as string);
      res.json(series);
    } catch (error) {
      console.error("Error searching series:", error);
      res.status(500).json({ message: "Failed to search series" });
    }
  });

  app.get('/api/series/:id', optionalAuth, async (req, res) => {
    try {
      const series = await storage.getSeries(req.params.id);
      if (!series) {
        return res.status(404).json({ message: "Series not found" });
      }
      res.json(series);
    } catch (error) {
      console.error("Error fetching series:", error);
      res.status(500).json({ message: "Failed to fetch series" });
    }
  });

  // User profile route
  app.get('/api/users/:id', optionalAuth, async (req, res) => {
    try {
      const user = await storage.getUserById(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Remove sensitive information including email for privacy
      const { password, email, resetToken, resetTokenExpiry, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.post('/api/series', requireAuth, upload.single('coverImage'), async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      // Validate required fields
      if (!req.body.title?.trim()) {
        return res.status(400).json({ message: "Title is required" });
      }
      if (!req.body.description?.trim()) {
        return res.status(400).json({ message: "Description is required" });
      }
      if (!req.file) {
        return res.status(400).json({ message: "Cover image is required" });
      }

      // Process and resize cover image
      let coverImageUrl = null;
      if (req.file) {
        const resizedFilename = `resized_${req.file.filename}`;
        const resizedPath = path.join('uploads', resizedFilename);
        
        await sharp(req.file.path)
          .resize(300, 450, { 
            fit: 'cover',
            position: 'center'
          })
          .jpeg({ quality: 85 })
          .toFile(resizedPath);
          
        coverImageUrl = `/uploads/${resizedFilename}`;
      }
      
      // Validate input - convert form data types
      const seriesData = insertSeriesSchema.parse({
        ...req.body,
        authorId: userId,
        genres: req.body.genres ? JSON.parse(req.body.genres) : [],
        tags: req.body.tags ? JSON.parse(req.body.tags) : [],
        isNSFW: req.body.isNSFW === 'true' || req.body.isNSFW === true,
        coverImageUrl,
      });

      const series = await storage.createSeries(seriesData);
      res.status(201).json(series);
    } catch (error) {
      console.error("Error creating series:", error);
      res.status(400).json({ message: "Failed to create series", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Public chapter routes (no auth required for reading)
  app.get('/api/series/:seriesId/chapters', optionalAuth, async (req, res) => {
    try {
      const chapters = await storage.getChaptersBySeriesId(req.params.seriesId);
      res.json(chapters);
    } catch (error) {
      console.error("Error fetching chapters:", error);
      res.status(500).json({ message: "Failed to fetch chapters" });
    }
  });

  app.get('/api/chapters/:id', optionalAuth, async (req, res) => {
    try {
      const chapter = await storage.getChapter(req.params.id);
      if (!chapter) {
        return res.status(404).json({ message: "Chapter not found" });
      }
      res.json(chapter);
    } catch (error) {
      console.error("Error fetching chapter:", error);
      res.status(500).json({ message: "Failed to fetch chapter" });
    }
  });

  app.post('/api/series/:seriesId/chapters', requireAuth, upload.array('pages', 50), async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      // Verify user owns the series
      const series = await storage.getSeries(req.params.seriesId);
      if (!series || series.authorId !== userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      // Process uploaded files for content
      let content = null;
      if (req.files && req.files.length > 0) {
        // For webtoon/manga - array of image URLs
        content = req.files.map((file: Express.Multer.File) => `/uploads/${file.filename}`);
      } else if (req.body.content) {
        // For novels - text content
        content = req.body.content;
      }

      const chapterData = insertChapterSchema.parse({
        ...req.body,
        seriesId: req.params.seriesId,
        content,
        chapterNumber: parseInt(req.body.chapterNumber),
        coinPrice: req.body.coinPrice ? parseInt(req.body.coinPrice) : 0,
      });

      const chapter = await storage.createChapter(chapterData);
      res.status(201).json(chapter);
    } catch (error) {
      console.error("Error creating chapter:", error);
      res.status(400).json({ message: "Failed to create chapter", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Public comment routes (no auth required for viewing)
  app.get('/api/chapters/:chapterId/comments', optionalAuth, async (req, res) => {
    try {
      const comments = await storage.getCommentsByChapterId(req.params.chapterId);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  app.post('/api/chapters/:chapterId/comments', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      const commentData = insertCommentSchema.parse({
        ...req.body,
        chapterId: req.params.chapterId,
        userId,
      });

      const comment = await storage.createComment(commentData);
      res.status(201).json(comment);
    } catch (error) {
      console.error("Error creating comment:", error);
      res.status(400).json({ message: "Failed to create comment", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Public review routes (no auth required for viewing)
  app.get('/api/series/:seriesId/reviews', optionalAuth, async (req, res) => {
    try {
      const reviews = await storage.getReviewsBySeriesId(req.params.seriesId);
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  app.post('/api/series/:seriesId/reviews', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      const reviewData = insertReviewSchema.parse({
        ...req.body,
        seriesId: req.params.seriesId,
        userId,
        rating: parseInt(req.body.rating),
      });

      const review = await storage.createReview(reviewData);
      res.status(201).json(review);
    } catch (error) {
      console.error("Error creating review:", error);
      res.status(400).json({ message: "Failed to create review", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Protected follow routes (require auth)
  app.post('/api/follow', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { targetId, targetType } = req.body;
      
      if (!targetId || !targetType) {
        return res.status(400).json({ message: "Target ID and type are required" });
      }

      const follow = await storage.createFollow(userId, targetId, targetType);
      res.status(201).json(follow);
    } catch (error) {
      console.error("Error creating follow:", error);
      res.status(400).json({ message: "Failed to follow", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.delete('/api/follow', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { targetId, targetType } = req.body;
      
      if (!targetId || !targetType) {
        return res.status(400).json({ message: "Target ID and type are required" });
      }

      await storage.deleteFollow(userId, targetId, targetType);
      res.status(204).send();
    } catch (error) {
      console.error("Error unfollowing:", error);
      res.status(400).json({ message: "Failed to unfollow", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.get('/api/user/followed-series', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const series = await storage.getFollowedSeries(userId);
      res.json(series);
    } catch (error) {
      console.error("Error fetching followed series:", error);
      res.status(500).json({ message: "Failed to fetch followed series" });
    }
  });

  // Protected bookmark routes (require auth)
  app.post('/api/bookmarks', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { seriesId } = req.body;
      
      if (!seriesId) {
        return res.status(400).json({ message: "Series ID is required" });
      }

      const bookmark = await storage.createBookmark(userId, seriesId);
      res.status(201).json(bookmark);
    } catch (error) {
      console.error("Error creating bookmark:", error);
      res.status(400).json({ message: "Failed to bookmark", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.delete('/api/bookmarks/:seriesId', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      await storage.deleteBookmark(userId, req.params.seriesId);
      res.status(204).send();
    } catch (error) {
      console.error("Error removing bookmark:", error);
      res.status(400).json({ message: "Failed to remove bookmark", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.get('/api/user/bookmarks', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const series = await storage.getBookmarkedSeries(userId);
      res.json(series);
    } catch (error) {
      console.error("Error fetching bookmarks:", error);
      res.status(500).json({ message: "Failed to fetch bookmarks" });
    }
  });

  // Protected reading progress routes (require auth)
  app.put('/api/reading-progress', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { seriesId, chapterId, progress } = req.body;
      
      if (!seriesId || !chapterId || progress === undefined) {
        return res.status(400).json({ message: "Series ID, chapter ID, and progress are required" });
      }

      const readingProgress = await storage.updateReadingProgress(userId, seriesId, chapterId, parseFloat(progress));
      res.json(readingProgress);
    } catch (error) {
      console.error("Error updating reading progress:", error);
      res.status(400).json({ message: "Failed to update reading progress", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.get('/api/reading-progress/:seriesId', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const progress = await storage.getReadingProgress(userId, req.params.seriesId);
      res.json(progress);
    } catch (error) {
      console.error("Error fetching reading progress:", error);
      res.status(500).json({ message: "Failed to fetch reading progress" });
    }
  });

  // Protected creator routes (require auth)
  app.get('/api/creator/series', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const series = await storage.getSeriesByAuthor(userId);
      res.json(series);
    } catch (error) {
      console.error("Error fetching creator series:", error);
      res.status(500).json({ message: "Failed to fetch creator series" });
    }
  });

  app.get('/api/creator/analytics', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      // Verify user is a creator
      if (!req.user.isCreator) {
        return res.status(403).json({ message: "Access denied: Not a creator" });
      }

      // Get basic analytics data
      const userSeries = await storage.getSeriesByAuthor(userId);
      const totalViews = userSeries.reduce((sum, series) => sum + (series.viewCount || 0), 0);
      const followersCount = req.user.followersCount || 0;
      
      // Generate realistic ad revenue data if eligible
      const hasAdRevenue = followersCount >= 1000;
      const adRevenue = hasAdRevenue ? {
        totalImpressions: Math.floor(totalViews * 0.3),
        totalClicks: Math.floor(totalViews * 0.015),
        ctr: 1.5 + Math.random() * 1.5, // 1.5-3% CTR
        revenue: Math.floor(totalViews * 0.001 * 100) / 100, // $0.001 per view
        weeklyRevenue: Math.floor(totalViews * 0.0002 * 100) / 100,
        monthlyRevenue: Math.floor(totalViews * 0.0008 * 100) / 100,
        dailyStats: Array.from({ length: 7 }, (_, i) => ({
          date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toISOString(),
          impressions: Math.floor(Math.random() * 1000) + 100,
          clicks: Math.floor(Math.random() * 30) + 5,
          revenue: Math.floor(Math.random() * 10 * 100) / 100,
        }))
      } : {
        totalImpressions: 0,
        totalClicks: 0,
        ctr: 0,
        revenue: 0,
        weeklyRevenue: 0,
        monthlyRevenue: 0,
        dailyStats: []
      };

      const analytics = {
        totalViews,
        followers: followersCount,
        coinsEarned: req.user.coinBalance || 0,
        activeSeries: userSeries.filter(s => s.status === 'ongoing').length,
        weeklyViews: Math.floor(totalViews * 0.15),
        monthlyViews: Math.floor(totalViews * 0.5),
        adRevenue,
        seriesStats: userSeries.map(series => ({
          id: series.id,
          title: series.title,
          coverImageUrl: series.coverImageUrl,
          views: series.viewCount || 0,
          followers: Math.floor((series.viewCount || 0) * 0.1),
          rating: series.rating || "0.0",
          chapters: series.chapterCount || 0,
          revenue: Math.floor((series.viewCount || 0) * 0.005 * 100) / 100,
          adImpressions: hasAdRevenue ? Math.floor((series.viewCount || 0) * 0.3) : 0,
        }))
      };

      res.json(analytics);
    } catch (error) {
      console.error("Error fetching creator analytics:", error);
      res.status(500).json({ message: "Failed to fetch creator analytics" });
    }
  });

  // Protected transaction routes (require auth)
  app.get('/api/user/transactions', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const transactions = await storage.getUserTransactions(userId);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  // Create Stripe Checkout Session for coin purchase
  app.post('/api/coins/create-checkout-session', requireAuth, async (req: any, res) => {
    try {
      const { packageId, amount, coinAmount } = req.body;
      
      if (!packageId || !amount || !coinAmount) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Stripe functionality temporarily disabled
      return res.status(501).json({ message: "Payment functionality not implemented yet" });
    } catch (error) {
      console.error("Error creating checkout session:", error);
      res.status(500).json({ message: "Failed to create checkout session" });
    }
  });

  // Handle successful Stripe payment
  app.post('/api/coins/confirm-payment', requireAuth, async (req: any, res) => {
    try {
      const { sessionId } = req.body;
      const userId = req.user.id;
      
      if (!sessionId) {
        return res.status(400).json({ message: "Session ID required" });
      }

      // Stripe functionality temporarily disabled
      return res.status(501).json({ message: "Payment confirmation not implemented yet" });
    } catch (error) {
      console.error("Error confirming payment:", error);
      res.status(500).json({ message: "Failed to confirm payment" });
    }
  });

  // User profile routes
  app.get('/api/users/:id', async (req, res) => {
    try {
      const userId = req.params.id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Remove sensitive information
      const { password, resetToken, resetTokenExpiry, ...publicUser } = user;
      
      // Get user's series if they're a creator
      let userSeries: Series[] = [];
      if (user.isCreator) {
        userSeries = await storage.getSeriesByAuthor(userId);
      }

      res.json({
        ...publicUser,
        series: userSeries,
      });
    } catch (error) {
      console.error("Error fetching user profile:", error);
      res.status(500).json({ message: "Failed to fetch user profile" });
    }
  });

  // Premium chapter unlock endpoint
  app.post('/api/chapters/:chapterId/unlock', requireAuth, async (req: any, res) => {
    try {
      const { chapterId } = req.params;
      const userId = req.user.id;

      // Get chapter details
      const chapter = await storage.getChapter(chapterId);
      if (!chapter) {
        return res.status(404).json({ message: "Chapter not found" });
      }

      // Check if chapter is premium
      if (chapter.status === 'free') {
        return res.status(400).json({ message: "Chapter is already free to read" });
      }

      // Check if already unlocked
      const isUnlocked = await storage.isChapterUnlocked(userId, chapterId);
      if (isUnlocked) {
        return res.json({ message: "Chapter already unlocked", unlocked: true });
      }

      // Check if user has enough coins
      const user = await storage.getUser(userId);
      if (!user || (user.coinBalance || 0) < (chapter.coinPrice || 0)) {
        return res.status(400).json({ 
          message: "Insufficient coins",
          required: chapter.coinPrice || 0,
          balance: user?.coinBalance || 0
        });
      }

      // Deduct coins and unlock chapter
      await storage.updateUser(userId, {
        coinBalance: (user.coinBalance || 0) - (chapter.coinPrice || 0)
      });

      await storage.unlockChapter(userId, chapterId);

      // Create transaction record
      await storage.createTransaction({
        userId,
        amount: -(chapter.coinPrice || 0),
        type: 'unlock',
        description: `Unlocked chapter: ${chapter.title}`,
        chapterId,
      });

      res.json({ 
        message: "Chapter unlocked successfully",
        unlocked: true,
        coinsSpent: chapter.coinPrice || 0,
        remainingBalance: (user.coinBalance || 0) - (chapter.coinPrice || 0)
      });
    } catch (error) {
      console.error("Error unlocking chapter:", error);
      res.status(500).json({ message: "Failed to unlock chapter" });
    }
  });

  // Search endpoint
  app.get('/api/search', async (req, res) => {
    try {
      const { q: query, type, status, genre } = req.query as {
        q?: string;
        type?: string;
        status?: string;
        genre?: string;
      };

      if (!query || query.length < 3) {
        return res.json({ series: [], creators: [], groups: [] });
      }

      // Search series
      const series = await storage.searchSeries(query, { type, status, genre });
      
      // Search creators  
      const creators = await storage.searchCreators(query);
      
      // Groups search (placeholder for now)
      const groups: any[] = [];

      res.json({ series, creators, groups });
    } catch (error) {
      console.error("Error performing search:", error);
      res.status(500).json({ message: "Search failed" });
    }
  });

  // Groups routes
  app.get('/api/groups', async (req, res) => {
    try {
      const groups = await storage.getGroupsList();
      res.json(groups);
    } catch (error) {
      console.error("Error fetching groups:", error);
      res.status(500).json({ message: "Failed to fetch groups" });
    }
  });

  app.get('/api/groups/:id', async (req, res) => {
    try {
      const group = await storage.getGroup(req.params.id);
      if (!group) {
        return res.status(404).json({ message: "Group not found" });
      }
      res.json(group);
    } catch (error) {
      console.error("Error fetching group:", error);
      res.status(500).json({ message: "Failed to fetch group" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
