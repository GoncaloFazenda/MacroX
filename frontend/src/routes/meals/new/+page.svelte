<script>
  import { foodStore } from '$lib/stores/foods.js';
  import { mealStore } from '$lib/stores/meals.js';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { ArrowLeft, X } from 'lucide-svelte';

  let mealName = $state('');
  let selectedItems = $state([]);
  let search = $state('');
  let saving = $state(false);

  onMount(() => { foodStore.load({ limit: 100 }); });

  const filteredFoods = $derived($foodStore.foods.filter(f => f.name.toLowerCase().includes(search.toLowerCase())));

  const totalMacros = $derived(() => {
    let c = 0, p = 0, cb = 0, f = 0;
    for (const item of selectedItems) {
      const mult = item.quantity / 100;
      c += item.food.calories * mult; p += item.food.protein * mult;
      cb += item.food.netCarbs * mult; f += item.food.fat * mult;
    }
    return { calories: Math.round(c), protein: Math.round(p * 10) / 10, netCarbs: Math.round(cb * 10) / 10, fat: Math.round(f * 10) / 10 };
  });

  function addFood(food) {
    const ex = selectedItems.find(i => i.foodId === food._id);
    if (ex) { selectedItems = selectedItems.map(i => i.foodId === food._id ? { ...i, quantity: i.quantity + 100 } : i); }
    else { selectedItems = [...selectedItems, { foodId: food._id, food, quantity: 100 }]; }
  }

  function removeItem(foodId) { selectedItems = selectedItems.filter(i => i.foodId !== foodId); }
  function updateQty(foodId, qty) { selectedItems = selectedItems.map(i => i.foodId === foodId ? { ...i, quantity: Math.max(1, qty) } : i); }

  async function handleSave(e) {
    e.preventDefault();
    if (!mealName || selectedItems.length === 0) return;
    saving = true;
    try {
      await mealStore.create({ name: mealName, items: selectedItems.map(i => ({ foodId: i.foodId, quantity: i.quantity })) });
      goto('/meals');
    } catch (err) { alert(err.message); }
    saving = false;
  }
</script>

<svelte:head><title>Build Meal — MacroX</title></svelte:head>

<div class="page-container">
  <a href="/meals" class="back"><ArrowLeft size={13} strokeWidth={1.5} /> Back</a>

  <h1 class="page-title" style="margin-top: var(--space-3);">Build Meal</h1>
  <p class="page-subtitle">Combine foods into a reusable meal</p>

  <div class="builder">
    <div class="panel animate-slide-up">
      <span class="panel-label">Foods</span>
      <input type="text" class="input" placeholder="Search…" bind:value={search} />
      <div class="pal-list">
        {#each filteredFoods as food}
          <button class="pal-item" onclick={() => addFood(food)}>
            <span class="pal-name">{food.name}</span>
            <span class="pal-cal mono">{food.calories}</span>
          </button>
        {/each}
      </div>
    </div>

    <div class="panel animate-slide-up stagger-2">
      <span class="panel-label">Meal</span>
      <form onsubmit={handleSave}>
        <div class="field" style="margin-bottom: var(--space-3);">
          <label class="label" for="mn">Name</label>
          <input id="mn" type="text" class="input" placeholder="e.g. Salmon with Asparagus" bind:value={mealName} required />
        </div>

        {#if selectedItems.length === 0}
          <p style="color: var(--text-3); font-size: var(--font-sm); padding: var(--space-6) 0; text-align: center;">Click foods to add</p>
        {:else}
          <div class="sel-list">
            {#each selectedItems as item}
              <div class="sel-item">
                <span class="sel-name">{item.food.name}</span>
                <input type="number" class="qty-input mono" value={item.quantity} oninput={(e) => updateQty(item.foodId, Number(e.target.value))} min="1" />
                <span class="qty-g">g</span>
                <button type="button" class="sel-rm" onclick={() => removeItem(item.foodId)}><X size={12} strokeWidth={1.5} /></button>
              </div>
            {/each}
          </div>

          <div class="totals">
            <span class="t mono" style="color: var(--cal)">{totalMacros().calories} kcal</span>
            <span class="t mono" style="color: var(--pro)">{totalMacros().protein}g P</span>
            <span class="t mono" style="color: var(--carb)">{totalMacros().netCarbs}g C</span>
            <span class="t mono" style="color: var(--fat)">{totalMacros().fat}g F</span>
          </div>

          <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: var(--space-3);" disabled={saving}>
            {saving ? 'Saving…' : 'Save Meal'}
          </button>
        {/if}
      </form>
    </div>
  </div>
</div>

<style>
  .back { display: inline-flex; align-items: center; gap: var(--space-1); font-size: var(--font-xs); color: var(--text-2); }
  .back:hover { color: var(--text-0); }

  .builder { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-5); margin-top: var(--space-5); }

  .panel {
    background: var(--bg-1); border: var(--border-width) solid var(--border); border-radius: var(--radius-lg); padding: var(--space-5);
  }
  .panel-label { font-size: var(--font-xs); color: var(--text-2); text-transform: uppercase; letter-spacing: 0.04em; font-weight: 500; display: block; margin-bottom: var(--space-3); }

  .pal-list { display: flex; flex-direction: column; max-height: 400px; overflow-y: auto; margin-top: var(--space-3); }
  .pal-item {
    display: flex; align-items: center; justify-content: space-between;
    padding: 4px 6px; border: none; background: transparent; cursor: pointer;
    border-radius: var(--radius-sm); font-family: var(--font-sans); text-align: left; transition: background var(--transition-fast);
  }
  .pal-item:hover { background: var(--bg-hover); }
  .pal-name { font-size: var(--font-sm); color: var(--text-0); }
  .pal-cal { font-size: var(--font-xs); color: var(--text-3); }

  .sel-list { display: flex; flex-direction: column; gap: var(--space-2); margin-bottom: var(--space-4); }
  .sel-item { display: flex; align-items: center; gap: var(--space-2); padding: 4px 6px; background: var(--bg-2); border-radius: var(--radius-sm); }
  .sel-name { flex: 1; font-size: var(--font-sm); }
  .qty-input {
    width: 56px; padding: 2px 4px; background: var(--bg-1); border: var(--border-width) solid var(--border); border-radius: 3px;
    color: var(--text-0); font-size: var(--font-sm); text-align: center; font-family: var(--font-mono);
  }
  .qty-g { font-size: var(--font-xs); color: var(--text-3); }
  .sel-rm { background: none; border: none; color: var(--text-3); cursor: pointer; display: flex; }
  .sel-rm:hover { color: var(--danger); }

  .totals { display: flex; gap: var(--space-3); padding: var(--space-3); background: var(--bg-2); border-radius: var(--radius-md); }
  .t { font-size: var(--font-sm); font-weight: 500; }

  .field { display: flex; flex-direction: column; }

  @media (max-width: 768px) { .builder { grid-template-columns: 1fr; } }
</style>
