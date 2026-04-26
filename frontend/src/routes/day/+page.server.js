import { serverApi } from '$lib/server/api.js';
import { formatDate } from '$lib/utils/macros.js';

function isValidDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export async function load(event) {
  const urlDate = event.url.searchParams.get('date');
  const templateId = event.url.searchParams.get('templateId');
  const newPlan = event.url.searchParams.get('newPlan') === '1';
  const currentDate = urlDate && isValidDate(urlDate) ? urlDate : formatDate(new Date());
  const templateMode = !!templateId || newPlan;

  const requests = [
    serverApi.get(event, '/foods?limit=200'),
    serverApi.get(event, '/composite-meals'),
  ];

  if (templateMode && !newPlan && templateId) {
    requests.push(serverApi.get(event, `/day-templates/${templateId}`));
  } else if (!templateMode) {
    requests.push(serverApi.get(event, `/daily-plans?date=${currentDate}`));
  }

  const [foodsData, mealsData, thirdData] = await Promise.all(requests);

  return {
    currentDate,
    templateMode,
    isNewTemplate: newPlan,
    editingTemplateId: templateId || null,
    foods: foodsData.foods ?? [],
    foodPagination: foodsData.pagination ?? null,
    meals: mealsData.meals ?? [],
    templates: thirdData?.template ? [thirdData.template] : [],
    template: thirdData?.template ?? null,
    dailyPlan: thirdData?.plan ?? null,
  };
}
