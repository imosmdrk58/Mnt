import { installManager } from '../../server/installManager.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const currentDbUrl = process.env.DATABASE_URL;
    if (!currentDbUrl) {
      return res.json({ valid: false, error: "No DATABASE_URL environment variable set" });
    }
    
    console.log("Testing current database connection...");
    const result = await installManager.validateDatabaseConnection(currentDbUrl);
    res.json({ 
      valid: result.valid, 
      message: result.valid ? "Current database connection works" : result.error || "Current database connection failed",
      hasDbUrl: !!currentDbUrl
    });
  } catch (error) {
    console.error("Current database test error:", error);
    res.json({ valid: false, error: `Database test failed: ${error.message}` });
  }
}