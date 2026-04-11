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

  const macros = $derived([
    { key: 'calories', label: 'Calories', value: totals.calories, goal: goals.calories, unit: 'kcal', color: 'var(--cal)', bg: 'var(--cal-bg)' },
    { key: 'protein', label: 'Protein', value: totals.protein, goal: goals.protein, unit: 'g', color: 'var(--pro)', bg: 'var(--pro-bg)' },
    { key: 'netCarbs', label: 'Net Carbs', value: totals.netCarbs, goal: goals.netCarbs, unit: 'g', color: 'var(--carb)', bg: 'var(--carb-bg)' },
    { key: 'fat', label: 'Fat', value: totals.fat, goal: goals.fat, unit: 'g', color: 'var(--fat)', bg: 'var(--fat-bg)' },
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

  function openGoalEditor() { goalForm = { ...goals }; editingGoals = true; }

  async function saveGoals(e) {
    e.preventDefault();
    await auth.updateGoals(goalForm);
    editingGoals = false;
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
      <div class="macro-card animate-slide-up stagger-{i + 1}">
        <div class="mc-top">
          <span class="mc-label">{macro.label}</span>
          <span class="mc-pct mono" style="color: {macro.color}">{getPercentage(macro.value, macro.goal)}%</span>
        </div>

        <div class="mc-value">
          <span class="mc-num mono">{macro.value}</span>
          <span class="mc-unit">/ {macro.goal} {macro.unit}</span>
        </div>

        <div class="progress-track">
          <div class="progress-fill" style="width: {mounted ? getPercentage(macro.value, macro.goal) : 0}%; background: {macro.color}"></div>
        </div>
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
  <div class="modal-overlay" onclick={() => editingGoals = false}>
    <div class="modal-content" onclick={(e) => e.stopPropagation()}>
      <h2 style="font-size: var(--font-lg); font-weight: 600; margin-bottom: var(--space-5);">Daily Goals</h2>
      <form onsubmit={saveGoals} style="display: flex; flex-direction: column; gap: var(--space-3);">
        <div class="field"><label class="label" for="g-cal">Calories (kcal)</label><input id="g-cal" type="number" class="input" bind:value={goalForm.calories} min="0" /></div>
        <div class="field"><label class="label" for="g-pro">Protein (g)</label><input id="g-pro" type="number" class="input" bind:value={goalForm.protein} min="0" /></div>
        <div class="field"><label class="label" for="g-carb">Net Carbs (g)</label><input id="g-carb" type="number" class="input" bind:value={goalForm.netCarbs} min="0" /></div>
        <div class="field"><label class="label" for="g-fat">Fat (g)</label><input id="g-fat" type="number" class="input" bind:value={goalForm.fat} min="0" /></div>
        <div style="display: flex; gap: var(--space-3); margin-top: var(--space-2);">
          <button type="button" class="btn btn-secondary" style="flex:1" onclick={() => editingGoals = false}>Cancel</button>
          <button type="submit" class="btn btn-primary" style="flex:1">Save</button>
        </div>
      </form>
    </div>
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
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: var(--space-5);
  }

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
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    transition: all var(--transition-fast);
  }
  .nav-card:hover { border-color: var(--border-strong); background: var(--bg-2); }

  .nc-label { font-size: var(--font-sm); font-weight: 500; color: var(--text-0); }
  .nc-desc { font-size: var(--font-xs); color: var(--text-2); }

  .field { display: flex; flex-direction: column; }

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
