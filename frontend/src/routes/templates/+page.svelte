<script>
  import { api } from '$lib/api/client.js';
  import { dayTemplateStore } from '$lib/stores/dayTemplates.js';
  import { foodStore } from '$lib/stores/foods.js';
  import { mealStore } from '$lib/stores/meals.js';
  import { onMount } from 'svelte';
  import { Trash2, Calendar, UtensilsCrossed, ChevronRight } from 'lucide-svelte';

  let mealTemplates = $state([]);
  let loading = $state(true);
  let activeTab = $state('day');

  const slotLabels = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snack: 'Snack' };
  const slotOrder = ['breakfast', 'lunch', 'dinner', 'snack'];

  onMount(async () => {
    loading = true;
    await Promise.all([
      foodStore.load({ limit: 200 }),
      mealStore.load(),
      dayTemplateStore.load(),
      api.get('/templates').then(d => mealTemplates = d.templates).catch(() => {}),
    ]);
    loading = false;
  });

  async function deleteMealTemplate(id) {
    if (!confirm('Delete this template?')) return;
    await api.del(`/templates/${id}`);
    mealTemplates = mealTemplates.filter(t => t._id !== id);
  }

  async function deleteDayTemplate(id) {
    if (!confirm('Delete this day template?')) return;
    await dayTemplateStore.remove(id);
  }

  function getName(item) {
    if (item.type === 'food') return $foodStore.foods.find(f => f._id === item.refId)?.name || '?';
    return $mealStore.meals.find(m => m._id === item.refId)?.name || '?';
  }

  function getItemCount(template) {
    return (template.meals || []).reduce((sum, m) => sum + (m.items?.length || 0), 0);
  }

  function getSlotSummary(template) {
    const filled = (template.meals || []).filter(m => m.items?.length > 0);
    return filled.map(m => slotLabels[m.slot] || m.slot).join(' · ');
  }
</script>

<svelte:head><title>Templates — MacroX</title></svelte:head>

<div class="page-container">
  <div class="top-bar animate-slide-up">
    <div>
      <h1 class="page-title">Templates</h1>
      <p class="page-subtitle">Saved meal configurations and day plans</p>
    </div>
    <a href="/planner/daily" class="btn btn-secondary">Create in Daily Planner<ChevronRight size={14} /></a>
  </div>

  <!-- Tabs -->
  <div class="tabs animate-slide-up stagger-1">
    <button class="tab" class:tab-active={activeTab === 'day'} onclick={() => activeTab = 'day'}>
      <Calendar size={15} strokeWidth={1.5} />Day Templates
      <span class="tab-count">{$dayTemplateStore.templates.length}</span>
    </button>
    <button class="tab" class:tab-active={activeTab === 'meal'} onclick={() => activeTab = 'meal'}>
      <UtensilsCrossed size={15} strokeWidth={1.5} />Meal Templates
      <span class="tab-count">{mealTemplates.length}</span>
    </button>
  </div>

  {#if loading}
    <div class="skeleton" style="height: 300px;"></div>
  {:else if activeTab === 'day'}
    <!-- Day Templates -->
    {#if $dayTemplateStore.templates.length === 0}
      <div class="empty-state"><p class="empty-state-text">No day templates yet. <a href="/planner/daily" class="empty-link">Create one from the Daily Planner</a></p></div>
    {:else}
      <div class="grid animate-slide-up stagger-2">
        {#each $dayTemplateStore.templates as t, idx}
          <div class="card" style="animation-delay: {idx * 40}ms">
            <div class="card-head">
              <div class="card-title-row">
                <span class="card-name">{t.name}</span>
                <button class="card-del" onclick={() => deleteDayTemplate(t._id)}><Trash2 size={14} strokeWidth={1.5} /></button>
              </div>
              <div class="card-meta">
                <span class="card-count">{getItemCount(t)} items</span>
                <span class="card-dot">·</span>
                <span class="card-slots">{getSlotSummary(t)}</span>
              </div>
            </div>

            <div class="card-macros">
              <div class="macro-pill">
                <span class="macro-val mono" style="color: var(--cal)">{Math.round(t.totalMacros?.calories || 0)}</span>
                <span class="macro-label">kcal</span>
              </div>
              <div class="macro-pill">
                <span class="macro-val mono" style="color: var(--pro)">{Math.round(t.totalMacros?.protein || 0)}</span>
                <span class="macro-label">protein</span>
              </div>
              <div class="macro-pill">
                <span class="macro-val mono" style="color: var(--carb)">{Math.round(t.totalMacros?.netCarbs || 0)}</span>
                <span class="macro-label">carbs</span>
              </div>
              <div class="macro-pill">
                <span class="macro-val mono" style="color: var(--fat)">{Math.round(t.totalMacros?.fat || 0)}</span>
                <span class="macro-label">fat</span>
              </div>
            </div>

            <div class="card-meals">
              {#each slotOrder as slot}
                {#each (t.meals || []).filter(m => m.slot === slot && m.items?.length > 0) as meal}
                  <div class="card-slot">
                    <span class="slot-label">{slotLabels[slot]}</span>
                    <div class="slot-items">
                      {#each meal.items as item}
                        <span class="slot-item">{getName(item)}</span>
                      {/each}
                    </div>
                  </div>
                {/each}
              {/each}
            </div>
          </div>
        {/each}
      </div>
    {/if}

  {:else}
    <!-- Meal Templates -->
    {#if mealTemplates.length === 0}
      <div class="empty-state"><p class="empty-state-text">No meal templates yet.</p></div>
    {:else}
      <div class="meal-list animate-slide-up stagger-2">
        {#each mealTemplates as t, i}
          <div class="meal-row" style="animation-delay: {i * 30}ms">
            <div class="meal-info">
              <span class="meal-name">{t.name}</span>
              <span class="meal-count">{t.items?.length || 0} items</span>
            </div>
            <div class="meal-macros">
              <span class="mono" style="color: var(--cal)">{Math.round(t.totalMacros?.calories || 0)}</span>
              <span class="ml">kcal</span>
              <span class="mono" style="color: var(--pro)">{Math.round(t.totalMacros?.protein || 0)}g</span>
              <span class="ml">P</span>
              <span class="mono" style="color: var(--carb)">{Math.round(t.totalMacros?.netCarbs || 0)}g</span>
              <span class="ml">C</span>
              <span class="mono" style="color: var(--fat)">{Math.round(t.totalMacros?.fat || 0)}g</span>
              <span class="ml">F</span>
            </div>
            <button class="btn btn-ghost btn-sm" onclick={() => deleteMealTemplate(t._id)} style="color: var(--text-3);"><Trash2 size={14} strokeWidth={1.5} /></button>
          </div>
        {/each}
      </div>
    {/if}
  {/if}
</div>

<style>
  .top-bar { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--space-5); }

  /* Tabs */
  .tabs { display: flex; gap: var(--space-1); margin-bottom: var(--space-5); border-bottom: var(--border-width) solid var(--border); padding-bottom: 0; }
  .tab {
    display: flex; align-items: center; gap: var(--space-2); padding: var(--space-3) var(--space-4);
    background: none; border: none; border-bottom: 2px solid transparent;
    font-size: var(--font-sm); font-weight: 500; color: var(--text-3);
    cursor: pointer; font-family: var(--font-sans); transition: all var(--transition-fast);
    margin-bottom: -1px;
  }
  .tab:hover { color: var(--text-1); }
  .tab-active { color: var(--text-0); border-bottom-color: var(--text-0); }
  .tab-count {
    font-size: var(--font-xs); padding: 1px 7px; border-radius: 10px;
    background: var(--bg-hover); color: var(--text-2); font-weight: 500;
  }
  .tab-active .tab-count { background: var(--accent-subtle); }

  .empty-link { color: var(--text-1); text-decoration: underline; }

  /* Day Template Grid */
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: var(--space-4); }

  .card {
    border: var(--border-width) solid var(--border); border-radius: var(--radius-lg);
    padding: var(--space-5); transition: border-color var(--transition-fast);
  }
  .card:hover { border-color: var(--border-strong); }

  .card-head { margin-bottom: var(--space-4); }
  .card-title-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--space-1); }
  .card-name { font-size: var(--font-lg); font-weight: 600; letter-spacing: -0.02em; }
  .card-del {
    background: none; border: none; color: var(--text-3); cursor: pointer;
    padding: var(--space-1); border-radius: var(--radius-sm); transition: all var(--transition-fast);
    opacity: 0;
  }
  .card:hover .card-del { opacity: 1; }
  .card-del:hover { color: var(--danger); background: var(--danger-bg); }
  .card-meta { display: flex; align-items: center; gap: var(--space-2); font-size: var(--font-sm); color: var(--text-3); }
  .card-dot { color: var(--text-3); }

  .card-macros {
    display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--space-2);
    margin-bottom: var(--space-4); padding: var(--space-3);
    border: var(--border-width) solid var(--border); border-radius: var(--radius-md);
  }
  .macro-pill { text-align: center; }
  .macro-val { font-size: var(--font-base); font-weight: 600; display: block; }
  .macro-label { font-size: var(--font-xs); color: var(--text-3); }

  .card-meals { display: flex; flex-direction: column; gap: var(--space-3); }
  .card-slot { display: flex; gap: var(--space-3); align-items: baseline; }
  .slot-label { font-size: var(--font-xs); font-weight: 600; color: var(--text-2); min-width: 70px; flex-shrink: 0; }
  .slot-items { display: flex; flex-wrap: wrap; gap: var(--space-1); }
  .slot-item {
    font-size: var(--font-sm); color: var(--text-1); padding: 2px 0;
  }
  .slot-item:not(:last-child)::after { content: ','; color: var(--text-3); margin-right: 4px; }

  /* Meal Template List */
  .meal-list { display: flex; flex-direction: column; }
  .meal-row {
    display: flex; align-items: center; gap: var(--space-4);
    padding: var(--space-4) var(--space-4); border-bottom: var(--border-width) solid var(--border);
    transition: background var(--transition-fast);
  }
  .meal-row:hover { background: var(--bg-hover); }
  .meal-info { flex: 1; }
  .meal-name { font-size: var(--font-base); font-weight: 500; display: block; }
  .meal-count { font-size: var(--font-sm); color: var(--text-3); }
  .meal-macros { display: flex; align-items: baseline; gap: var(--space-1); font-size: var(--font-sm); }
  .ml { font-size: var(--font-xs); color: var(--text-3); margin-right: var(--space-2); }
</style>
