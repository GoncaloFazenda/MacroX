<script>
  import { foodStore } from '$lib/stores/foods.js';
  import { mealStore } from '$lib/stores/meals.js';
  import { plannerStore } from '$lib/stores/planner.js';
  import { onMount } from 'svelte';
  import { formatDate } from '$lib/utils/macros.js';
  import { ChevronLeft, ChevronRight, X } from 'lucide-svelte';
  import { dndzone } from 'svelte-dnd-action';
  import { flip } from 'svelte/animate';

  const flipDurationMs = 150;
  let currentDate = $state(formatDate(new Date()));
  let search = $state('');
  let saving = $state(false);
  let saved = $state(false);
  let nextId = 1;

  let slots = $state({ breakfast: [], lunch: [], dinner: [], snack: [] });

  const slotMeta = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snack: 'Snack' };

  onMount(async () => {
    await Promise.all([foodStore.load({ limit: 100 }), mealStore.load()]);
    await loadPlan();
  });

  async function loadPlan() {
    await plannerStore.loadDaily(currentDate);
    const plan = $plannerStore.dailyPlan;
    if (plan?.meals) {
      const newSlots = { breakfast: [], lunch: [], dinner: [], snack: [] };
      for (const meal of plan.meals) {
        if (newSlots[meal.slot]) {
          newSlots[meal.slot] = meal.items.map((item) => ({
            id: nextId++, type: item.type, refId: item.refId, quantity: item.quantity,
            name: getName(item), cal: getCal(item),
          }));
        }
      }
      slots = newSlots;
    } else {
      slots = { breakfast: [], lunch: [], dinner: [], snack: [] };
    }
  }

  function getName(item) {
    if (item.type === 'food') return $foodStore.foods.find(f => f._id === item.refId)?.name || 'Unknown';
    return $mealStore.meals.find(m => m._id === item.refId)?.name || 'Unknown';
  }

  function getCal(item) {
    const mult = item.quantity / 100;
    if (item.type === 'food') { const f = $foodStore.foods.find(f => f._id === item.refId); return Math.round((f?.calories || 0) * mult); }
    const m = $mealStore.meals.find(m => m._id === item.refId); return Math.round((m?.totalMacros?.calories || 0) * mult);
  }

  const filteredFoods = $derived($foodStore.foods.filter(f => f.name.toLowerCase().includes(search.toLowerCase())));

  function addFood(slot, food) {
    slots[slot] = [...slots[slot], { id: nextId++, type: 'food', refId: food._id, quantity: 100, name: food.name, cal: food.calories }];
    slots = { ...slots };
  }

  function addMeal(slot, meal) {
    slots[slot] = [...slots[slot], { id: nextId++, type: 'compositeMeal', refId: meal._id, quantity: 100, name: meal.name, cal: Math.round(meal.totalMacros?.calories || 0) }];
    slots = { ...slots };
  }

  function handleConsider(slot, e) { slots[slot] = e.detail.items; slots = { ...slots }; }
  function handleFinalize(slot, e) { slots[slot] = e.detail.items; slots = { ...slots }; }
  function removeItem(slot, id) { slots[slot] = slots[slot].filter(i => i.id !== id); slots = { ...slots }; }

  function slotTotal(items) { return items.reduce((s, i) => s + (i.cal || 0), 0); }

  const dayTotal = $derived(() => {
    return Object.values(slots).flat().reduce((s, i) => s + (i.cal || 0), 0);
  });

  async function savePlan() {
    saving = true;
    saved = false;
    try {
      const meals = Object.entries(slots).map(([slot, items]) => ({
        slot,
        items: items.map(i => ({ type: i.type, refId: i.refId, quantity: i.quantity })),
      }));
      await plannerStore.saveDaily(currentDate, meals);
      saved = true;
      setTimeout(() => saved = false, 2000);
    } catch (err) {
      console.error('Save failed:', err);
      alert('Save failed: ' + err.message);
    }
    saving = false;
  }

  function prevDay() { const d = new Date(currentDate); d.setDate(d.getDate() - 1); currentDate = formatDate(d); loadPlan(); }
  function nextDay() { const d = new Date(currentDate); d.setDate(d.getDate() + 1); currentDate = formatDate(d); loadPlan(); }
</script>

<svelte:head><title>Daily Planner — MacroX</title></svelte:head>

<div class="page-container">
  <div class="top-bar animate-slide-up">
    <div>
      <h1 class="page-title">Daily Planner</h1>
      <p class="page-subtitle">Drag foods into meal slots</p>
    </div>
    <div style="display: flex; gap: var(--space-2); align-items: center;">
      {#if saved}<span class="saved-msg">Saved</span>{/if}
      <button class="btn btn-primary" onclick={savePlan} disabled={saving}>
        {saving ? 'Saving…' : 'Save'}
      </button>
    </div>
  </div>

  <div class="date-bar animate-slide-up stagger-1">
    <button class="btn btn-ghost btn-sm" onclick={prevDay}><ChevronLeft size={14} /></button>
    <span class="date-text">{new Date(currentDate + 'T00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
    <button class="btn btn-ghost btn-sm" onclick={nextDay}><ChevronRight size={14} /></button>
    <span class="day-cal mono">{dayTotal()} kcal</span>
  </div>

  <div class="planner-grid">
    <div class="palette animate-slide-up stagger-2">
      <input type="text" class="input" placeholder="Search foods…" bind:value={search} />

      <div class="pal-list">
        {#each filteredFoods.slice(0, 25) as food}
          <div class="pal-item">
            <span class="pal-name">{food.name}</span>
            <span class="pal-cal mono">{food.calories}</span>
            <div class="pal-btns">
              {#each Object.keys(slotMeta) as s}
                <button class="pal-add" onclick={() => addFood(s, food)} title={slotMeta[s]}>{slotMeta[s][0]}</button>
              {/each}
            </div>
          </div>
        {/each}
      </div>

      {#if $mealStore.meals.length > 0}
        <div class="pal-divider"></div>
        <span class="pal-heading">Meals</span>
        <div class="pal-list">
          {#each $mealStore.meals as meal}
            <div class="pal-item">
              <span class="pal-name">{meal.name}</span>
              <span class="pal-cal mono">{Math.round(meal.totalMacros?.calories || 0)}</span>
              <div class="pal-btns">
                {#each Object.keys(slotMeta) as s}
                  <button class="pal-add" onclick={() => addMeal(s, meal)} title={slotMeta[s]}>{slotMeta[s][0]}</button>
                {/each}
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>

    <div class="slots">
      {#each Object.entries(slotMeta) as [key, label], i}
        {@const items = slots[key]}
        <div class="slot animate-slide-up stagger-{i + 3}">
          <div class="slot-head">
            <span class="slot-label">{label}</span>
            <span class="slot-cal mono">{slotTotal(items)} kcal</span>
          </div>
          <div
            class="slot-zone"
            use:dndzone={{ items, flipDurationMs, dropTargetClasses: ['dnd-drop-target'] }}
            onconsider={(e) => handleConsider(key, e)}
            onfinalize={(e) => handleFinalize(key, e)}
          >
            {#each items as item (item.id)}
              <div class="slot-item" animate:flip={{ duration: flipDurationMs }}>
                <span class="si-name">{item.name}</span>
                <span class="si-cal mono">{item.cal}</span>
                <button class="si-rm" onclick={() => removeItem(key, item.id)}><X size={11} strokeWidth={1.5} /></button>
              </div>
            {/each}
          </div>
          {#if items.length === 0}<p class="slot-ph">Empty</p>{/if}
        </div>
      {/each}
    </div>
  </div>
</div>

<style>
  .top-bar { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--space-4); }
  .saved-msg { font-size: var(--font-xs); color: var(--success); font-weight: 500; }

  .date-bar { display: flex; align-items: center; gap: var(--space-3); margin-bottom: var(--space-5); }
  .date-text { font-size: var(--font-sm); font-weight: 500; min-width: 130px; text-align: center; }
  .day-cal { font-size: var(--font-sm); color: var(--text-1); margin-left: auto; }

  .planner-grid { display: grid; grid-template-columns: 300px 1fr; gap: var(--space-5); }

  .palette {
    background: var(--bg-1);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: var(--space-4);
    position: sticky;
    top: calc(var(--navbar-height) + var(--space-4));
    max-height: calc(100vh - var(--navbar-height) - var(--space-8));
    overflow-y: auto;
  }

  .pal-list { display: flex; flex-direction: column; margin-top: var(--space-3); }
  .pal-divider { height: 1px; background: var(--border); margin: var(--space-3) 0; }
  .pal-heading { font-size: var(--font-xs); color: var(--text-2); text-transform: uppercase; letter-spacing: 0.04em; font-weight: 500; }

  .pal-item { display: flex; align-items: center; gap: var(--space-2); padding: 3px 6px; border-radius: var(--radius-sm); }
  .pal-item:hover { background: var(--bg-hover); }
  .pal-name { flex: 1; font-size: var(--font-sm); color: var(--text-0); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .pal-cal { font-size: var(--font-xs); color: var(--text-3); }

  .pal-btns { display: flex; gap: 1px; }
  .pal-add {
    width: 18px; height: 18px; border: none; background: transparent; color: var(--text-3);
    cursor: pointer; font-size: var(--font-xs); font-family: var(--font-sans); font-weight: 600;
    border-radius: 3px; display: flex; align-items: center; justify-content: center;
  }
  .pal-add:hover { background: var(--bg-3); color: var(--text-0); }

  .slots { display: flex; flex-direction: column; gap: var(--space-3); }

  .slot {
    background: var(--bg-1);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: var(--space-4);
  }

  .slot-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-3); }
  .slot-label { font-size: var(--font-sm); font-weight: 500; }
  .slot-cal { font-size: var(--font-xs); color: var(--text-2); }

  .slot-zone { display: flex; flex-direction: column; gap: var(--space-1); min-height: 32px; }

  .slot-item {
    display: flex; align-items: center; gap: var(--space-2);
    padding: 5px 8px; background: var(--bg-2); border-radius: var(--radius-sm);
    cursor: grab; transition: background var(--transition-fast);
  }
  .slot-item:hover { background: var(--bg-3); }

  .si-name { flex: 1; font-size: var(--font-xs); font-weight: 400; }
  .si-cal { font-size: var(--font-xs); color: var(--text-2); }
  .si-rm { background: none; border: none; color: var(--text-3); cursor: pointer; display: flex; padding: 1px; }
  .si-rm:hover { color: var(--danger); }

  .slot-ph { text-align: center; font-size: var(--font-xs); color: var(--text-3); padding: var(--space-3); }

  @media (max-width: 768px) {
    .planner-grid { grid-template-columns: 1fr; }
    .palette { position: static; max-height: 250px; }
  }
</style>
