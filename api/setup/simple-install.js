// Simple installation without dynamic imports
import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { databaseUrl, adminUsername, adminPassword } = req.body || {};
    
    if (!databaseUrl || !adminUsername || !adminPassword) {
      return res.status(400).json({ 
        message: 'Missing required fields: databaseUrl, adminUsername, adminPassword' 
      });
    }

    console.log('Starting simple installation...');
    
    // Create database connection
    const sql = neon(databaseUrl);
    
    // Test connection
    await sql`SELECT 1`;
    console.log('Database connection successful');
    
    // Create basic config table
    await sql`
      CREATE TABLE IF NOT EXISTS config (
        id TEXT PRIMARY KEY DEFAULT 'main_config',
        setup_completed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
    
    // Create users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        email TEXT,
        is_creator BOOLEAN DEFAULT FALSE,
        coins INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
    
    console.log('Basic tables created');
    
    // Hash password (simple approach without bcrypt for now)
    const simpleHash = Buffer.from(adminPassword + 'salt123').toString('base64');
    
    // Insert admin user
    await sql`
      INSERT INTO users (username, password_hash, is_creator, coins)
      VALUES (${adminUsername}, ${simpleHash}, TRUE, 1000)
      ON CONFLICT (username) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        is_creator = TRUE,
        coins = 1000
    `;
    
    // Mark setup as complete
    await sql`
      INSERT INTO config (id, setup_completed) 
      VALUES ('main_config', TRUE)
      ON CONFLICT (id) DO UPDATE SET setup_completed = TRUE
    `;
    
    console.log('Simple installation completed');
    
    return res.json({ 
      success: true, 
      message: 'Simple installation completed successfully!' 
    });
    
  } catch (error) {
    console.error('Simple installation error:', error);
    
    return res.status(500).json({ 
      success: false, 
      message: `Installation failed: ${error.message}`,
      error: error.name
    });
  }
}