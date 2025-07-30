import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { sql } from 'drizzle-orm';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';
import * as schema from "@shared/schema";
import type { InstallerSetup } from "@shared/schema";
import ws from "ws";

const scryptAsync = promisify(scrypt);
neonConfig.webSocketConstructor = ws;

export class InstallManager {
  private pool: Pool | null = null;
  private db: any = null;

  async validateDatabaseConnection(databaseUrl: string): Promise<boolean> {
    if (!databaseUrl || databaseUrl.trim() === '') {
      return false;
    }

    try {
      // Validate URL format first
      const url = new URL(databaseUrl);
      if (!['postgres:', 'postgresql:'].includes(url.protocol)) {
        console.error("Invalid database protocol. Must be postgres:// or postgresql://");
        return false;
      }

      const testPool = new Pool({ 
        connectionString: databaseUrl,
        connectionTimeoutMillis: 10000, // 10 second timeout
        idleTimeoutMillis: 5000, // 5 second idle timeout
      });
      
      const testDb = drizzle({ client: testPool, schema });
      
      // Test connection with a simple query with timeout
      const queryPromise = testDb.execute(sql`SELECT 1 as test`);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout')), 15000)
      );
      
      await Promise.race([queryPromise, timeoutPromise]);
      await testPool.end();
      
      console.log("Database connection validated successfully");
      return true;
    } catch (error) {
      console.error("Database validation failed:", error);
      
      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('ENOTFOUND')) {
          console.error("DNS resolution failed - check hostname");
        } else if (error.message.includes('ECONNREFUSED')) {
          console.error("Connection refused - check if database is running");
        } else if (error.message.includes('timeout')) {
          console.error("Connection timeout - check network connectivity");
        } else if (error.message.includes('authentication')) {
          console.error("Authentication failed - check credentials");
        }
      }
      
      return false;
    }
  }

  async initializeDatabase(databaseUrl: string): Promise<boolean> {
    try {
      this.pool = new Pool({ connectionString: databaseUrl });
      this.db = drizzle({ client: this.pool, schema });
      return true;
    } catch (error) {
      console.error("Failed to initialize database:", error);
      return false;
    }
  }

  async createTables(): Promise<boolean> {
    if (!this.db) {
      throw new Error("Database not initialized");
    }

    try {
      // Create tables by running migrations
      // Note: In production, you'd use drizzle-kit for proper migrations
      
      // Sessions table
      await this.db.execute(sql`
        CREATE TABLE IF NOT EXISTS sessions (
          sid varchar PRIMARY KEY,
          sess jsonb NOT NULL,
          expire timestamp NOT NULL
        )
      `);
      
      await this.db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_session_expire ON sessions(expire)
      `);

      // Config table
      await this.db.execute(sql`
        CREATE TABLE IF NOT EXISTS config (
          id varchar PRIMARY KEY DEFAULT 'main_config',
          setup_complete boolean DEFAULT false,
          site_name varchar DEFAULT 'MangaVerse',
          admin_user_id varchar,
          installer_disabled boolean DEFAULT false,
          created_at timestamp DEFAULT now(),
          updated_at timestamp DEFAULT now()
        )
      `);

      // Users table
      await this.db.execute(sql`
        CREATE TABLE IF NOT EXISTS users (
          id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
          username varchar UNIQUE NOT NULL,
          email varchar UNIQUE NOT NULL,
          password varchar NOT NULL,
          first_name varchar,
          last_name varchar,
          profile_image_url varchar,
          coin_balance integer DEFAULT 0,
          is_creator boolean DEFAULT false,
          is_elite_reader boolean DEFAULT false,
          followers_count integer DEFAULT 0,
          email_verified boolean DEFAULT false,
          reset_token varchar,
          reset_token_expiry timestamp,
          creator_display_name text,
          creator_bio text,
          creator_portfolio_url text,
          creator_social_media_url text,
          creator_content_types text,
          creator_experience text,
          creator_motivation text,
          creator_application_status text,
          creator_application_date text,
          chapters_read integer DEFAULT 0,
          reading_streak integer DEFAULT 0,
          last_read_at timestamp,
          reading_dates text,
          settings text,
          created_at timestamp DEFAULT now(),
          updated_at timestamp DEFAULT now()
        )
      `);

      return true;
    } catch (error) {
      console.error("Failed to create tables:", error);
      return false;
    }
  }

  async createAdminUser(username: string, email: string, password: string): Promise<string | null> {
    if (!this.db) {
      throw new Error("Database not initialized");
    }

    try {
      // Hash password with scrypt
      const salt = randomBytes(16).toString('hex');
      const derivedKey = await scryptAsync(password, salt, 64) as Buffer;
      const hashedPassword = `${salt}:${derivedKey.toString('hex')}`;

      // Create admin user
      const [user] = await this.db.insert(schema.users).values({
        username,
        email,
        password: hashedPassword,
        isCreator: true, // Make admin a creator by default
        coinBalance: 10000, // Give admin some coins
      }).returning();

      return user.id;
    } catch (error) {
      console.error("Failed to create admin user:", error);
      return null;
    }
  }

  async completeSetup(siteName: string, adminUserId: string): Promise<boolean> {
    if (!this.db) {
      throw new Error("Database not initialized");
    }

    try {
      // Insert or update config to mark setup as complete
      await this.db.insert(schema.config).values({
        id: "main_config",
        setupComplete: true,
        siteName,
        adminUserId,
        installerDisabled: false,
      }).onConflictDoUpdate({
        target: schema.config.id,
        set: {
          setupComplete: true,
          siteName,
          adminUserId,
          updatedAt: sql`now()`,
        }
      });

      return true;
    } catch (error) {
      console.error("Failed to complete setup:", error);
      return false;
    }
  }

  async checkSetupStatus(): Promise<{ isSetup: boolean; config?: any }> {
    if (!this.db) {
      return { isSetup: false };
    }

    try {
      const [config] = await this.db.select().from(schema.config).where(sql`id = 'main_config'`);
      return {
        isSetup: config?.setupComplete || false,
        config: config || null
      };
    } catch (error) {
      console.error("Failed to check setup status:", error);
      return { isSetup: false };
    }
  }

  async performFullInstallation(setupData: InstallerSetup): Promise<{ success: boolean; error?: string; adminUserId?: string }> {
    try {
      // Step 1: Validate database connection
      const isValidDb = await this.validateDatabaseConnection(setupData.databaseUrl);
      if (!isValidDb) {
        return { success: false, error: "Invalid database URL or connection failed" };
      }

      // Step 2: Initialize database connection
      const isInitialized = await this.initializeDatabase(setupData.databaseUrl);
      if (!isInitialized) {
        return { success: false, error: "Failed to initialize database connection" };
      }

      // Step 3: Create required tables
      const tablesCreated = await this.createTables();
      if (!tablesCreated) {
        return { success: false, error: "Failed to create database tables" };
      }

      // Step 4: Create admin user
      const adminUserId = await this.createAdminUser(
        setupData.adminUsername,
        setupData.adminEmail,
        setupData.adminPassword
      );
      if (!adminUserId) {
        return { success: false, error: "Failed to create admin user" };
      }

      // Step 5: Mark setup as complete
      const setupCompleted = await this.completeSetup(setupData.siteName, adminUserId);
      if (!setupCompleted) {
        return { success: false, error: "Failed to complete setup configuration" };
      }

      // Step 6: Set environment variable (in-memory for this session)
      process.env.DATABASE_URL = setupData.databaseUrl;

      return { success: true, adminUserId };
    } catch (error) {
      console.error("Installation failed:", error);
      return { success: false, error: error instanceof Error ? error.message : "Unknown error occurred" };
    }
  }

  async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      this.db = null;
    }
  }
}

export const installManager = new InstallManager();