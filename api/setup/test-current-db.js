const { neon } = require('@neondatabase/serverless');

async function validateDatabaseConnection(databaseUrl) {
  try {
    const sql = neon(databaseUrl);
    await sql`SELECT 1`;
    return { valid: true };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const currentDbUrl = process.env.DATABASE_URL;
    if (!currentDbUrl) {
      return res.json({ valid: false, error: "No DATABASE_URL environment variable set" });
    }
    
    console.log("Testing current database connection...");
    const result = await validateDatabaseConnection(currentDbUrl);
    res.json({ 
      valid: result.valid, 
      message: result.valid ? "Current database connection works" : result.error || "Current database connection failed",
      hasDbUrl: !!currentDbUrl
    });
  } catch (error) {
    console.error("Current database test error:", error);
    res.json({ valid: false, error: `Database test failed: ${error.message}` });
  }
};