import { writable } from 'svelte/store';
import { api } from '$lib/api/client.js';

function createAuthStore() {
  const { subscribe, set, update } = writable({
    user: null,
    loading: true,
    error: null,
  });

  return {
    subscribe,

    hydrate(user) {
      set({ user, loading: false, error: null });
    },

    async init() {
      try {
        const data = await api.get('/auth/me');
        set({ user: data.user, loading: false, error: null });
      } catch {
        set({ user: null, loading: false, error: null });
      }
    },

    async login(email, password) {
      update((s) => ({ ...s, loading: true, error: null }));
      try {
        const data = await api.post('/auth/login', { email, password });
        set({ user: data.user, loading: false, error: null });
        return true;
      } catch (err) {
        set({ user: null, loading: false, error: err.message });
        return false;
      }
    },

    async register(name, email, password) {
      update((s) => ({ ...s, loading: true, error: null }));
      try {
        const data = await api.post('/auth/register', { name, email, password });
        set({ user: data.user, loading: false, error: null });
        return true;
      } catch (err) {
        set({ user: null, loading: false, error: err.message });
        return false;
      }
    },

    async logout() {
      await api.post('/auth/logout');
      set({ user: null, loading: false, error: null });
    },

    async updateGoals(goals) {
      const data = await api.put('/auth/goals', { goals });
      update((s) => ({ ...s, user: data.user }));
    },

    async updateProfile({ name, email }) {
      const data = await api.put('/auth/profile', { name, email });
      update((s) => ({ ...s, user: data.user }));
    },

    async updatePassword({ currentPassword, newPassword }) {
      await api.put('/auth/password', { currentPassword, newPassword });
    },

    clearError() {
      update((s) => ({ ...s, error: null }));
    },
  };
}

export const auth = createAuthStore();
