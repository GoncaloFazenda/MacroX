import { Router, Response, NextFunction } from 'express';
import Food from '../models/Food';
import { createFoodSchema, updateFoodSchema } from '../utils/schemas';
import { authenticate, optionalAuth } from '../middleware/auth';
import type { AuthenticatedRequest } from '../types';

const router = Router();

/**
 * @swagger
 * /api/foods:
 *   get:
 *     tags: [Foods]
 *     summary: List all foods (default + user's custom)
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 50 }
 *     responses:
 *       200: { description: List of foods }
 */
router.get('/', optionalAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { search, category, page = '1', limit = '50', scope } = req.query;
    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string)));

    const filter: Record<string, any> = {};

    // Show default foods + user's custom foods, or only the user's foods when scope=custom
    if (req.user) {
      if (scope === 'custom') {
        filter.userId = req.user.userId;
      } else {
        filter.$or = [{ isDefault: true }, { userId: req.user.userId }];
      }
    } else {
      filter.isDefault = true;
    }

    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    if (category) {
      filter.category = category;
    }

    const [foods, total] = await Promise.all([
      Food.find(filter)
        .sort({ name: 1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Food.countDocuments(filter),
    ]);

    res.json({
      foods,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/foods/{id}:
 *   get:
 *     tags: [Foods]
 *     summary: Get a single food by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Food details }
 *       404: { description: Not found }
 */
router.get('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const food = await Food.findById(req.params.id);
    if (!food) {
      res.status(404).json({ error: 'Food not found' });
      return;
    }
    res.json({ food });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/foods:
 *   post:
 *     tags: [Foods]
 *     summary: Create a custom food
 *     security: [{ cookieAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, protein, totalCarbs, fiber, fat, calories, category]
 *             properties:
 *               name: { type: string }
 *               protein: { type: number }
 *               totalCarbs: { type: number }
 *               fiber: { type: number }
 *               fat: { type: number }
 *               calories: { type: number }
 *               category: { type: string }
 *     responses:
 *       201: { description: Food created }
 */
router.post('/', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const data = createFoodSchema.parse(req.body);

    const food = await Food.create({
      ...data,
      netCarbs: data.netCarbs ?? Math.max(0, data.totalCarbs - data.fiber),
      userId: req.user!.userId,
      isDefault: false,
    });

    res.status(201).json({ food });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/foods/{id}:
 *   put:
 *     tags: [Foods]
 *     summary: Update a custom food
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Food updated }
 */
router.put('/:id', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const data = updateFoodSchema.parse(req.body);

    const food = await Food.findOne({ _id: req.params.id, userId: req.user!.userId });
    if (!food) {
      res.status(404).json({ error: 'Food not found or not owned by you' });
      return;
    }

    Object.assign(food, data);
    if (data.totalCarbs !== undefined || data.fiber !== undefined) {
      food.netCarbs = Math.max(0, food.totalCarbs - food.fiber);
    }
    await food.save();

    res.json({ food });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/foods/{id}:
 *   delete:
 *     tags: [Foods]
 *     summary: Delete a custom food
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Food deleted }
 */
router.delete('/:id', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const food = await Food.findOneAndDelete({ _id: req.params.id, userId: req.user!.userId });
    if (!food) {
      res.status(404).json({ error: 'Food not found or not owned by you' });
      return;
    }
    res.json({ message: 'Food deleted' });
  } catch (error) {
    next(error);
  }
});

export default router;
