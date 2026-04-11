import { Router, Response, NextFunction } from 'express';
import WeeklyPlan from '../models/WeeklyPlan';
import { upsertWeeklyPlanSchema } from '../utils/schemas';
import { authenticate } from '../middleware/auth';
import type { AuthenticatedRequest } from '../types';

const router = Router();

/**
 * @swagger
 * /api/weekly-plans:
 *   get:
 *     tags: [Weekly Plans]
 *     summary: Get weekly plan for a specific week
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: weekStart
 *         required: true
 *         schema: { type: string, format: date }
 *     responses:
 *       200: { description: Weekly plan }
 */
router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { weekStart } = req.query;
    if (!weekStart) {
      res.status(400).json({ error: 'weekStart parameter required (YYYY-MM-DD)' });
      return;
    }

    const plan = await WeeklyPlan.findOne({
      userId: req.user!.userId,
      weekStart: new Date(weekStart as string),
    });

    res.json({ plan: plan || null });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/weekly-plans:
 *   put:
 *     tags: [Weekly Plans]
 *     summary: Create or update a weekly plan
 *     security: [{ cookieAuth: [] }]
 */
router.put('/', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const data = upsertWeeklyPlanSchema.parse(req.body);

    const plan = await WeeklyPlan.findOneAndUpdate(
      {
        userId: req.user!.userId,
        weekStart: new Date(data.weekStart),
      },
      {
        userId: req.user!.userId,
        weekStart: new Date(data.weekStart),
        days: data.days,
      },
      { upsert: true, new: true }
    );

    res.json({ plan });
  } catch (error) {
    next(error);
  }
});

export default router;
