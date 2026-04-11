import { writable } from 'svelte/store';
import { api } from '$lib/api/client.js';

function createPlannerStore() {
  const { subscribe, set, update } = writable({
    dailyPlan: null,
    weeklyPlan: null,
    loading: false,
  });

  return {
    subscribe,

    async loadDaily(date) {
      update((s) => ({ ...s, loading: true }));
      try {
        const data = await api.get(`/daily-plans?date=${date}`);
        update((s) => ({ ...s, dailyPlan: data.plan, loading: false }));
      } catch {
        update((s) => ({ ...s, loading: false }));
      }
    },

    async saveDaily(date, meals) {
      const data = await api.put('/daily-plans', { date, meals });
      update((s) => ({ ...s, dailyPlan: data.plan }));
      return data.plan;
    },

    async loadWeekly(weekStart) {
      update((s) => ({ ...s, loading: true }));
      try {
        const data = await api.get(`/weekly-plans?weekStart=${weekStart}`);
        update((s) => ({ ...s, weeklyPlan: data.plan, loading: false }));
      } catch {
        update((s) => ({ ...s, loading: false }));
      }
    },

    async saveWeekly(weekStart, days) {
      const data = await api.put('/weekly-plans', { weekStart, days });
      update((s) => ({ ...s, weeklyPlan: data.plan }));
      return data.plan;
    },
  };
}

export const plannerStore = createPlannerStore();
