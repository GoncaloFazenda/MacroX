import { Router, Response, NextFunction } from 'express';
import DayTemplate from '../models/DayTemplate';
import Food from '../models/Food';
import CompositeMeal from '../models/CompositeMeal';
import { createDayTemplateSchema, updateDayTemplateSchema } from '../utils/schemas';
import { authenticate } from '../middleware/auth';
import type { AuthenticatedRequest } from '../types';

const router = Router();

async function computeDayMacros(meals: Array<{ slot: string; items: Array<{ type: string; refId: string; quantity: number }> }>) {
  const totals = { calories: 0, protein: 0, netCarbs: 0, fat: 0 };

  for (const meal of meals) {
    for (const item of meal.items) {
      if (item.type === 'food') {
        const food = await Food.findById(item.refId);
        if (food) {
          const multiplier = item.quantity / 100;
          totals.calories += food.calories * multiplier;
          totals.protein += food.protein * multiplier;
          totals.netCarbs += food.netCarbs * multiplier;
          totals.fat += food.fat * multiplier;
        }
      } else if (item.type === 'compositeMeal') {
        const meal = await CompositeMeal.findById(item.refId);
        if (meal) {
          const multiplier = item.quantity / 100;
          totals.calories += meal.totalMacros.calories * multiplier;
          totals.protein += meal.totalMacros.protein * multiplier;
          totals.netCarbs += meal.totalMacros.netCarbs * multiplier;
          totals.fat += meal.totalMacros.fat * multiplier;
        }
      }
    }
  }

  return {
    calories: Math.round(totals.calories * 10) / 10,
    protein: Math.round(totals.protein * 10) / 10,
    netCarbs: Math.round(totals.netCarbs * 10) / 10,
    fat: Math.round(totals.fat * 10) / 10,
  };
}

/**
 * @swagger
 * /api/day-templates:
 *   get:
 *     tags: [Day Templates]
 *     summary: List user's day templates
 *     security: [{ cookieAuth: [] }]
 *     responses:
 *       200: { description: List of day templates }
 */
router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const templates = await DayTemplate.find({ userId: req.user!.userId })
      .sort({ updatedAt: -1 });
    res.json({ templates });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/day-templates/{id}:
 *   get:
 *     tags: [Day Templates]
 *     summary: Get a day template by ID
 *     security: [{ cookieAuth: [] }]
 */
router.get('/:id', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const template = await DayTemplate.findOne({ _id: req.params.id, userId: req.user!.userId });
    if (!template) {
      res.status(404).json({ error: 'Day template not found' });
      return;
    }
    res.json({ template });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/day-templates:
 *   post:
 *     tags: [Day Templates]
 *     summary: Create a day template
 *     security: [{ cookieAuth: [] }]
 */
router.post('/', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const data = createDayTemplateSchema.parse(req.body);
    const totalMacros = await computeDayMacros(data.meals);

    const template = await DayTemplate.create({
      ...data,
      userId: req.user!.userId,
      totalMacros,
    });

    res.status(201).json({ template });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/day-templates/{id}:
 *   put:
 *     tags: [Day Templates]
 *     summary: Update a day template
 *     security: [{ cookieAuth: [] }]
 */
router.put('/:id', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const data = updateDayTemplateSchema.parse(req.body);

    const template = await DayTemplate.findOne({ _id: req.params.id, userId: req.user!.userId });
    if (!template) {
      res.status(404).json({ error: 'Day template not found' });
      return;
    }

    if (data.name) template.name = data.name;
    if (data.meals) {
      template.meals = data.meals as any;
      template.totalMacros = await computeDayMacros(data.meals) as any;
    }

    await template.save();
    res.json({ template });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/day-templates/{id}:
 *   delete:
 *     tags: [Day Templates]
 *     summary: Delete a day template
 *     security: [{ cookieAuth: [] }]
 */
router.delete('/:id', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const template = await DayTemplate.findOneAndDelete({ _id: req.params.id, userId: req.user!.userId });
    if (!template) {
      res.status(404).json({ error: 'Day template not found' });
      return;
    }
    res.json({ message: 'Day template deleted' });
  } catch (error) {
    next(error);
  }
});

export default router;
