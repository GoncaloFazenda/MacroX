<script>
  import { page } from '$app/stores';
  import { auth } from '$lib/stores/auth.js';
  import { theme } from '$lib/stores/theme.js';
  import { Sun, Moon, Cloud, LogOut, Menu, X, ChevronDown } from 'lucide-svelte';

  let { user = null } = $props();
  let mobileOpen = $state(false);
  let libraryOpen = $state(false);
  let libraryTimeout;

  const mainNav = [
    { href: '/overview', label: 'Overview' },
    { href: '/day', label: 'My Day' },
    { href: '/week', label: 'My Week' },
  ];

  const libraryItems = [
    { href: '/library/foods-meals', label: 'Foods & Meals' },
    { href: '/library/templates', label: 'Day Plans' },
  ];

  function isActive(href) {
    return $page.url.pathname.startsWith(href);
  }

  const libraryActive = $derived(libraryItems.some(i => isActive(i.href)));

  function openLibrary() { clearTimeout(libraryTimeout); libraryOpen = true; }
  function closeLibrary() { libraryTimeout = setTimeout(() => libraryOpen = false, 150); }

  async function handleLogout() {
    await auth.logout();
    window.location.href = '/login';
  }
</script>

<nav class="navbar">
  <div class="navbar-inner">
    <a href="/overview" class="logo">Macro<span class="logo-x">X</span></a>

    <div class="nav-links" class:open={mobileOpen}>
      {#each mainNav as item}
        <a
          href={item.href}
          class="nav-link"
          class:active={isActive(item.href)}
          onclick={() => mobileOpen = false}
        >{item.label}</a>
      {/each}

      {#if user}
        <a
          href="/profile"
          class="nav-link mobile-profile"
          class:active={isActive('/profile')}
          onclick={() => mobileOpen = false}
        >Profile</a>
      {/if}

      <!-- Library dropdown (desktop) -->
      <div
        class="lib-wrap"
        onmouseenter={openLibrary}
        onmouseleave={closeLibrary}
        role="navigation"
      >
        <button
          class="nav-link lib-trigger"
          class:active={libraryActive}
          onclick={() => libraryOpen = !libraryOpen}
        >
          Library
          <ChevronDown size={12} strokeWidth={1.5} class="lib-chevron {libraryOpen ? 'lib-chevron-open' : ''}" />
        </button>

        {#if libraryOpen}
          <div class="lib-dropdown">
            {#each libraryItems as item}
              <a
                href={item.href}
                class="lib-item"
                class:active={isActive(item.href)}
                onclick={() => { libraryOpen = false; mobileOpen = false; }}
              >{item.label}</a>
            {/each}
          </div>
        {/if}
      </div>
    </div>

    <div class="nav-actions">
      <button class="btn btn-ghost btn-sm" onclick={() => theme.toggle()} aria-label="Toggle theme">
        {#if $theme === 'dark'}
          <Sun size={16} strokeWidth={1.5} />
        {:else if $theme === 'light'}
          <Cloud size={16} strokeWidth={1.5} />
        {:else}
          <Moon size={16} strokeWidth={1.5} />
        {/if}
      </button>

      {#if user}
        <a href="/profile" class="user-link" aria-label="Open profile">{user.name}</a>
        <button class="btn btn-ghost btn-sm" onclick={handleLogout} aria-label="Log out">
          <LogOut size={16} strokeWidth={1.5} />
        </button>
      {/if}

      <button class="mobile-toggle btn btn-ghost btn-sm" onclick={() => mobileOpen = !mobileOpen}>
        {#if mobileOpen}
          <X size={16} />
        {:else}
          <Menu size={16} />
        {/if}
      </button>
    </div>
  </div>
</nav>

<style>
  .navbar {
    position: sticky;
    top: 0;
    z-index: 100;
    height: var(--navbar-height);
    background: var(--bg-0);
    border-bottom: var(--border-width) solid var(--border);
  }

  .navbar-inner {
    max-width: 1600px;
    margin: 0 auto;
    height: 100%;
    display: flex;
    align-items: center;
    padding: 0 var(--space-8);
    gap: var(--space-8);
  }

  .logo {
    font-size: 22px;
    font-weight: 700;
    color: var(--text-0);
    letter-spacing: -0.04em;
    flex-shrink: 0;
  }

  .logo-x {
    color: var(--cal);
  }

  .nav-links {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    flex: 1;
  }

  .nav-link {
    padding: 6px 14px;
    border-radius: var(--radius-md);
    font-size: var(--font-sm);
    font-weight: 400;
    color: var(--text-2);
    transition: all var(--transition-fast);
    background: none;
    border: none;
    cursor: pointer;
    font-family: var(--font-sans);
    display: flex;
    align-items: center;
    gap: var(--space-1);
  }

  .nav-link:hover { color: var(--text-0); background: var(--bg-hover); }

  .nav-link.active {
    color: var(--text-0);
    background: var(--bg-3);
  }

  /* Library dropdown */
  .lib-wrap {
    position: relative;
  }

  .lib-trigger {
    user-select: none;
  }

  :global(.lib-chevron) {
    transition: transform 150ms ease;
    opacity: 0.5;
  }
  :global(.lib-chevron-open) {
    transform: rotate(180deg);
  }

  .lib-dropdown {
    position: absolute;
    top: calc(100% + 6px);
    left: 0;
    min-width: 180px;
    background: var(--bg-modal);
    border: var(--border-width) solid var(--border);
    border-radius: var(--radius-md);
    padding: var(--space-1);
    box-shadow: 0 8px 24px rgba(0,0,0,0.2);
    animation: dropIn 120ms ease;
    z-index: 200;
  }

  @keyframes dropIn {
    from { opacity: 0; transform: translateY(-4px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .lib-item {
    display: block;
    padding: 8px 12px;
    border-radius: var(--radius-sm);
    font-size: var(--font-sm);
    color: var(--text-2);
    transition: all var(--transition-fast);
  }
  .lib-item:hover { color: var(--text-0); background: var(--bg-hover); }
  .lib-item.active { color: var(--text-0); background: var(--bg-3); }

  .nav-actions {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    flex-shrink: 0;
  }

  .nav-actions .btn-sm {
    height: 33px;
    width: 33px;
    padding: 0;
  }

  .user-link {
    font-size: var(--font-sm);
    color: var(--text-2);
    font-weight: 500;
    transition: color var(--transition-fast);
  }
  .user-link:hover { color: var(--text-0); }
  .mobile-profile { display: none; }

  .mobile-toggle { display: none; }

  @media (max-width: 768px) {
    .nav-links {
      display: none;
      position: fixed;
      top: var(--navbar-height);
      left: 0;
      right: 0;
      background: var(--bg-modal);
      border-bottom: var(--border-width) solid var(--border);
      flex-direction: column;
      padding: var(--space-3);
      gap: var(--space-1);
      z-index: 150;
    }
    .nav-links.open { display: flex; }
    .nav-link { width: 100%; padding: var(--space-2) var(--space-3); }
    .lib-wrap { width: 100%; }
    .lib-dropdown {
      position: static;
      box-shadow: none;
      border: none;
      padding: 0 0 0 var(--space-4);
      background: transparent;
      animation: none;
    }
    .mobile-toggle { display: flex; }
    .user-link { display: none; }
    .mobile-profile { display: flex; }
  }
</style>
