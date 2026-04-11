import { writable } from 'svelte/store';
import { browser } from '$app/environment';

function createThemeStore() {
  const initial = browser ? (localStorage.getItem('macrox-theme') || 'dark') : 'dark';
  const { subscribe, set } = writable(initial);

  return {
    subscribe,

    toggle() {
      let newTheme;
      subscribe((current) => {
        newTheme = current === 'dark' ? 'light' : 'dark';
      })();
      set(newTheme);
      if (browser) {
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('macrox-theme', newTheme);
      }
    },

    init() {
      if (browser) {
        const saved = localStorage.getItem('macrox-theme') || 'dark';
        set(saved);
        document.documentElement.setAttribute('data-theme', saved);
      }
    },
  };
}

export const theme = createThemeStore();
