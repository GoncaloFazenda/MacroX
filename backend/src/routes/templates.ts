import { Router, Response, NextFunction } from 'express';
import MealTemplate from '../models/MealTemplate';
import Food from '../models/Food';
import CompositeMeal from '../models/CompositeMeal';
import { createMealTemplateSchema, updateMealTemplateSchema } from '../utils/schemas';
import { authenticate } from '../middleware/auth';
import type { AuthenticatedRequest } from '../types';

const router = Router();

async function computeTemplateMacros(items: Array<{ type: string; refId: string; quantity: number }>) {
  const totals = { calories: 0, protein: 0, netCarbs: 0, fat: 0 };

  for (const item of items) {
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

  return {
    calories: Math.round(totals.calories * 10) / 10,
    protein: Math.round(totals.protein * 10) / 10,
    netCarbs: Math.round(totals.netCarbs * 10) / 10,
    fat: Math.round(totals.fat * 10) / 10,
  };
}

/**
 * @swagger
 * /api/templates:
 *   get:
 *     tags: [Templates]
 *     summary: List user's meal templates
 *     security: [{ cookieAuth: [] }]
 *     responses:
 *       200: { description: List of templates }
 */
router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const templates = await MealTemplate.find({ userId: req.user!.userId })
      .sort({ updatedAt: -1 });
    res.json({ templates });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/templates/{id}:
 *   get:
 *     tags: [Templates]
 *     summary: Get a template by ID
 *     security: [{ cookieAuth: [] }]
 */
router.get('/:id', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const template = await MealTemplate.findOne({ _id: req.params.id, userId: req.user!.userId });
    if (!template) {
      res.status(404).json({ error: 'Template not found' });
      return;
    }
    res.json({ template });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/templates:
 *   post:
 *     tags: [Templates]
 *     summary: Create a meal template
 *     security: [{ cookieAuth: [] }]
 */
router.post('/', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const data = createMealTemplateSchema.parse(req.body);
    const totalMacros = await computeTemplateMacros(data.items);

    const template = await MealTemplate.create({
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
 * /api/templates/{id}:
 *   put:
 *     tags: [Templates]
 *     summary: Update a meal template
 *     security: [{ cookieAuth: [] }]
 */
router.put('/:id', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const data = updateMealTemplateSchema.parse(req.body);

    const template = await MealTemplate.findOne({ _id: req.params.id, userId: req.user!.userId });
    if (!template) {
      res.status(404).json({ error: 'Template not found' });
      return;
    }

    if (data.name) template.name = data.name;
    if (data.items) {
      template.items = data.items as any;
      template.totalMacros = await computeTemplateMacros(data.items) as any;
    }

    await template.save();
    res.json({ template });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/templates/{id}:
 *   delete:
 *     tags: [Templates]
 *     summary: Delete a meal template
 *     security: [{ cookieAuth: [] }]
 */
router.delete('/:id', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const template = await MealTemplate.findOneAndDelete({ _id: req.params.id, userId: req.user!.userId });
    if (!template) {
      res.status(404).json({ error: 'Template not found' });
      return;
    }
    res.json({ message: 'Template deleted' });
  } catch (error) {
    next(error);
  }
});

export default router;
