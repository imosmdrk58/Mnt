export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      return res.json({ isSetup: false });
    }

    // Import neon dynamically to avoid module issues
    const { neon } = await import('@neondatabase/serverless');
    const sql = neon(databaseUrl);
    
    // Try to check if config table exists and has setup data
    const result = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'config'
      ) as table_exists
    `;
    
    if (!result[0]?.table_exists) {
      return res.json({ isSetup: false });
    }

    // Check if setup is complete
    const configResult = await sql`
      SELECT setup_complete, site_name, admin_user_id FROM config WHERE id = 'main_config' LIMIT 1
    `;
    
    const config = configResult[0];
    
    return res.json({
      isSetup: config?.setup_complete || false,
      config: config ? {
        id: 'main_config',
        setupComplete: config.setup_complete,
        siteName: config.site_name,
        adminUserId: config.admin_user_id
      } : null
    });
  } catch (error) {
    console.error('Setup status endpoint error:', error);
    return res.json({ isSetup: false, error: error.message });
  }
}