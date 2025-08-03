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
      SELECT setup_complete FROM config WHERE id = 'main_config' LIMIT 1
    `;
    
    return res.json({
      isSetup: configResult[0]?.setup_complete || false
    });
  } catch (error) {
    console.error('Setup status endpoint error:', error);
    return res.json({ isSetup: false, error: error.message });
  }
}