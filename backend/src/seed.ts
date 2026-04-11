import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectDB } from './config/db';
import Food from './models/Food';

dotenv.config();

const foods = [
  // ─── Proteins ─────────────────────────────────────
  { name: 'Chicken Breast (skinless)', protein: 31, totalCarbs: 0, fiber: 0, fat: 3.6, calories: 165, category: 'Protein' },
  { name: 'Salmon (Atlantic)', protein: 20, totalCarbs: 0, fiber: 0, fat: 13, calories: 208, category: 'Protein' },
  { name: 'Ground Beef (90% lean)', protein: 26, totalCarbs: 0, fiber: 0, fat: 10, calories: 196, category: 'Protein' },
  { name: 'Turkey Breast', protein: 29, totalCarbs: 0, fiber: 0, fat: 1, calories: 135, category: 'Protein' },
  { name: 'Tuna (canned in water)', protein: 26, totalCarbs: 0, fiber: 0, fat: 1, calories: 116, category: 'Protein' },
  { name: 'Shrimp', protein: 24, totalCarbs: 0.2, fiber: 0, fat: 0.3, calories: 99, category: 'Protein' },
  { name: 'Pork Tenderloin', protein: 26, totalCarbs: 0, fiber: 0, fat: 3.5, calories: 143, category: 'Protein' },
  { name: 'Cod', protein: 18, totalCarbs: 0, fiber: 0, fat: 0.7, calories: 82, category: 'Protein' },
  { name: 'Egg (large, whole)', protein: 6.3, totalCarbs: 0.4, fiber: 0, fat: 5, calories: 72, category: 'Protein' },
  { name: 'Egg Whites (large)', protein: 3.6, totalCarbs: 0.2, fiber: 0, fat: 0.1, calories: 17, category: 'Protein' },
  { name: 'Lamb Loin', protein: 25, totalCarbs: 0, fiber: 0, fat: 8.8, calories: 184, category: 'Protein' },
  { name: 'Tilapia', protein: 26, totalCarbs: 0, fiber: 0, fat: 2.6, calories: 128, category: 'Protein' },

  // ─── Vegetables ───────────────────────────────────
  { name: 'Broccoli', protein: 2.8, totalCarbs: 7, fiber: 2.6, fat: 0.4, calories: 34, category: 'Vegetable' },
  { name: 'Spinach', protein: 2.9, totalCarbs: 3.6, fiber: 2.2, fat: 0.4, calories: 23, category: 'Vegetable' },
  { name: 'Asparagus', protein: 2.2, totalCarbs: 3.9, fiber: 2.1, fat: 0.1, calories: 20, category: 'Vegetable' },
  { name: 'Brussels Sprouts', protein: 3.4, totalCarbs: 9, fiber: 3.8, fat: 0.3, calories: 43, category: 'Vegetable' },
  { name: 'Kale', protein: 4.3, totalCarbs: 9, fiber: 3.6, fat: 0.9, calories: 49, category: 'Vegetable' },
  { name: 'Bell Pepper (red)', protein: 1, totalCarbs: 6, fiber: 2.1, fat: 0.3, calories: 31, category: 'Vegetable' },
  { name: 'Zucchini', protein: 1.2, totalCarbs: 3.1, fiber: 1, fat: 0.3, calories: 17, category: 'Vegetable' },
  { name: 'Cauliflower', protein: 1.9, totalCarbs: 5, fiber: 2, fat: 0.3, calories: 25, category: 'Vegetable' },
  { name: 'Sweet Potato', protein: 1.6, totalCarbs: 20.1, fiber: 3, fat: 0.1, calories: 86, category: 'Vegetable' },
  { name: 'Tomato', protein: 0.9, totalCarbs: 3.9, fiber: 1.2, fat: 0.2, calories: 18, category: 'Vegetable' },
  { name: 'Cucumber', protein: 0.7, totalCarbs: 3.6, fiber: 0.5, fat: 0.1, calories: 15, category: 'Vegetable' },
  { name: 'Onion', protein: 1.1, totalCarbs: 9.3, fiber: 1.7, fat: 0.1, calories: 40, category: 'Vegetable' },

  // ─── Fruits ───────────────────────────────────────
  { name: 'Banana', protein: 1.1, totalCarbs: 23, fiber: 2.6, fat: 0.3, calories: 89, category: 'Fruit' },
  { name: 'Blueberries', protein: 0.7, totalCarbs: 14, fiber: 2.4, fat: 0.3, calories: 57, category: 'Fruit' },
  { name: 'Strawberries', protein: 0.7, totalCarbs: 7.7, fiber: 2, fat: 0.3, calories: 32, category: 'Fruit' },
  { name: 'Apple', protein: 0.3, totalCarbs: 14, fiber: 2.4, fat: 0.2, calories: 52, category: 'Fruit' },
  { name: 'Avocado', protein: 2, totalCarbs: 9, fiber: 7, fat: 15, calories: 160, category: 'Fruit' },
  { name: 'Orange', protein: 0.9, totalCarbs: 12, fiber: 2.4, fat: 0.1, calories: 47, category: 'Fruit' },

  // ─── Grains ───────────────────────────────────────
  { name: 'White Rice (cooked)', protein: 2.7, totalCarbs: 28, fiber: 0.4, fat: 0.3, calories: 130, category: 'Grain' },
  { name: 'Brown Rice (cooked)', protein: 2.6, totalCarbs: 23, fiber: 1.8, fat: 0.9, calories: 112, category: 'Grain' },
  { name: 'Oats (dry)', protein: 13.2, totalCarbs: 68, fiber: 10.6, fat: 6.9, calories: 389, category: 'Grain' },
  { name: 'Quinoa (cooked)', protein: 4.4, totalCarbs: 21, fiber: 2.8, fat: 1.9, calories: 120, category: 'Grain' },
  { name: 'Whole Wheat Bread (1 slice)', protein: 3.6, totalCarbs: 12, fiber: 1.9, fat: 1, calories: 69, category: 'Grain' },
  { name: 'Pasta (cooked)', protein: 5.8, totalCarbs: 25, fiber: 1.8, fat: 0.9, calories: 131, category: 'Grain' },

  // ─── Dairy ────────────────────────────────────────
  { name: 'Greek Yogurt (plain, nonfat)', protein: 10, totalCarbs: 3.6, fiber: 0, fat: 0.7, calories: 59, category: 'Dairy' },
  { name: 'Cottage Cheese (2%)', protein: 12, totalCarbs: 3.1, fiber: 0, fat: 2.3, calories: 81, category: 'Dairy' },
  { name: 'Cheddar Cheese', protein: 25, totalCarbs: 1.3, fiber: 0, fat: 33, calories: 403, category: 'Dairy' },
  { name: 'Mozzarella Cheese', protein: 22, totalCarbs: 2.2, fiber: 0, fat: 22, calories: 300, category: 'Dairy' },
  { name: 'Whole Milk', protein: 3.2, totalCarbs: 4.8, fiber: 0, fat: 3.3, calories: 61, category: 'Dairy' },
  { name: 'Whey Protein Powder', protein: 80, totalCarbs: 10, fiber: 0, fat: 3, calories: 400, category: 'Dairy' },

  // ─── Fats & Oils ──────────────────────────────────
  { name: 'Olive Oil', protein: 0, totalCarbs: 0, fiber: 0, fat: 100, calories: 884, category: 'Fat & Oil' },
  { name: 'Coconut Oil', protein: 0, totalCarbs: 0, fiber: 0, fat: 100, calories: 862, category: 'Fat & Oil' },
  { name: 'Butter', protein: 0.9, totalCarbs: 0.1, fiber: 0, fat: 81, calories: 717, category: 'Fat & Oil' },

  // ─── Nuts & Seeds ─────────────────────────────────
  { name: 'Almonds', protein: 21, totalCarbs: 22, fiber: 12.5, fat: 49, calories: 579, category: 'Nut & Seed' },
  { name: 'Walnuts', protein: 15, totalCarbs: 14, fiber: 6.7, fat: 65, calories: 654, category: 'Nut & Seed' },
  { name: 'Peanut Butter', protein: 25, totalCarbs: 20, fiber: 6, fat: 50, calories: 588, category: 'Nut & Seed' },
  { name: 'Chia Seeds', protein: 17, totalCarbs: 42, fiber: 34, fat: 31, calories: 486, category: 'Nut & Seed' },
  { name: 'Flax Seeds (ground)', protein: 18, totalCarbs: 29, fiber: 27, fat: 42, calories: 534, category: 'Nut & Seed' },

  // ─── Legumes ──────────────────────────────────────
  { name: 'Black Beans (cooked)', protein: 8.9, totalCarbs: 24, fiber: 8.7, fat: 0.5, calories: 132, category: 'Legume' },
  { name: 'Lentils (cooked)', protein: 9, totalCarbs: 20, fiber: 7.9, fat: 0.4, calories: 116, category: 'Legume' },
  { name: 'Chickpeas (cooked)', protein: 8.9, totalCarbs: 27, fiber: 7.6, fat: 2.6, calories: 164, category: 'Legume' },
  { name: 'Edamame', protein: 11, totalCarbs: 10, fiber: 5, fat: 5, calories: 121, category: 'Legume' },
  { name: 'Tofu (firm)', protein: 8, totalCarbs: 2.3, fiber: 0.3, fat: 4.8, calories: 76, category: 'Legume' },
];

async function seed() {
  try {
    await connectDB();
    console.log('🌱 Seeding food database...\n');

    // Clear existing default foods
    await Food.deleteMany({ isDefault: true });

    const foodDocs = foods.map((f) => ({
      ...f,
      netCarbs: Math.max(0, f.totalCarbs - f.fiber),
      isDefault: true,
      userId: null,
    }));

    await Food.insertMany(foodDocs);
    console.log(`✓ Inserted ${foodDocs.length} foods\n`);

    // Print summary
    const categories = [...new Set(foods.map((f) => f.category))];
    for (const cat of categories) {
      const count = foods.filter((f) => f.category === cat).length;
      console.log(`  ${cat}: ${count} items`);
    }

    console.log('\n✅ Seed complete!');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
}

seed();
