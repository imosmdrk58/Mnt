export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { databaseUrl } = req.body;
    
    if (!databaseUrl) {
      return res.status(400).json({ message: 'Database URL is required' });
    }

    // Dynamic import to avoid module issues
    const { neon } = await import('@neondatabase/serverless');
    const sql = neon(databaseUrl);
    await sql`SELECT 1`;
    
    return res.json({ valid: true, message: 'Database connection successful' });
  } catch (error) {
    console.error('Database validation error:', error);
    return res.json({ valid: false, error: `Database validation failed: ${error.message}` });
  }
};