import { installManager } from '../../server/installManager.js';
import { clearSetupStatusCache } from '../../server/middleware/setupMiddleware.js';

export default async function handler(req, res) {
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
    const result = await installManager.runInstallation({
      databaseUrl,
      adminUsername,
      adminPassword
    });

    if (result.success) {
      clearSetupStatusCache();
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
}