export function calculateMacros(items, foodMap, mealMap = new Map()) {
  const totals = { calories: 0, protein: 0, netCarbs: 0, fat: 0 };

  for (const item of items) {
    const multiplier = item.quantity / 100;

    if (item.type === 'food') {
      const food = foodMap.get(item.refId || item.foodId);
      if (food) {
        totals.calories += food.calories * multiplier;
        totals.protein += food.protein * multiplier;
        totals.netCarbs += food.netCarbs * multiplier;
        totals.fat += food.fat * multiplier;
      }
    } else if (item.type === 'compositeMeal') {
      const meal = mealMap.get(item.refId);
      if (meal?.totalMacros) {
        totals.calories += meal.totalMacros.calories * multiplier;
        totals.protein += meal.totalMacros.protein * multiplier;
        totals.netCarbs += meal.totalMacros.netCarbs * multiplier;
        totals.fat += meal.totalMacros.fat * multiplier;
      }
    }
  }

  return {
    calories: Math.round(totals.calories),
    protein: Math.round(totals.protein * 10) / 10,
    netCarbs: Math.round(totals.netCarbs * 10) / 10,
    fat: Math.round(totals.fat * 10) / 10,
  };
}

export function getPercentage(current, goal) {
  if (!goal || goal <= 0) return 0;
  return Math.min(100, Math.round((current / goal) * 100));
}

export function formatDate(date) {
  return new Date(date).toISOString().split('T')[0];
}

export function getWeekStart(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return formatDate(d);
}

export function getDayNames() {
  return ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
}

export function getDayShortNames() {
  return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
}
