import { serverApi } from '$lib/server/api.js';

export async function load(event) {
  const [foodsData, mealsData, templatesData] = await Promise.all([
    serverApi.get(event, '/foods?limit=200'),
    serverApi.get(event, '/composite-meals'),
    serverApi.get(event, '/day-templates'),
  ]);

  return {
    foods: foodsData.foods ?? [],
    foodPagination: foodsData.pagination ?? null,
    meals: mealsData.meals ?? [],
    templates: templatesData.templates ?? [],
  };
}
