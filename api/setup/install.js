const { neon } = require('@neondatabase/serverless');
const bcrypt = require('bcrypt');

async function runInstallation({ databaseUrl, adminUsername, adminPassword }) {
  try {
    const sql = neon(databaseUrl);
    
    // Create tables
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        email TEXT,
        display_name TEXT,
        avatar_url TEXT,
        bio TEXT,
        coins INTEGER DEFAULT 100,
        is_creator BOOLEAN DEFAULT false,
        is_admin BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS config (
        id TEXT PRIMARY KEY,
        setup_complete BOOLEAN DEFAULT false,
        site_name TEXT DEFAULT 'Webtoon Platform',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Hash admin password
    const hashedPassword = await bcrypt.hash(adminPassword, 12);
    
    // Create admin user
    await sql`
      INSERT INTO users (username, password_hash, is_admin, display_name)
      VALUES (${adminUsername}, ${hashedPassword}, true, ${adminUsername})
      ON CONFLICT (username) DO UPDATE SET
        password_hash = ${hashedPassword},
        is_admin = true
    `;

    // Mark setup as complete
    await sql`
      INSERT INTO config (id, setup_complete)
      VALUES ('main_config', true)
      ON CONFLICT (id) DO UPDATE SET
        setup_complete = true,
        updated_at = CURRENT_TIMESTAMP
    `;

    return { 
      success: true, 
      details: 'Database initialized and admin user created' 
    };
  } catch (error) {
    console.error('Installation error:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
}

module.exports = async function handler(req, res) {
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

    console.log('Starting installation process...');
    const result = await runInstallation({
      databaseUrl,
      adminUsername,
      adminPassword
    });

    if (result.success) {
      res.json({ 
        success: true, 
        message: 'Installation completed successfully!',
        details: result.details 
      });
    } else {
      res.status(400).json({ 
        success: false, 
        message: result.error || 'Installation failed' 
      });
    }
  } catch (error) {
    console.error('Installation error:', error);
    res.status(500).json({ 
      success: false, 
      message: `Installation failed: ${error.message}` 
    });
  }
};