export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const currentDbUrl = process.env.DATABASE_URL;
    if (!currentDbUrl) {
      return res.json({ valid: false, error: "No DATABASE_URL environment variable set" });
    }
    
    // Dynamic import to avoid module issues
    const { neon } = await import('@neondatabase/serverless');
    const sql = neon(currentDbUrl);
    await sql`SELECT 1`;
    
    return res.json({ 
      valid: true, 
      message: "Current database connection works",
      hasDbUrl: true
    });
  } catch (error) {
    console.error("Current database test error:", error);
    return res.json({ valid: false, error: `Database test failed: ${error.message}` });
  }
};