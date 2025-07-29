import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
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
  // Auth middleware
  await setupAuth(app);

  // Serve uploaded files
  app.use('/uploads', express.static(uploadDir));

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Series routes
  app.get('/api/series', async (req, res) => {
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

  app.get('/api/series/trending', async (req, res) => {
    try {
      const { limit } = req.query;
      const series = await storage.getTrendingSeries(limit ? parseInt(limit as string) : 10);
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

  app.get('/api/series/:id', async (req, res) => {
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

  app.post('/api/series', isAuthenticated, upload.single('coverImage'), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
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

  // Chapter routes
  app.get('/api/series/:seriesId/chapters', async (req, res) => {
    try {
      const chapters = await storage.getChaptersBySeriesId(req.params.seriesId);
      res.json(chapters);
    } catch (error) {
      console.error("Error fetching chapters:", error);
      res.status(500).json({ message: "Failed to fetch chapters" });
    }
  });

  app.get('/api/chapters/:id', async (req, res) => {
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

  app.post('/api/series/:seriesId/chapters', isAuthenticated, upload.array('pages', 50), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
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

  // Comment routes
  app.get('/api/chapters/:chapterId/comments', async (req, res) => {
    try {
      const comments = await storage.getCommentsByChapterId(req.params.chapterId);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  app.post('/api/chapters/:chapterId/comments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
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

  // Review routes
  app.get('/api/series/:seriesId/reviews', async (req, res) => {
    try {
      const reviews = await storage.getReviewsBySeriesId(req.params.seriesId);
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  app.post('/api/series/:seriesId/reviews', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
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

  // Follow routes
  app.post('/api/follow', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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

  app.delete('/api/follow', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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

  app.get('/api/user/followed-series', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const series = await storage.getFollowedSeries(userId);
      res.json(series);
    } catch (error) {
      console.error("Error fetching followed series:", error);
      res.status(500).json({ message: "Failed to fetch followed series" });
    }
  });

  // Bookmark routes
  app.post('/api/bookmarks', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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

  app.delete('/api/bookmarks/:seriesId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.deleteBookmark(userId, req.params.seriesId);
      res.status(204).send();
    } catch (error) {
      console.error("Error removing bookmark:", error);
      res.status(400).json({ message: "Failed to remove bookmark", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.get('/api/user/bookmarks', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const series = await storage.getBookmarkedSeries(userId);
      res.json(series);
    } catch (error) {
      console.error("Error fetching bookmarks:", error);
      res.status(500).json({ message: "Failed to fetch bookmarks" });
    }
  });

  // Reading progress routes
  app.put('/api/reading-progress', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { seriesId, chapterId, progress } = req.body;
      
      if (!seriesId || !chapterId || progress === undefined) {
        return res.status(400).json({ message: "Series ID, chapter ID, and progress are required" });
      }

      const readingProgress = await storage.updateReadingProgress(userId, seriesId, chapterId, parseFloat(progress));
      res.json(readingProgress);
    } catch (error) {
      console.error("Error updating reading progress:", error);
      res.status(400).json({ message: "Failed to update reading progress", error: error.message });
    }
  });

  app.get('/api/reading-progress/:seriesId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const progress = await storage.getReadingProgress(userId, req.params.seriesId);
      res.json(progress);
    } catch (error) {
      console.error("Error fetching reading progress:", error);
      res.status(500).json({ message: "Failed to fetch reading progress" });
    }
  });

  // Creator routes
  app.get('/api/creator/series', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const series = await storage.getSeriesByAuthor(userId);
      res.json(series);
    } catch (error) {
      console.error("Error fetching creator series:", error);
      res.status(500).json({ message: "Failed to fetch creator series" });
    }
  });

  app.get('/api/creator/analytics', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const analytics = await storage.getCreatorAnalytics(userId);
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching creator analytics:", error);
      res.status(500).json({ message: "Failed to fetch creator analytics" });
    }
  });

  // Transaction routes
  app.get('/api/user/transactions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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
