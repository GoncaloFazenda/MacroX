<script>
  import { auth } from '$lib/stores/auth.js';
  import { plannerStore } from '$lib/stores/planner.js';
  import { foodStore } from '$lib/stores/foods.js';
  import { mealStore } from '$lib/stores/meals.js';
  import { api } from '$lib/api/client.js';
  import { getPercentage, formatDate, calculateMacros, todayDateString } from '$lib/utils/macros.js';
  import { onMount } from 'svelte';
  import { AlertTriangle, Settings, Check, X, Flame } from 'lucide-svelte';
  import AnimatedNumber from '$lib/components/ui/AnimatedNumber.svelte';

  let today = todayDateString();
  let mounted = $state(false);
  let loadError = $state('');

  // ── Toast ──
  let toast = $state({ visible: false, message: '', type: 'success' });
  let toastTimeout;
  function showToast(message, type = 'success') {
    clearTimeout(toastTimeout);
    toast = { visible: true, message, type };
    toastTimeout = setTimeout(() => (toast = { ...toast, visible: false }), 3000);
  }

  let goals = $derived($auth.user?.goals || { calories: 2000, protein: 150, netCarbs: 100, fat: 65 });
  let totals = $state({ calories: 0, protein: 0, netCarbs: 0, fat: 0 });
  let weekHistory = $state([]);

  let editingGoals = $state(false);
  let goalForm = $state({ calories: 2000, protein: 150, netCarbs: 100, fat: 65 });
  let goalEnabled = $state({ protein: true, netCarbs: true, fat: true });

  // Live calorie sanity check from the macro values currently entered.
  const macroKcal = $derived.by(() => {
    const p = goalEnabled.protein  ? Number(goalForm.protein  || 0) * 4 : 0;
    const c = goalEnabled.netCarbs ? Number(goalForm.netCarbs || 0) * 4 : 0;
    const f = goalEnabled.fat      ? Number(goalForm.fat      || 0) * 9 : 0;
    return { p, c, f, total: p + c + f };
  });
  const macroSplit = $derived.by(() => {
    const t = macroKcal.total;
    if (t === 0) return { p: 0, c: 0, f: 0 };
    return {
      p: Math.round(macroKcal.p / t * 100),
      c: Math.round(macroKcal.c / t * 100),
      f: Math.round(macroKcal.f / t * 100),
    };
  });
  const calDelta = $derived(Number(goalForm.calories || 0) - macroKcal.total);

  const macros = $derived([
    { key: 'calories', label: 'Calories', value: totals.calories, goal: goals.calories, unit: 'kcal', color: 'var(--cal)', bg: 'var(--cal-bg)', enabled: true, integer: true },
    { key: 'protein', label: 'Protein', value: totals.protein, goal: goals.protein, unit: 'g', color: 'var(--pro)', bg: 'var(--pro-bg)', enabled: goals.protein != null, integer: false },
    { key: 'netCarbs', label: 'Net Carbs', value: totals.netCarbs, goal: goals.netCarbs, unit: 'g', color: 'var(--carb)', bg: 'var(--carb-bg)', enabled: goals.netCarbs != null, integer: false },
    { key: 'fat', label: 'Fat', value: totals.fat, goal: goals.fat, unit: 'g', color: 'var(--fat)', bg: 'var(--fat-bg)', enabled: goals.fat != null, integer: false },
  ]);

  const trendMacros = $derived(macros.filter((m) => m.enabled && m.goal > 0));

  function dayTotals(plan, foodMap, mealMap) {
    if (!plan?.meals) return { calories: 0, protein: 0, netCarbs: 0, fat: 0 };
    const items = plan.meals.flatMap((slot) => slot.items || []);
    return calculateMacros(items, foodMap, mealMap);
  }

  function formatDiff(diff, integer) {
    const abs = Math.abs(diff);
    return integer ? Math.round(abs) : Math.round(abs * 10) / 10;
  }

  function dayLetter(date) {
    return ['S', 'M', 'T', 'W', 'T', 'F', 'S'][date.getDay()];
  }

  function averagePercent(history, key, goal) {
    const tracked = history.filter((d) => d.hasData);
    if (!tracked.length || !goal) return 0;
    const sum = tracked.reduce((acc, d) => acc + d.totals[key], 0);
    return Math.round((sum / tracked.length / goal) * 100);
  }

  async function loadOverview() {
    const start = new Date();
    start.setDate(start.getDate() - 6);
    const startStr = formatDate(start);

    await Promise.all([
      plannerStore.loadDaily(today),
      foodStore.load({ limit: 100 }),
      mealStore.load(),
    ]);

    const rangeRes = await api.get(`/daily-plans/range?start=${startStr}&end=${today}`).catch(() => ({ plans: [] }));
    const foodMap = new Map(($foodStore?.foods || []).map((food) => [food._id, food]));
    const mealMap = new Map(($mealStore?.meals || []).map((meal) => [meal._id, meal]));

    totals = dayTotals($plannerStore?.dailyPlan, foodMap, mealMap);

    const plansByDate = new Map((rangeRes?.plans || []).map((plan) => [formatDate(new Date(plan.date)), plan]));
    const history = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const key = formatDate(date);
      const plan = plansByDate.get(key);
      const hasData = !!plan?.meals?.some((meal) => meal.items?.length);
      history.push({
        date: key,
        letter: dayLetter(date),
        isToday: i === 0,
        hasData,
        totals: hasData ? dayTotals(plan, foodMap, mealMap) : { calories: 0, protein: 0, netCarbs: 0, fat: 0 },
      });
    }

    weekHistory = history;
    setTimeout(() => {
      mounted = true;
    }, 50);
  }

  onMount(async () => {
    try {
      await loadOverview();
    } catch (err) {
      loadError = err?.message || 'Overview failed to load.';
      console.error('Overview load failed', err);
    }
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
      showToast('Goals updated');
    } catch (err) {
      showToast(err.message, 'error');
    }
  }
</script>

<svelte:head><title>Overview - MacroX</title></svelte:head>

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

  {#if loadError}
    <div class="overview-error">
      <AlertTriangle size={16} strokeWidth={1.8} />
      <div>
        <div class="overview-error-title">Overview failed to load</div>
        <div class="overview-error-body">{loadError}</div>
      </div>
    </div>
  {:else}
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
            <span class="mc-num mono">
              <AnimatedNumber value={macro.value} decimals={macro.integer ? 0 : 1} duration={900} />
            </span>
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
            {@const diff = macro.goal - macro.value}
            <div class="mc-remaining mono" class:mc-over={diff < 0} style={diff < 0 ? `color: ${macro.color}` : ''}>
              {#if diff < 0}
                +{formatDiff(diff, macro.integer)} {macro.unit} over
              {:else}
                {formatDiff(diff, macro.integer)} {macro.unit} left
              {/if}
            </div>
          {/if}
        </div>
      {/each}
    </div>

    {#if trendMacros.length > 0}
      <div class="trend-section animate-slide-up stagger-5">
        <div class="section-head">
          <span class="section-label">Last 7 Days</span>
        </div>
        <div class="trend-row">
          {#each trendMacros as macro}
            <div class="trend-card">
              <div class="tc-head">
                <span class="tc-label">{macro.label}</span>
                <span class="tc-avg mono" style="color: {macro.color}">
                  {averagePercent(weekHistory, macro.key, macro.goal)}% avg
                </span>
              </div>
              <div class="tc-bars">
                {#each weekHistory as day}
                  {@const raw = macro.goal ? (day.totals[macro.key] / macro.goal) * 100 : 0}
                  {@const pct = Math.min(100, raw)}
                  {@const dayValue = macro.integer ? Math.round(day.totals[macro.key]) : Math.round(day.totals[macro.key] * 10) / 10}
                  <div class="tc-bar-col" class:tc-today={day.isToday}>
                    <div class="tc-bar-track" title={day.hasData ? `${dayValue} ${macro.unit} - ${Math.round(raw)}%` : 'No data'}>
                      {#if day.hasData}
                        <div
                          class="tc-bar-fill"
                          class:tc-bar-over={raw > 100}
                          style="height: {mounted ? pct : 0}%; background: {macro.color}"
                        ></div>
                        <span class="tc-tip" style="color: {macro.color}">{dayValue}<span class="tc-tip-pct">{Math.round(raw)}%</span></span>
                      {/if}
                    </div>
                    <span class="tc-day" class:tc-day-today={day.isToday}>{day.letter}</span>
                  </div>
                {/each}
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <div class="nav-row animate-slide-up stagger-6">
      <a href="/day" class="nav-card">
        <span class="nc-label">My Day</span>
        <span class="nc-desc">Plan today's meals</span>
      </a>
      <a href="/library/foods-meals" class="nav-card">
        <span class="nc-label">Foods & Meals</span>
        <span class="nc-desc">{$foodStore.pagination?.total || 0} foods</span>
      </a>
      <a href="/library/templates" class="nav-card">
        <span class="nc-label">Templates</span>
        <span class="nc-desc">Saved day plans</span>
      </a>
      <a href="/week" class="nav-card">
        <span class="nc-label">My Week</span>
        <span class="nc-desc">Plan your week</span>
      </a>
    </div>
  {/if}
</div>

{#if editingGoals}
  <!-- svelte-ignore a11y_no_static_element_interactions a11y_click_events_have_key_events -->
  <div class="modal-overlay" onclick={() => editingGoals = false}>
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions a11y_click_events_have_key_events -->
    <form class="modal-content gm" onclick={(e) => e.stopPropagation()} onsubmit={saveGoals}>
      <span class="gm-side-bar" aria-hidden="true"></span>

      <div class="gm-content">
        <button type="button" class="gm-close" aria-label="Close" onclick={() => editingGoals = false}>
          <X size={14} strokeWidth={1.75} />
        </button>

        <header class="gm-head">
          <span class="gm-eyebrow">Daily Goals</span>
          <p class="gm-sub">Targets used to scale progress across Overview, Day, and Week.</p>
        </header>

        <!-- Calorie hero — like the Week Summary card -->
        <div class="gm-cal-hero">
          <div class="gm-cal-row">
            <input
              type="number"
              class="gm-cal-input mono"
              bind:value={goalForm.calories}
              min="0"
              aria-label="Daily calorie target"
            />
            <span class="gm-cal-unit">kcal</span>
          </div>
          {#if macroKcal.total > 0}
            <div class="gm-cal-hint">
              Macros total <span class="mono">{macroKcal.total.toLocaleString()}</span> kcal
              {#if calDelta > 0}
                <span class="gm-delta">· <span class="mono">+{calDelta}</span> buffer</span>
              {:else if calDelta < 0}
                <span class="gm-delta gm-delta-over">· <span class="mono">{calDelta}</span> over</span>
              {:else}
                <span class="gm-delta gm-delta-match">· matches</span>
              {/if}
            </div>
          {:else}
            <div class="gm-cal-hint">Set a daily calorie target</div>
          {/if}
        </div>

        <span class="gm-section-label">Macros</span>

        <div class="gm-macros">
          {#each [
            { key: 'protein',  label: 'Protein',   color: 'var(--pro)',  pct: macroSplit.p },
            { key: 'netCarbs', label: 'Carbs',     color: 'var(--carb)', pct: macroSplit.c },
            { key: 'fat',      label: 'Fat',       color: 'var(--fat)',  pct: macroSplit.f },
          ] as m}
            <div class="gm-macro" class:gm-macro-off={!goalEnabled[m.key]} style="--mc: {m.color}">
              <div class="gm-macro-row">
                <span class="gm-name">{m.label}</span>

                {#if goalEnabled[m.key]}
                  <span class="gm-pct mono">{m.pct}%</span>
                  <div class="gm-input-wrap">
                    <input type="number" class="gm-input mono" bind:value={goalForm[m.key]} min="0" />
                    <span class="gm-unit">g</span>
                  </div>
                {:else}
                  <span class="gm-off-label">Off</span>
                {/if}

                <button
                  type="button"
                  role="switch"
                  aria-checked={goalEnabled[m.key]}
                  aria-label="{goalEnabled[m.key] ? 'Disable' : 'Enable'} {m.label} tracking"
                  class="gm-switch"
                  class:gm-switch-on={goalEnabled[m.key]}
                  onclick={() => (goalEnabled[m.key] = !goalEnabled[m.key])}
                >
                  <span class="gm-switch-knob"></span>
                </button>
              </div>

              <div class="gm-bar-wrap">
                <div class="gm-bar"><div class="gm-bar-fill" style="width: {goalEnabled[m.key] ? m.pct : 0}%"></div></div>
              </div>
            </div>
          {/each}
        </div>

        <footer class="gm-foot">
          <button type="button" class="btn btn-ghost" onclick={() => editingGoals = false}>Cancel</button>
          <button type="submit" class="btn btn-primary">Save goals</button>
        </footer>
      </div>
    </form>
  </div>
{/if}

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
  .dash-header { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: var(--space-8); }
  .dash-date { font-size: var(--font-xs); color: var(--text-2); text-transform: uppercase; letter-spacing: 0.04em; }
  .dash-name { font-size: var(--font-3xl); font-weight: 600; letter-spacing: -0.03em; margin-top: var(--space-1); }
  .overview-error {
    display: flex;
    align-items: flex-start;
    gap: var(--space-3);
    padding: var(--space-4) var(--space-5);
    border: var(--border-width) solid color-mix(in srgb, var(--danger) 24%, transparent);
    border-radius: var(--radius-lg);
    background: var(--danger-bg);
    color: var(--text-1);
  }
  .overview-error-title { font-size: var(--font-sm); font-weight: 600; color: var(--text-0); }
  .overview-error-body { margin-top: 4px; font-size: var(--font-sm); color: var(--text-2); }
  .macro-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--space-4); margin-bottom: var(--space-8); }
  .macro-card { background: var(--bg-1); border: var(--border-width) solid var(--border); border-radius: var(--radius-lg); padding: var(--space-5); }
  .macro-card.disabled { opacity: 0.5; }
  .mc-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-3); }
  .mc-label { font-size: var(--font-xs); color: var(--text-2); text-transform: uppercase; letter-spacing: 0.04em; font-weight: 500; }
  .mc-pct { font-size: var(--font-sm); font-weight: 500; }
  .mc-value { display: flex; align-items: baseline; gap: var(--space-2); margin-bottom: var(--space-4); }
  .mc-num { font-size: var(--font-3xl); font-weight: 600; letter-spacing: -0.03em; }
  .mc-unit { font-size: var(--font-xs); color: var(--text-2); }
  .mc-remaining { font-size: var(--font-xs); color: var(--text-3); margin-top: var(--space-3); letter-spacing: -0.01em; }
  .mc-remaining.mc-over { font-weight: 500; }
  .trend-section { margin-bottom: var(--space-8); }
  .section-head { margin-bottom: var(--space-4); }
  .section-label { font-size: var(--font-xs); color: var(--text-2); text-transform: uppercase; letter-spacing: 0.04em; font-weight: 500; }
  .trend-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--space-4); }
  .trend-card { background: var(--bg-1); border: var(--border-width) solid var(--border); border-radius: var(--radius-lg); padding: var(--space-5); }
  .tc-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-4); }
  .tc-label { font-size: var(--font-xs); color: var(--text-2); text-transform: uppercase; letter-spacing: 0.04em; font-weight: 500; }
  .tc-avg { font-size: var(--font-sm); font-weight: 500; }
  .tc-bars { display: grid; grid-template-columns: repeat(7, 1fr); gap: var(--space-2); align-items: end; }
  .tc-bar-col { display: flex; flex-direction: column; align-items: center; gap: var(--space-2); }
  .tc-bar-track { position: relative; width: 100%; height: 48px; background: var(--bg-3); border-radius: var(--radius-sm); display: flex; align-items: flex-end; overflow: visible; cursor: default; transition: transform var(--transition-fast); }
  .tc-bar-track:hover { transform: scaleY(1.04); }
  .tc-bar-fill { width: 100%; border-radius: var(--radius-sm); transition: height 900ms cubic-bezier(0.4, 0, 0.2, 1), filter var(--transition-fast); }
  .tc-bar-track:hover .tc-bar-fill { filter: brightness(1.18); }
  .tc-bar-fill.tc-bar-over { box-shadow: inset 0 2px 0 0 var(--text-0); }
  .tc-tip { position: absolute; bottom: calc(100% + 6px); left: 50%; transform: translateX(-50%) translateY(4px); display: inline-flex; align-items: baseline; gap: 4px; padding: 3px 7px; border-radius: var(--radius-sm); background: var(--bg-modal); border: var(--border-width) solid var(--border); font-family: var(--font-mono); font-size: 10px; font-weight: 600; letter-spacing: -0.02em; white-space: nowrap; opacity: 0; pointer-events: none; transition: opacity 140ms ease, transform 140ms ease; z-index: 5; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.18); }
  .tc-tip-pct { font-size: 9px; color: var(--text-3); font-weight: 500; }
  .tc-bar-track:hover .tc-tip { opacity: 1; transform: translateX(-50%) translateY(0); }
  .tc-day { font-size: 10px; color: var(--text-3); letter-spacing: 0.04em; font-family: var(--font-mono); }
  .tc-day-today { color: var(--text-0); font-weight: 600; }
  .nav-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--space-3); }
  .nav-card { display: flex; flex-direction: column; gap: var(--space-1); padding: var(--space-5); background: var(--bg-1); border: var(--border-width) solid var(--border); border-radius: var(--radius-lg); transition: all var(--transition-fast); }
  .nav-card:hover { border-color: var(--border-strong); background: var(--bg-2); }
  .nc-label { font-size: var(--font-sm); font-weight: 500; color: var(--text-0); }
  .nc-desc { font-size: var(--font-xs); color: var(--text-2); }
  /* ── Goals modal — My Week vibe ── */
  .gm {
    max-width: 480px;
    padding: 0;
    display: flex;
    flex-direction: row;
    align-items: stretch;
    overflow: hidden;
  }
  .gm-side-bar {
    width: 3px;
    background: linear-gradient(180deg, var(--cal), transparent);
    flex-shrink: 0;
  }
  .gm-content {
    position: relative;
    flex: 1;
    min-width: 0;
    padding: var(--space-5) var(--space-5) var(--space-4) var(--space-5);
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .gm-close {
    position: absolute;
    top: 12px;
    right: 12px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    padding: 0;
    background: transparent;
    border: none;
    color: var(--text-3);
    border-radius: var(--radius-sm);
    cursor: pointer;
    transition: color var(--transition-fast), background var(--transition-fast);
  }
  .gm-close:hover { color: var(--text-0); background: var(--bg-hover); }

  .gm-head { display: flex; flex-direction: column; gap: 4px; padding-right: 32px; }
  .gm-eyebrow {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--text-3);
  }
  .gm-sub {
    margin: 0;
    font-size: var(--font-xs);
    color: var(--text-2);
    line-height: 1.55;
  }

  /* Calorie hero — mirrors the Week Summary card hero */
  .gm-cal-hero {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding: var(--space-4) var(--space-3);
    background: var(--bg-hover);
    border-radius: var(--radius-md);
  }
  .gm-cal-row {
    display: flex;
    align-items: baseline;
    justify-content: center;
    gap: 8px;
  }
  .gm-cal-input {
    width: 140px;
    background: transparent;
    border: none;
    border-bottom: 1.5px solid var(--border-strong);
    color: var(--text-0);
    font-size: var(--font-2xl);
    font-weight: 700;
    letter-spacing: -0.04em;
    text-align: center;
    padding: 4px 0;
    outline: none;
    transition: border-color var(--transition-fast);
    text-shadow: 0 0 18px rgba(212, 165, 116, 0.18);
  }
  .gm-cal-input:focus {
    border-bottom-color: var(--cal);
  }
  .gm-cal-input::-webkit-outer-spin-button,
  .gm-cal-input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
  .gm-cal-input { -moz-appearance: textfield; appearance: textfield; }
  .gm-cal-unit {
    font-size: 11px;
    color: var(--text-3);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    font-weight: 500;
  }
  .gm-cal-hint {
    font-size: 11px;
    color: var(--text-3);
    letter-spacing: 0.005em;
  }
  .gm-cal-hint .mono { color: var(--text-2); font-weight: 500; }
  .gm-delta { color: var(--text-2); margin-left: 2px; }
  .gm-delta-over { color: var(--danger); }
  .gm-delta-match { color: var(--carb); }

  /* Section label */
  .gm-section-label {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--text-3);
    margin-top: 2px;
  }

  /* Macro cards — floating, with glowing progress bar */
  .gm-macros { display: flex; flex-direction: column; gap: 8px; }
  .gm-macro {
    background: var(--bg-1);
    border-radius: var(--radius-md);
    padding: 10px var(--space-3);
    display: flex;
    flex-direction: column;
    gap: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.18), 0 1px 2px rgba(0, 0, 0, 0.08);
    transition: opacity var(--transition-fast), box-shadow var(--transition-fast);
  }
  .gm-macro:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.22), 0 2px 4px rgba(0, 0, 0, 0.12);
  }
  .gm-macro-off { opacity: 0.55; }
  .gm-macro-row {
    display: flex;
    align-items: baseline;
    gap: 10px;
  }
  .gm-name {
    font-size: var(--font-sm);
    font-weight: 600;
    color: var(--text-0);
    letter-spacing: -0.015em;
    flex: 1;
    min-width: 0;
  }
  .gm-pct {
    font-size: 10px;
    font-weight: 600;
    color: var(--text-3);
    letter-spacing: 0.04em;
  }
  .gm-input-wrap {
    display: inline-flex;
    align-items: baseline;
    gap: 4px;
  }
  .gm-input {
    width: 64px;
    padding: 4px 8px;
    background: transparent;
    border: var(--border-width) solid var(--border);
    border-radius: var(--radius-sm);
    color: var(--mc);
    font-size: var(--font-sm);
    font-weight: 600;
    text-align: right;
    font-family: var(--font-mono);
    transition: border-color var(--transition-fast), background var(--transition-fast);
  }
  .gm-input:focus {
    outline: none;
    border-color: var(--mc);
    background: var(--bg-active);
  }
  .gm-input::-webkit-outer-spin-button,
  .gm-input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
  .gm-input { -moz-appearance: textfield; appearance: textfield; }
  .gm-unit {
    font-size: 10px;
    color: var(--text-3);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .gm-off-label {
    flex: 1;
    text-align: right;
    font-size: var(--font-xs);
    color: var(--text-3);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    font-weight: 500;
  }

  /* Glowing macro bar — matches the Week Summary card bars */
  .gm-bar-wrap { width: 100%; }
  .gm-bar {
    width: 100%;
    height: 4px;
    background: var(--bg-hover);
    border-radius: var(--radius-full);
    overflow: hidden;
  }
  .gm-bar-fill {
    height: 100%;
    border-radius: var(--radius-full);
    background: var(--mc);
    opacity: 0.92;
    box-shadow:
      0 0 4px color-mix(in srgb, var(--mc) 50%, transparent),
      0 0 8px color-mix(in srgb, var(--mc) 22%, transparent);
    transition: width 600ms cubic-bezier(0.4, 0, 0.2, 1);
    animation: gmBarPulse 3.6s ease-in-out infinite;
    min-width: 0;
  }
  @keyframes gmBarPulse {
    0%, 100% {
      box-shadow:
        0 0 3px color-mix(in srgb, var(--mc) 40%, transparent),
        0 0 6px color-mix(in srgb, var(--mc) 18%, transparent);
    }
    50% {
      box-shadow:
        0 0 5px color-mix(in srgb, var(--mc) 55%, transparent),
        0 0 10px color-mix(in srgb, var(--mc) 28%, transparent);
    }
  }

  /* Switch — matches the previous design but a touch larger to feel deliberate */
  .gm-switch {
    position: relative;
    display: inline-flex;
    width: 30px;
    height: 17px;
    padding: 0;
    background: var(--bg-active);
    border: 1px solid var(--border);
    border-radius: var(--radius-full);
    cursor: pointer;
    transition: background var(--transition-fast), border-color var(--transition-fast);
    flex-shrink: 0;
  }
  .gm-switch-knob {
    position: absolute;
    top: 1px;
    left: 1px;
    width: 13px;
    height: 13px;
    background: var(--text-3);
    border-radius: 50%;
    transition: left var(--transition-fast), background var(--transition-fast);
  }
  .gm-switch-on {
    background: var(--text-0);
    border-color: var(--text-0);
  }
  .gm-switch-on .gm-switch-knob {
    left: 14px;
    background: var(--bg-0);
  }

  /* Footer */
  .gm-foot {
    display: flex;
    justify-content: flex-end;
    gap: var(--space-2);
    margin-top: var(--space-2);
  }

  @media (max-width: 640px) {
    .gm-foot { flex-direction: column-reverse; }
    .gm-foot :global(.btn) { width: 100%; }
  }
  @media (max-width: 1024px) { .macro-row, .trend-row { grid-template-columns: repeat(2, 1fr); } .nav-row { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 640px) { .macro-row, .trend-row, .nav-row { grid-template-columns: 1fr; } .dash-header { flex-direction: column; align-items: flex-start; gap: var(--space-3); } .dash-name { font-size: var(--font-2xl); } }
</style>
