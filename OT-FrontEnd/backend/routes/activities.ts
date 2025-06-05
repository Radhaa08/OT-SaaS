import { Router, Request, Response } from "express";
import { getRecentActivities } from '../lib/db/queries';

const router = Router();

// Get recent activities
router.get('/', async (req: Request, res: Response) => {
  try {
    const limit = Number(req.query.limit) || 50;
    const offset = Number(req.query.offset) || 0;
    
    const activities = await getRecentActivities(limit, offset);
    return res.status(200).json(activities);
  } catch (error) {
    console.error('Get activities error:', error);
    return res.status(500).json({ error: 'Failed to fetch activities' });
  }
});

export default router;
