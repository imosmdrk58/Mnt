import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// For installer mode, allow running without DATABASE_URL initially
export let pool: Pool | null = null;
export let db: any = null;

export function initializeDatabase(databaseUrl?: string) {
  const connectionUrl = databaseUrl || process.env.DATABASE_URL;
  
  if (!connectionUrl) {
    console.warn("Database not initialized - installer mode active");
    return false;
  }

  try {
    pool = new Pool({ connectionString: connectionUrl });
    db = drizzle({ client: pool, schema });
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