import { Pool as NeonPool, neonConfig } from '@neondatabase/serverless';
import { Pool as PgPool } from 'pg';
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-serverless';
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import { sql } from 'drizzle-orm';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';
import * as schema from "@shared/schema";
import type { InstallerSetup } from "@shared/schema";
import ws from "ws";

const scryptAsync = promisify(scrypt);
neonConfig.webSocketConstructor = ws;

export class InstallManager {
  private pool: NeonPool | PgPool | null = null;
  private db: any = null;
  private isNeonDatabase = false;

  private isNeonUrl(databaseUrl: string): boolean {
    return databaseUrl.includes('neon.tech') || databaseUrl.includes('neon.dev');
  }

  private isSupabaseUrl(databaseUrl: string): boolean {
    return databaseUrl.includes('supabase.co');
  }

  async validateDatabaseConnection(databaseUrl: string): Promise<{ valid: boolean; error?: string }> {
    if (!databaseUrl || databaseUrl.trim() === '') {
      return { valid: false, error: "Database URL is required" };
    }

    let testPool: NeonPool | PgPool | null = null;

    try {
      // Validate URL format first
      const url = new URL(databaseUrl);
      if (!['postgres:', 'postgresql:'].includes(url.protocol)) {
        return { valid: false, error: "Invalid database protocol. Must be postgres:// or postgresql://" };
      }

      const isNeon = this.isNeonUrl(databaseUrl);
      console.log(`Testing database connection (${isNeon ? 'Neon' : 'Standard PostgreSQL'}):`, databaseUrl.replace(/:\/\/[^@]+@/, '://***:***@'));
      
      if (isNeon) {
        // Use Neon serverless for Neon databases
        testPool = new NeonPool({ 
          connectionString: databaseUrl,
          connectionTimeoutMillis: 15000,
          idleTimeoutMillis: 5000,
        });
        
        const testDb = drizzleNeon({ client: testPool as NeonPool, schema });
        await testDb.execute(sql`SELECT 1 as test`);
      } else {
        // Use regular pg Pool for other PostgreSQL providers (Supabase, etc.)
        testPool = new PgPool({ 
          connectionString: databaseUrl,
          connectionTimeoutMillis: 15000,
          idleTimeoutMillis: 5000,
          max: 1,
          ssl: { rejectUnauthorized: false }, // Allow SSL connections for cloud databases
        });
        
        // Test connection with a simple query using the pool directly
        const client = await testPool.connect();
        await client.query('SELECT 1 as test');
        client.release();
      }
      
      console.log("Database connection validated successfully");
      return { valid: true };
    } catch (error) {
      console.error("Database validation failed:", error);
      
      // Provide more specific error messages
      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase();
        
        if (errorMessage.includes('enotfound') || errorMessage.includes('getaddrinfo')) {
          // Check if this is a Supabase connection issue
          if (this.isSupabaseUrl(databaseUrl)) {
            return { valid: false, error: "Cannot reach Supabase database from this environment. This may be due to network restrictions in the server environment. The database URL appears valid, but the hostname cannot be resolved from this server. You may need to use a different database provider or check if your Supabase project allows connections from this IP range." };
          }
          return { valid: false, error: "Database hostname could not be resolved. Please verify the hostname in your connection string and check your internet connection." };
        } else if (errorMessage.includes('econnrefused')) {
          return { valid: false, error: "Connection refused. The database server may be down or the port may be incorrect." };
        } else if (errorMessage.includes('timeout') || errorMessage.includes('etimedout')) {
          return { valid: false, error: "Connection timeout. Please check your network connectivity and database availability." };
        } else if (errorMessage.includes('authentication') || errorMessage.includes('password') || errorMessage.includes('login')) {
          return { valid: false, error: "Authentication failed. Please check your username and password." };
        } else if (errorMessage.includes('econnreset')) {
          return { valid: false, error: "Connection reset. The database may be overloaded or have connection limits." };
        } else if (errorMessage.includes('invalid') && errorMessage.includes('url')) {
          return { valid: false, error: "Invalid database URL format. Please check your connection string." };
        } else if (errorMessage.includes('no pg_hba.conf entry')) {
          return { valid: false, error: "Database access denied. Please check your database access configuration." };
        } else if (errorMessage.includes('does not exist')) {
          return { valid: false, error: "Database does not exist. Please verify the database name in your connection string." };
        }
      }
      
      return { valid: false, error: `Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}` };
    } finally {
      // Always clean up the test connection
      if (testPool) {
        try {
          await testPool.end();
        } catch (cleanupError) {
          console.warn("Failed to cleanup test connection:", cleanupError);
        }
      }
    }
  }

  async initializeDatabase(databaseUrl: string): Promise<boolean> {
    try {
      this.isNeonDatabase = this.isNeonUrl(databaseUrl);
      
      if (this.isNeonDatabase) {
        this.pool = new NeonPool({ connectionString: databaseUrl });
        this.db = drizzleNeon({ client: this.pool as NeonPool, schema });
      } else {
        this.pool = new PgPool({ connectionString: databaseUrl });
        this.db = drizzlePg(this.pool as PgPool, { schema });
      }
      
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
      console.log("Creating database schema...");
      
      // Use a simplified approach - create only essential tables for installation
      // and let the application create the rest via migrations
      
      // Sessions table
      await this.db.execute(sql`CREATE TABLE IF NOT EXISTS sessions (sid varchar PRIMARY KEY, sess jsonb NOT NULL, expire timestamp NOT NULL)`);
      
      await this.db.execute(sql`CREATE INDEX IF NOT EXISTS idx_session_expire ON sessions(expire)`);

      // Config table
      await this.db.execute(sql`CREATE TABLE IF NOT EXISTS config (id varchar PRIMARY KEY DEFAULT 'main_config', setup_complete boolean DEFAULT false, site_name varchar DEFAULT 'MangaVerse', admin_user_id varchar, installer_disabled boolean DEFAULT false, stripe_public_key varchar, stripe_secret_key varchar, logo_url varchar, favicon_url varchar, created_at timestamp DEFAULT now(), updated_at timestamp DEFAULT now())`);

      // Users table
      await this.db.execute(sql`CREATE TABLE IF NOT EXISTS users (id varchar PRIMARY KEY DEFAULT gen_random_uuid(), username varchar UNIQUE NOT NULL, email varchar UNIQUE NOT NULL, password varchar NOT NULL, first_name varchar, last_name varchar, profile_image_url varchar, coin_balance integer DEFAULT 0, is_creator boolean DEFAULT false, is_elite_reader boolean DEFAULT false, followers_count integer DEFAULT 0, email_verified boolean DEFAULT false, reset_token varchar, reset_token_expiry timestamp, creator_display_name text, creator_bio text, creator_portfolio_url text, creator_social_media_url text, creator_content_types text, creator_experience text, creator_motivation text, creator_application_status text, creator_application_date text, chapters_read integer DEFAULT 0, reading_streak integer DEFAULT 0, last_read_at timestamp, reading_dates text, settings text, created_at timestamp DEFAULT now(), updated_at timestamp DEFAULT now())`);

      console.log("Basic tables created successfully");
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
      // Hash password with scrypt (using same format as auth.ts)
      const salt = randomBytes(16).toString('hex');
      const derivedKey = await scryptAsync(password, salt, 64) as Buffer;
      const hashedPassword = `${derivedKey.toString('hex')}.${salt}`; // Fixed: hash.salt format

      // Create admin user
      const [user] = await this.db.insert(schema.users).values({
        username,
        email,
        password: hashedPassword,
        isCreator: true, // Make admin a creator by default
        coinBalance: 10000, // Give admin some coins
      }).returning();

      console.log(`Admin user created successfully: ${username} (${user.id})`);
      return user.id;
    } catch (error) {
      console.error("Failed to create admin user:", error);
      return null;
    }
  }

  async completeSetup(setupData: {
    siteName: string;
    adminUserId: string;
    stripePublicKey?: string;
    stripeSecretKey?: string;
    logoUrl?: string;
    faviconUrl?: string;
  }): Promise<boolean> {
    if (!this.db) {
      throw new Error("Database not initialized");
    }

    try {
      // Insert or update config to mark setup as complete
      await this.db.insert(schema.config).values({
        id: "main_config",
        setupComplete: true,
        siteName: setupData.siteName,
        adminUserId: setupData.adminUserId,
        stripePublicKey: setupData.stripePublicKey,
        stripeSecretKey: setupData.stripeSecretKey,
        logoUrl: setupData.logoUrl,
        faviconUrl: setupData.faviconUrl,
        installerDisabled: false,
      }).onConflictDoUpdate({
        target: schema.config.id,
        set: {
          setupComplete: true,
          siteName: setupData.siteName,
          adminUserId: setupData.adminUserId,
          stripePublicKey: setupData.stripePublicKey,
          stripeSecretKey: setupData.stripeSecretKey,
          logoUrl: setupData.logoUrl,
          faviconUrl: setupData.faviconUrl,
          updatedAt: sql`now()`,
        }
      });
      
      // Set environment variables for this session
      if (setupData.stripePublicKey) {
        process.env.VITE_STRIPE_PUBLIC_KEY = setupData.stripePublicKey;
      }
      if (setupData.stripeSecretKey) {
        process.env.STRIPE_SECRET_KEY = setupData.stripeSecretKey;
      }

      console.log("Setup completed successfully with configuration:", {
        siteName: setupData.siteName,
        hasStripe: !!(setupData.stripePublicKey && setupData.stripeSecretKey),
        hasLogo: !!setupData.logoUrl,
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
      const dbValidation = await this.validateDatabaseConnection(setupData.databaseUrl);
      if (!dbValidation.valid) {
        return { success: false, error: dbValidation.error || "Invalid database URL or connection failed" };
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

      // Step 5: Mark setup as complete with all configuration
      const setupCompleted = await this.completeSetup({
        siteName: setupData.siteName,
        adminUserId,
        stripePublicKey: setupData.stripePublicKey,
        stripeSecretKey: setupData.stripeSecretKey,
        logoUrl: setupData.logoUrl,
        faviconUrl: setupData.faviconUrl,
      });
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