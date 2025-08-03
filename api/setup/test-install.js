export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    console.log('Test install API called');
    
    const { databaseUrl, adminUsername, adminPassword } = req.body || {};
    
    if (!databaseUrl || !adminUsername || !adminPassword) {
      return res.status(400).json({ 
        message: 'Missing required fields: databaseUrl, adminUsername, adminPassword' 
      });
    }

    // Test neon import
    console.log('Testing neon import...');
    const { neon } = await import('@neondatabase/serverless');
    console.log('Neon imported successfully');
    
    // Test bcrypt import
    console.log('Testing bcrypt import...');
    const bcrypt = await import('bcrypt');
    console.log('Bcrypt imported successfully');
    
    // Test database connection
    console.log('Testing database connection...');
    const sql = neon(databaseUrl);
    await sql`SELECT 1`;
    console.log('Database connection successful');
    
    // Test simple table creation
    console.log('Testing table creation...');
    await sql`
      CREATE TABLE IF NOT EXISTS test_table (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        name TEXT
      )
    `;
    console.log('Table creation successful');
    
    return res.json({ 
      success: true, 
      message: 'Test installation completed successfully!' 
    });
    
  } catch (error) {
    console.error('Test installation error:', error);
    console.error('Error stack:', error.stack);
    
    return res.status(500).json({ 
      success: false, 
      message: `Test failed: ${error.message}`,
      error: error.name,
      stack: error.stack
    });
  }
}