<script>
  import { auth } from '$lib/stores/auth.js';
  import { onMount } from 'svelte';

  onMount(() => {
    const unsub = auth.subscribe((state) => {
      if (!state.loading) {
        window.location.href = state.user ? '/overview' : '/login';
      }
    });
    return unsub;
  });
</script>

<div class="loading">
  <span class="loading-text">MacroX</span>
</div>

<style>
  .loading {
    display: flex; align-items: center; justify-content: center;
    min-height: 100vh;
  }
  .loading-text {
    font-size: var(--font-lg); font-weight: 700; color: var(--text-2);
    letter-spacing: -0.04em; animation: pulse 1.5s ease-in-out infinite;
  }
  @keyframes pulse { 0%, 100% { opacity: 0.3; } 50% { opacity: 1; } }
</style>
