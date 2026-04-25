<script>
  import { foodStore } from '$lib/stores/foods.js';
  import { mealStore } from '$lib/stores/meals.js';
  import { onMount } from 'svelte';
  import { Search, Plus, X, Trash2, UtensilsCrossed, Apple, Pencil, Star, ChevronDown, ArrowUp, ArrowDown } from 'lucide-svelte';
  import ConfirmModal from '$lib/components/ui/ConfirmModal.svelte';

  const categories = ['All', 'Protein', 'Vegetable', 'Fruit', 'Grain', 'Dairy', 'Fat & Oil', 'Nut & Seed', 'Legume'];
  const PAGE_SIZE = 50;

  let activeTab = $state('foods');

  // Foods filtering
  let search = $state('');
  let category = $state('');
  let customOnly = $state(false);
  let searchTimeout;

  // Meals filtering
  let mealQuery = $state('');
  let mealSort = $state('recent'); // 'recent' | 'name' | 'calories' | 'protein'
  let mealSortDir = $state('desc');

  // Food modal
  let showFoodModal = $state(false);
  let foodMode = $state('add');
  let editingFoodId = $state(null);
  let newFood = $state({ name: '', protein: 0, totalCarbs: 0, fiber: 0, fat: 0, calories: 0, category: 'Protein' });

  // Meal modal
  let showMealModal = $state(false);
  let mealMode = $state('add');
  let editingMealId = $state(null);
  let mealName = $state('');
  let mealItems = $state([]);
  let mealSearch = $state('');
  let savingMeal = $state(false);

  // Sort, pin, expand, pagination
  let sortBy = $state('name');
  let sortDir = $state('asc');
  let expandedMealId = $state(null);
  let pinnedFoodIds = $state(new Set());
  let foodPage = $state(1);

  let pendingDuplicate = $state(null);

  let confirmState = $state({ open: false, title: '', message: '', warning: '', confirmText: 'Confirm', danger: false, onConfirm: null });
  let toast = $state({ visible: false, message: '', type: 'success' });
  let toastTimeout;

  // ── Number formatting ──
  function fmt(n, decimals = 1) {
    if (n == null || isNaN(n)) return '0';
    const f = Math.pow(10, decimals);
    const rounded = Math.round(Number(n) * f) / f;
    return rounded.toString();
  }
  function fmtInt(n) { return Math.round(Number(n) || 0).toString(); }

  // ── Macro distribution (used in meal builder totals only) ──
  function macroSplit(p, c, f) {
    const pCal = (Number(p) || 0) * 4;
    const cCal = (Number(c) || 0) * 4;
    const fCal = (Number(f) || 0) * 9;
    const total = pCal + cCal + fCal;
    if (total <= 0) return { p: 0, c: 0, f: 0 };
    return { p: (pCal / total) * 100, c: (cCal / total) * 100, f: (fCal / total) * 100 };
  }

  // ── Dominant macro label ──
  function dominantMacro(p, c, f) {
    const pCal = (Number(p) || 0) * 4;
    const cCal = (Number(c) || 0) * 4;
    const fCal = (Number(f) || 0) * 9;
    if (pCal === 0 && cCal === 0 && fCal === 0) return null;
    if (pCal >= cCal && pCal >= fCal) return 'Protein';
    if (cCal >= fCal) return 'Carbs';
    return 'Fat';
  }

  const filteredBuilderFoods = $derived.by(() => {
    const q = mealSearch.toLowerCase();
    const filtered = $foodStore.foods.filter(f => f.name.toLowerCase().includes(q));
    const pinned = filtered.filter(f => pinnedFoodIds.has(f._id));
    const others = filtered.filter(f => !pinnedFoodIds.has(f._id));
    return [...pinned, ...others];
  });

  const mealTotals = $derived.by(() => {
    let c = 0, p = 0, cb = 0, f = 0;
    for (const item of mealItems) {
      const mult = item.quantity / 100;
      c += (item.food?.calories || 0) * mult;
      p += (item.food?.protein || 0) * mult;
      cb += (item.food?.netCarbs || 0) * mult;
      f += (item.food?.fat || 0) * mult;
    }
    return {
      calories: Math.round(c),
      protein: Math.round(p * 10) / 10,
      netCarbs: Math.round(cb * 10) / 10,
      fat: Math.round(f * 10) / 10,
    };
  });

  const sortedFoods = $derived.by(() => {
    const foods = [...$foodStore.foods];
    const sortFn = (a, b) => {
      const av = a[sortBy], bv = b[sortBy];
      const cmp = typeof av === 'string' ? av.localeCompare(bv) : (av || 0) - (bv || 0);
      return sortDir === 'asc' ? cmp : -cmp;
    };
    const pinned = foods.filter(f => pinnedFoodIds.has(f._id)).sort(sortFn);
    const others = foods.filter(f => !pinnedFoodIds.has(f._id)).sort(sortFn);
    return [...pinned, ...others];
  });

  const filteredMeals = $derived.by(() => {
    let meals = $mealStore.meals.slice();
    const q = mealQuery.trim().toLowerCase();
    if (q) meals = meals.filter(m => m.name.toLowerCase().includes(q));
    meals.sort((a, b) => {
      let cmp = 0;
      if (mealSort === 'name') cmp = a.name.localeCompare(b.name);
      else if (mealSort === 'calories') cmp = (a.totalMacros?.calories || 0) - (b.totalMacros?.calories || 0);
      else if (mealSort === 'protein') cmp = (a.totalMacros?.protein || 0) - (b.totalMacros?.protein || 0);
      else cmp = new Date(a.updatedAt || a.createdAt || 0) - new Date(b.updatedAt || b.createdAt || 0);
      return mealSortDir === 'asc' ? cmp : -cmp;
    });
    return meals;
  });

  const mealSortOptions = [
    { key: 'recent', label: 'Recent' },
    { key: 'name', label: 'Name' },
    { key: 'calories', label: 'Calories' },
    { key: 'protein', label: 'Protein' },
  ];

  onMount(() => {
    try {
      const stored = localStorage.getItem('macrox-pinned-foods');
      if (stored) pinnedFoodIds = new Set(JSON.parse(stored));
    } catch {}
    loadFoods();
    mealStore.load();
  });

  function loadFoods() {
    foodStore.load({
      search,
      category,
      page: foodPage,
      limit: PAGE_SIZE,
      scope: customOnly ? 'custom' : undefined,
    });
  }
  function toggleCustomOnly() {
    customOnly = !customOnly;
    foodPage = 1;
    loadFoods();
  }
  function handleSearch() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => { foodPage = 1; loadFoods(); }, 300);
  }
  function clearSearch() { search = ''; foodPage = 1; loadFoods(); }
  function selectCategory(cat) {
    category = cat === 'All' ? '' : cat;
    foodPage = 1;
    loadFoods();
  }
  function clearAllFilters() { search = ''; category = ''; customOnly = false; foodPage = 1; loadFoods(); }
  function toggleSort(key) {
    if (sortBy === key) sortDir = sortDir === 'asc' ? 'desc' : 'asc';
    else { sortBy = key; sortDir = key === 'name' ? 'asc' : 'desc'; }
  }
  function selectMealSort(key) {
    if (mealSort === key) {
      mealSortDir = mealSortDir === 'asc' ? 'desc' : 'asc';
    } else {
      mealSort = key;
      mealSortDir = key === 'name' ? 'asc' : 'desc';
    }
  }
  function clearMealQuery() { mealQuery = ''; }
  function togglePin(id, e) {
    e?.stopPropagation?.();
    const next = new Set(pinnedFoodIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    pinnedFoodIds = next;
    try { localStorage.setItem('macrox-pinned-foods', JSON.stringify([...next])); } catch {}
  }
  function prevPage() { if (foodPage > 1) { foodPage--; loadFoods(); } }
  function nextPage() {
    const pages = $foodStore.pagination?.pages || 1;
    if (foodPage < pages) { foodPage++; loadFoods(); }
  }

  // ── Food CRUD ──
  function openAddFood() {
    foodMode = 'add';
    editingFoodId = null;
    newFood = { name: '', protein: 0, totalCarbs: 0, fiber: 0, fat: 0, calories: 0, category: 'Protein' };
    showFoodModal = true;
  }
  function openEditFood(food) {
    foodMode = 'edit';
    editingFoodId = food._id;
    newFood = {
      name: food.name,
      protein: Math.round((food.protein || 0) * 10) / 10,
      totalCarbs: Math.round((food.totalCarbs || 0) * 10) / 10,
      fiber: Math.round((food.fiber || 0) * 10) / 10,
      fat: Math.round((food.fat || 0) * 10) / 10,
      calories: Math.round(food.calories || 0),
      category: food.category,
    };
    showFoodModal = true;
  }
  async function saveFood(e) {
    e.preventDefault();
    try {
      if (foodMode === 'edit') {
        await foodStore.update(editingFoodId, newFood);
        showFoodModal = false;
        showToast(`${newFood.name} updated`);
        return;
      }
      const name = newFood.name.trim().toLowerCase();
      const dup = $foodStore.foods.find(f => f.name.toLowerCase() === name);
      if (dup) { pendingDuplicate = { ...newFood }; return; }
      await foodStore.create(newFood);
      showFoodModal = false;
      showToast(`${newFood.name} added`);
    } catch (err) { showToast(err.message, 'error'); }
  }
  async function confirmDuplicate() {
    if (!pendingDuplicate) return;
    try {
      await foodStore.create(pendingDuplicate);
      const name = pendingDuplicate.name;
      pendingDuplicate = null;
      showFoodModal = false;
      showToast(`${name} added`);
    } catch (err) {
      showToast(err.message, 'error');
      pendingDuplicate = null;
    }
  }
  function askDeleteFood(food) {
    openConfirm({
      title: 'Delete food?',
      message: `Delete "${food.name}"?`,
      warning: 'This cannot be undone.',
      confirmText: 'Delete',
      danger: true,
      onConfirm: async () => {
        try {
          await foodStore.remove(food._id);
          if (pinnedFoodIds.has(food._id)) togglePin(food._id);
          showToast(`${food.name} deleted`);
        } catch (err) { showToast(err.message, 'error'); }
      },
    });
  }

  // ── Meal CRUD ──
  function openAddMeal() {
    mealMode = 'add';
    editingMealId = null;
    mealName = '';
    mealItems = [];
    mealSearch = '';
    showMealModal = true;
  }
  function openEditMeal(meal, e) {
    e?.stopPropagation?.();
    mealMode = 'edit';
    editingMealId = meal._id;
    mealName = meal.name;
    mealItems = (meal.items || []).map(item => {
      const populated = typeof item.foodId === 'object' && item.foodId !== null;
      const foodId = populated ? item.foodId._id : item.foodId;
      const food = populated
        ? item.foodId
        : ($foodStore.foods.find(f => f._id === foodId) || { _id: foodId, name: 'Unknown', calories: 0, protein: 0, netCarbs: 0, fat: 0 });
      return { foodId, food, quantity: item.quantity };
    });
    mealSearch = '';
    showMealModal = true;
  }
  function addFoodToMeal(food) {
    const ex = mealItems.find(i => i.foodId === food._id);
    if (ex) mealItems = mealItems.map(i => i.foodId === food._id ? { ...i, quantity: i.quantity + 100 } : i);
    else mealItems = [...mealItems, { foodId: food._id, food, quantity: 100 }];
  }
  function removeMealItem(foodId) { mealItems = mealItems.filter(i => i.foodId !== foodId); }
  function updateMealQty(foodId, qty) {
    mealItems = mealItems.map(i => i.foodId === foodId ? { ...i, quantity: Math.max(1, qty || 1) } : i);
  }

  async function saveMeal(e) {
    e.preventDefault();
    if (!mealName || mealItems.length === 0) return;
    savingMeal = true;
    try {
      const payload = { name: mealName, items: mealItems.map(i => ({ foodId: i.foodId, quantity: i.quantity })) };
      if (mealMode === 'edit') {
        await mealStore.update(editingMealId, payload);
        showToast(`${mealName} updated`);
      } else {
        await mealStore.create(payload);
        showToast(`${mealName} saved`);
      }
      showMealModal = false;
    } catch (err) { showToast(err.message, 'error'); }
    savingMeal = false;
  }
  function askDeleteMeal(meal, e) {
    e?.stopPropagation?.();
    openConfirm({
      title: 'Delete meal?',
      message: `Delete "${meal.name}"?`,
      warning: 'This cannot be undone.',
      confirmText: 'Delete',
      danger: true,
      onConfirm: async () => {
        try {
          await mealStore.remove(meal._id);
          if (expandedMealId === meal._id) expandedMealId = null;
          showToast(`${meal.name} deleted`);
        } catch (err) { showToast(err.message, 'error'); }
      },
    });
  }
  function toggleExpand(id) { expandedMealId = expandedMealId === id ? null : id; }

  function itemContribution(item) {
    const populated = typeof item.foodId === 'object' && item.foodId !== null;
    const food = populated ? item.foodId : $foodStore.foods.find(f => f._id === item.foodId);
    const mult = item.quantity / 100;
    return {
      name: food?.name || 'Unknown',
      calories: Math.round((food?.calories || 0) * mult),
      protein: Math.round((food?.protein || 0) * mult * 10) / 10,
      netCarbs: Math.round((food?.netCarbs || 0) * mult * 10) / 10,
      fat: Math.round((food?.fat || 0) * mult * 10) / 10,
    };
  }

  // ── Confirm + toast ──
  function openConfirm(cfg) {
    confirmState = { open: true, title: '', message: '', warning: '', confirmText: 'Confirm', danger: false, onConfirm: null, ...cfg };
  }
  function closeConfirm() { confirmState = { ...confirmState, open: false, onConfirm: null }; }
  async function executeConfirm() {
    const cb = confirmState.onConfirm;
    closeConfirm();
    if (cb) await cb();
  }
  function showToast(message, type = 'success') {
    if (toastTimeout) clearTimeout(toastTimeout);
    toast = { visible: true, message, type };
    toastTimeout = setTimeout(() => (toast = { ...toast, visible: false }), 3000);
  }
</script>

<svelte:head><title>Foods & Meals — MacroX</title></svelte:head>

<!-- Stat snippet — number on top, tiny uppercase unit beneath -->
{#snippet stat(value, unit, color = null, big = false)}
  <span class="stat" class:stat-big={big}>
    <span class="stat-n mono" style={color ? `color: ${color}` : ''}>{value}</span>
    <span class="stat-u">{unit}</span>
  </span>
{/snippet}

<div class="page-container">
  <div class="top-bar animate-slide-up">
    <div>
      <h1 class="page-title">Foods & Meals</h1>
      <p class="page-subtitle">Your ingredient database and meal combos</p>
    </div>
    <div class="top-actions">
      {#if activeTab === 'foods'}
        <button class="btn btn-primary btn-sm" onclick={openAddFood}><Plus size={14} strokeWidth={1.5} />Add Food</button>
      {:else}
        <button class="btn btn-primary btn-sm" onclick={openAddMeal}><Plus size={14} strokeWidth={1.5} />New Meal</button>
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
    <!-- Foods filter row: chips left, search right -->
    <div class="filter-row animate-slide-up stagger-2">
      <div class="chips">
        {#each categories as cat}
          <button class="chip" class:active={category === (cat === 'All' ? '' : cat)} onclick={() => selectCategory(cat)}>{cat}</button>
        {/each}
        <span class="chip-divider" aria-hidden="true"></span>
        <button
          class="chip chip-mine"
          class:active={customOnly}
          onclick={toggleCustomOnly}
          type="button"
          title="Show only foods you've created"
        >
          <span class="chip-mine-dot" aria-hidden="true"></span>
          My foods
        </button>
      </div>
      <div class="search-box">
        <Search size={13} strokeWidth={1.5} />
        <input type="text" class="search-input" placeholder="Search foods…" bind:value={search} oninput={handleSearch} />
        {#if search}
          <button class="search-clear" onclick={clearSearch} aria-label="Clear search" type="button">
            <X size={12} strokeWidth={1.5} />
          </button>
        {/if}
      </div>
    </div>

    {#if $foodStore.loading}
      <div class="skeleton" style="height: 400px;"></div>
    {:else if sortedFoods.length === 0}
      <div class="empty-state">
        <p class="empty-state-text">{search || category ? 'No foods match your filters.' : 'No foods yet.'}</p>
        {#if search || category}
          <button class="btn btn-ghost btn-sm" onclick={clearAllFilters}>Clear filters</button>
        {/if}
      </div>
    {:else}
      <div class="food-table animate-slide-up stagger-3">
        <div class="table-head">
          <span class="th pin-col"></span>
          <button class="th th-sort name-col" onclick={() => toggleSort('name')} type="button">
            <span>Name</span>
            {#if sortBy === 'name'}{#if sortDir === 'asc'}<ArrowUp size={10} strokeWidth={2} />{:else}<ArrowDown size={10} strokeWidth={2} />{/if}{/if}
          </button>
          <button class="th th-sort num cal-col" onclick={() => toggleSort('calories')} type="button">
            {#if sortBy === 'calories'}{#if sortDir === 'asc'}<ArrowUp size={10} strokeWidth={2} />{:else}<ArrowDown size={10} strokeWidth={2} />{/if}{/if}
            <span>Calories</span>
          </button>
          <button class="th th-sort num pro-col" onclick={() => toggleSort('protein')} type="button">
            {#if sortBy === 'protein'}{#if sortDir === 'asc'}<ArrowUp size={10} strokeWidth={2} />{:else}<ArrowDown size={10} strokeWidth={2} />{/if}{/if}
            <span>Protein</span>
          </button>
          <button class="th th-sort num carb-col" onclick={() => toggleSort('netCarbs')} type="button">
            {#if sortBy === 'netCarbs'}{#if sortDir === 'asc'}<ArrowUp size={10} strokeWidth={2} />{:else}<ArrowDown size={10} strokeWidth={2} />{/if}{/if}
            <span>Carbs</span>
          </button>
          <button class="th th-sort num fat-col" onclick={() => toggleSort('fat')} type="button">
            {#if sortBy === 'fat'}{#if sortDir === 'asc'}<ArrowUp size={10} strokeWidth={2} />{:else}<ArrowDown size={10} strokeWidth={2} />{/if}{/if}
            <span>Fat</span>
          </button>
          <button class="th th-sort num fiber-col" onclick={() => toggleSort('fiber')} type="button">
            {#if sortBy === 'fiber'}{#if sortDir === 'asc'}<ArrowUp size={10} strokeWidth={2} />{:else}<ArrowDown size={10} strokeWidth={2} />{/if}{/if}
            <span>Fiber</span>
          </button>
          <span class="th act-col"></span>
        </div>
        {#each sortedFoods as food, i (food._id)}
          {@const dom = dominantMacro(food.protein, food.netCarbs, food.fat)}
          <div class="food-row" style="animation-delay: {Math.min(i * 12, 200)}ms">
            <button
              class="pin-btn pin-col"
              class:pin-active={pinnedFoodIds.has(food._id)}
              onclick={(e) => togglePin(food._id, e)}
              aria-label={pinnedFoodIds.has(food._id) ? 'Unpin' : 'Pin'}
              type="button"
            >
              <Star size={12} strokeWidth={1.5} fill={pinnedFoodIds.has(food._id) ? 'currentColor' : 'none'} />
            </button>
            <div class="fr-name name-col">
              <div class="fr-name-line">
                <span class="fr-name-text">{food.name}</span>
                {#if !food.isDefault}<span class="custom-dot" title="Custom food"></span>{/if}
              </div>
              <div class="fr-meta">
                <span class="fr-cat">{food.category}</span>
                {#if dom}<span class="fr-dot">·</span><span class="fr-dom">{dom}</span>{/if}
              </div>
            </div>
            <div class="fr-stat-cell cal-col">
              {@render stat(fmtInt(food.calories), 'kcal', null, true)}
            </div>
            <div class="fr-stat-cell pro-col">
              {@render stat(fmt(food.protein), 'g protein', 'var(--pro)')}
            </div>
            <div class="fr-stat-cell carb-col">
              {@render stat(fmt(food.netCarbs), 'g carbs', 'var(--carb)')}
            </div>
            <div class="fr-stat-cell fat-col">
              {@render stat(fmt(food.fat), 'g fat', 'var(--fat)')}
            </div>
            <div class="fr-stat-cell fiber-col">
              {@render stat(fmt(food.fiber), 'g fiber')}
            </div>
            <span class="td act act-col">
              {#if !food.isDefault}
                <button class="row-act" onclick={() => openEditFood(food)} aria-label="Edit" type="button"><Pencil size={12} strokeWidth={1.5} /></button>
                <button class="row-act row-act-del" onclick={() => askDeleteFood(food)} aria-label="Delete" type="button"><Trash2 size={12} strokeWidth={1.5} /></button>
              {/if}
            </span>
          </div>
        {/each}
      </div>

      {#if $foodStore.pagination && $foodStore.pagination.pages > 1}
        <div class="pager">
          <button class="btn btn-ghost btn-sm" onclick={prevPage} disabled={foodPage === 1} type="button">Previous</button>
          <span class="pager-info">Page <span class="mono">{foodPage}</span> of <span class="mono">{$foodStore.pagination.pages}</span></span>
          <button class="btn btn-ghost btn-sm" onclick={nextPage} disabled={foodPage >= $foodStore.pagination.pages} type="button">Next</button>
        </div>
      {/if}
    {/if}

  {:else}
    <!-- Meals filter row: sort chips left, search right -->
    <div class="filter-row animate-slide-up stagger-2">
      <div class="chips chips-sort">
        <span class="chips-prefix">Sort</span>
        {#each mealSortOptions as opt}
          <button
            class="chip chip-sort"
            class:active={mealSort === opt.key}
            onclick={() => selectMealSort(opt.key)}
            type="button"
          >
            <span>{opt.label}</span>
            {#if mealSort === opt.key}
              {#if mealSortDir === 'asc'}<ArrowUp size={9} strokeWidth={2} />{:else}<ArrowDown size={9} strokeWidth={2} />{/if}
            {/if}
          </button>
        {/each}
      </div>
      <div class="search-box">
        <Search size={13} strokeWidth={1.5} />
        <input type="text" class="search-input" placeholder="Search meals…" bind:value={mealQuery} />
        {#if mealQuery}
          <button class="search-clear" onclick={clearMealQuery} aria-label="Clear search" type="button">
            <X size={12} strokeWidth={1.5} />
          </button>
        {/if}
      </div>
    </div>

    {#if $mealStore.loading}
      <div class="skeleton" style="height: 200px;"></div>
    {:else if $mealStore.meals.length === 0}
      <div class="empty-state">
        <p class="empty-state-text">No meals yet.</p>
        <button class="btn btn-primary btn-sm" onclick={openAddMeal}>Create your first</button>
      </div>
    {:else if filteredMeals.length === 0}
      <div class="empty-state">
        <p class="empty-state-text">No meals match "<strong>{mealQuery}</strong>"</p>
        <button class="btn btn-ghost btn-sm" onclick={clearMealQuery}>Clear search</button>
      </div>
    {:else}
      <div class="meal-list animate-slide-up stagger-3">
        {#each filteredMeals as meal, i (meal._id)}
          {@const tm = meal.totalMacros || {}}
          {@const dom = dominantMacro(tm.protein, tm.netCarbs, tm.fat)}
          <article class="meal-card" class:meal-card-open={expandedMealId === meal._id} style="animation-delay: {i * 30}ms">
            <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
            <div
              class="mc-head"
              onclick={() => toggleExpand(meal._id)}
              role="button"
              tabindex="0"
              onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleExpand(meal._id); } }}
            >
              <span class="mc-chev" class:mc-chev-open={expandedMealId === meal._id}>
                <ChevronDown size={14} strokeWidth={1.5} />
              </span>
              <div class="mc-name-block">
                <h3 class="mc-name">{meal.name}</h3>
                <div class="mc-meta">
                  {#if dom}<span class="mc-dom">{dom}</span><span class="mc-dot">·</span>{/if}
                  <span>{meal.items?.length || 0} {meal.items?.length === 1 ? 'item' : 'items'}</span>
                </div>
              </div>
              <div class="mc-stats">
                <div class="mc-stat-cell">
                  {@render stat(fmtInt(tm.calories), 'kcal', null, true)}
                </div>
                <div class="mc-stat-cell mc-stat-cell-narrow">
                  {@render stat(fmt(tm.protein), 'g protein', 'var(--pro)')}
                </div>
                <div class="mc-stat-cell mc-stat-cell-narrow">
                  {@render stat(fmt(tm.netCarbs), 'g carbs', 'var(--carb)')}
                </div>
                <div class="mc-stat-cell mc-stat-cell-narrow">
                  {@render stat(fmt(tm.fat), 'g fat', 'var(--fat)')}
                </div>
              </div>
              <div class="mc-actions">
                <button class="row-act" onclick={(e) => openEditMeal(meal, e)} aria-label="Edit meal" type="button"><Pencil size={13} strokeWidth={1.5} /></button>
                <button class="row-act row-act-del" onclick={(e) => askDeleteMeal(meal, e)} aria-label="Delete meal" type="button"><Trash2 size={13} strokeWidth={1.5} /></button>
              </div>
            </div>

            {#if expandedMealId === meal._id}
              <div class="mc-items animate-fade-in">
                <div class="mci-head">
                  <span>Ingredients</span>
                </div>
                {#each (meal.items || []) as item, idx (idx)}
                  {@const c = itemContribution(item)}
                  <div class="mci">
                    <div class="mci-info">
                      <span class="mci-name">{c.name}</span>
                      <span class="mci-qty mono">{item.quantity}<span class="mci-qty-u">g</span></span>
                    </div>
                    <div class="mci-vals">
                      <span class="mono mci-cal">{c.calories}</span><span class="mci-u">kcal</span>
                      <span class="mci-vsep"></span>
                      <span class="mono" style="color: var(--pro)">{fmt(c.protein)}</span><span class="mci-u">P</span>
                      <span class="mono" style="color: var(--carb)">{fmt(c.netCarbs)}</span><span class="mci-u">C</span>
                      <span class="mono" style="color: var(--fat)">{fmt(c.fat)}</span><span class="mci-u">F</span>
                    </div>
                  </div>
                {/each}
              </div>
            {/if}
          </article>
        {/each}
      </div>
    {/if}
  {/if}
</div>

<!-- ─── Add / Edit Food Modal ─── -->
{#if showFoodModal}
  <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions a11y_no_noninteractive_element_interactions -->
  <div class="modal-overlay" onclick={() => showFoodModal = false}>
    <form
      class="modal-content food-modal"
      onclick={(e) => e.stopPropagation()}
      onsubmit={saveFood}
    >
      <header class="fm-head">
        <div>
          <h2 class="fm-title">{foodMode === 'edit' ? 'Edit Food' : 'New Food'}</h2>
          <p class="fm-sub">All values per 100g</p>
        </div>
        <button class="fm-close" type="button" onclick={() => showFoodModal = false} aria-label="Close"><X size={16} strokeWidth={1.5} /></button>
      </header>

      <div class="fm-id">
        <label class="fm-field">
          <span class="fm-flabel">Name</span>
          <input class="fm-input fm-input-lg" type="text" bind:value={newFood.name} placeholder="Wild salmon" required />
        </label>
        <label class="fm-field fm-field-cat">
          <span class="fm-flabel">Category</span>
          <select class="fm-input" bind:value={newFood.category}>
            {#each categories.slice(1) as c}<option value={c}>{c}</option>{/each}
          </select>
        </label>
      </div>

      <div class="fm-divider"></div>

      <div class="fm-macros">
        <label class="fm-mac">
          <span class="fm-mac-label">Calories</span>
          <input class="fm-mac-input mono" type="number" bind:value={newFood.calories} min="0" />
          <span class="fm-mac-unit">kcal</span>
        </label>
        <label class="fm-mac">
          <span class="fm-mac-label" style="color: var(--pro)">Protein</span>
          <input class="fm-mac-input mono" type="number" bind:value={newFood.protein} min="0" step="0.1" />
          <span class="fm-mac-unit">g</span>
        </label>
        <label class="fm-mac">
          <span class="fm-mac-label" style="color: var(--carb)">Carbs</span>
          <input class="fm-mac-input mono" type="number" bind:value={newFood.totalCarbs} min="0" step="0.1" />
          <span class="fm-mac-unit">g</span>
        </label>
        <label class="fm-mac">
          <span class="fm-mac-label">Fiber</span>
          <input class="fm-mac-input mono" type="number" bind:value={newFood.fiber} min="0" step="0.1" />
          <span class="fm-mac-unit">g</span>
        </label>
        <label class="fm-mac">
          <span class="fm-mac-label" style="color: var(--fat)">Fat</span>
          <input class="fm-mac-input mono" type="number" bind:value={newFood.fat} min="0" step="0.1" />
          <span class="fm-mac-unit">g</span>
        </label>
      </div>

      <footer class="fm-foot">
        <button type="button" class="btn btn-ghost" onclick={() => showFoodModal = false}>Cancel</button>
        <button type="submit" class="btn btn-primary">{foodMode === 'edit' ? 'Save changes' : 'Add food'}</button>
      </footer>
    </form>
  </div>
{/if}

<!-- ─── Add / Edit Meal Modal ─── -->
{#if showMealModal}
  <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions a11y_no_noninteractive_element_interactions -->
  <div class="modal-overlay" onclick={() => showMealModal = false}>
    <form
      class="modal-content meal-modal"
      onclick={(e) => e.stopPropagation()}
      onsubmit={saveMeal}
    >
      <header class="mb-head">
        <div>
          <h2 class="fm-title">{mealMode === 'edit' ? 'Edit Meal' : 'New Meal'}</h2>
          <p class="fm-sub">Combine foods into a reusable meal</p>
        </div>
        <button class="fm-close" type="button" onclick={() => showMealModal = false} aria-label="Close"><X size={16} strokeWidth={1.5} /></button>
      </header>

      <div class="mb-name">
        <input class="fm-input fm-input-lg" type="text" placeholder="Meal name" bind:value={mealName} required />
      </div>

      <div class="mb-body">
        <section class="mb-pane mb-picker">
          <span class="mb-section-label">Foods</span>
          <div class="mb-search">
            <Search size={13} strokeWidth={1.5} />
            <input class="mb-search-input" type="text" placeholder="Search…" bind:value={mealSearch} />
          </div>
          <div class="mb-pal">
            {#each filteredBuilderFoods as food (food._id)}
              <button type="button" class="pal-item" onclick={() => addFoodToMeal(food)}>
                {#if pinnedFoodIds.has(food._id)}
                  <span class="pal-pin"><Star size={9} strokeWidth={1.5} fill="currentColor" /></span>
                {/if}
                <span class="pal-name">{food.name}</span>
                <span class="pal-cal mono">{fmtInt(food.calories)}</span>
              </button>
            {/each}
          </div>
        </section>

        <div class="mb-divider" aria-hidden="true"></div>

        <section class="mb-pane mb-meal">
          <span class="mb-section-label">In this meal</span>
          {#if mealItems.length === 0}
            <div class="mb-empty">
              <UtensilsCrossed size={24} strokeWidth={1.2} />
              <p class="mb-empty-text">Click foods to add</p>
            </div>
          {:else}
            {@const tSplit = macroSplit(mealTotals.protein, mealTotals.netCarbs, mealTotals.fat)}
            <div class="mb-items">
              {#each mealItems as item (item.foodId)}
                <div class="mbi">
                  <div class="mbi-top">
                    <span class="mbi-name">{item.food.name}</span>
                    <div class="mbi-qty-group">
                      <input
                        type="number"
                        class="mbi-qty-input mono"
                        value={item.quantity}
                        oninput={(e) => updateMealQty(item.foodId, Number(e.target.value))}
                        min="1"
                      />
                      <span class="mbi-qty-u">g</span>
                    </div>
                    <button type="button" class="mbi-rm" onclick={() => removeMealItem(item.foodId)} aria-label="Remove"><X size={12} strokeWidth={1.5} /></button>
                  </div>
                  <div class="mbi-presets">
                    {#each [50, 100, 150, 200] as p}
                      <button type="button" class="qty-preset" class:qty-preset-active={item.quantity === p} onclick={() => updateMealQty(item.foodId, p)}>{p}</button>
                    {/each}
                  </div>
                </div>
              {/each}
            </div>

            <div class="mb-totals">
              <div class="macro-bar mb-totals-bar">
                <div class="mb-pro" style="width: {tSplit.p}%"></div>
                <div class="mb-carb" style="width: {tSplit.c}%"></div>
                <div class="mb-fat" style="width: {tSplit.f}%"></div>
              </div>
              <div class="mb-totals-nums">
                <div class="mbt"><span class="mbt-n mono" style="color: var(--cal)">{mealTotals.calories}</span><span class="mbt-u">kcal</span></div>
                <div class="mbt"><span class="mbt-n mono" style="color: var(--pro)">{fmt(mealTotals.protein)}</span><span class="mbt-u">P</span></div>
                <div class="mbt"><span class="mbt-n mono" style="color: var(--carb)">{fmt(mealTotals.netCarbs)}</span><span class="mbt-u">C</span></div>
                <div class="mbt"><span class="mbt-n mono" style="color: var(--fat)">{fmt(mealTotals.fat)}</span><span class="mbt-u">F</span></div>
              </div>
            </div>
          {/if}
        </section>
      </div>

      <footer class="fm-foot">
        <button type="button" class="btn btn-ghost" onclick={() => showMealModal = false}>Cancel</button>
        <button type="submit" class="btn btn-primary" disabled={savingMeal || mealItems.length === 0 || !mealName}>
          {savingMeal ? 'Saving…' : (mealMode === 'edit' ? 'Save changes' : 'Save meal')}
        </button>
      </footer>
    </form>
  </div>
{/if}

<!-- Duplicate detection -->
<ConfirmModal
  open={!!pendingDuplicate}
  title="Food already exists"
  message={pendingDuplicate ? `A food named "${pendingDuplicate.name}" is already in your library. Add it again?` : ''}
  confirmText="Add anyway"
  onconfirm={confirmDuplicate}
  oncancel={() => pendingDuplicate = null}
/>

<!-- Confirm -->
<ConfirmModal
  open={confirmState.open}
  title={confirmState.title}
  message={confirmState.message}
  warning={confirmState.warning}
  confirmText={confirmState.confirmText}
  danger={confirmState.danger}
  onconfirm={executeConfirm}
  oncancel={closeConfirm}
/>

<!-- Toast -->
{#if toast.visible}
  <div class="toast-container">
    <div class="app-toast app-toast-{toast.type}" role="alert">
      <span class="app-toast-icon">
        <Check size={16} strokeWidth={2.5} />
      </span>
      <span>{toast.message}</span>
    </div>
  </div>
{/if}

<style>
  .top-bar { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--space-5); }
  .top-actions { display: flex; gap: var(--space-2); }

  /* ─── Tabs ─── */
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

  /* ─── Filter row (chips + search) ─── */
  .filter-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-4);
    margin-bottom: var(--space-5);
    flex-wrap: wrap;
  }

  .chips {
    display: flex; gap: var(--space-1); flex-wrap: wrap;
    flex: 1 1 auto; min-width: 0;
    align-items: center;
  }
  .chips-prefix {
    font-size: 11px;
    color: var(--text-3);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-weight: 500;
    margin-right: var(--space-2);
  }
  .chip {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 4px 12px;
    background: transparent; border: var(--border-width) solid var(--border);
    border-radius: var(--radius-full);
    font-size: var(--font-sm); font-weight: 400;
    color: var(--text-2); cursor: pointer; font-family: var(--font-sans);
    transition: all var(--transition-fast);
    letter-spacing: -0.01em;
  }
  .chip:hover { border-color: var(--border-strong); color: var(--text-0); }
  .chip.active { background: var(--text-0); color: var(--bg-0); border-color: var(--text-0); }

  .chip-divider {
    width: 1px;
    height: 14px;
    background: var(--border);
    margin: 0 var(--space-1);
    align-self: center;
  }
  .chip-mine .chip-mine-dot {
    display: inline-block;
    width: 5px; height: 5px;
    border-radius: 50%;
    background: var(--cal);
    opacity: 0.85;
  }
  .chip-mine.active .chip-mine-dot { background: var(--bg-0); opacity: 1; }

  .search-box {
    display: flex; align-items: center; gap: var(--space-2);
    background: var(--bg-2); border: var(--border-width) solid var(--border);
    border-radius: var(--radius-md);
    padding: 0 var(--space-3);
    width: 240px;
    color: var(--text-3);
    transition: border-color var(--transition-fast);
    flex-shrink: 0;
  }
  .search-box:focus-within { border-color: var(--border-strong); }
  .search-input {
    background: none; border: none; color: var(--text-0); font-family: var(--font-sans);
    font-size: var(--font-sm); padding: 7px 0; flex: 1; outline: none; min-width: 0;
  }
  .search-input::placeholder { color: var(--text-3); }
  .search-clear {
    background: none; border: none; color: var(--text-3); cursor: pointer;
    display: flex; padding: 2px; border-radius: var(--radius-sm);
    transition: color var(--transition-fast);
  }
  .search-clear:hover { color: var(--text-1); }

  /* ─── Stat snippet (number + tiny unit beneath) ─── */
  .stat {
    display: flex; flex-direction: column; align-items: flex-end;
    gap: 1px;
  }
  .stat-n {
    font-size: var(--font-base);
    font-weight: 500;
    color: var(--text-0);
    letter-spacing: -0.025em;
    line-height: 1.1;
  }
  .stat-big .stat-n {
    font-size: var(--font-md);
    font-weight: 600;
  }
  .stat-u {
    font-size: 9px;
    color: var(--text-3);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    font-weight: 500;
    line-height: 1;
  }

  /* ─── Food table ─── */
  .food-table { width: 100%; }
  .table-head, .food-row {
    display: grid;
    grid-template-columns: 24px 1fr 80px 80px 80px 80px 80px 56px;
    gap: var(--space-3);
    padding: 0 var(--space-3);
    align-items: center;
  }
  .table-head {
    position: sticky;
    top: 0;
    padding: var(--space-3) var(--space-3);
    border-bottom: var(--border-width) solid var(--border);
    background: var(--bg-0);
    z-index: 5;
    backdrop-filter: blur(8px);
  }
  .th {
    font-size: 11px; color: var(--text-3);
    text-transform: uppercase; letter-spacing: 0.08em;
    font-weight: 500;
    display: flex; align-items: center;
  }
  .th-sort {
    background: none; border: none; cursor: pointer;
    font-family: var(--font-sans);
    font-size: 11px; color: var(--text-3);
    text-transform: uppercase; letter-spacing: 0.08em;
    font-weight: 500; padding: 0; gap: 4px;
    transition: color var(--transition-fast);
  }
  .th-sort:hover { color: var(--text-1); }
  .th.num, .fr-stat-cell { justify-content: flex-end; }

  .food-row {
    padding: 12px var(--space-3);
    transition: background var(--transition-fast);
    animation: slideUp 200ms ease both;
    border-bottom: 1px solid var(--surface-border);
  }
  .food-row:hover { background: var(--bg-hover); }

  .fr-name {
    display: flex; flex-direction: column; gap: 3px;
    min-width: 0;
  }
  .fr-name-line {
    display: flex; align-items: center; gap: var(--space-2);
    min-width: 0;
  }
  .fr-name-text {
    font-size: var(--font-md);
    font-weight: 500;
    color: var(--text-0);
    letter-spacing: -0.025em;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .custom-dot {
    width: 5px; height: 5px; border-radius: 50%;
    background: var(--cal); opacity: 0.85; flex-shrink: 0;
  }
  .fr-meta {
    display: flex; align-items: center; gap: 6px;
    font-size: 10px;
    color: var(--text-3);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-weight: 500;
  }
  .fr-cat { color: var(--text-2); }
  .fr-dot { color: var(--text-3); opacity: 0.6; }
  .fr-dom {}

  .fr-stat-cell {
    display: flex;
    justify-content: flex-end;
  }

  .pin-btn {
    background: none; border: none; cursor: pointer;
    color: var(--text-3);
    display: flex; align-items: center; justify-content: center;
    padding: 3px;
    border-radius: var(--radius-sm);
    transition: color var(--transition-fast);
  }
  .pin-btn:hover { color: var(--text-1); }
  .pin-active { color: var(--cal); }
  .pin-active:hover { color: var(--cal); }

  .row-act {
    background: none; border: none; color: var(--text-3); cursor: pointer;
    display: flex; padding: 5px; border-radius: var(--radius-sm);
    opacity: 0;
    transition: all var(--transition-fast);
  }
  .food-row:hover .row-act,
  .meal-card:hover .row-act,
  .row-act:focus-visible { opacity: 1; }
  .row-act:hover { color: var(--text-0); background: var(--bg-hover); }
  .row-act-del:hover { color: var(--danger); background: var(--danger-bg); }
  .td.act { display: flex; justify-content: flex-end; gap: 2px; }

  /* ─── Pagination ─── */
  .pager {
    display: flex; justify-content: center; align-items: center;
    gap: var(--space-5); margin-top: var(--space-5); padding-top: var(--space-4);
  }
  .pager-info { font-size: var(--font-sm); color: var(--text-2); }

  /* ─── Meal cards ─── */
  .meal-list { display: flex; flex-direction: column; gap: var(--space-2); }
  .meal-card {
    position: relative;
    border: 1px solid var(--surface-border);
    border-radius: var(--radius-lg);
    transition: border-color var(--transition-base), background var(--transition-base);
    animation: slideUp 250ms ease both;
    overflow: hidden;
  }
  .meal-card:hover { border-color: var(--border); }
  .meal-card-open {
    border-color: var(--border-strong);
    background: var(--bg-hover);
  }

  .mc-head {
    display: grid;
    grid-template-columns: 16px 1fr auto auto;
    gap: var(--space-5);
    align-items: center;
    padding: var(--space-4) var(--space-5);
    cursor: pointer;
    user-select: none;
  }

  .mc-chev {
    color: var(--text-3); display: flex;
    transition: transform 200ms ease, color var(--transition-fast);
    transform: rotate(-90deg);
  }
  .mc-chev-open { transform: rotate(0deg); color: var(--text-0); }

  .mc-name-block { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
  .mc-name {
    font-size: var(--font-lg);
    font-weight: 600;
    letter-spacing: -0.025em;
    color: var(--text-0);
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .mc-meta {
    font-size: 10px;
    color: var(--text-3);
    display: flex; align-items: center; gap: 6px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-weight: 500;
  }
  .mc-dom { color: var(--text-2); }
  .mc-dot { color: var(--text-3); opacity: 0.6; }

  .mc-stats {
    display: grid;
    grid-template-columns: repeat(4, auto);
    gap: var(--space-5);
    align-items: center;
  }
  .mc-stat-cell { display: flex; justify-content: flex-end; }
  .mc-stat-cell-narrow .stat-n { font-size: var(--font-base); }

  .mc-actions { display: flex; gap: 2px; }

  .mc-items {
    display: flex; flex-direction: column;
    padding: 0 var(--space-5) var(--space-4) calc(var(--space-5) + 28px);
    border-top: 1px solid var(--surface-border);
    background: transparent;
  }
  .mci-head {
    font-size: 10px;
    color: var(--text-3);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    font-weight: 500;
    padding: var(--space-3) 0 var(--space-2);
  }
  .mci {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: var(--space-4);
    padding: 8px 0;
    align-items: center;
    border-top: 1px solid var(--surface-border);
  }
  .mci-info { display: flex; align-items: baseline; gap: var(--space-3); min-width: 0; }
  .mci-name {
    font-size: var(--font-sm);
    font-weight: 500;
    color: var(--text-1);
    letter-spacing: -0.01em;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    flex: 1; min-width: 0;
  }
  .mci-qty {
    font-size: var(--font-xs);
    color: var(--text-3);
    flex-shrink: 0;
  }
  .mci-qty-u { margin-left: 1px; font-size: 10px; opacity: 0.8; }

  .mci-vals {
    display: flex; align-items: baseline;
    font-size: var(--font-xs);
    gap: 0;
  }
  .mci-vals .mono {
    font-size: var(--font-sm);
    font-weight: 500;
    margin-left: var(--space-3);
  }
  .mci-vals .mono:first-child { margin-left: 0; }
  .mci-cal { color: var(--text-0); }
  .mci-u {
    font-size: 10px;
    color: var(--text-3);
    margin-left: 3px;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    font-weight: 500;
  }
  .mci-vsep {
    width: 1px; height: 12px;
    background: var(--border);
    margin: 0 var(--space-3);
    opacity: 0.5;
  }

  /* ─── Modal styling (kept from previous design — user liked these) ─── */
  .food-modal, .meal-modal {
    max-width: 540px;
    padding: var(--space-6) var(--space-6) var(--space-5);
    display: flex;
    flex-direction: column;
    gap: var(--space-5);
  }
  .meal-modal { max-width: 760px; }

  .fm-head, .mb-head {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: var(--space-4);
  }
  .fm-title { font-size: var(--font-xl); font-weight: 600; letter-spacing: -0.025em; }
  .fm-sub { font-size: var(--font-xs); color: var(--text-3); margin-top: 2px; letter-spacing: 0.02em; }
  .fm-close {
    background: none; border: none; cursor: pointer; color: var(--text-3);
    padding: 4px; display: flex; border-radius: var(--radius-sm);
    transition: all var(--transition-fast);
  }
  .fm-close:hover { color: var(--text-0); background: var(--bg-hover); }

  .fm-id {
    display: grid;
    grid-template-columns: 1fr 160px;
    gap: var(--space-4);
  }
  .fm-field { display: flex; flex-direction: column; gap: 6px; }
  .fm-flabel {
    font-size: 11px; color: var(--text-3);
    text-transform: uppercase; letter-spacing: 0.06em;
    font-weight: 500;
  }
  .fm-input {
    background: transparent;
    border: none;
    border-bottom: var(--border-width) solid var(--border);
    color: var(--text-0);
    font-family: var(--font-sans);
    font-size: var(--font-base);
    padding: 8px 0;
    outline: none;
    transition: border-color var(--transition-fast);
    border-radius: 0;
  }
  .fm-input:focus { border-color: var(--text-2); }
  .fm-input::placeholder { color: var(--text-3); }
  .fm-input-lg {
    font-size: var(--font-lg);
    font-weight: 500;
    letter-spacing: -0.02em;
  }
  select.fm-input {
    appearance: none;
    background-image: linear-gradient(45deg, transparent 50%, var(--text-3) 50%), linear-gradient(135deg, var(--text-3) 50%, transparent 50%);
    background-position: calc(100% - 11px) 14px, calc(100% - 6px) 14px;
    background-size: 5px 5px, 5px 5px;
    background-repeat: no-repeat;
    padding-right: 18px;
  }

  .fm-divider {
    height: 1px;
    background: var(--surface-border);
    margin: 0 calc(var(--space-2) * -1);
  }

  .fm-macros {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: var(--space-3);
  }
  .fm-mac { display: flex; flex-direction: column; gap: 4px; }
  .fm-mac-label {
    font-size: 11px; color: var(--text-2);
    text-transform: uppercase; letter-spacing: 0.06em; font-weight: 500;
  }
  .fm-mac-input {
    background: transparent;
    border: none;
    border-bottom: var(--border-width) solid var(--border);
    padding: 6px 0;
    font-size: var(--font-md); font-weight: 600;
    color: var(--text-0);
    outline: none; width: 100%;
    transition: border-color var(--transition-fast);
    letter-spacing: -0.02em;
  }
  .fm-mac-input:focus { border-color: var(--text-2); }
  .fm-mac-unit {
    font-size: 10px; color: var(--text-3);
    letter-spacing: 0.06em; text-transform: uppercase;
  }

  .fm-foot {
    display: flex; justify-content: flex-end;
    gap: var(--space-3);
    margin-top: var(--space-2);
    padding-top: var(--space-4);
    border-top: var(--border-width) solid var(--surface-border);
  }

  /* ─── Meal builder modal ─── */
  .mb-name { display: flex; }
  .mb-name input { width: 100%; }
  .mb-body {
    display: grid;
    grid-template-columns: 1fr 1px 1fr;
    gap: var(--space-5);
    min-height: 320px;
  }
  .mb-pane { display: flex; flex-direction: column; min-width: 0; }
  .mb-divider { background: var(--surface-border); width: 1px; }
  .mb-section-label {
    font-size: 11px; color: var(--text-3);
    text-transform: uppercase; letter-spacing: 0.06em;
    font-weight: 500; margin-bottom: var(--space-3);
  }
  .mb-search {
    display: flex; align-items: center; gap: var(--space-2);
    border-bottom: var(--border-width) solid var(--border);
    padding: 0 0 6px;
    margin-bottom: var(--space-2);
    color: var(--text-3);
    transition: border-color var(--transition-fast);
  }
  .mb-search:focus-within { border-color: var(--text-2); }
  .mb-search-input {
    background: none; border: none; outline: none;
    font-family: var(--font-sans); font-size: var(--font-sm);
    color: var(--text-0); flex: 1; min-width: 0;
  }
  .mb-search-input::placeholder { color: var(--text-3); }

  .mb-pal {
    display: flex; flex-direction: column;
    max-height: 320px; overflow-y: auto;
    padding-right: 2px;
  }
  .pal-item {
    display: flex; align-items: center; gap: var(--space-2);
    padding: 6px 6px;
    border: none; background: transparent; cursor: pointer;
    border-radius: var(--radius-sm);
    font-family: var(--font-sans); text-align: left;
    transition: background var(--transition-fast);
  }
  .pal-item:hover { background: var(--bg-hover); }
  .pal-pin { color: var(--cal); display: flex; flex-shrink: 0; }
  .pal-name {
    font-size: var(--font-sm); color: var(--text-0); flex: 1;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .pal-cal { font-size: var(--font-xs); color: var(--text-3); }

  .mb-empty {
    flex: 1;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: var(--space-3);
    color: var(--text-3);
    padding: var(--space-8) 0;
  }
  .mb-empty-text { font-size: var(--font-sm); }

  .mb-items {
    display: flex; flex-direction: column;
    gap: var(--space-3);
    overflow-y: auto;
    max-height: 280px;
    padding-right: 2px;
  }

  .mbi {
    display: flex; flex-direction: column; gap: var(--space-2);
    padding: var(--space-1) 0 var(--space-3);
    border-bottom: var(--border-width) solid var(--surface-border);
  }
  .mbi:last-child { border-bottom: none; }
  .mbi-top { display: flex; align-items: center; gap: var(--space-2); }
  .mbi-name {
    flex: 1; min-width: 0;
    font-size: var(--font-sm); font-weight: 500; color: var(--text-0);
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .mbi-qty-group { display: flex; align-items: baseline; gap: 2px; flex-shrink: 0; }
  .mbi-qty-input {
    width: 50px;
    padding: 2px 0;
    background: transparent;
    border: none;
    border-bottom: var(--border-width) solid var(--border);
    color: var(--text-0);
    font-size: var(--font-base); font-weight: 600;
    text-align: right; outline: none;
    transition: border-color var(--transition-fast);
  }
  .mbi-qty-input:focus { border-color: var(--text-2); }
  .mbi-qty-u { font-size: 10px; color: var(--text-3); letter-spacing: 0.04em; }
  .mbi-rm {
    background: none; border: none; color: var(--text-3); cursor: pointer; display: flex;
    padding: 4px; border-radius: var(--radius-sm); transition: all var(--transition-fast);
  }
  .mbi-rm:hover { color: var(--danger); background: var(--danger-bg); }

  .mbi-presets { display: flex; gap: 4px; }
  .qty-preset {
    flex: 1;
    padding: 4px 6px;
    font-size: 11px;
    color: var(--text-3);
    background: transparent;
    border: var(--border-width) solid var(--border);
    border-radius: var(--radius-sm);
    cursor: pointer;
    font-family: var(--font-mono);
    transition: all var(--transition-fast);
  }
  .qty-preset:hover { color: var(--text-1); border-color: var(--border-strong); }
  .qty-preset-active {
    background: var(--accent-subtle);
    border-color: var(--text-2);
    color: var(--text-0);
  }

  .mb-totals {
    margin-top: auto;
    padding-top: var(--space-4);
    display: flex; flex-direction: column; gap: var(--space-3);
  }
  .macro-bar {
    display: flex; height: 4px;
    border-radius: 2px; overflow: hidden;
    background: var(--bg-3);
  }
  .mb-pro { background: var(--pro); transition: width 600ms cubic-bezier(0.4, 0, 0.2, 1); }
  .mb-carb { background: var(--carb); transition: width 600ms cubic-bezier(0.4, 0, 0.2, 1); }
  .mb-fat { background: var(--fat); transition: width 600ms cubic-bezier(0.4, 0, 0.2, 1); }
  .mb-totals-bar { height: 4px; }
  .mb-totals-nums { display: flex; gap: var(--space-5); flex-wrap: wrap; }
  .mbt { display: flex; align-items: baseline; gap: 3px; }
  .mbt-n { font-size: var(--font-md); font-weight: 600; letter-spacing: -0.02em; }
  .mbt-u {
    font-size: 10px; color: var(--text-3);
    text-transform: uppercase; letter-spacing: 0.06em;
  }

  /* ─── Responsive ─── */
  @media (max-width: 1024px) {
    .table-head, .food-row {
      grid-template-columns: 24px 1fr 80px 80px 80px 80px 56px;
    }
    .fiber-col { display: none; }
    .fm-macros { grid-template-columns: repeat(3, 1fr); }
    .mc-stats { gap: var(--space-3); }
    .search-box { width: 200px; }
  }
  @media (max-width: 768px) {
    .table-head, .food-row {
      grid-template-columns: 24px 1fr 70px 70px 70px;
    }
    .fat-col { display: none; }
    .fm-id { grid-template-columns: 1fr; }
    .fm-macros { grid-template-columns: repeat(2, 1fr); }
    .mb-body {
      grid-template-columns: 1fr;
      gap: var(--space-5);
    }
    .mb-divider { display: none; }
    .mc-stats { display: none; }
    .mc-head { grid-template-columns: 16px 1fr auto; }
    .mc-items { padding-left: var(--space-5); }
    .filter-row { flex-direction: column; align-items: stretch; }
    .search-box { width: 100%; max-width: none; }
  }
</style>
