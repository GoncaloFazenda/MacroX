import { z } from 'zod';

// ─── User ───────────────────────────────────────────
const nullableGoal = z.union([z.null(), z.coerce.number().min(0)]);

export const goalsSchema = z.object({
  calories: z.coerce.number().min(0).default(2000),
  protein: nullableGoal.default(null),
  netCarbs: nullableGoal.default(null),
  fat: nullableGoal.default(null),
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(1, 'Name is required').max(100),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const updateGoalsSchema = z.object({
  goals: goalsSchema,
});

// ─── Food ───────────────────────────────────────────
export const foodCategories = [
  'Protein',
  'Vegetable',
  'Fruit',
  'Grain',
  'Dairy',
  'Fat & Oil',
  'Nut & Seed',
  'Legume',
  'Beverage',
  'Condiment',
  'Other',
] as const;

export const createFoodSchema = z.object({
  name: z.string().min(1).max(200),
  protein: z.number().min(0),
  totalCarbs: z.number().min(0),
  fiber: z.number().min(0),
  netCarbs: z.number().min(0).optional(),
  fat: z.number().min(0),
  calories: z.number().min(0),
  category: z.enum(foodCategories),
});

export const updateFoodSchema = createFoodSchema.partial();

// ─── Composite Meal ─────────────────────────────────
export const compositeMealItemSchema = z.object({
  foodId: z.string().min(1),
  quantity: z.number().min(0.1, 'Quantity must be positive'),
});

export const createCompositeMealSchema = z.object({
  name: z.string().min(1).max(200),
  items: z.array(compositeMealItemSchema).min(1, 'At least one food item required'),
});

export const updateCompositeMealSchema = createCompositeMealSchema.partial();

// ─── Daily Plan ─────────────────────────────────────
export const mealSlots = ['breakfast', 'lunch', 'dinner', 'snack'] as const;

export const planItemSchema = z.object({
  type: z.enum(['food', 'compositeMeal']),
  refId: z.string().min(1),
  quantity: z.number().min(0.1),
});

export const mealSlotSchema = z.object({
  slot: z.enum(mealSlots),
  items: z.array(planItemSchema),
});

export const upsertDailyPlanSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  meals: z.array(mealSlotSchema),
});

// ─── Weekly Plan ────────────────────────────────────
export const upsertWeeklyPlanSchema = z.object({
  weekStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  days: z.array(z.object({
    dayOfWeek: z.number().min(0).max(6),
    meals: z.array(mealSlotSchema),
  })),
});

// ─── Meal Template ──────────────────────────────────
export const createMealTemplateSchema = z.object({
  name: z.string().min(1).max(200),
  items: z.array(planItemSchema).min(1),
});

export const updateMealTemplateSchema = createMealTemplateSchema.partial();

// ─── Day Template ───────────────────────────────────
export const createDayTemplateSchema = z.object({
  name: z.string().min(1).max(200),
  meals: z.array(mealSlotSchema).min(1),
});

export const updateDayTemplateSchema = createDayTemplateSchema.partial();

// ─── Type Exports ───────────────────────────────────
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateFoodInput = z.infer<typeof createFoodSchema>;
export type UpdateFoodInput = z.infer<typeof updateFoodSchema>;
export type CreateCompositeMealInput = z.infer<typeof createCompositeMealSchema>;
export type UpsertDailyPlanInput = z.infer<typeof upsertDailyPlanSchema>;
export type UpsertWeeklyPlanInput = z.infer<typeof upsertWeeklyPlanSchema>;
export type CreateMealTemplateInput = z.infer<typeof createMealTemplateSchema>;
export type CreateDayTemplateInput = z.infer<typeof createDayTemplateSchema>;
export type Goals = z.infer<typeof goalsSchema>;
