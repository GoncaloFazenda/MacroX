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

    const dateString = date as string;
    const dateUTC = new Date(dateString + 'T00:00:00Z');

    // Primary lookup — direct DailyPlan for this date.
    let plan = await DailyPlan.findOne({
      userId: req.user!.userId,
      date: dateUTC,
    });

    // Fallback — if no DailyPlan exists, check whether the matching
    // WeeklyPlan slot has items. This rescues legacy data created before
    // the Weekly→Daily sync existed, and protects against edge cases
    // where the two collections could otherwise drift apart.
    if (!plan) {
      const jsDow = dateUTC.getUTCDay();           // Sun=0..Sat=6
      const dayOfWeek = (jsDow + 6) % 7;            // Mon=0..Sun=6
      const weekStart = new Date(dateUTC);
      weekStart.setUTCDate(weekStart.getUTCDate() - dayOfWeek);

      const weekly = await WeeklyPlan.findOne({
        userId: req.user!.userId,
        weekStart,
      });
      const dayData = weekly?.days?.find((d: any) => d.dayOfWeek === dayOfWeek);
      if (dayData?.meals?.some((m: any) => m.items?.length)) {
        // Persist the recovered data so subsequent loads (and any other
        // route that queries DailyPlan directly) see it without a fallback.
        plan = await DailyPlan.findOneAndUpdate(
          { userId: req.user!.userId, date: dateUTC },
          { userId: req.user!.userId, date: dateUTC, meals: dayData.meals },
          { upsert: true, new: true }
        );
      }
    }

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

    const userId = req.user!.userId;
    const startDate = new Date((start as string) + 'T00:00:00Z');
    const endDate   = new Date((end   as string) + 'T00:00:00Z');
    const DAY_MS = 86400000;

    const directPlans = await DailyPlan.find({
      userId,
      date: { $gte: startDate, $lte: endDate },
    });

    const byDateKey = new Map<string, any>(
      directPlans.map((p) => [p.date.toISOString().split('T')[0], p])
    );

    // Pull in any WeeklyPlans that could overlap the requested range.
    // A WeeklyPlan covers [weekStart, weekStart+6], so weekStart can be
    // up to 6 days before startDate.
    const weekStartMin = new Date(startDate.getTime() - 6 * DAY_MS);
    const weeklyPlans = await WeeklyPlan.find({
      userId,
      weekStart: { $gte: weekStartMin, $lte: endDate },
    });

    const recovered: any[] = [];
    for (let t = startDate.getTime(); t <= endDate.getTime(); t += DAY_MS) {
      const dateUTC = new Date(t);
      const dateKey = dateUTC.toISOString().split('T')[0];
      if (byDateKey.has(dateKey)) continue;

      for (const weekly of weeklyPlans) {
        const wStart = new Date(weekly.weekStart).getTime();
        const dayOfWeek = Math.round((t - wStart) / DAY_MS);
        if (dayOfWeek < 0 || dayOfWeek > 6) continue;
        const dayData = (weekly.days as any[])?.find((d) => d.dayOfWeek === dayOfWeek);
        if (dayData?.meals?.some((m: any) => m.items?.length)) {
          recovered.push({ date: dateUTC, meals: dayData.meals });
        }
        break; // each date can only belong to one weekly plan
      }
    }

    const plans = [...directPlans, ...recovered].sort(
      (a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    res.json({ plans });
  } catch (error) {
    next(error);
  }
});

export default router;
