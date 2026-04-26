<script>
  import { auth } from '$lib/stores/auth.js';
  import SaveButton from '$lib/components/ui/SaveButton.svelte';
  import { Check, AlertTriangle, Settings, Target, UtensilsCrossed, Bell, Link as LinkIcon } from 'lucide-svelte';

  let { data } = $props();
  let saving = $state(false);
  let toast = $state({ visible: false, message: '', type: 'success' });
  let toastTimeout;

  let goalForm = $state({ calories: 2000, protein: 150, netCarbs: 100, fat: 65 });
  let goalEnabled = $state({ protein: true, netCarbs: true, fat: true });
  let savedSnapshot = $state('');

  const user = $derived(data.user ?? $auth.user);
  const joinedLabel = $derived(user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Recently');
  const goalDirty = $derived(JSON.stringify({
    calories: Number(goalForm.calories),
    protein: goalEnabled.protein ? Number(goalForm.protein) : null,
    netCarbs: goalEnabled.netCarbs ? Number(goalForm.netCarbs) : null,
    fat: goalEnabled.fat ? Number(goalForm.fat) : null,
  }) !== savedSnapshot);

  function syncGoalForm() {
    const goals = user?.goals || { calories: 2000, protein: 150, netCarbs: 100, fat: 65 };
    goalForm = {
      calories: goals.calories,
      protein: goals.protein ?? 150,
      netCarbs: goals.netCarbs ?? 100,
      fat: goals.fat ?? 65,
    };
    goalEnabled = {
      protein: goals.protein != null,
      netCarbs: goals.netCarbs != null,
      fat: goals.fat != null,
    };
    savedSnapshot = JSON.stringify(goals);
  }

  function showToast(message, type = 'success') {
    clearTimeout(toastTimeout);
    toast = { visible: true, message, type };
    toastTimeout = setTimeout(() => {
      toast = { ...toast, visible: false };
    }, 3200);
  }

  async function saveGoals() {
    saving = true;
    try {
      const payload = {
        calories: Number(goalForm.calories),
        protein: goalEnabled.protein ? Number(goalForm.protein) : null,
        netCarbs: goalEnabled.netCarbs ? Number(goalForm.netCarbs) : null,
        fat: goalEnabled.fat ? Number(goalForm.fat) : null,
      };
      await auth.updateGoals(payload);
      syncGoalForm();
      showToast('Profile goals updated');
    } catch (err) {
      showToast(err.message, 'error');
    }
    saving = false;
  }

  $effect(() => {
    if (user) {
      syncGoalForm();
    }
  });
</script>

<svelte:head><title>Profile - MacroX</title></svelte:head>

<div class="page-container profile-page">
  <div class="top-bar">
    <div>
      <span class="eyebrow">Profile</span>
      <h1 class="page-title">Settings and nutrition defaults</h1>
      <p class="page-subtitle">This is the quieter home for goals, preferences, and the next layer of account tools.</p>
    </div>
  </div>

  <section class="profile-hero">
    <div class="hero-main">
      <div class="hero-icon">
        <Settings size={18} strokeWidth={1.7} />
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
        <span class="hero-stat-value mono">{[user?.goals?.protein, user?.goals?.netCarbs, user?.goals?.fat].filter((v) => v != null).length + 1}</span>
      </div>
    </div>
  </section>

  <section class="settings-grid">
    <div class="settings-card">
      <div class="card-head">
        <div>
          <span class="card-tag">Live now</span>
          <h2 class="card-title">Macro goals</h2>
        </div>
        <SaveButton ready={!!user} dirty={goalDirty} saving={saving} onclick={saveGoals} idleLabel="Saved" />
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

        <div class="goal-card" class:goal-card-off={!goalEnabled.protein}>
          <div class="goal-head">
            <span class="goal-dot" style="background: var(--pro)"></span>
            <span class="goal-name">Protein</span>
            <button type="button" class="goal-chip" onclick={() => goalEnabled.protein = !goalEnabled.protein}>
              {goalEnabled.protein ? 'Tracking' : 'Off'}
            </button>
          </div>
          {#if goalEnabled.protein}
            <div class="goal-input-row">
              <input type="number" class="goal-input mono" bind:value={goalForm.protein} min="0" />
              <span class="goal-unit">g</span>
            </div>
          {/if}
        </div>

        <div class="goal-card" class:goal-card-off={!goalEnabled.netCarbs}>
          <div class="goal-head">
            <span class="goal-dot" style="background: var(--carb)"></span>
            <span class="goal-name">Net Carbs</span>
            <button type="button" class="goal-chip" onclick={() => goalEnabled.netCarbs = !goalEnabled.netCarbs}>
              {goalEnabled.netCarbs ? 'Tracking' : 'Off'}
            </button>
          </div>
          {#if goalEnabled.netCarbs}
            <div class="goal-input-row">
              <input type="number" class="goal-input mono" bind:value={goalForm.netCarbs} min="0" />
              <span class="goal-unit">g</span>
            </div>
          {/if}
        </div>

        <div class="goal-card" class:goal-card-off={!goalEnabled.fat}>
          <div class="goal-head">
            <span class="goal-dot" style="background: var(--fat)"></span>
            <span class="goal-name">Fat</span>
            <button type="button" class="goal-chip" onclick={() => goalEnabled.fat = !goalEnabled.fat}>
              {goalEnabled.fat ? 'Tracking' : 'Off'}
            </button>
          </div>
          {#if goalEnabled.fat}
            <div class="goal-input-row">
              <input type="number" class="goal-input mono" bind:value={goalForm.fat} min="0" />
              <span class="goal-unit">g</span>
            </div>
          {/if}
        </div>
      </div>
    </div>

    <div class="settings-card">
      <div class="card-head stacked">
        <div>
          <span class="card-tag muted">Planned next</span>
          <h2 class="card-title">Nutrition approach</h2>
          <p class="card-copy">A future layer for guiding suggestions, defaults, and guardrails based on how you actually eat.</p>
        </div>
      </div>

      <div class="future-grid">
        <div class="future-card active">
          <UtensilsCrossed size={16} strokeWidth={1.6} />
          <span class="future-title">Carnivore to keto</span>
          <span class="future-copy">Switch between stricter and broader approaches without rebuilding your planning defaults by hand.</span>
          <span class="future-badge">Planned</span>
        </div>
        <div class="future-card">
          <Target size={16} strokeWidth={1.6} />
          <span class="future-title">Fat loss or maintenance</span>
          <span class="future-copy">Let the app adjust targets, suggestions, and weekly pacing around the current phase.</span>
          <span class="future-badge">Planned</span>
        </div>
      </div>
    </div>
  </section>

  <section class="future-sections">
    <div class="future-section-card">
      <div class="future-section-head">
        <Bell size={16} strokeWidth={1.6} />
        <div>
          <h3 class="future-section-title">Reminders and checkpoints</h3>
          <p class="future-section-copy">Useful later for meal timing nudges, weekly review prompts, and compliance check-ins.</p>
        </div>
      </div>
      <span class="future-badge">Future</span>
    </div>

    <div class="future-section-card">
      <div class="future-section-head">
        <LinkIcon size={16} strokeWidth={1.6} />
        <div>
          <h3 class="future-section-title">Health signals and integrations</h3>
          <p class="future-section-copy">A place for weight trends, glucose notes, wearable data, labs, and any signal that should shape planning.</p>
        </div>
      </div>
      <span class="future-badge">Future</span>
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
  .top-bar {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--space-4);
  }
  .eyebrow {
    display: inline-block;
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
    background: var(--bg-1);
  }
  .hero-main {
    display: flex;
    align-items: center;
    gap: var(--space-4);
  }
  .hero-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 42px;
    height: 42px;
    border-radius: 50%;
    background: var(--accent-subtle);
    color: var(--text-1);
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
    gap: var(--space-4);
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
  .settings-grid {
    display: grid;
    grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.85fr);
    gap: var(--space-4);
  }
  .settings-card,
  .future-section-card {
    padding: var(--space-6);
    border: var(--border-width) solid var(--border);
    border-radius: var(--radius-xl);
    background: var(--bg-1);
  }
  .card-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--space-4);
    margin-bottom: var(--space-5);
  }
  .card-head.stacked {
    justify-content: flex-start;
  }
  .card-tag {
    display: inline-block;
    margin-bottom: var(--space-2);
    font-size: var(--font-xs);
    color: var(--success);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: 600;
  }
  .card-tag.muted { color: var(--text-3); }
  .card-title {
    font-size: var(--font-lg);
    font-weight: 600;
    letter-spacing: -0.02em;
  }
  .card-copy {
    margin-top: var(--space-2);
    font-size: var(--font-sm);
    color: var(--text-2);
    line-height: 1.6;
  }
  .goals-grid,
  .future-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--space-3);
  }
  .goal-card,
  .future-card {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    padding: var(--space-4);
    border: var(--border-width) solid var(--border);
    border-radius: var(--radius-lg);
    background: color-mix(in srgb, var(--bg-3) 24%, transparent);
  }
  .goal-card-off { opacity: 0.55; }
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
    cursor: pointer;
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
  }
  .goal-input:focus { outline: none; border-color: var(--text-2); }
  .goal-unit {
    min-width: 34px;
    color: var(--text-3);
    font-size: var(--font-sm);
  }
  .future-card.active {
    border-color: color-mix(in srgb, var(--text-1) 35%, var(--border));
  }
  .future-title,
  .future-section-title {
    font-size: var(--font-md);
    font-weight: 600;
    color: var(--text-0);
  }
  .future-copy,
  .future-section-copy {
    color: var(--text-2);
    font-size: var(--font-sm);
    line-height: 1.6;
  }
  .future-badge {
    align-self: flex-start;
    padding: 4px 10px;
    border-radius: var(--radius-full);
    background: var(--accent-subtle);
    color: var(--text-2);
    font-size: var(--font-xs);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    font-weight: 600;
  }
  .future-sections {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--space-4);
  }
  .future-section-card {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--space-4);
  }
  .future-section-head {
    display: flex;
    align-items: flex-start;
    gap: var(--space-3);
  }

  @media (max-width: 1024px) {
    .settings-grid,
    .future-sections,
    .goals-grid,
    .future-grid {
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
    .future-section-card,
    .profile-hero {
      padding: var(--space-5);
    }
    .card-head {
      flex-direction: column;
      align-items: stretch;
    }
    .future-section-card {
      flex-direction: column;
    }
  }
</style>
