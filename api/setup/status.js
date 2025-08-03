import { checkSetupStatus } from '../../server/middleware/setupMiddleware.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const setupStatus = await checkSetupStatus();
    res.json(setupStatus);
  } catch (error) {
    console.error('Setup status check error:', error);
    res.status(500).json({ message: 'Failed to check setup status' });
  }
}