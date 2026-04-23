import { Router, Response, NextFunction } from 'express';
import WeeklyPlan from '../models/WeeklyPlan';
import DailyPlan from '../models/DailyPlan';
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

    // ─── Sync each day to DailyPlan ─────────────────
    const weekStartDate = new Date(data.weekStart + 'T00:00:00Z');
    for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
      const dayDate = new Date(weekStartDate);
      dayDate.setUTCDate(dayDate.getUTCDate() + dayOfWeek);

      const dayData = data.days.find(d => d.dayOfWeek === dayOfWeek);
      const hasMeals = dayData && dayData.meals.some(m => m.items.length > 0);

      if (hasMeals) {
        await DailyPlan.findOneAndUpdate(
          { userId: req.user!.userId, date: dayDate },
          { userId: req.user!.userId, date: dayDate, meals: dayData!.meals },
          { upsert: true, new: true }
        );
      } else {
        // Day has no meals — remove the daily plan if one exists
        await DailyPlan.deleteOne({ userId: req.user!.userId, date: dayDate });
      }
    }

    res.json({ plan });
  } catch (error) {
    next(error);
  }
});

export default router;
