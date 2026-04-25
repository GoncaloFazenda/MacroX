import { writable } from 'svelte/store';
import { api } from '$lib/api/client.js';

function createDayTemplateStore() {
  const { subscribe, set, update } = writable({
    templates: [],
    loading: false,
  });

  return {
    subscribe,

    async load() {
      update((s) => ({ ...s, loading: true }));
      try {
        const data = await api.get('/day-templates');
        update((s) => ({ ...s, templates: data.templates, loading: false }));
      } catch {
        update((s) => ({ ...s, loading: false }));
      }
    },

    async create(name, meals) {
      const data = await api.post('/day-templates', { name, meals });
      update((s) => ({ ...s, templates: [data.template, ...s.templates] }));
      return data.template;
    },

    async update(id, payload) {
      const data = await api.put(`/day-templates/${id}`, payload);
      update((s) => ({
        ...s,
        templates: s.templates.map((t) => (t._id === id ? data.template : t)),
      }));
      return data.template;
    },

    async remove(id) {
      await api.del(`/day-templates/${id}`);
      update((s) => ({
        ...s,
        templates: s.templates.filter((t) => t._id !== id),
      }));
    },
  };
}

export const dayTemplateStore = createDayTemplateStore();
