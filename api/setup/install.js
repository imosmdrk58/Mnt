export default async function handler(req, res) {
  // Set proper headers for JSON response
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    console.log('API called with method:', req.method);
    console.log('Request headers:', req.headers);
    console.log('Raw body type:', typeof req.body);
    console.log('Request body keys:', Object.keys(req.body || {}));
    
    // Handle different body parsing scenarios
    let requestData = req.body;
    if (typeof req.body === 'string') {
      try {
        requestData = JSON.parse(req.body);
      } catch (parseError) {
        console.error('Failed to parse JSON body:', parseError);
        return res.status(400).json({
          success: false,
          message: 'Invalid JSON in request body'
        });
      }
    }
    
    const { databaseUrl, adminUsername, adminPassword } = requestData || {};

    if (!databaseUrl || !adminUsername || !adminPassword) {
      console.log('Missing fields:', { 
        hasDatabaseUrl: !!databaseUrl, 
        hasUsername: !!adminUsername, 
        hasPassword: !!adminPassword 
      });
      return res.status(400).json({ 
        message: 'Missing required fields: databaseUrl, adminUsername, adminPassword' 
      });
    }

    console.log('Starting installation process...');
    
    // Dynamic imports to avoid module issues
    const { neon } = await import('@neondatabase/serverless');
    
    // Try to import bcrypt, fallback to bcryptjs if needed
    let bcrypt;
    try {
      bcrypt = await import('bcrypt');
    } catch (bcryptError) {
      console.log('bcrypt failed, trying bcryptjs fallback');
      try {
        bcrypt = await import('bcryptjs');
      } catch (fallbackError) {
        throw new Error('Neither bcrypt nor bcryptjs available for password hashing');
      }
    }
    
    console.log('Testing database connection (Neon):', databaseUrl.replace(/\/\/.*@/, '//**:***@'));
    const sql = neon(databaseUrl);
    
    // Test connection
    try {
      await sql`SELECT 1`;
      console.log('Database connection validated successfully');
    } catch (connError) {
      console.error('Database connection failed:', connError);
      return res.status(400).json({ 
        success: false, 
        message: 'Database connection failed. Please check your DATABASE_URL.' 
      });
    }

    console.log('Creating database schema...');
    
    // Create all tables manually since Drizzle CLI isn't available in Vercel serverless
    // Skip enums for now to avoid serverless issues - use TEXT with constraints instead
    console.log('Creating core tables...');

    // Sessions table (required for auth)
    await sql`
      CREATE TABLE IF NOT EXISTS sessions (
        sid TEXT PRIMARY KEY,
        sess JSONB NOT NULL,
        expire TIMESTAMP NOT NULL
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_session_expire ON sessions(expire)`;

    // Config table
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

    // Users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
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

    // Groups table
    await sql`
      CREATE TABLE IF NOT EXISTS groups (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        banner_url TEXT,
        logo_url TEXT,
        social_links JSONB,
        owner_id TEXT NOT NULL,
        member_count INTEGER DEFAULT 1,
        series_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Series table
    await sql`
      CREATE TABLE IF NOT EXISTS series (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        cover_image_url TEXT,
        type TEXT NOT NULL CHECK (type IN ('webtoon', 'manga', 'novel')),
        status TEXT DEFAULT 'ongoing' CHECK (status IN ('ongoing', 'completed', 'hiatus')),
        author_id TEXT NOT NULL,
        group_id TEXT,
        genres TEXT,
        tags TEXT,
        is_nsfw BOOLEAN DEFAULT false,
        view_count INTEGER DEFAULT 0,
        like_count INTEGER DEFAULT 0,
        bookmark_count INTEGER DEFAULT 0,
        rating DECIMAL(3,2) DEFAULT 0.00,
        rating_count INTEGER DEFAULT 0,
        chapter_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Chapters table
    await sql`
      CREATE TABLE IF NOT EXISTS chapters (
        id TEXT PRIMARY KEY,
        series_id TEXT NOT NULL,
        title TEXT NOT NULL,
        chapter_number INTEGER NOT NULL,
        content JSONB,
        images TEXT,
        preview_image TEXT,
        status TEXT DEFAULT 'free' CHECK (status IN ('free', 'premium', 'scheduled')),
        coin_price INTEGER DEFAULT 0,
        view_count INTEGER DEFAULT 0,
        like_count INTEGER DEFAULT 0,
        published_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Chapter unlocks table
    await sql`
      CREATE TABLE IF NOT EXISTS chapter_unlocks (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        chapter_id TEXT NOT NULL,
        unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Group members table
    await sql`
      CREATE TABLE IF NOT EXISTS group_members (
        id TEXT PRIMARY KEY,
        group_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'contributor',
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Comments table
    await sql`
      CREATE TABLE IF NOT EXISTS comments (
        id TEXT PRIMARY KEY,
        chapter_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        content TEXT NOT NULL,
        parent_id TEXT,
        like_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Reviews table
    await sql`
      CREATE TABLE IF NOT EXISTS reviews (
        id TEXT PRIMARY KEY,
        series_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        rating INTEGER NOT NULL,
        content TEXT,
        like_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Follows table
    await sql`
      CREATE TABLE IF NOT EXISTS follows (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        target_id TEXT NOT NULL,
        target_type TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Bookmarks table
    await sql`
      CREATE TABLE IF NOT EXISTS bookmarks (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        series_id TEXT NOT NULL,
        folder_id TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Bookmark folders table
    await sql`
      CREATE TABLE IF NOT EXISTS bookmark_folders (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Reading progress table
    await sql`
      CREATE TABLE IF NOT EXISTS reading_progress (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        series_id TEXT NOT NULL,
        chapter_id TEXT NOT NULL,
        progress DECIMAL(5,2) DEFAULT 0.00,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, series_id, chapter_id)
      )
    `;

    // Reading history table
    await sql`
      CREATE TABLE IF NOT EXISTS reading_history (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        chapter_id TEXT NOT NULL,
        series_id TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Chapter likes table
    await sql`
      CREATE TABLE IF NOT EXISTS chapter_likes (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        chapter_id TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Chapter views table
    await sql`
      CREATE TABLE IF NOT EXISTS chapter_views (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        chapter_id TEXT NOT NULL,
        viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Transactions table
    await sql`
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        type TEXT NOT NULL,
        amount INTEGER NOT NULL,
        chapter_id TEXT,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    console.log('Basic tables created successfully');

    // Create admin user with simple ID generation
    const adminUserId = Math.random().toString(36).substring(2) + Date.now().toString(36);
    const hashedPassword = await bcrypt.hash(adminPassword, 12);
    
    console.log('Creating admin user...');
    await sql`
      INSERT INTO users (id, username, email, password, is_creator)
      VALUES (${adminUserId}, ${adminUsername}, ${adminUsername + '@admin.local'}, ${hashedPassword}, true)
      ON CONFLICT (username) DO UPDATE SET
        password = ${hashedPassword},
        is_creator = true,
        updated_at = CURRENT_TIMESTAMP
    `;

    console.log('Admin user created successfully:', adminUsername, `(${adminUserId})`);

    // Mark setup as complete
    await sql`
      INSERT INTO config (id, setup_complete, admin_user_id, site_name)
      VALUES ('main_config', true, ${adminUserId}, 'Webtoon Platform')
      ON CONFLICT (id) DO UPDATE SET
        setup_complete = true,
        admin_user_id = ${adminUserId},
        updated_at = CURRENT_TIMESTAMP
    `;
    
    console.log('Setup status marked as complete in database');

    const configData = {
      siteName: 'Webtoon Platform',
      hasStripe: false,
      hasLogo: false
    };

    console.log('Setup completed successfully with configuration:', configData);

    return res.json({ 
      success: true, 
      message: 'Installation completed successfully!',
      adminUserId: adminUserId
    });
  } catch (error) {
    console.error('Installation error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.code
    });
    
    return res.status(500).json({ 
      success: false, 
      message: `Installation failed: ${error.message}`,
      error: error.name,
      details: error.stack
    });
  }
}