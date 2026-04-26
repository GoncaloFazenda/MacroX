<script>
  import '../app.css';
  import Navbar from '$lib/components/layout/Navbar.svelte';
  import { auth } from '$lib/stores/auth.js';
  import { theme } from '$lib/stores/theme.js';
  import { onMount } from 'svelte';
  import { page } from '$app/stores';

  let { data, children } = $props();

  const publicRoutes = ['/login', '/register', '/'];

  onMount(() => {
    theme.init();
  });

  $effect(() => {
    auth.hydrate(data.user ?? null);
  });

  const currentUser = $derived(data.user ?? $auth.user);
  const showNav = $derived(!publicRoutes.includes($page.url.pathname) && currentUser);
</script>

<div class="app-shell">
  {#if showNav}
    <Navbar user={currentUser} />
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
    min-height: 100%;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }
</style>
