import { writable } from 'svelte/store';
import { api } from '$lib/api/client.js';

function createFoodStore() {
  const { subscribe, set, update } = writable({
    foods: [],
    loading: false,
    pagination: null,
  });

  return {
    subscribe,

    hydrate(foods = [], pagination = null) {
      set({ foods, loading: false, pagination });
    },

    async load(params = {}) {
      update((s) => ({ ...s, loading: true }));
      try {
        const query = new URLSearchParams();
        if (params.search) query.set('search', params.search);
        if (params.category) query.set('category', params.category);
        if (params.page) query.set('page', String(params.page));
        if (params.limit) query.set('limit', String(params.limit));
        if (params.scope) query.set('scope', params.scope);

        const data = await api.get(`/foods?${query.toString()}`);
        set({ foods: data.foods, loading: false, pagination: data.pagination });
      } catch (err) {
        update((s) => ({ ...s, loading: false }));
      }
    },

    async create(food) {
      const data = await api.post('/foods', food);
      update((s) => ({ ...s, foods: [data.food, ...s.foods] }));
      return data.food;
    },

    async update(id, food) {
      const data = await api.put(`/foods/${id}`, food);
      update((s) => ({ ...s, foods: s.foods.map((f) => (f._id === id ? data.food : f)) }));
      return data.food;
    },

    async remove(id) {
      await api.del(`/foods/${id}`);
      update((s) => ({ ...s, foods: s.foods.filter((f) => f._id !== id) }));
    },
  };
}

export const foodStore = createFoodStore();
