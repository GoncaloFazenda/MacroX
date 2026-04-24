<script>
  import { foodStore } from '$lib/stores/foods.js';
  import { mealStore } from '$lib/stores/meals.js';
  import { onMount } from 'svelte';
  import { Search, Plus, X, Trash2, UtensilsCrossed, Apple } from 'lucide-svelte';

  let activeTab = $state('foods');
  let search = $state('');
  let category = $state('');
  let showAddFoodModal = $state(false);
  let showAddMealModal = $state(false);
  let searchTimeout;

  const categories = ['All', 'Protein', 'Vegetable', 'Fruit', 'Grain', 'Dairy', 'Fat & Oil', 'Nut & Seed', 'Legume'];

  let newFood = $state({ name: '', protein: 0, totalCarbs: 0, fiber: 0, fat: 0, calories: 0, category: 'Protein' });

  // Meal builder state
  let mealName = $state('');
  let mealItems = $state([]);
  let mealSearch = $state('');
  let savingMeal = $state(false);

  const filteredBuilderFoods = $derived($foodStore.foods.filter(f => f.name.toLowerCase().includes(mealSearch.toLowerCase())));

  const mealTotals = $derived.by(() => {
    let c = 0, p = 0, cb = 0, f = 0;
    for (const item of mealItems) {
      const mult = item.quantity / 100;
      c += item.food.calories * mult; p += item.food.protein * mult;
      cb += item.food.netCarbs * mult; f += item.food.fat * mult;
    }
    return { calories: Math.round(c), protein: Math.round(p * 10) / 10, netCarbs: Math.round(cb * 10) / 10, fat: Math.round(f * 10) / 10 };
  });

  onMount(() => {
    foodStore.load({ limit: 100 });
    mealStore.load();
  });

  function handleSearch() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => { foodStore.load({ search, category: category === 'All' ? '' : category, limit: 100 }); }, 300);
  }

  function selectCategory(cat) { category = cat === 'All' ? '' : cat; foodStore.load({ search, category, limit: 100 }); }

  async function addFood(e) {
    e.preventDefault();
    await foodStore.create(newFood);
    showAddFoodModal = false;
    newFood = { name: '', protein: 0, totalCarbs: 0, fiber: 0, fat: 0, calories: 0, category: 'Protein' };
  }

  async function deleteFood(id) { if (confirm('Delete this food?')) await foodStore.remove(id); }
  async function deleteMeal(id) { if (confirm('Delete this meal?')) await mealStore.remove(id); }

  // Meal builder functions
  function addFoodToMeal(food) {
    const ex = mealItems.find(i => i.foodId === food._id);
    if (ex) { mealItems = mealItems.map(i => i.foodId === food._id ? { ...i, quantity: i.quantity + 100 } : i); }
    else { mealItems = [...mealItems, { foodId: food._id, food, quantity: 100 }]; }
  }
  function removeMealItem(foodId) { mealItems = mealItems.filter(i => i.foodId !== foodId); }
  function updateMealQty(foodId, qty) { mealItems = mealItems.map(i => i.foodId === foodId ? { ...i, quantity: Math.max(1, qty) } : i); }

  async function saveMeal(e) {
    e.preventDefault();
    if (!mealName || mealItems.length === 0) return;
    savingMeal = true;
    try {
      await mealStore.create({ name: mealName, items: mealItems.map(i => ({ foodId: i.foodId, quantity: i.quantity })) });
      showAddMealModal = false;
      mealName = ''; mealItems = []; mealSearch = '';
    } catch (err) { alert(err.message); }
    savingMeal = false;
  }
</script>

<svelte:head><title>Foods & Meals — MacroX</title></svelte:head>

<div class="page-container">
  <div class="top-bar animate-slide-up">
    <div>
      <h1 class="page-title">Foods & Meals</h1>
      <p class="page-subtitle">Your ingredient database and meal combos</p>
    </div>
    <div class="top-actions">
      {#if activeTab === 'foods'}
        <button class="btn btn-primary btn-sm" onclick={() => showAddFoodModal = true}><Plus size={14} strokeWidth={1.5} />Add Food</button>
      {:else}
        <button class="btn btn-primary btn-sm" onclick={() => showAddMealModal = true}><Plus size={14} strokeWidth={1.5} />New Meal</button>
      {/if}
    </div>
  </div>

  <!-- Tabs -->
  <div class="tabs animate-slide-up stagger-1">
    <button class="tab" class:tab-active={activeTab === 'foods'} onclick={() => activeTab = 'foods'}>
      <Apple size={15} strokeWidth={1.5} />Foods
      <span class="tab-count">{$foodStore.pagination?.total || $foodStore.foods.length}</span>
    </button>
    <button class="tab" class:tab-active={activeTab === 'meals'} onclick={() => activeTab = 'meals'}>
      <UtensilsCrossed size={15} strokeWidth={1.5} />Meals
      <span class="tab-count">{$mealStore.meals.length}</span>
    </button>
  </div>

  {#if activeTab === 'foods'}
    <!-- Foods Tab -->
    <div class="controls animate-slide-up stagger-2">
      <div class="search-box">
        <Search size={14} strokeWidth={1.5} />
        <input type="text" class="search-input" placeholder="Search foods…" bind:value={search} oninput={handleSearch} />
      </div>
    </div>

    <div class="chips">
      {#each categories as cat}
        <button class="chip" class:active={category === (cat === 'All' ? '' : cat)} onclick={() => selectCategory(cat)}>{cat}</button>
      {/each}
    </div>

    {#if $foodStore.loading}
      <div class="skeleton" style="height: 400px;"></div>
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
                <button class="btn btn-ghost btn-sm" onclick={() => deleteFood(food._id)} style="color: var(--text-3);"><Trash2 size={13} strokeWidth={1.5} /></button>
              {/if}
            </span>
          </div>
        {/each}
      </div>
    {/if}

  {:else}
    <!-- Meals Tab -->
    {#if $mealStore.loading}
      <div class="skeleton" style="height: 200px;"></div>
    {:else if $mealStore.meals.length === 0}
      <div class="empty-state">
        <p class="empty-state-text">No meals yet.</p>
        <button class="btn btn-primary btn-sm" onclick={() => showAddMealModal = true}>Create your first</button>
      </div>
    {:else}
      <div class="meal-list animate-slide-up stagger-2">
        {#each $mealStore.meals as meal, i}
          <div class="meal-row" style="animation-delay: {i * 30}ms">
            <div class="mr-info">
              <span class="mr-name">{meal.name}</span>
              <span class="mr-items">{meal.items?.length || 0} items</span>
            </div>
            <div class="mr-macros">
              <span class="mm mono" style="color: var(--cal)">{Math.round(meal.totalMacros?.calories || 0)}</span>
              <span class="ml">kcal</span>
              <span class="mm mono" style="color: var(--pro)">{Math.round(meal.totalMacros?.protein || 0)}g</span>
              <span class="ml">P</span>
              <span class="mm mono" style="color: var(--carb)">{Math.round(meal.totalMacros?.netCarbs || 0)}g</span>
              <span class="ml">C</span>
              <span class="mm mono" style="color: var(--fat)">{Math.round(meal.totalMacros?.fat || 0)}g</span>
              <span class="ml">F</span>
            </div>
            <button class="btn btn-ghost btn-sm" onclick={() => deleteMeal(meal._id)} style="color: var(--text-3);"><Trash2 size={14} strokeWidth={1.5} /></button>
          </div>
        {/each}
      </div>
    {/if}
  {/if}
</div>

<!-- Add Food Modal -->
{#if showAddFoodModal}
  <div class="modal-overlay" onclick={() => showAddFoodModal = false}>
    <div class="modal-content" onclick={(e) => e.stopPropagation()}>
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-5);">
        <h2 style="font-size: var(--font-lg); font-weight: 600;">Add Food</h2>
        <button class="btn btn-ghost btn-sm" onclick={() => showAddFoodModal = false}><X size={14} /></button>
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

<!-- New Meal Modal -->
{#if showAddMealModal}
  <div class="modal-overlay" onclick={() => showAddMealModal = false}>
    <div class="modal-content modal-wide" onclick={(e) => e.stopPropagation()}>
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-5);">
        <h2 style="font-size: var(--font-lg); font-weight: 600;">Build Meal</h2>
        <button class="btn btn-ghost btn-sm" onclick={() => showAddMealModal = false}><X size={14} /></button>
      </div>
      <form onsubmit={saveMeal}>
        <div class="builder">
          <div class="build-panel">
            <span class="panel-label">Foods</span>
            <input type="text" class="input" placeholder="Search foods…" bind:value={mealSearch} />
            <div class="pal-list">
              {#each filteredBuilderFoods as food}
                <button type="button" class="pal-item" onclick={() => addFoodToMeal(food)}>
                  <span class="pal-name">{food.name}</span>
                  <span class="pal-cal mono">{food.calories}</span>
                </button>
              {/each}
            </div>
          </div>
          <div class="build-panel">
            <span class="panel-label">Meal</span>
            <div class="field" style="margin-bottom: var(--space-3);">
              <label class="label" for="mn">Name</label>
              <input id="mn" type="text" class="input" placeholder="e.g. Salmon with Asparagus" bind:value={mealName} required />
            </div>
            {#if mealItems.length === 0}
              <p style="color: var(--text-3); font-size: var(--font-sm); padding: var(--space-6) 0; text-align: center;">Click foods to add</p>
            {:else}
              <div class="sel-list">
                {#each mealItems as item}
                  <div class="sel-item">
                    <span class="sel-name">{item.food.name}</span>
                    <input type="number" class="qty-input mono" value={item.quantity} oninput={(e) => updateMealQty(item.foodId, Number(e.target.value))} min="1" />
                    <span class="qty-g">g</span>
                    <button type="button" class="sel-rm" onclick={() => removeMealItem(item.foodId)}><X size={12} strokeWidth={1.5} /></button>
                  </div>
                {/each}
              </div>
              <div class="totals">
                <span class="t mono" style="color: var(--cal)">{mealTotals.calories} kcal</span>
                <span class="t mono" style="color: var(--pro)">{mealTotals.protein}g P</span>
                <span class="t mono" style="color: var(--carb)">{mealTotals.netCarbs}g C</span>
                <span class="t mono" style="color: var(--fat)">{mealTotals.fat}g F</span>
              </div>
              <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: var(--space-3);" disabled={savingMeal}>
                {savingMeal ? 'Saving…' : 'Save Meal'}
              </button>
            {/if}
          </div>
        </div>
      </form>
    </div>
  </div>
{/if}

<style>
  .top-bar { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--space-5); }
  .top-actions { display: flex; gap: var(--space-2); }

  /* Tabs */
  .tabs { display: flex; gap: var(--space-1); margin-bottom: var(--space-5); border-bottom: var(--border-width) solid var(--border); }
  .tab {
    display: flex; align-items: center; gap: var(--space-2); padding: var(--space-3) var(--space-4);
    background: none; border: none; border-bottom: 2px solid transparent;
    font-size: var(--font-sm); font-weight: 500; color: var(--text-3);
    cursor: pointer; font-family: var(--font-sans); transition: all var(--transition-fast); margin-bottom: -1px;
  }
  .tab:hover { color: var(--text-1); }
  .tab-active { color: var(--text-0); border-bottom-color: var(--text-0); }
  .tab-count { font-size: var(--font-xs); padding: 1px 7px; border-radius: 10px; background: var(--bg-hover); color: var(--text-2); font-weight: 500; }
  .tab-active .tab-count { background: var(--accent-subtle); }

  /* Search & chips */
  .controls { margin-bottom: var(--space-3); }
  .search-box {
    display: flex; align-items: center; gap: var(--space-2);
    background: var(--bg-2); border: var(--border-width) solid var(--border); border-radius: var(--radius-md);
    padding: 0 var(--space-3); max-width: 320px; color: var(--text-3);
  }
  .search-input {
    background: none; border: none; color: var(--text-0); font-family: var(--font-sans);
    font-size: var(--font-sm); padding: 8px 0; width: 100%; outline: none;
  }
  .search-input::placeholder { color: var(--text-3); }
  .chips { display: flex; gap: var(--space-1); margin-bottom: var(--space-5); flex-wrap: wrap; }
  .chip {
    padding: 4px 12px; background: transparent; border: var(--border-width) solid var(--border);
    border-radius: var(--radius-full); font-size: var(--font-sm); font-weight: 400;
    color: var(--text-2); cursor: pointer; font-family: var(--font-sans); transition: all var(--transition-fast);
  }
  .chip:hover { border-color: var(--border-strong); color: var(--text-0); }
  .chip.active { background: var(--text-0); color: var(--bg-0); border-color: var(--text-0); }

  /* Food table */
  .food-table { width: 100%; }
  .table-head {
    display: grid; grid-template-columns: 1fr 100px 60px 60px 70px 50px 50px 36px;
    gap: var(--space-2); padding: var(--space-2) var(--space-3); border-bottom: var(--border-width) solid var(--border);
  }
  .th { font-size: var(--font-xs); color: var(--text-3); text-transform: uppercase; letter-spacing: 0.05em; font-weight: 500; }
  .th.num, .td.num { text-align: right; }
  .table-row {
    display: grid; grid-template-columns: 1fr 100px 60px 60px 70px 50px 50px 36px;
    gap: var(--space-2); padding: 8px var(--space-3); border-bottom: var(--border-width) solid var(--border);
    transition: background var(--transition-fast); animation: slideUp 200ms ease both;
  }
  .table-row:hover { background: var(--bg-hover); }
  .td { font-size: var(--font-sm); display: flex; align-items: center; }
  .td.name { font-weight: 500; }
  .td.num { justify-content: flex-end; color: var(--text-1); }
  .td.act { justify-content: center; }
  .field { display: flex; flex-direction: column; }

  /* Meal list */
  .meal-list { display: flex; flex-direction: column; }
  .meal-row {
    display: flex; align-items: center; gap: var(--space-4);
    padding: var(--space-4) var(--space-4); border-bottom: var(--border-width) solid var(--border);
    transition: background var(--transition-fast);
  }
  .meal-row:hover { background: var(--bg-hover); }
  .mr-info { flex: 1; display: flex; flex-direction: column; }
  .mr-name { font-size: var(--font-base); font-weight: 500; }
  .mr-items { font-size: var(--font-sm); color: var(--text-3); }
  .mr-macros { display: flex; align-items: baseline; gap: var(--space-1); }
  .mm { font-size: var(--font-sm); font-weight: 500; }
  .ml { font-size: var(--font-xs); color: var(--text-3); margin-right: var(--space-2); }

  /* Meal builder modal */
  .modal-wide { max-width: 720px; }
  .builder { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); }
  .build-panel { border: var(--border-width) solid var(--border); border-radius: var(--radius-md); padding: var(--space-4); }
  .panel-label { font-size: var(--font-xs); color: var(--text-2); text-transform: uppercase; letter-spacing: 0.04em; font-weight: 500; display: block; margin-bottom: var(--space-3); }
  .pal-list { display: flex; flex-direction: column; max-height: 300px; overflow-y: auto; margin-top: var(--space-3); }
  .pal-item {
    display: flex; align-items: center; justify-content: space-between;
    padding: 5px 8px; border: none; background: transparent; cursor: pointer;
    border-radius: var(--radius-sm); font-family: var(--font-sans); text-align: left; transition: background var(--transition-fast);
  }
  .pal-item:hover { background: var(--bg-hover); }
  .pal-name { font-size: var(--font-sm); color: var(--text-0); }
  .pal-cal { font-size: var(--font-xs); color: var(--text-3); }
  .sel-list { display: flex; flex-direction: column; gap: var(--space-2); margin-bottom: var(--space-4); }
  .sel-item { display: flex; align-items: center; gap: var(--space-2); padding: 5px 8px; background: var(--bg-2); border-radius: var(--radius-sm); }
  .sel-name { flex: 1; font-size: var(--font-sm); }
  .qty-input {
    width: 56px; padding: 3px 4px; background: var(--bg-1); border: var(--border-width) solid var(--border); border-radius: 3px;
    color: var(--text-0); font-size: var(--font-sm); text-align: center; font-family: var(--font-mono);
  }
  .qty-g { font-size: var(--font-xs); color: var(--text-3); }
  .sel-rm { background: none; border: none; color: var(--text-3); cursor: pointer; display: flex; }
  .sel-rm:hover { color: var(--danger); }
  .totals { display: flex; gap: var(--space-3); padding: var(--space-3); background: var(--bg-2); border-radius: var(--radius-md); }
  .t { font-size: var(--font-sm); font-weight: 500; }

  @media (max-width: 768px) {
    .table-head, .table-row { grid-template-columns: 1fr 60px 60px 60px; }
    .th.cat, .td.cat, .th:nth-child(6), .td:nth-child(6), .th:nth-child(7), .td:nth-child(7), .th.act, .td.act { display: none; }
    .builder { grid-template-columns: 1fr; }
  }
</style>
