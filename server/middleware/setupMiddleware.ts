import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { config } from '@shared/schema';
import { sql } from 'drizzle-orm';

export interface SetupStatus {
  isSetup: boolean;
  config?: any;
}

let cachedSetupStatus: SetupStatus | null = null;
let lastStatusCheck = 0;
const STATUS_CACHE_DURATION = 30000; // 30 seconds

export async function checkSetupStatus(): Promise<SetupStatus> {
  const now = Date.now();
  
  // Return cached status if still valid
  if (cachedSetupStatus && (now - lastStatusCheck) < STATUS_CACHE_DURATION) {
    return cachedSetupStatus;
  }

  // If database is not initialized, setup is not complete
  if (!db) {
    cachedSetupStatus = { isSetup: false };
    lastStatusCheck = now;
    return cachedSetupStatus;
  }

  try {
    const [configRecord] = await db.select().from(config).where(sql`id = 'main_config'`);
    
    cachedSetupStatus = {
      isSetup: configRecord?.setupComplete || false,
      config: configRecord || null
    };
    
    lastStatusCheck = now;
    return cachedSetupStatus;
  } catch (error) {
    console.error("Failed to check setup status:", error);
    cachedSetupStatus = { isSetup: false };
    lastStatusCheck = now;
    return cachedSetupStatus;
  }
}

export function clearSetupStatusCache(): void {
  cachedSetupStatus = null;
  lastStatusCheck = 0;
}

export async function setupMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  const path = req.path;
  
  // Skip middleware for setup routes and static assets
  if (path.startsWith('/setup') || path.startsWith('/api/setup') || 
      path.startsWith('/assets') || path.startsWith('/node_modules') ||
      path.startsWith('/@vite') || path.startsWith('/src') ||
      path.startsWith('/@id') || path.startsWith('/@fs') ||
      path.startsWith('/@react-refresh') || path.startsWith('/__vite') ||
      path.endsWith('.js') || path.endsWith('.css') || path.endsWith('.ico') ||
      path.endsWith('.ts') || path.endsWith('.tsx') || path.endsWith('.jsx') ||
      path.endsWith('.map') || path.endsWith('.woff') || path.endsWith('.woff2') ||
      path.endsWith('.mjs') || path.endsWith('.json') ||
      path.includes('/uploads/') || path.includes('.vite/')) {
    return next();
  }

  // Also skip for any other API routes during development to prevent blocking
  if (process.env.NODE_ENV === 'development' && path.startsWith('/api/')) {
    console.log(`Setup middleware: Allowing API route during development: ${path}`);
    return next();
  }

  try {
    const setupStatus = await checkSetupStatus();
    
    // If setup is not complete, redirect to setup page
    if (!setupStatus.isSetup) {
      if (req.headers.accept?.includes('application/json')) {
        // For API requests, return JSON response
        res.status(503).json({
          error: 'Setup required',
          message: 'Please complete the installation setup',
          setupRequired: true
        });
        return;
      } else {
        // For browser requests, redirect to setup page
        res.redirect('/setup');
        return;
      }
    }

    // Setup is complete, continue to next middleware
    next();
  } catch (error) {
    console.error("Setup middleware error:", error);
    
    // On error, assume setup is not complete
    if (req.headers.accept?.includes('application/json')) {
      res.status(503).json({
        error: 'Setup status check failed',
        message: 'Unable to verify installation status',
        setupRequired: true
      });
      return;
    } else {
      res.redirect('/setup');
      return;
    }
  }
}