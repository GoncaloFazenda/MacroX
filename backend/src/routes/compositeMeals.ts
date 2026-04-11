import { Router, Response, NextFunction } from 'express';
import CompositeMeal from '../models/CompositeMeal';
import Food from '../models/Food';
import { createCompositeMealSchema, updateCompositeMealSchema } from '../utils/schemas';
import { authenticate } from '../middleware/auth';
import type { AuthenticatedRequest } from '../types';

const router = Router();

async function computeMacros(items: Array<{ foodId: string; quantity: number }>) {
  const foodIds = items.map((i) => i.foodId);
  const foods = await Food.find({ _id: { $in: foodIds } });
  const foodMap = new Map(foods.map((f) => [f._id.toString(), f]));

  const totals = { calories: 0, protein: 0, netCarbs: 0, fat: 0 };

  for (const item of items) {
    const food = foodMap.get(item.foodId);
    if (!food) continue;
    const multiplier = item.quantity / 100; // per 100g base
    totals.calories += food.calories * multiplier;
    totals.protein += food.protein * multiplier;
    totals.netCarbs += food.netCarbs * multiplier;
    totals.fat += food.fat * multiplier;
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
 * /api/composite-meals:
 *   get:
 *     tags: [Composite Meals]
 *     summary: List user's composite meals
 *     security: [{ cookieAuth: [] }]
 *     responses:
 *       200: { description: List of composite meals }
 */
router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const meals = await CompositeMeal.find({ userId: req.user!.userId })
      .populate('items.foodId', 'name calories protein netCarbs fat')
      .sort({ updatedAt: -1 });

    res.json({ meals });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/composite-meals/{id}:
 *   get:
 *     tags: [Composite Meals]
 *     summary: Get a composite meal by ID
 *     security: [{ cookieAuth: [] }]
 */
router.get('/:id', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const meal = await CompositeMeal.findOne({ _id: req.params.id, userId: req.user!.userId })
      .populate('items.foodId');

    if (!meal) {
      res.status(404).json({ error: 'Composite meal not found' });
      return;
    }

    res.json({ meal });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/composite-meals:
 *   post:
 *     tags: [Composite Meals]
 *     summary: Create a composite meal
 *     security: [{ cookieAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, items]
 *             properties:
 *               name: { type: string }
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     foodId: { type: string }
 *                     quantity: { type: number }
 *     responses:
 *       201: { description: Composite meal created }
 */
router.post('/', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const data = createCompositeMealSchema.parse(req.body);
    const totalMacros = await computeMacros(data.items);

    const meal = await CompositeMeal.create({
      ...data,
      userId: req.user!.userId,
      totalMacros,
    });

    const populated = await meal.populate('items.foodId', 'name calories protein netCarbs fat');
    res.status(201).json({ meal: populated });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/composite-meals/{id}:
 *   put:
 *     tags: [Composite Meals]
 *     summary: Update a composite meal
 *     security: [{ cookieAuth: [] }]
 */
router.put('/:id', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const data = updateCompositeMealSchema.parse(req.body);

    const meal = await CompositeMeal.findOne({ _id: req.params.id, userId: req.user!.userId });
    if (!meal) {
      res.status(404).json({ error: 'Composite meal not found' });
      return;
    }

    if (data.name) meal.name = data.name;
    if (data.items) {
      meal.items = data.items as any;
      meal.totalMacros = await computeMacros(data.items) as any;
    }

    await meal.save();
    const populated = await meal.populate('items.foodId', 'name calories protein netCarbs fat');
    res.json({ meal: populated });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/composite-meals/{id}:
 *   delete:
 *     tags: [Composite Meals]
 *     summary: Delete a composite meal
 *     security: [{ cookieAuth: [] }]
 */
router.delete('/:id', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const meal = await CompositeMeal.findOneAndDelete({ _id: req.params.id, userId: req.user!.userId });
    if (!meal) {
      res.status(404).json({ error: 'Composite meal not found' });
      return;
    }
    res.json({ message: 'Composite meal deleted' });
  } catch (error) {
    next(error);
  }
});

export default router;
