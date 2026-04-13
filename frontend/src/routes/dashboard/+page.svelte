<script>
  import { auth } from '$lib/stores/auth.js';
  import { plannerStore } from '$lib/stores/planner.js';
  import { foodStore } from '$lib/stores/foods.js';
  import { mealStore } from '$lib/stores/meals.js';
  import { getPercentage, formatDate } from '$lib/utils/macros.js';
  import { onMount } from 'svelte';
  import { Settings } from 'lucide-svelte';

  let today = formatDate(new Date());
  let mounted = $state(false);

  let goals = $derived($auth.user?.goals || { calories: 2000, protein: 150, netCarbs: 100, fat: 65 });
  let totals = $state({ calories: 0, protein: 0, netCarbs: 0, fat: 0 });

  let editingGoals = $state(false);
  let goalForm = $state({ calories: 2000, protein: 150, netCarbs: 100, fat: 65 });
  let goalEnabled = $state({ protein: true, netCarbs: true, fat: true });

  const macros = $derived([
    { key: 'calories', label: 'Calories', value: totals.calories, goal: goals.calories, unit: 'kcal', color: 'var(--cal)', bg: 'var(--cal-bg)', enabled: true },
    { key: 'protein', label: 'Protein', value: totals.protein, goal: goals.protein, unit: 'g', color: 'var(--pro)', bg: 'var(--pro-bg)', enabled: goals.protein != null },
    { key: 'netCarbs', label: 'Net Carbs', value: totals.netCarbs, goal: goals.netCarbs, unit: 'g', color: 'var(--carb)', bg: 'var(--carb-bg)', enabled: goals.netCarbs != null },
    { key: 'fat', label: 'Fat', value: totals.fat, goal: goals.fat, unit: 'g', color: 'var(--fat)', bg: 'var(--fat-bg)', enabled: goals.fat != null },
  ]);

  onMount(async () => {
    await plannerStore.loadDaily(today);
    await foodStore.load({ limit: 100 });
    await mealStore.load();

    const plan = $plannerStore.dailyPlan;
    if (plan?.meals) {
      const foods = $foodStore.foods;
      const meals = $mealStore.meals;
      const foodMap = new Map(foods.map(f => [f._id, f]));
      const mealMap = new Map(meals.map(m => [m._id, m]));

      let c = 0, p = 0, cb = 0, f = 0;
      for (const slot of plan.meals) {
        for (const item of slot.items) {
          const mult = item.quantity / 100;
          if (item.type === 'food') {
            const food = foodMap.get(item.refId);
            if (food) { c += food.calories * mult; p += food.protein * mult; cb += food.netCarbs * mult; f += food.fat * mult; }
          } else {
            const meal = mealMap.get(item.refId);
            if (meal?.totalMacros) { c += meal.totalMacros.calories * mult; p += meal.totalMacros.protein * mult; cb += meal.totalMacros.netCarbs * mult; f += meal.totalMacros.fat * mult; }
          }
        }
      }
      totals = { calories: Math.round(c), protein: Math.round(p * 10) / 10, netCarbs: Math.round(cb * 10) / 10, fat: Math.round(f * 10) / 10 };
    }
    setTimeout(() => mounted = true, 50);
  });

  function openGoalEditor() {
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
    editingGoals = true;
  }

  async function saveGoals(e) {
    e.preventDefault();
    const payload = {
      calories: Number(goalForm.calories),
      protein: goalEnabled.protein ? Number(goalForm.protein) : null,
      netCarbs: goalEnabled.netCarbs ? Number(goalForm.netCarbs) : null,
      fat: goalEnabled.fat ? Number(goalForm.fat) : null,
    };
    try {
      await auth.updateGoals(payload);
      editingGoals = false;
    } catch (err) {
      alert(err.message);
    }
  }
</script>

<svelte:head><title>Dashboard — MacroX</title></svelte:head>

<div class="page-container">
  <div class="dash-header animate-slide-up">
    <div>
      <span class="dash-date">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
      <h1 class="dash-name">{$auth.user?.name || ''}</h1>
    </div>
    <button class="btn btn-secondary btn-sm" onclick={openGoalEditor}>
      <Settings size={13} strokeWidth={1.5} />
      Goals
    </button>
  </div>

  <!-- Macro Cards -->
  <div class="macro-row">
    {#each macros as macro, i}
      <div class="macro-card animate-slide-up stagger-{i + 1}" class:disabled={!macro.enabled}>
        <div class="mc-top">
          <span class="mc-label">{macro.label}</span>
          {#if macro.enabled}
            <span class="mc-pct mono" style="color: {macro.color}">{getPercentage(macro.value, macro.goal)}%</span>
          {:else}
            <span class="mc-pct mono" style="color: var(--text-3)">Free</span>
          {/if}
        </div>

        <div class="mc-value">
          <span class="mc-num mono">{macro.value}</span>
          {#if macro.enabled}
            <span class="mc-unit">/ {macro.goal} {macro.unit}</span>
          {:else}
            <span class="mc-unit">{macro.unit}</span>
          {/if}
        </div>

        {#if macro.enabled}
          <div class="progress-track">
            <div class="progress-fill" style="width: {mounted ? getPercentage(macro.value, macro.goal) : 0}%; background: {macro.color}"></div>
          </div>
        {/if}
      </div>
    {/each}
  </div>

  <!-- Quick Nav -->
  <div class="nav-row animate-slide-up stagger-5">
    <a href="/planner/daily" class="nav-card">
      <span class="nc-label">Daily Planner</span>
      <span class="nc-desc">Plan today's meals</span>
    </a>
    <a href="/foods" class="nav-card">
      <span class="nc-label">Food Database</span>
      <span class="nc-desc">{$foodStore.pagination?.total || 0} foods</span>
    </a>
    <a href="/meals/new" class="nav-card">
      <span class="nc-label">Build Meal</span>
      <span class="nc-desc">Create composite meal</span>
    </a>
    <a href="/planner/weekly" class="nav-card">
      <span class="nc-label">Weekly Planner</span>
      <span class="nc-desc">Plan your week</span>
    </a>
  </div>
</div>

{#if editingGoals}
  <!-- svelte-ignore a11y_no_static_element_interactions a11y_click_events_have_key_events -->
  <div class="gp-overlay" onclick={() => editingGoals = false}>
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions a11y_click_events_have_key_events -->
    <form class="gp" onclick={(e) => e.stopPropagation()} onsubmit={saveGoals}>

      <div class="gp-header">
        <h2 class="gp-title">Daily Goals</h2>
        <p class="gp-desc">Configure your daily macro targets</p>
      </div>

      <div class="gp-items">
        <div class="gp-card">
          <div class="gp-card-head">
            <span class="gp-dot" style="background: var(--cal)"></span>
            <span class="gp-name">Calories</span>
          </div>
          <div class="gp-card-body">
            <input type="number" class="gp-input mono" bind:value={goalForm.calories} min="0" />
            <span class="gp-unit">kcal</span>
          </div>
        </div>

        <div class="gp-card" class:gp-card-off={!goalEnabled.protein}>
          <div class="gp-card-head">
            <span class="gp-dot" style="background: var(--pro)"></span>
            <span class="gp-name">Protein</span>
            <button type="button" class="gp-chip" onclick={() => goalEnabled.protein = !goalEnabled.protein} aria-label="Toggle protein goal">
              {goalEnabled.protein ? 'Tracking' : 'Off'}
            </button>
          </div>
          {#if goalEnabled.protein}
            <div class="gp-card-body">
              <input type="number" class="gp-input mono" bind:value={goalForm.protein} min="0" />
              <span class="gp-unit">g</span>
            </div>
          {/if}
        </div>

        <div class="gp-card" class:gp-card-off={!goalEnabled.netCarbs}>
          <div class="gp-card-head">
            <span class="gp-dot" style="background: var(--carb)"></span>
            <span class="gp-name">Net Carbs</span>
            <button type="button" class="gp-chip" onclick={() => goalEnabled.netCarbs = !goalEnabled.netCarbs} aria-label="Toggle net carbs goal">
              {goalEnabled.netCarbs ? 'Tracking' : 'Off'}
            </button>
          </div>
          {#if goalEnabled.netCarbs}
            <div class="gp-card-body">
              <input type="number" class="gp-input mono" bind:value={goalForm.netCarbs} min="0" />
              <span class="gp-unit">g</span>
            </div>
          {/if}
        </div>

        <div class="gp-card" class:gp-card-off={!goalEnabled.fat}>
          <div class="gp-card-head">
            <span class="gp-dot" style="background: var(--fat)"></span>
            <span class="gp-name">Fat</span>
            <button type="button" class="gp-chip" onclick={() => goalEnabled.fat = !goalEnabled.fat} aria-label="Toggle fat goal">
              {goalEnabled.fat ? 'Tracking' : 'Off'}
            </button>
          </div>
          {#if goalEnabled.fat}
            <div class="gp-card-body">
              <input type="number" class="gp-input mono" bind:value={goalForm.fat} min="0" />
              <span class="gp-unit">g</span>
            </div>
          {/if}
        </div>
      </div>

      <div class="gp-foot">
        <button type="button" class="btn btn-ghost" onclick={() => editingGoals = false}>Cancel</button>
        <button type="submit" class="btn btn-primary">Save</button>
      </div>

    </form>
  </div>
{/if}

<style>
  .dash-header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    margin-bottom: var(--space-8);
  }
  .dash-date { font-size: var(--font-xs); color: var(--text-2); text-transform: uppercase; letter-spacing: 0.04em; }
  .dash-name { font-size: var(--font-3xl); font-weight: 600; letter-spacing: -0.03em; margin-top: var(--space-1); }

  .macro-row {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: var(--space-4);
    margin-bottom: var(--space-8);
  }

  .macro-card {
    background: var(--bg-1);
    border: var(--border-width) solid var(--border);
    border-radius: var(--radius-lg);
    padding: var(--space-5);
  }

  .macro-card.disabled { opacity: 0.5; }

  .mc-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-3); }
  .mc-label { font-size: var(--font-xs); color: var(--text-2); text-transform: uppercase; letter-spacing: 0.04em; font-weight: 500; }
  .mc-pct { font-size: var(--font-sm); font-weight: 500; }

  .mc-value { display: flex; align-items: baseline; gap: var(--space-2); margin-bottom: var(--space-4); }
  .mc-num { font-size: var(--font-3xl); font-weight: 600; letter-spacing: -0.03em; }
  .mc-unit { font-size: var(--font-xs); color: var(--text-2); }

  .nav-row {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: var(--space-3);
  }

  .nav-card {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    padding: var(--space-5);
    background: var(--bg-1);
    border: var(--border-width) solid var(--border);
    border-radius: var(--radius-lg);
    transition: all var(--transition-fast);
  }
  .nav-card:hover { border-color: var(--border-strong); background: var(--bg-2); }

  .nc-label { font-size: var(--font-sm); font-weight: 500; color: var(--text-0); }
  .nc-desc { font-size: var(--font-xs); color: var(--text-2); }

  .gp-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    animation: fadeIn 150ms ease;
  }

  .gp {
    width: 420px;
    background: var(--bg-modal);
    border: var(--border-width) solid var(--border);
    border-radius: var(--radius-xl);
    padding: var(--space-8);
    animation: scaleIn 200ms ease;
  }

  .gp-header { margin-bottom: var(--space-6); }
  .gp-title { font-size: var(--font-xl); font-weight: 600; letter-spacing: -0.025em; }
  .gp-desc { font-size: var(--font-xs); color: var(--text-2); margin-top: var(--space-1); }

  .gp-items { display: flex; flex-direction: column; gap: var(--space-3); }

  .gp-card {
    border: var(--border-width) solid var(--border);
    border-radius: var(--radius-md);
    padding: var(--space-4) var(--space-5);
    transition: opacity var(--transition-fast);
  }

  .gp-card-off { opacity: 0.45; }

  .gp-card-head {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }

  .gp-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
  .gp-name { font-size: var(--font-sm); font-weight: 500; flex: 1; }

  .gp-chip {
    padding: 2px 10px;
    font-size: var(--font-xs);
    font-family: var(--font-sans);
    font-weight: 500;
    border: var(--border-width) solid var(--border);
    border-radius: var(--radius-full);
    background: transparent;
    color: var(--text-2);
    cursor: pointer;
    transition: all var(--transition-fast);
    letter-spacing: 0.01em;
  }
  .gp-chip:hover { border-color: var(--border-strong); color: var(--text-0); }

  .gp-card-body {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    margin-top: var(--space-3);
    padding-top: var(--space-3);
    border-top: var(--border-width) solid var(--border);
  }

  .gp-input {
    flex: 1;
    padding: var(--space-2) var(--space-3);
    background: transparent;
    border: var(--border-width) solid var(--border);
    border-radius: var(--radius-sm);
    color: var(--text-0);
    font-size: var(--font-base);
    text-align: right;
    transition: border-color var(--transition-fast);
  }
  .gp-input:focus { outline: none; border-color: var(--text-2); }

  .gp-unit { font-size: var(--font-sm); color: var(--text-3); min-width: 30px; }

  .gp-foot {
    display: flex;
    justify-content: flex-end;
    gap: var(--space-3);
    margin-top: var(--space-6);
  }

  @media (max-width: 1024px) {
    .macro-row { grid-template-columns: repeat(2, 1fr); }
    .nav-row { grid-template-columns: repeat(2, 1fr); }
  }
  @media (max-width: 640px) {
    .macro-row, .nav-row { grid-template-columns: 1fr; }
    .dash-header { flex-direction: column; align-items: flex-start; gap: var(--space-3); }
    .dash-name { font-size: var(--font-2xl); }
  }
</style>
