import { writable } from 'svelte/store';
import { api } from '$lib/api/client.js';

function createMealStore() {
  const { subscribe, set, update } = writable({
    meals: [],
    loading: false,
  });

  return {
    subscribe,

    hydrate(meals = []) {
      set({ meals, loading: false });
    },

    async load() {
      update((s) => ({ ...s, loading: true }));
      try {
        const data = await api.get('/composite-meals');
        set({ meals: data.meals, loading: false });
      } catch {
        update((s) => ({ ...s, loading: false }));
      }
    },

    async create(meal) {
      const data = await api.post('/composite-meals', meal);
      update((s) => ({ ...s, meals: [data.meal, ...s.meals] }));
      return data.meal;
    },

    async update(id, meal) {
      const data = await api.put(`/composite-meals/${id}`, meal);
      update((s) => ({ ...s, meals: s.meals.map((m) => (m._id === id ? data.meal : m)) }));
      return data.meal;
    },

    async remove(id) {
      await api.del(`/composite-meals/${id}`);
      update((s) => ({ ...s, meals: s.meals.filter((m) => m._id !== id) }));
    },
  };
}

export const mealStore = createMealStore();
