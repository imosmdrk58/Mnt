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
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { databaseUrl } = req.body;
    
    if (!databaseUrl) {
      return res.status(400).json({ message: 'Database URL is required' });
    }

    console.log('Validating database connection...');
    const result = await validateDatabaseConnection(databaseUrl);
    
    if (result.valid) {
      res.json({ valid: true, message: 'Database connection successful' });
    } else {
      const errorMessage = result.error || 'Database connection failed';
      res.json({ valid: false, error: errorMessage });
    }
  } catch (error) {
    console.error('Database validation error:', error);
    res.json({ valid: false, error: `Database validation failed: ${error.message}` });
  }
};