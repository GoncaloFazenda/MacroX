<script>
  import { auth } from '$lib/stores/auth.js';
  import SaveButton from '$lib/components/ui/SaveButton.svelte';
  import { Check, AlertTriangle, User, Lock, Target } from 'lucide-svelte';

  let { data } = $props();

  const user = $derived(data.user ?? $auth.user);
  const joinedLabel = $derived(
    user?.createdAt
      ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      : 'Recently'
  );

  // ─── Toast ────────────────────────────────────────────
  let toast = $state({ visible: false, message: '', type: 'success' });
  let toastTimeout;
  function showToast(message, type = 'success') {
    clearTimeout(toastTimeout);
    toast = { visible: true, message, type };
    toastTimeout = setTimeout(() => (toast = { ...toast, visible: false }), 3200);
  }

  // ─── Account form ─────────────────────────────────────
  let accountForm = $state({ name: '', email: '' });
  let accountSnapshot = $state('');
  let savingAccount = $state(false);

  function syncAccount() {
    const next = { name: user?.name || '', email: user?.email || '' };
    accountForm = next;
    accountSnapshot = JSON.stringify(next);
  }
  const accountDirty = $derived(JSON.stringify(accountForm) !== accountSnapshot);

  async function saveAccount() {
    savingAccount = true;
    try {
      await auth.updateProfile({
        name: accountForm.name.trim(),
        email: accountForm.email.trim(),
      });
      syncAccount();
      showToast('Account updated');
    } catch (err) {
      showToast(err.message, 'error');
    }
    savingAccount = false;
  }

  // ─── Password form ────────────────────────────────────
  let passwordForm = $state({ currentPassword: '', newPassword: '', confirmPassword: '' });
  let savingPassword = $state(false);
  const passwordReady = $derived(
    passwordForm.currentPassword.length > 0 &&
      passwordForm.newPassword.length >= 6 &&
      passwordForm.newPassword === passwordForm.confirmPassword
  );
  const passwordMismatch = $derived(
    passwordForm.confirmPassword.length > 0 &&
      passwordForm.newPassword !== passwordForm.confirmPassword
  );

  async function savePassword(e) {
    e.preventDefault();
    if (!passwordReady) return;
    savingPassword = true;
    try {
      await auth.updatePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      passwordForm = { currentPassword: '', newPassword: '', confirmPassword: '' };
      showToast('Password updated');
    } catch (err) {
      showToast(err.message, 'error');
    }
    savingPassword = false;
  }

  // ─── Goals form ───────────────────────────────────────
  let goalForm = $state({ calories: 2000, protein: 150, netCarbs: 100, fat: 65 });
  let goalEnabled = $state({ protein: true, netCarbs: true, fat: true });
  let goalSnapshot = $state('');
  let savingGoals = $state(false);

  function buildGoalPayload(form, enabled) {
    return JSON.stringify({
      calories: Number(form.calories),
      protein: enabled.protein ? Number(form.protein) : null,
      netCarbs: enabled.netCarbs ? Number(form.netCarbs) : null,
      fat: enabled.fat ? Number(form.fat) : null,
    });
  }
  function syncGoals() {
    const goals = user?.goals || { calories: 2000, protein: 150, netCarbs: 100, fat: 65 };
    const nextForm = {
      calories: goals.calories,
      protein: goals.protein ?? 150,
      netCarbs: goals.netCarbs ?? 100,
      fat: goals.fat ?? 65,
    };
    const nextEnabled = {
      protein: goals.protein != null,
      netCarbs: goals.netCarbs != null,
      fat: goals.fat != null,
    };
    goalForm = nextForm;
    goalEnabled = nextEnabled;
    goalSnapshot = buildGoalPayload(nextForm, nextEnabled);
  }
  const goalsDirty = $derived(buildGoalPayload(goalForm, goalEnabled) !== goalSnapshot);

  async function saveGoals() {
    savingGoals = true;
    try {
      await auth.updateGoals(JSON.parse(buildGoalPayload(goalForm, goalEnabled)));
      syncGoals();
      showToast('Goals updated');
    } catch (err) {
      showToast(err.message, 'error');
    }
    savingGoals = false;
  }

  $effect(() => {
    if (user) {
      syncAccount();
      syncGoals();
    }
  });

  const trackedCount = $derived(
    [user?.goals?.protein, user?.goals?.netCarbs, user?.goals?.fat].filter((v) => v != null).length + 1
  );
</script>

<svelte:head><title>Profile - MacroX</title></svelte:head>

<div class="page-container profile-page">
  <div class="profile-header animate-slide-up">
    <span class="eyebrow">Profile</span>
    <h1 class="page-title">Account and preferences</h1>
    <p class="page-subtitle">Update your details, change your password, or adjust your daily macro targets.</p>
  </div>

  <section class="profile-hero animate-slide-up stagger-1">
    <div class="hero-main">
      <div class="hero-avatar">
        {(user?.name || '?').charAt(0).toUpperCase()}
      </div>
      <div>
        <h2 class="hero-name">{user?.name || 'Profile'}</h2>
        <p class="hero-meta">{user?.email || ''}</p>
      </div>
    </div>
    <div class="hero-stats">
      <div class="hero-stat">
        <span class="hero-stat-label">Joined</span>
        <span class="hero-stat-value mono">{joinedLabel}</span>
      </div>
      <div class="hero-stat">
        <span class="hero-stat-label">Tracked goals</span>
        <span class="hero-stat-value mono">{trackedCount}</span>
      </div>
    </div>
  </section>

  <section class="settings-card animate-slide-up stagger-2">
    <div class="card-head">
      <div class="card-title-row">
        <span class="card-icon"><User size={16} strokeWidth={1.6} /></span>
        <div>
          <h2 class="card-title">Account</h2>
          <p class="card-copy">Your name and the email we use to sign you in.</p>
        </div>
      </div>
      <SaveButton ready={!!user} dirty={accountDirty} saving={savingAccount} onclick={saveAccount} />
    </div>

    <div class="field-grid">
      <label class="field">
        <span class="label">Name</span>
        <input class="input" type="text" bind:value={accountForm.name} placeholder="Your name" />
      </label>
      <label class="field">
        <span class="label">Email</span>
        <input class="input" type="email" bind:value={accountForm.email} placeholder="you@example.com" />
      </label>
    </div>
  </section>

  <section class="settings-card animate-slide-up stagger-3">
    <div class="card-head stacked">
      <div class="card-title-row">
        <span class="card-icon"><Lock size={16} strokeWidth={1.6} /></span>
        <div>
          <h2 class="card-title">Password</h2>
          <p class="card-copy">Use at least 6 characters. You'll stay signed in after the change.</p>
        </div>
      </div>
    </div>

    <form class="field-grid" onsubmit={savePassword}>
      <label class="field full">
        <span class="label">Current password</span>
        <input class="input" type="password" autocomplete="current-password" bind:value={passwordForm.currentPassword} />
      </label>
      <label class="field">
        <span class="label">New password</span>
        <input class="input" type="password" autocomplete="new-password" bind:value={passwordForm.newPassword} minlength="6" />
      </label>
      <label class="field">
        <span class="label">Confirm new password</span>
        <input
          class="input"
          class:input-error={passwordMismatch}
          type="password"
          autocomplete="new-password"
          bind:value={passwordForm.confirmPassword}
        />
        {#if passwordMismatch}
          <span class="field-hint danger">Passwords do not match</span>
        {/if}
      </label>

      <div class="form-actions">
        <button class="btn btn-primary" type="submit" disabled={!passwordReady || savingPassword}>
          {savingPassword ? 'Saving...' : 'Change password'}
        </button>
      </div>
    </form>
  </section>

  <section class="settings-card animate-slide-up stagger-4">
    <div class="card-head">
      <div class="card-title-row">
        <span class="card-icon"><Target size={16} strokeWidth={1.6} /></span>
        <div>
          <h2 class="card-title">Macro goals</h2>
          <p class="card-copy">Toggle which macros to track and set your daily targets.</p>
        </div>
      </div>
      <SaveButton ready={!!user} dirty={goalsDirty} saving={savingGoals} onclick={saveGoals} />
    </div>

    <div class="goals-grid">
      <div class="goal-card">
        <div class="goal-head">
          <span class="goal-dot" style="background: var(--cal)"></span>
          <span class="goal-name">Calories</span>
        </div>
        <div class="goal-input-row">
          <input type="number" class="goal-input mono" bind:value={goalForm.calories} min="0" />
          <span class="goal-unit">kcal</span>
        </div>
      </div>

      {#each [{ key: 'protein', label: 'Protein', color: 'var(--pro)', unit: 'g' }, { key: 'netCarbs', label: 'Net Carbs', color: 'var(--carb)', unit: 'g' }, { key: 'fat', label: 'Fat', color: 'var(--fat)', unit: 'g' }] as macro}
        <div class="goal-card" class:goal-card-off={!goalEnabled[macro.key]}>
          <div class="goal-head">
            <span class="goal-dot" style="background: {macro.color}"></span>
            <span class="goal-name">{macro.label}</span>
            <button
              type="button"
              class="goal-chip"
              onclick={() => (goalEnabled[macro.key] = !goalEnabled[macro.key])}
            >
              {goalEnabled[macro.key] ? 'Tracking' : 'Off'}
            </button>
          </div>
          {#if goalEnabled[macro.key]}
            <div class="goal-input-row">
              <input type="number" class="goal-input mono" bind:value={goalForm[macro.key]} min="0" />
              <span class="goal-unit">{macro.unit}</span>
            </div>
          {/if}
        </div>
      {/each}
    </div>
  </section>
</div>

{#if toast.visible}
  <div class="toast-container">
    <div class="app-toast app-toast-{toast.type}" role="alert">
      <span class="app-toast-icon">
        {#if toast.type === 'success'}
          <Check size={16} strokeWidth={2.5} />
        {:else}
          <AlertTriangle size={16} strokeWidth={2} />
        {/if}
      </span>
      <span>{toast.message}</span>
    </div>
  </div>
{/if}

<style>
  .profile-page {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
  }

  .profile-header {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  .eyebrow {
    font-size: var(--font-xs);
    color: var(--text-2);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    font-weight: 500;
    margin-bottom: var(--space-2);
  }

  .profile-hero {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-4);
    padding: var(--space-6);
    border: var(--border-width) solid var(--border);
    border-radius: var(--radius-xl);
    background: var(--bg-elevated);
  }

  .hero-main {
    display: flex;
    align-items: center;
    gap: var(--space-4);
  }

  .hero-avatar {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 52px;
    height: 52px;
    border-radius: 50%;
    background: var(--accent-subtle);
    color: var(--text-0);
    font-size: var(--font-lg);
    font-weight: 600;
    border: var(--border-width) solid var(--border);
  }

  .hero-name {
    font-size: var(--font-xl);
    font-weight: 600;
    letter-spacing: -0.02em;
  }

  .hero-meta {
    margin-top: 4px;
    color: var(--text-2);
    font-size: var(--font-sm);
  }

  .hero-stats {
    display: flex;
    gap: var(--space-3);
  }

  .hero-stat {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: var(--space-3) var(--space-4);
    border: var(--border-width) solid var(--border);
    border-radius: var(--radius-md);
    min-width: 128px;
  }

  .hero-stat-label {
    font-size: var(--font-xs);
    color: var(--text-3);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .hero-stat-value {
    font-size: var(--font-md);
    font-weight: 600;
    color: var(--text-0);
  }

  .settings-card {
    padding: var(--space-6);
    border: var(--border-width) solid var(--border);
    border-radius: var(--radius-xl);
    background: var(--bg-elevated);
  }

  .card-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--space-4);
    margin-bottom: var(--space-5);
  }
  .card-head.stacked {
    margin-bottom: var(--space-4);
  }

  .card-title-row {
    display: flex;
    align-items: flex-start;
    gap: var(--space-3);
  }

  .card-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: var(--radius-md);
    background: var(--accent-subtle);
    color: var(--text-1);
    flex-shrink: 0;
  }

  .card-title {
    font-size: var(--font-lg);
    font-weight: 600;
    letter-spacing: -0.02em;
  }

  .card-copy {
    margin-top: var(--space-1);
    font-size: var(--font-sm);
    color: var(--text-2);
    line-height: 1.5;
  }

  .field-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--space-4);
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .field.full {
    grid-column: 1 / -1;
  }

  .input-error {
    border-color: var(--danger) !important;
  }

  .field-hint {
    font-size: var(--font-xs);
    color: var(--text-3);
  }
  .field-hint.danger {
    color: var(--danger);
  }

  .form-actions {
    grid-column: 1 / -1;
    display: flex;
    justify-content: flex-end;
    gap: var(--space-3);
    margin-top: var(--space-2);
  }

  .form-actions .btn:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  .goals-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--space-3);
  }

  .goal-card {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    padding: var(--space-4);
    border: var(--border-width) solid var(--border);
    border-radius: var(--radius-lg);
    background: color-mix(in srgb, var(--bg-3) 24%, transparent);
    min-height: 116px;
  }

  .goal-card-off {
    opacity: 0.55;
  }

  .goal-head {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }

  .goal-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .goal-name {
    font-size: var(--font-sm);
    font-weight: 500;
    flex: 1;
  }

  .goal-chip {
    padding: 2px 10px;
    border: var(--border-width) solid var(--border);
    border-radius: var(--radius-full);
    background: transparent;
    color: var(--text-2);
    font-size: var(--font-xs);
    font-family: var(--font-sans);
    cursor: pointer;
    transition: all var(--transition-fast);
  }
  .goal-chip:hover {
    border-color: var(--border-strong);
    color: var(--text-0);
  }

  .goal-input-row {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    margin-top: auto;
  }

  .goal-input {
    flex: 1;
    padding: var(--space-2) var(--space-3);
    border: var(--border-width) solid var(--border);
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--text-0);
    text-align: right;
    font-size: var(--font-base);
  }

  .goal-input:focus {
    outline: none;
    border-color: var(--text-2);
  }

  .goal-unit {
    min-width: 34px;
    color: var(--text-3);
    font-size: var(--font-sm);
  }

  @media (max-width: 1024px) {
    .field-grid,
    .goals-grid {
      grid-template-columns: 1fr;
    }
    .profile-hero {
      flex-direction: column;
      align-items: flex-start;
    }
    .hero-stats {
      width: 100%;
      flex-wrap: wrap;
    }
  }

  @media (max-width: 640px) {
    .settings-card,
    .profile-hero {
      padding: var(--space-5);
    }
    .card-head {
      flex-direction: column;
      align-items: stretch;
    }
  }
</style>
