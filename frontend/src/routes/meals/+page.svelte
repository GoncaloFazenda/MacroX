<script>
  import { mealStore } from '$lib/stores/meals.js';
  import { onMount } from 'svelte';
  import { Plus, Trash2 } from 'lucide-svelte';

  onMount(() => { mealStore.load(); });

  async function deleteMeal(id) { if (confirm('Delete?')) await mealStore.remove(id); }
</script>

<svelte:head><title>Meals — MacroX</title></svelte:head>

<div class="page-container">
  <div class="top-bar animate-slide-up">
    <div>
      <h1 class="page-title">Composite Meals</h1>
      <p class="page-subtitle">Your custom meal combinations</p>
    </div>
    <a href="/meals/new" class="btn btn-primary btn-sm"><Plus size={13} strokeWidth={1.5} />New Meal</a>
  </div>

  {#if $mealStore.loading}
    <div class="skeleton" style="height: 200px;"></div>
  {:else if $mealStore.meals.length === 0}
    <div class="empty-state">
      <p class="empty-state-text">No meals yet.</p>
      <a href="/meals/new" class="btn btn-primary btn-sm">Create your first</a>
    </div>
  {:else}
    <div class="meal-list">
      {#each $mealStore.meals as meal, i}
        <div class="meal-row animate-slide-up" style="animation-delay: {i * 30}ms">
          <div class="mr-info">
            <span class="mr-name">{meal.name}</span>
            <span class="mr-items">{meal.items?.length || 0} items</span>
          </div>
          <div class="mr-macros">
            <span class="mm mono" style="color: var(--cal)">{Math.round(meal.totalMacros?.calories || 0)}</span>
            <span class="ml">kcal</span>
            <span class="mm mono" style="color: var(--pro)">{meal.totalMacros?.protein || 0}g</span>
            <span class="ml">P</span>
            <span class="mm mono" style="color: var(--carb)">{meal.totalMacros?.netCarbs || 0}g</span>
            <span class="ml">C</span>
            <span class="mm mono" style="color: var(--fat)">{meal.totalMacros?.fat || 0}g</span>
            <span class="ml">F</span>
          </div>
          <button class="btn btn-ghost btn-sm" onclick={() => deleteMeal(meal._id)} style="color: var(--text-3);"><Trash2 size={13} strokeWidth={1.5} /></button>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .top-bar { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--space-5); }

  .meal-list { display: flex; flex-direction: column; }

  .meal-row {
    display: flex; align-items: center; gap: var(--space-4);
    padding: var(--space-3) var(--space-4);
    border-bottom: var(--border-width) solid var(--border);
    transition: background var(--transition-fast);
  }
  .meal-row:hover { background: var(--bg-hover); }

  .mr-info { flex: 1; display: flex; flex-direction: column; }
  .mr-name { font-size: var(--font-sm); font-weight: 500; }
  .mr-items { font-size: var(--font-xs); color: var(--text-3); }

  .mr-macros { display: flex; align-items: baseline; gap: var(--space-1); }
  .mm { font-size: var(--font-sm); font-weight: 500; }
  .ml { font-size: var(--font-xs); color: var(--text-3); margin-right: var(--space-2); }
</style>
