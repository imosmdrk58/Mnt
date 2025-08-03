const { neon } = require('@neondatabase/serverless');

async function checkSetupStatus() {
  try {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      return { isSetup: false };
    }

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
      return { isSetup: false };
    }

    // Check if setup is complete
    const configResult = await sql`
      SELECT setup_complete FROM config WHERE id = 'main_config' LIMIT 1
    `;
    
    return {
      isSetup: configResult[0]?.setup_complete || false
    };
  } catch (error) {
    console.error('Setup status check error:', error);
    return { isSetup: false };
  }
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const setupStatus = await checkSetupStatus();
    res.json(setupStatus);
  } catch (error) {
    console.error('Setup status endpoint error:', error);
    res.status(500).json({ message: 'Failed to check setup status', error: error.message });
  }
};