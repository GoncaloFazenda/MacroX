<script>
  import { foodStore } from '$lib/stores/foods.js';
  import { mealStore } from '$lib/stores/meals.js';
  import { plannerStore } from '$lib/stores/planner.js';
  import { onMount } from 'svelte';
  import { getWeekStart, getDayShortNames, formatDate } from '$lib/utils/macros.js';
  import { ChevronLeft, ChevronRight, X } from 'lucide-svelte';
  import { dndzone } from 'svelte-dnd-action';
  import { flip } from 'svelte/animate';

  const flipDurationMs = 150;
  let weekStart = $state(getWeekStart());
  let saving = $state(false);
  let saved = $state(false);
  let search = $state('');
  let nextId = 1;

  let days = $state(Array.from({ length: 7 }, (_, i) => ({ dayOfWeek: i, items: [] })));
  const dayNames = getDayShortNames();

  onMount(async () => {
    await Promise.all([foodStore.load({ limit: 100 }), mealStore.load()]);
    await loadPlan();
  });

  async function loadPlan() {
    await plannerStore.loadWeekly(weekStart);
    const plan = $plannerStore.weeklyPlan;
    if (plan?.days) {
      days = Array.from({ length: 7 }, (_, i) => {
        const dayData = plan.days.find(d => d.dayOfWeek === i);
        if (!dayData) return { dayOfWeek: i, items: [] };
        const items = [];
        for (const meal of dayData.meals || []) {
          for (const item of meal.items) {
            items.push({ id: nextId++, type: item.type, refId: item.refId, quantity: item.quantity, name: getName(item), cal: getCal(item) });
          }
        }
        return { dayOfWeek: i, items };
      });
    } else {
      days = Array.from({ length: 7 }, (_, i) => ({ dayOfWeek: i, items: [] }));
    }
  }

  function getName(item) {
    if (item.type === 'food') return $foodStore.foods.find(f => f._id === item.refId)?.name || '?';
    return $mealStore.meals.find(m => m._id === item.refId)?.name || '?';
  }
  function getCal(item) {
    const mult = item.quantity / 100;
    if (item.type === 'food') { const f = $foodStore.foods.find(f => f._id === item.refId); return Math.round((f?.calories || 0) * mult); }
    const m = $mealStore.meals.find(m => m._id === item.refId); return Math.round((m?.totalMacros?.calories || 0) * mult);
  }

  const filteredFoods = $derived($foodStore.foods.filter(f => f.name.toLowerCase().includes(search.toLowerCase())).slice(0, 15));

  function addFoodToDay(di, food) {
    days[di].items = [...days[di].items, { id: nextId++, type: 'food', refId: food._id, quantity: 100, name: food.name, cal: food.calories }];
    days = [...days];
  }

  function handleConsider(di, e) { days[di].items = e.detail.items; days = [...days]; }
  function handleFinalize(di, e) { days[di].items = e.detail.items; days = [...days]; }
  function removeItem(di, id) { days[di].items = days[di].items.filter(i => i.id !== id); days = [...days]; }

  function dayTotal(items) { return items.reduce((s, i) => s + (i.cal || 0), 0); }

  async function savePlan() {
    saving = true;
    saved = false;
    try {
      const planDays = days.map(day => ({
        dayOfWeek: day.dayOfWeek,
        meals: [{ slot: 'lunch', items: day.items.map(i => ({ type: i.type, refId: i.refId, quantity: i.quantity })) }],
      }));
      await plannerStore.saveWeekly(weekStart, planDays);
      saved = true;
      setTimeout(() => saved = false, 2000);
    } catch (err) {
      alert('Save failed: ' + err.message);
    }
    saving = false;
  }

  function prevWeek() { const d = new Date(weekStart); d.setDate(d.getDate() - 7); weekStart = formatDate(d); loadPlan(); }
  function nextWeek() { const d = new Date(weekStart); d.setDate(d.getDate() + 7); weekStart = formatDate(d); loadPlan(); }
  function getDateNum(i) { const d = new Date(weekStart); d.setDate(d.getDate() + i); return d.getDate(); }
</script>

<svelte:head><title>Weekly Planner — MacroX</title></svelte:head>

<div class="page-container">
  <div class="top-bar animate-slide-up">
    <div>
      <h1 class="page-title">Weekly Planner</h1>
      <p class="page-subtitle">Plan your week</p>
    </div>
    <div style="display: flex; gap: var(--space-2); align-items: center;">
      {#if saved}<span style="font-size: var(--font-xs); color: var(--success);">Saved</span>{/if}
      <button class="btn btn-primary" onclick={savePlan} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
    </div>
  </div>

  <div class="week-nav animate-slide-up stagger-1">
    <button class="btn btn-ghost btn-sm" onclick={prevWeek}><ChevronLeft size={14} /></button>
    <span class="week-label">Week of {new Date(weekStart + 'T00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
    <button class="btn btn-ghost btn-sm" onclick={nextWeek}><ChevronRight size={14} /></button>
  </div>

  <!-- Quick search -->
  <div class="search-row animate-slide-up stagger-2">
    <input type="text" class="input" style="max-width: 320px;" placeholder="Search foods to add…" bind:value={search} />
    {#if search.length > 0}
      <div class="search-dropdown">
        {#each filteredFoods as food}
          <div class="sd-item">
            <span class="sd-name">{food.name}</span>
            <span class="sd-cal mono">{food.calories}</span>
            <div class="sd-days">
              {#each dayNames as dn, i}
                <button class="sd-btn" onclick={() => addFoodToDay(i, food)}>{dn[0]}</button>
              {/each}
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>

  <div class="week-grid animate-slide-up stagger-3">
    {#each days as day, i}
      <div class="day-col">
        <div class="day-head">
          <span class="day-name">{dayNames[i]}</span>
          <span class="day-num">{getDateNum(i)}</span>
        </div>
        <div class="day-kcal mono">{dayTotal(day.items)}</div>
        <div
          class="day-zone"
          use:dndzone={{ items: day.items, flipDurationMs, dropTargetClasses: ['dnd-drop-target'] }}
          onconsider={(e) => handleConsider(i, e)}
          onfinalize={(e) => handleFinalize(i, e)}
        >
          {#each day.items as item (item.id)}
            <div class="day-item" animate:flip={{ duration: flipDurationMs }}>
              <span class="di-name">{item.name}</span>
              <button class="di-rm" onclick={() => removeItem(i, item.id)}><X size={10} strokeWidth={1.5} /></button>
            </div>
          {/each}
        </div>
        {#if day.items.length === 0}<p class="day-ph">—</p>{/if}
      </div>
    {/each}
  </div>
</div>

<style>
  .top-bar { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--space-4); }
  .week-nav { display: flex; align-items: center; gap: var(--space-3); margin-bottom: var(--space-4); }
  .week-label { font-size: var(--font-sm); font-weight: 500; min-width: 140px; text-align: center; }

  .search-row { position: relative; margin-bottom: var(--space-5); }
  .search-dropdown {
    position: absolute; top: 100%; left: 0; max-width: 320px; width: 100%; margin-top: var(--space-1);
    background: var(--bg-2); border: 1px solid var(--border); border-radius: var(--radius-md);
    box-shadow: 0 4px 16px rgba(0,0,0,0.2); z-index: 10; max-height: 250px; overflow-y: auto;
  }
  .sd-item { display: flex; align-items: center; gap: var(--space-2); padding: 4px 8px; border-bottom: 1px solid var(--border); }
  .sd-item:last-child { border-bottom: none; }
  .sd-item:hover { background: var(--bg-hover); }
  .sd-name { flex: 1; font-size: var(--font-sm); }
  .sd-cal { font-size: var(--font-xs); color: var(--text-3); }
  .sd-days { display: flex; gap: 1px; }
  .sd-btn {
    width: 18px; height: 18px; border: none; background: transparent; color: var(--text-3);
    cursor: pointer; font-size: var(--font-xs); font-family: var(--font-sans); font-weight: 600;
    border-radius: 3px; display: flex; align-items: center; justify-content: center;
  }
  .sd-btn:hover { background: var(--bg-3); color: var(--text-0); }

  .week-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: var(--space-2); }

  .day-col {
    background: var(--bg-1); border: 1px solid var(--border); border-radius: var(--radius-lg);
    padding: var(--space-3); min-height: 280px;
  }
  .day-col:hover { border-color: var(--border-strong); }

  .day-head { display: flex; justify-content: space-between; margin-bottom: var(--space-1); }
  .day-name { font-size: var(--font-xs); font-weight: 500; }
  .day-num { font-size: var(--font-xs); color: var(--text-3); }
  .day-kcal { font-size: var(--font-xs); color: var(--text-2); margin-bottom: var(--space-2); }

  .day-zone { display: flex; flex-direction: column; gap: 2px; min-height: 40px; }

  .day-item {
    padding: 3px 5px; background: var(--bg-2); border-radius: 3px;
    font-size: var(--font-xs); cursor: grab; display: flex; align-items: center; gap: var(--space-1);
  }
  .day-item:hover { background: var(--bg-3); }
  .di-name { flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .di-rm { background: none; border: none; color: var(--text-3); cursor: pointer; display: flex; padding: 0; opacity: 0; }
  .day-item:hover .di-rm { opacity: 1; }
  .di-rm:hover { color: var(--danger); }

  .day-ph { text-align: center; font-size: var(--font-xs); color: var(--text-3); padding: var(--space-4); }

  @media (max-width: 1024px) { .week-grid { grid-template-columns: repeat(4, 1fr); } }
  @media (max-width: 640px) { .week-grid { grid-template-columns: repeat(2, 1fr); } }
</style>
