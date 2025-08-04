import { Pool as NeonPool, neonConfig } from '@neondatabase/serverless';
import { Pool as PgPool } from 'pg';
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-serverless';
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// For installer mode, allow running without DATABASE_URL initially
export let pool: NeonPool | PgPool | null = null;
export let db: any = null;

function isNeonUrl(databaseUrl: string): boolean {
  return databaseUrl.includes('neon.tech') || databaseUrl.includes('neon.dev');
}

export function initializeDatabase(databaseUrl?: string) {
  const connectionUrl = databaseUrl || process.env.DATABASE_URL;
  
  if (!connectionUrl) {
    console.warn("Database not initialized - installer mode active");
    return false;
  }

  // Skip reinitialization if already connected to the same URL
  if (db && pool && connectionUrl === process.env.DATABASE_URL) {
    return true;
  }

  try {
    // Close existing connection if reinitializing
    if (pool) {
      pool.end().catch(err => console.warn("Error closing previous pool:", err));
    }

    const isNeon = isNeonUrl(connectionUrl);
    
    if (isNeon) {
      // Use Neon serverless for Neon databases  
      pool = new NeonPool({ 
        connectionString: connectionUrl,
        connectionTimeoutMillis: 15000,
        idleTimeoutMillis: 5000,
      });
      db = drizzleNeon({ client: pool as NeonPool, schema });
      console.log("Database initialized with Neon serverless driver");
    } else {
      // Use regular pg Pool for other PostgreSQL providers (Supabase, etc.)
      pool = new PgPool({ 
        connectionString: connectionUrl,
        connectionTimeoutMillis: 15000,
        idleTimeoutMillis: 5000,
        max: 1, // Single connection for serverless
        ssl: { rejectUnauthorized: false },
      });
      db = drizzlePg(pool as PgPool, { schema });
      console.log("Database initialized with standard PostgreSQL driver");
    }
    
    return true;
  } catch (error) {
    console.error("Failed to initialize database:", error);
    return false;
  }
}

// Initialize database on module load if DATABASE_URL is available
if (process.env.DATABASE_URL) {
  initializeDatabase();
}

export { schema };