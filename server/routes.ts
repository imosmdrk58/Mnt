import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, requireAuth, optionalAuth } from "./auth";
import { insertSeriesSchema, insertChapterSchema, insertCommentSchema, insertReviewSchema, installerSetupSchema, type Series } from "@shared/schema";
import { installManager } from "./installManager";
import { checkSetupStatus, clearSetupStatusCache, setupMiddleware } from "./middleware/setupMiddleware";
import { initializeDatabase } from "./db";
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
  // Setup/Installation API routes (must be before auth middleware)
  app.get('/api/setup/status', async (req, res) => {
    try {
      const setupStatus = await checkSetupStatus();
      res.json(setupStatus);
    } catch (error) {
      console.error("Setup status check failed:", error);
      res.status(500).json({ error: "Failed to check setup status" });
    }
  });

  app.post('/api/setup/install', async (req, res) => {
    try {
      const setupData = installerSetupSchema.parse(req.body);
      
      // Perform full installation
      const result = await installManager.performFullInstallation(setupData);
      
      if (result.success) {
        // Reinitialize main database connection with new URL
        initializeDatabase(setupData.databaseUrl);
        
        // Clear setup status cache to force refresh
        clearSetupStatusCache();
        
        res.json({ 
          success: true, 
          message: "Installation completed successfully",
          adminUserId: result.adminUserId,
          siteName: setupData.siteName
        });
      } else {
        res.status(400).json({ 
          success: false, 
          error: result.error || "Installation failed"
        });
      }
    } catch (error) {
      console.error("Installation error:", error);
      if (error instanceof Error) {
        res.status(400).json({ 
          success: false, 
          error: error.message
        });
      } else {
        res.status(500).json({ 
          success: false, 
          error: "Unknown installation error"
        });
      }
    }
  });

  app.post('/api/setup/validate-db', async (req, res) => {
    try {
      console.log("Received validation request:", req.body);
      const { databaseUrl } = req.body;
      
      if (!databaseUrl || databaseUrl.trim() === '') {
        return res.status(400).json({ valid: false, error: "Database URL is required" });
      }
      
      console.log("Validating database URL:", databaseUrl.substring(0, 20) + "...");
      const result = await installManager.validateDatabaseConnection(databaseUrl);
      
      if (result.valid) {
        res.json({ valid: true, message: "Database connection successful" });
      } else {
        res.json({ valid: false, error: result.error || "Unable to connect to database." });
      }
    } catch (error) {
      console.error("Database validation error:", error);
      
      // Provide more specific error messages based on the error type
      let errorMessage = "Database validation failed";
      if (error instanceof Error) {
        if (error.message.includes('ENOTFOUND')) {
          errorMessage = "Database hostname not found. Please verify the hostname in your connection string.";
        } else if (error.message.includes('ECONNREFUSED')) {
          errorMessage = "Connection refused. The database server may be down or the port may be incorrect.";
        } else if (error.message.includes('timeout')) {
          errorMessage = "Connection timeout. Please check your network connectivity and database availability.";
        } else if (error.message.includes('authentication') || error.message.includes('password')) {
          errorMessage = "Authentication failed. Please check your username and password.";
        } else if (error.message.includes('ECONNRESET')) {
          errorMessage = "Connection reset. The database may be overloaded or have connection limits.";
        } else {
          errorMessage = `Database validation failed: ${error.message}`;
        }
      }
      
      res.json({ valid: false, error: errorMessage });
    }
  });

  // Test endpoint to validate current environment database
  app.get('/api/setup/test-current-db', async (req, res) => {
    try {
      const currentDbUrl = process.env.DATABASE_URL;
      if (!currentDbUrl) {
        return res.json({ valid: false, error: "No DATABASE_URL environment variable set" });
      }
      
      console.log("Testing current database connection...");
      const result = await installManager.validateDatabaseConnection(currentDbUrl);
      res.json({ 
        valid: result.valid, 
        message: result.valid ? "Current database connection works" : result.error || "Current database connection failed",
        hasDbUrl: !!currentDbUrl
      });
    } catch (error) {
      console.error("Current database test error:", error);
      res.json({ valid: false, error: `Database test failed: ${(error as Error).message}` });
    }
  });

  // Apply setup middleware to protect all non-setup routes
  app.use((req, res, next) => {
    const path = req.path;
    // Skip setup middleware for setup-related routes and static assets
    if (path.startsWith('/api/setup') || 
        path.startsWith('/uploads') || 
        path.endsWith('.js') || path.endsWith('.css') || path.endsWith('.ico') ||
        path.endsWith('.png') || path.endsWith('.jpg') || path.endsWith('.jpeg') ||
        path.endsWith('.webp') || path.endsWith('.svg') || path.endsWith('.woff') ||
        path.endsWith('.woff2') || path.endsWith('.map')) {
      return next();
    }
    
    // Apply setup middleware to all other routes
    setupMiddleware(req, res, next);
  });

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

  // User profile route by ID
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

  // User profile route by username (case-insensitive)
  app.get('/api/user/:username', optionalAuth, async (req, res) => {
    try {
      const user = await storage.getUserByUsername(req.params.username);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Calculate follower and following counts
      const followerCount = await storage.getFollowerCount(user.id);
      const followingCount = await storage.getFollowingCount(user.id);
      
      // Check if current user is following this profile (if authenticated)
      let isFollowing = false;
      if (req.user && req.user.id !== user.id) {
        isFollowing = await storage.isFollowing(req.user.id, user.id);
      }
      
      // Remove sensitive information including email for privacy
      const { password, email, resetToken, resetTokenExpiry, ...safeUser } = user;
      
      res.json({
        ...safeUser,
        stats: {
          followers: followerCount,
          following: followingCount,
          chaptersRead: user.chaptersRead || 0
        },
        isFollowing
      });
    } catch (error) {
      console.error("Error fetching user by username:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Following system endpoints
  app.post('/api/follow', requireAuth, async (req: any, res) => {
    try {
      const { followingId } = req.body;
      const followerId = req.user.id;
      
      if (followerId === followingId) {
        return res.status(400).json({ message: "Cannot follow yourself" });
      }
      
      const follow = await storage.createFollow(followerId, followingId, 'user');
      res.json({ message: "Successfully followed user", follow });
    } catch (error) {
      console.error("Error following user:", error);
      res.status(500).json({ message: "Failed to follow user" });
    }
  });

  app.delete('/api/follow', requireAuth, async (req: any, res) => {
    try {
      const { followingId } = req.body;
      const followerId = req.user.id;
      
      await storage.deleteFollow(followerId, followingId, 'user');
      res.json({ message: "Successfully unfollowed user" });
    } catch (error) {
      console.error("Error unfollowing user:", error);
      res.status(500).json({ message: "Failed to unfollow user" });
    }
  });

  app.get('/api/user/:id/following', optionalAuth, async (req, res) => {
    try {
      const following = await storage.getUserFollowing(req.params.id);
      res.json(following);
    } catch (error) {
      console.error("Error fetching following:", error);
      res.status(500).json({ message: "Failed to fetch following" });
    }
  });

  app.get('/api/user/:id/followers', optionalAuth, async (req, res) => {
    try {
      const followers = await storage.getUserFollowers(req.params.id);
      res.json(followers);
    } catch (error) {
      console.error("Error fetching followers:", error);
      res.status(500).json({ message: "Failed to fetch followers" });
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

  // Reorder chapters
  app.post("/api/series/:id/reorder-chapters", requireAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { chapterIds } = req.body;

      if (!Array.isArray(chapterIds)) {
        return res.status(400).json({ error: "chapterIds must be an array" });
      }

      // Update chapter order in database
      for (let i = 0; i < chapterIds.length; i++) {
        await storage.updateChapter(chapterIds[i], {
          chapterNumber: i + 1
        });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Reorder chapters error:", error);
      res.status(500).json({ error: "Failed to reorder chapters" });
    }
  });

  app.get('/api/chapters/:id', optionalAuth, async (req, res) => {
    try {
      const chapter = await storage.getChapter(req.params.id);
      if (!chapter) {
        return res.status(404).json({ message: "Chapter not found" });
      }

      // Track view if user is logged in (unique per user per chapter)
      if (req.user) {
        await storage.trackChapterView(req.params.id, req.user.id);
      }

      res.json(chapter);
    } catch (error) {
      console.error("Error fetching chapter:", error);
      res.status(500).json({ message: "Failed to fetch chapter" });
    }
  });

  // Like/unlike chapter endpoint
  app.post('/api/chapters/:id/like', requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      
      const result = await storage.toggleChapterLike(id, userId);
      res.json(result);
    } catch (error) {
      console.error("Error toggling chapter like:", error);
      res.status(500).json({ message: "Failed to toggle like" });
    }
  });

  app.delete('/api/chapters/:id/like', requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      
      const result = await storage.toggleChapterLike(id, userId);
      res.json(result);
    } catch (error) {
      console.error("Error toggling chapter like:", error);
      res.status(500).json({ message: "Failed to toggle like" });
    }
  });

  // Check if user has liked a chapter
  app.get('/api/chapters/:id/like-status', requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      
      const isLiked = await storage.hasUserLikedChapter(id, userId);
      res.json({ isLiked });
    } catch (error) {
      console.error("Error checking like status:", error);
      res.status(500).json({ message: "Failed to check like status" });
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

  // Check bookmark status for a specific series
  app.get('/api/bookmarks/:seriesId/status', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { seriesId } = req.params;
      
      const bookmarks = await storage.getBookmarkedSeries(userId);
      const isBookmarked = bookmarks.some(series => series.id === seriesId);
      
      res.json({ isBookmarked });
    } catch (error) {
      console.error("Error checking bookmark status:", error);
      res.status(500).json({ message: "Failed to check bookmark status" });
    }
  });

  // Like/Unlike a chapter
  app.post('/api/chapters/:chapterId/like', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { chapterId } = req.params;
      
      // Check if user already liked this chapter
      const existingLike = await storage.getUserChapterLike(userId, chapterId);
      
      if (existingLike) {
        // Unlike the chapter
        await storage.removeLike(existingLike.id);
        const chapter = await storage.getChapter(chapterId);
        const updatedLikeCount = Math.max(0, (chapter?.likeCount || 0) - 1);
        await storage.updateChapter(chapterId, { likeCount: updatedLikeCount });
        
        // Update series total like count (sum of all chapter likes)
        if (chapter?.seriesId) {
          const chapters = await storage.getChaptersBySeriesId(chapter.seriesId);
          const totalSeriesLikes = chapters.reduce((sum, ch) => sum + (ch.likeCount || 0), 0) - 1;
          await storage.updateSeries(chapter.seriesId, { likeCount: Math.max(0, totalSeriesLikes) });
        }
        
        res.json({ isLiked: false, totalLikes: updatedLikeCount });
      } else {
        // Like the chapter
        await storage.addLike(userId, chapterId);
        const chapter = await storage.getChapter(chapterId);
        const updatedLikeCount = (chapter?.likeCount || 0) + 1;
        await storage.updateChapter(chapterId, { likeCount: updatedLikeCount });
        
        // Update series total like count (sum of all chapter likes)  
        if (chapter?.seriesId) {
          const chapters = await storage.getChaptersBySeriesId(chapter.seriesId);
          const totalSeriesLikes = chapters.reduce((sum, ch) => sum + (ch.likeCount || 0), 0) + 1;
          await storage.updateSeries(chapter.seriesId, { likeCount: totalSeriesLikes });
        }
        
        res.json({ isLiked: true, totalLikes: updatedLikeCount });
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      res.status(500).json({ message: "Failed to toggle like" });
    }
  });

  // Check if user liked a chapter
  app.get('/api/chapters/:chapterId/like-status', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { chapterId } = req.params;
      
      const like = await storage.getUserChapterLike(userId, chapterId);
      res.json({ isLiked: !!like });
    } catch (error) {
      console.error("Error checking like status:", error);
      res.status(500).json({ message: "Failed to check like status" });
    }
  });

  // Get chapter comments
  app.get('/api/chapters/:chapterId/comments', async (req: any, res) => {
    try {
      const { chapterId } = req.params;
      const comments = await storage.getChapterComments(chapterId);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  // Add a comment to a chapter
  app.post('/api/chapters/:chapterId/comments', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { chapterId } = req.params;
      const { content } = req.body;
      
      if (!content || !content.trim()) {
        return res.status(400).json({ message: "Comment content is required" });
      }
      
      await storage.addComment(userId, chapterId, content.trim());
      res.status(201).json({ message: "Comment added successfully" });
    } catch (error) {
      console.error("Error adding comment:", error);
      res.status(500).json({ message: "Failed to add comment" });
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

  // Profile stats endpoint
  app.get('/api/user/profile-stats', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const profileStats = await storage.getProfileStats(userId);
      res.json(profileStats);
    } catch (error) {
      console.error("Error fetching profile stats:", error);
      res.status(500).json({ message: "Failed to fetch profile stats" });
    }
  });

  // Update reading statistics when user completes chapter
  app.post('/api/user/updateReadingStats', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { chapterId, seriesId } = req.body;
      
      if (!chapterId || !seriesId) {
        return res.status(400).json({ message: "Chapter ID and Series ID are required" });
      }
      
      await storage.updateReadingStats(userId, chapterId, seriesId);
      res.json({ message: "Reading statistics updated successfully" });
    } catch (error) {
      console.error("Error updating reading stats:", error);
      res.status(500).json({ message: "Failed to update reading statistics" });
    }
  });

  // Get user settings
  app.get('/api/user/settings', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const settings = await storage.getUserSettings(userId);
      res.json(settings);
    } catch (error) {
      console.error("Error fetching user settings:", error);
      res.status(500).json({ message: "Failed to fetch user settings" });
    }
  });

  // Update user settings
  app.patch('/api/user/settings', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { settingKey, value, settings } = req.body;
      
      if (settings) {
        // Update entire settings object
        await storage.updateUserSettings(userId, settings);
      } else if (settingKey && value !== undefined) {
        // Update specific setting
        const currentSettings = await storage.getUserSettings(userId) || {};
        const keys = settingKey.split('.');
        let current = currentSettings;
        
        // Navigate to the nested property
        for (let i = 0; i < keys.length - 1; i++) {
          if (!current[keys[i]]) {
            current[keys[i]] = {};
          }
          current = current[keys[i]];
        }
        
        // Set the value
        current[keys[keys.length - 1]] = value;
        await storage.updateUserSettings(userId, currentSettings);
      } else {
        return res.status(400).json({ message: "Either 'settings' object or 'settingKey' and 'value' are required" });
      }
      
      res.json({ message: "Settings updated successfully" });
    } catch (error) {
      console.error("Error updating user settings:", error);
      res.status(500).json({ message: "Failed to update user settings" });
    }
  });

  // Get continue reading data
  app.get('/api/user/continue-reading', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const continueReading = await storage.getContinueReading(userId);
      res.json(continueReading);
    } catch (error) {
      console.error("Error fetching continue reading data:", error);
      res.status(500).json({ message: "Failed to fetch continue reading data" });
    }
  });

  // Get accurate series progress
  app.get('/api/progress/:seriesId', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { seriesId } = req.params;
      
      if (!seriesId) {
        return res.status(400).json({ message: "Series ID is required" });
      }
      
      const progress = await storage.getSeriesProgress(userId, seriesId);
      res.json(progress);
    } catch (error) {
      console.error("Error fetching series progress:", error);
      res.status(500).json({ message: "Failed to fetch series progress" });
    }
  });

  // Update progress when chapter is completed  
  app.post('/api/progress/update', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { chapterId, seriesId } = req.body;
      
      if (!chapterId || !seriesId) {
        return res.status(400).json({ message: "Chapter ID and Series ID are required" });
      }
      
      await storage.updateReadingStats(userId, chapterId, seriesId);
      
      // Return updated progress
      const progress = await storage.getSeriesProgress(userId, seriesId);
      res.json({ 
        message: "Progress updated successfully",
        progress 
      });
    } catch (error) {
      console.error("Error updating progress:", error);
      res.status(500).json({ message: "Failed to update progress" });
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

  // Chapter like endpoints
  app.post("/api/chapters/:id/like", requireAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      const result = await storage.toggleChapterLike(id, userId);
      res.json(result);
    } catch (error) {
      console.error("Error toggling chapter like:", error);
      res.status(500).json({ message: "Failed to toggle chapter like" });
    }
  });

  app.get("/api/chapters/:id/like-status", optionalAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      
      if (!userId) {
        return res.json({ isLiked: false });
      }
      
      const isLiked = await storage.hasUserLikedChapter(id, userId);
      res.json({ isLiked });
    } catch (error) {
      console.error("Error checking like status:", error);
      res.status(500).json({ message: "Failed to check like status" });
    }
  });

  app.post("/api/chapters/:id/view", async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      
      await storage.trackChapterView(id, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error tracking chapter view:", error);
      res.status(500).json({ message: "Failed to track chapter view" });
    }
  });

  // Track reading endpoint - records reading activity at 90% completion
  app.post('/api/track-reading', requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { chapterId, seriesId } = req.body;

      if (!chapterId || !seriesId) {
        return res.status(400).json({ message: "Missing chapterId or seriesId" });
      }

      // Add reading history record
      await storage.addReadingHistory(userId, chapterId, seriesId);

      // Increment chapter view count
      await storage.incrementChapterViews(chapterId);

      // Increment series total views
      await storage.incrementSeriesViews(seriesId);

      res.json({ success: true, message: "Reading tracked successfully" });
    } catch (error) {
      console.error("Error tracking reading:", error);
      res.status(500).json({ message: "Failed to track reading" });
    }
  });

  // User stats endpoint
  app.get('/api/user/:id/stats', optionalAuth, async (req, res) => {
    try {
      const userId = req.params.id;
      const stats = await storage.getUserStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching user stats:", error);
      res.status(500).json({ message: "Failed to fetch user stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
