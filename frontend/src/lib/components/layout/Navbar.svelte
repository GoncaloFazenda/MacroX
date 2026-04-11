<script>
  import { page } from '$app/stores';
  import { auth } from '$lib/stores/auth.js';
  import { theme } from '$lib/stores/theme.js';
  import { Sun, Moon, LogOut, Menu, X } from 'lucide-svelte';

  let mobileOpen = $state(false);

  const navItems = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/foods', label: 'Foods' },
    { href: '/meals', label: 'Meals' },
    { href: '/planner/daily', label: 'Daily' },
    { href: '/planner/weekly', label: 'Weekly' },
    { href: '/templates', label: 'Templates' },
  ];

  function isActive(href) {
    return $page.url.pathname.startsWith(href);
  }

  async function handleLogout() {
    await auth.logout();
    window.location.href = '/login';
  }
</script>

<nav class="navbar">
  <div class="navbar-inner">
    <a href="/dashboard" class="logo">MacroX</a>

    <div class="nav-links" class:open={mobileOpen}>
      {#each navItems as item}
        <a
          href={item.href}
          class="nav-link"
          class:active={isActive(item.href)}
          onclick={() => mobileOpen = false}
        >{item.label}</a>
      {/each}
    </div>

    <div class="nav-actions">
      <button class="btn btn-ghost btn-sm" onclick={() => theme.toggle()} aria-label="Toggle theme">
        {#if $theme === 'dark'}
          <Sun size={16} strokeWidth={1.5} />
        {:else}
          <Moon size={16} strokeWidth={1.5} />
        {/if}
      </button>

      {#if $auth.user}
        <span class="user-name">{$auth.user.name}</span>
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
    border-bottom: 1px solid var(--border);
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
    font-size: var(--font-lg);
    font-weight: 700;
    color: var(--text-0);
    letter-spacing: -0.04em;
    flex-shrink: 0;
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
  }

  .nav-link:hover { color: var(--text-0); background: var(--bg-hover); }

  .nav-link.active {
    color: var(--text-0);
    background: var(--bg-3);
  }

  .nav-actions {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    flex-shrink: 0;
  }

  .user-name {
    font-size: var(--font-sm);
    color: var(--text-2);
    font-weight: 500;
  }

  .mobile-toggle { display: none; }

  @media (max-width: 768px) {
    .nav-links {
      display: none;
      position: fixed;
      top: var(--navbar-height);
      left: 0;
      right: 0;
      background: var(--bg-1);
      border-bottom: 1px solid var(--border);
      flex-direction: column;
      padding: var(--space-3);
      gap: var(--space-1);
    }
    .nav-links.open { display: flex; }
    .nav-link { width: 100%; padding: var(--space-2) var(--space-3); }
    .mobile-toggle { display: flex; }
    .user-name { display: none; }
  }
</style>
