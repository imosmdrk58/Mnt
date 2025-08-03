export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { databaseUrl, adminUsername, adminPassword } = req.body;

    if (!databaseUrl || !adminUsername || !adminPassword) {
      return res.status(400).json({ 
        message: 'Missing required fields: databaseUrl, adminUsername, adminPassword' 
      });
    }

    // Set the DATABASE_URL environment variable for Drizzle
    process.env.DATABASE_URL = databaseUrl;

    // Dynamic imports to avoid module issues
    const { neon } = await import('@neondatabase/serverless');
    const bcrypt = await import('bcrypt');
    const { execSync } = await import('child_process');
    
    console.log('Starting database installation...');
    
    // Use Drizzle to push all schema tables to the database
    try {
      console.log('Pushing database schema...');
      execSync('npm run db:push', { 
        stdio: 'inherit',
        env: { ...process.env, DATABASE_URL: databaseUrl }
      });
      console.log('Database schema pushed successfully');
    } catch (pushError) {
      console.error('Drizzle push failed:', pushError);
      // Fallback to manual table creation for critical tables
      const sql = neon(databaseUrl);
      
      await sql`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
          username TEXT UNIQUE NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          first_name TEXT,
          last_name TEXT,
          profile_image_url TEXT,
          coin_balance INTEGER DEFAULT 0,
          is_creator BOOLEAN DEFAULT false,
          is_elite_reader BOOLEAN DEFAULT false,
          followers_count INTEGER DEFAULT 0,
          email_verified BOOLEAN DEFAULT false,
          reset_token TEXT,
          reset_token_expiry TIMESTAMP,
          creator_display_name TEXT,
          creator_bio TEXT,
          creator_portfolio_url TEXT,
          creator_social_media_url TEXT,
          creator_content_types TEXT,
          creator_experience TEXT,
          creator_motivation TEXT,
          creator_application_status TEXT,
          creator_application_date TEXT,
          chapters_read INTEGER DEFAULT 0,
          reading_streak INTEGER DEFAULT 0,
          last_read_at TIMESTAMP,
          reading_dates TEXT,
          settings TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS config (
          id TEXT PRIMARY KEY,
          setup_complete BOOLEAN DEFAULT false,
          site_name TEXT DEFAULT 'MangaVerse',
          admin_user_id TEXT,
          installer_disabled BOOLEAN DEFAULT false,
          stripe_public_key TEXT,
          stripe_secret_key TEXT,
          logo_url TEXT,
          favicon_url TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;
    }

    // Create admin user using Drizzle
    const sql = neon(databaseUrl);
    const hashedPassword = await bcrypt.hash(adminPassword, 12);
    
    console.log('Creating admin user...');
    // Insert admin user with proper schema fields
    const adminUserResult = await sql`
      INSERT INTO users (username, email, password, is_creator)
      VALUES (${adminUsername}, ${adminUsername}@admin.local, ${hashedPassword}, true)
      ON CONFLICT (username) DO UPDATE SET
        password = ${hashedPassword},
        is_creator = true,
        updated_at = CURRENT_TIMESTAMP
      RETURNING id
    `;

    const adminUserId = adminUserResult[0]?.id;

    // Mark setup as complete
    console.log('Marking setup as complete...');
    await sql`
      INSERT INTO config (id, setup_complete, admin_user_id)
      VALUES ('main_config', true, ${adminUserId})
      ON CONFLICT (id) DO UPDATE SET
        setup_complete = true,
        admin_user_id = ${adminUserId},
        updated_at = CURRENT_TIMESTAMP
    `;

    // Clear the setup status cache so the middleware will re-check
    try {
      const { clearSetupStatusCache } = await import('../../server/middleware/setupMiddleware.js');
      clearSetupStatusCache();
      console.log('Setup status cache cleared');
    } catch (cacheError) {
      console.warn('Could not clear setup status cache:', cacheError.message);
    }

    console.log('Installation completed successfully');
    return res.json({ 
      success: true, 
      message: 'Installation completed successfully!',
      details: 'All database tables created and admin user configured' 
    });
  } catch (error) {
    console.error('Installation error:', error);
    return res.status(500).json({ 
      success: false, 
      message: `Installation failed: ${error.message}` 
    });
  }
}

