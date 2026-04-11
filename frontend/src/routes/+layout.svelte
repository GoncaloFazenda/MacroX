<script>
  import '../app.css';
  import Navbar from '$lib/components/layout/Navbar.svelte';
  import { auth } from '$lib/stores/auth.js';
  import { theme } from '$lib/stores/theme.js';
  import { onMount } from 'svelte';
  import { page } from '$app/stores';

  let { children } = $props();

  const publicRoutes = ['/login', '/register', '/'];

  onMount(() => {
    theme.init();
    auth.init();
  });

  $effect(() => {
    if (!$auth.loading && !$auth.user && !publicRoutes.includes($page.url.pathname)) {
      // Don't redirect during loading, only when we know user is not authenticated
    }
  });

  const showNav = $derived(!publicRoutes.includes($page.url.pathname) && $auth.user);
</script>

<div class="app-shell">
  {#if showNav}
    <Navbar />
  {/if}

  <main class="main-content" class:with-nav={showNav}>
    {#key $page.url.pathname}
      <div class="page-transition">
        {@render children()}
      </div>
    {/key}
  </main>
</div>

<style>
  .app-shell {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  .main-content {
    flex: 1;
    position: relative;
  }

  .page-transition {
    animation: fadeIn 300ms ease-out;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }
</style>
