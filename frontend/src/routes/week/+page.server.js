import { serverApi } from '$lib/server/api.js';
import { getWeekStart } from '$lib/utils/macros.js';

function isValidWeekStart(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export async function load(event) {
  const requestedWeekStart = event.url.searchParams.get('weekStart');
  const weekStart = requestedWeekStart && isValidWeekStart(requestedWeekStart)
    ? requestedWeekStart
    : getWeekStart();

  const [foodsData, mealsData, templatesData, weeklyPlanData] = await Promise.all([
    serverApi.get(event, '/foods?limit=200'),
    serverApi.get(event, '/composite-meals'),
    serverApi.get(event, '/day-templates'),
    serverApi.get(event, `/weekly-plans?weekStart=${weekStart}`),
  ]);

  return {
    weekStart,
    foods: foodsData.foods ?? [],
    foodPagination: foodsData.pagination ?? null,
    meals: mealsData.meals ?? [],
    templates: templatesData.templates ?? [],
    weeklyPlan: weeklyPlanData.plan ?? null,
  };
}
