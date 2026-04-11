<script>
  import { foodStore } from '$lib/stores/foods.js';
  import { onMount } from 'svelte';
  import { Search, Plus, X, Trash2 } from 'lucide-svelte';

  let search = $state('');
  let category = $state('');
  let showAddModal = $state(false);
  let searchTimeout;

  const categories = ['All', 'Protein', 'Vegetable', 'Fruit', 'Grain', 'Dairy', 'Fat & Oil', 'Nut & Seed', 'Legume'];

  let newFood = $state({ name: '', protein: 0, totalCarbs: 0, fiber: 0, fat: 0, calories: 0, category: 'Protein' });

  onMount(() => { foodStore.load({ limit: 100 }); });

  function handleSearch() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => { foodStore.load({ search, category: category === 'All' ? '' : category, limit: 100 }); }, 300);
  }

  function selectCategory(cat) { category = cat === 'All' ? '' : cat; foodStore.load({ search, category, limit: 100 }); }

  async function addFood(e) {
    e.preventDefault();
    await foodStore.create(newFood);
    showAddModal = false;
    newFood = { name: '', protein: 0, totalCarbs: 0, fiber: 0, fat: 0, calories: 0, category: 'Protein' };
  }

  async function deleteFood(id) { if (confirm('Delete?')) await foodStore.remove(id); }
</script>

<svelte:head><title>Foods — MacroX</title></svelte:head>

<div class="page-container">
  <div class="top-bar animate-slide-up">
    <div>
      <h1 class="page-title">Food Database</h1>
      <p class="page-subtitle">{$foodStore.pagination?.total || 0} items</p>
    </div>
    <button class="btn btn-primary btn-sm" onclick={() => showAddModal = true}>
      <Plus size={13} strokeWidth={1.5} />
      Add
    </button>
  </div>

  <div class="controls animate-slide-up stagger-1">
    <div class="search-box">
      <Search size={13} strokeWidth={1.5} />
      <input type="text" class="search-input" placeholder="Search…" bind:value={search} oninput={handleSearch} />
    </div>
  </div>

  <div class="chips animate-slide-up stagger-2">
    {#each categories as cat}
      <button class="chip" class:active={category === (cat === 'All' ? '' : cat)} onclick={() => selectCategory(cat)}>{cat}</button>
    {/each}
  </div>

  {#if $foodStore.loading}
    <div class="food-table"><div class="skeleton" style="height: 400px;"></div></div>
  {:else if $foodStore.foods.length === 0}
    <div class="empty-state"><p class="empty-state-text">No foods match your filters.</p></div>
  {:else}
    <div class="food-table animate-slide-up stagger-3">
      <div class="table-head">
        <span class="th name">Name</span>
        <span class="th cat">Category</span>
        <span class="th num">Cal</span>
        <span class="th num">Protein</span>
        <span class="th num">Net Carbs</span>
        <span class="th num">Fat</span>
        <span class="th num">Fiber</span>
        <span class="th act"></span>
      </div>
      {#each $foodStore.foods as food, i}
        <div class="table-row" style="animation-delay: {Math.min(i * 15, 200)}ms">
          <span class="td name">{food.name}</span>
          <span class="td cat"><span class="badge">{food.category}</span></span>
          <span class="td num mono">{food.calories}</span>
          <span class="td num mono">{food.protein}</span>
          <span class="td num mono">{food.netCarbs}</span>
          <span class="td num mono">{food.fat}</span>
          <span class="td num mono">{food.fiber}</span>
          <span class="td act">
            {#if !food.isDefault}
              <button class="btn btn-ghost btn-sm" onclick={() => deleteFood(food._id)} style="color: var(--text-3);"><Trash2 size={12} strokeWidth={1.5} /></button>
            {/if}
          </span>
        </div>
      {/each}
    </div>
  {/if}
</div>

{#if showAddModal}
  <div class="modal-overlay" onclick={() => showAddModal = false}>
    <div class="modal-content" onclick={(e) => e.stopPropagation()}>
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-5);">
        <h2 style="font-size: var(--font-lg); font-weight: 600;">Add Food</h2>
        <button class="btn btn-ghost btn-sm" onclick={() => showAddModal = false}><X size={14} /></button>
      </div>
      <form onsubmit={addFood} style="display: flex; flex-direction: column; gap: var(--space-3);">
        <div class="field"><label class="label" for="fn">Name</label><input id="fn" type="text" class="input" bind:value={newFood.name} required /></div>
        <div class="field"><label class="label" for="fc">Category</label>
          <select id="fc" class="input" bind:value={newFood.category}>{#each categories.slice(1) as c}<option value={c}>{c}</option>{/each}</select>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3);">
          <div class="field"><label class="label" for="fcal">Calories</label><input id="fcal" type="number" class="input" bind:value={newFood.calories} min="0" /></div>
          <div class="field"><label class="label" for="fpro">Protein</label><input id="fpro" type="number" class="input" bind:value={newFood.protein} min="0" step="0.1" /></div>
          <div class="field"><label class="label" for="fcb">Total Carbs</label><input id="fcb" type="number" class="input" bind:value={newFood.totalCarbs} min="0" step="0.1" /></div>
          <div class="field"><label class="label" for="ffb">Fiber</label><input id="ffb" type="number" class="input" bind:value={newFood.fiber} min="0" step="0.1" /></div>
          <div class="field"><label class="label" for="fft">Fat</label><input id="fft" type="number" class="input" bind:value={newFood.fat} min="0" step="0.1" /></div>
        </div>
        <button type="submit" class="btn btn-primary" style="margin-top: var(--space-2);">Add Food</button>
      </form>
    </div>
  </div>
{/if}

<style>
  .top-bar { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--space-4); }

  .controls { margin-bottom: var(--space-3); }

  .search-box {
    display: flex; align-items: center; gap: var(--space-2);
    background: var(--bg-2); border: 1px solid var(--border); border-radius: var(--radius-md);
    padding: 0 var(--space-3); max-width: 280px; color: var(--text-3);
  }
  .search-input {
    background: none; border: none; color: var(--text-0); font-family: var(--font-sans);
    font-size: var(--font-sm); padding: 6px 0; width: 100%; outline: none;
  }
  .search-input::placeholder { color: var(--text-3); }

  .chips { display: flex; gap: var(--space-1); margin-bottom: var(--space-5); flex-wrap: wrap; }
  .chip {
    padding: 3px 10px; background: transparent; border: 1px solid var(--border);
    border-radius: var(--radius-full); font-size: var(--font-sm); font-weight: 400;
    color: var(--text-2); cursor: pointer; font-family: var(--font-sans); transition: all var(--transition-fast);
  }
  .chip:hover { border-color: var(--border-strong); color: var(--text-0); }
  .chip.active { background: var(--text-0); color: var(--bg-0); border-color: var(--text-0); }

  .food-table { width: 100%; }

  .table-head {
    display: grid;
    grid-template-columns: 1fr 100px 60px 60px 70px 50px 50px 36px;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-3);
    border-bottom: 1px solid var(--border);
  }

  .th {
    font-size: var(--font-xs); color: var(--text-3); text-transform: uppercase; letter-spacing: 0.05em; font-weight: 500;
  }
  .th.num, .td.num { text-align: right; }

  .table-row {
    display: grid;
    grid-template-columns: 1fr 100px 60px 60px 70px 50px 50px 36px;
    gap: var(--space-2);
    padding: 6px var(--space-3);
    border-bottom: 1px solid var(--border);
    transition: background var(--transition-fast);
    animation: slideUp 200ms ease both;
  }
  .table-row:hover { background: var(--bg-hover); }

  .td { font-size: var(--font-sm); display: flex; align-items: center; }
  .td.name { font-weight: 500; }
  .td.cat { }
  .td.num { justify-content: flex-end; color: var(--text-1); font-size: var(--font-sm); }
  .td.act { justify-content: center; }

  .field { display: flex; flex-direction: column; }

  @media (max-width: 768px) {
    .table-head, .table-row { grid-template-columns: 1fr 60px 60px 60px; }
    .th.cat, .td.cat, .th:nth-child(6), .td:nth-child(6), .th:nth-child(7), .td:nth-child(7), .th.act, .td.act { display: none; }
  }
</style>
