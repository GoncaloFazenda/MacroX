import { writable } from 'svelte/store';
import { browser } from '$app/environment';

const THEMES = ['dark', 'light', 'stone'];

function createThemeStore() {
  const initial = browser ? (localStorage.getItem('macrox-theme') || 'dark') : 'dark';
  const { subscribe, set } = writable(initial);

  return {
    subscribe,

    toggle() {
      let newTheme;
      subscribe((current) => {
        const idx = THEMES.indexOf(current);
        newTheme = THEMES[(idx + 1) % THEMES.length];
      })();
      set(newTheme);
      if (browser) {
        document.body.classList.add('theme-transitioning');
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('macrox-theme', newTheme);
        clearTimeout(window.__macroxThemeTimeout);
        window.__macroxThemeTimeout = setTimeout(() => {
          document.body.classList.remove('theme-transitioning');
        }, 420);
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
