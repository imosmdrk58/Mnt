import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, requireAuth, optionalAuth } from "./auth";
import { insertSeriesSchema, insertChapterSchema, insertCommentSchema, insertReviewSchema } from "@shared/schema";
import multer from 'multer';
import path from 'path';
import fs from 'fs';

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

  app.post('/api/series', requireAuth, upload.single('coverImage'), async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      // Validate input
      const seriesData = insertSeriesSchema.parse({
        ...req.body,
        authorId: userId,
        genres: req.body.genres ? JSON.parse(req.body.genres) : [],
        tags: req.body.tags ? JSON.parse(req.body.tags) : [],
        coverImageUrl: req.file ? `/uploads/${req.file.filename}` : null,
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
      const analytics = await storage.getCreatorAnalytics(userId);
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
