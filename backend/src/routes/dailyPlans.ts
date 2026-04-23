import { Router, Response, NextFunction } from 'express';
import DailyPlan from '../models/DailyPlan';
import WeeklyPlan from '../models/WeeklyPlan';
import { upsertDailyPlanSchema } from '../utils/schemas';
import { authenticate } from '../middleware/auth';
import type { AuthenticatedRequest } from '../types';

const router = Router();

/**
 * @swagger
 * /api/daily-plans:
 *   get:
 *     tags: [Daily Plans]
 *     summary: Get daily plan for a specific date
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: date
 *         required: true
 *         schema: { type: string, format: date }
 *     responses:
 *       200: { description: Daily plan }
 */
router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { date } = req.query;
    if (!date) {
      res.status(400).json({ error: 'Date parameter required (YYYY-MM-DD)' });
      return;
    }

    const plan = await DailyPlan.findOne({
      userId: req.user!.userId,
      date: new Date(date as string),
    });

    res.json({ plan: plan || null });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/daily-plans:
 *   put:
 *     tags: [Daily Plans]
 *     summary: Create or update a daily plan
 *     security: [{ cookieAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [date, meals]
 *             properties:
 *               date: { type: string, format: date }
 *               meals:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     slot: { type: string, enum: [breakfast, lunch, dinner, snack] }
 *                     items:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           type: { type: string, enum: [food, compositeMeal] }
 *                           refId: { type: string }
 *                           quantity: { type: number }
 *     responses:
 *       200: { description: Daily plan saved }
 */
router.put('/', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const data = upsertDailyPlanSchema.parse(req.body);

    const plan = await DailyPlan.findOneAndUpdate(
      {
        userId: req.user!.userId,
        date: new Date(data.date),
      },
      {
        userId: req.user!.userId,
        date: new Date(data.date),
        meals: data.meals,
      },
      { upsert: true, new: true }
    );

    // ─── Sync to WeeklyPlan ─────────────────────────
    const dateObj = new Date(data.date + 'T00:00:00Z');
    // Convert JS day (Sun=0) to our system (Mon=0)
    const jsDow = dateObj.getUTCDay();
    const dayOfWeek = (jsDow + 6) % 7; // Mon=0, Tue=1, ..., Sun=6

    // Calculate week start (Monday)
    const weekStartDate = new Date(dateObj);
    weekStartDate.setUTCDate(weekStartDate.getUTCDate() - dayOfWeek);

    const hasMeals = data.meals.some(m => m.items.length > 0);

    const weeklyPlan = await WeeklyPlan.findOne({
      userId: req.user!.userId,
      weekStart: weekStartDate,
    });

    if (weeklyPlan) {
      // Update existing weekly plan — replace only this day's entry
      const otherDays = weeklyPlan.days.filter(d => d.dayOfWeek !== dayOfWeek);
      if (hasMeals) {
        otherDays.push({ dayOfWeek, meals: data.meals } as any);
      }
      weeklyPlan.days = otherDays;
      await weeklyPlan.save();
    } else if (hasMeals) {
      // Create new weekly plan with just this day
      await WeeklyPlan.create({
        userId: req.user!.userId,
        weekStart: weekStartDate,
        days: [{ dayOfWeek, meals: data.meals }],
      });
    }

    res.json({ plan });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/daily-plans/range:
 *   get:
 *     tags: [Daily Plans]
 *     summary: Get daily plans for a date range
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: start
 *         required: true
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: end
 *         required: true
 *         schema: { type: string, format: date }
 *     responses:
 *       200: { description: List of daily plans }
 */
router.get('/range', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { start, end } = req.query;
    if (!start || !end) {
      res.status(400).json({ error: 'Start and end date parameters required' });
      return;
    }

    const plans = await DailyPlan.find({
      userId: req.user!.userId,
      date: {
        $gte: new Date(start as string),
        $lte: new Date(end as string),
      },
    }).sort({ date: 1 });

    res.json({ plans });
  } catch (error) {
    next(error);
  }
});

export default router;
