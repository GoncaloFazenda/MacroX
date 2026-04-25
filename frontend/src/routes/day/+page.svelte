<script>
  import { auth } from '$lib/stores/auth.js';
  import { foodStore } from '$lib/stores/foods.js';
  import { mealStore } from '$lib/stores/meals.js';
  import { plannerStore } from '$lib/stores/planner.js';
  import { dayTemplateStore } from '$lib/stores/dayTemplates.js';
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { beforeNavigate, goto } from '$app/navigation';
  import ConfirmModal from '$lib/components/ui/ConfirmModal.svelte';
  import { formatDate, getPercentage } from '$lib/utils/macros.js';
  import { X, Plus, Sparkles, GripVertical, Bookmark, ArrowLeft, Pencil, Check, Trash2, Undo2, Copy } from 'lucide-svelte';
  import DateNav from '$lib/components/ui/DateNav.svelte';
  import SaveButton from '$lib/components/ui/SaveButton.svelte';
  import { dndzone, SHADOW_ITEM_MARKER_PROPERTY_NAME } from 'svelte-dnd-action';
  import { flip } from 'svelte/animate';

  const FLIP_MS = 150;
  const ZONE = 'planner';

  // Read URL params (used by weekly planner links and templates page)
  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const urlDate = urlParams?.get('date');
  const urlTemplateId = urlParams?.get('templateId');
  const urlNewPlan = urlParams?.get('newPlan') === '1';

  let currentDate = $state(urlDate || formatDate(new Date()));
  let search = $state('');
  let activeCategory = $state('All');
  let activeSlot = $state('breakfast');
  let saving = $state(false);
  let mounted = $state(false);
  let nextId = 1;

  // ── Template-edit / new-plan mode ──
  let templateMode = $state(!!urlTemplateId || urlNewPlan);
  let isNewTemplate = $state(urlNewPlan);
  let editingTemplateId = $state(urlTemplateId || null);
  let templateNameValue = $state('');
  let editingTemplateName = $state(urlNewPlan); // open name editor immediately when creating
  let templateNameDraft = $state('');

  // ── Dirty tracking ──
  let savedSnapshot = $state('');
  const dirty = $derived(snapshot() !== savedSnapshot);

  function snapshot() {
    return JSON.stringify({
      slots: Object.fromEntries(
        Object.entries(slots).map(([k, items]) => [
          k,
          items.map(i => ({ type: i.type, refId: i.refId, quantity: i.quantity })),
        ])
      ),
      name: templateMode ? templateNameValue : null,
    });
  }
  function takeSavedSnapshot() { savedSnapshot = snapshot(); }

  // Toast
  let toast = $state({ visible: false, message: '', type: 'success' });
  let toastTimeout;
  function showToast(message, type = 'success') {
    if (toastTimeout) clearTimeout(toastTimeout);
    toast = { visible: true, message, type };
    toastTimeout = setTimeout(() => (toast = { ...toast, visible: false }), 3000);
  }

  // Confirm modal
  let confirmState = $state({ open: false, title: '', message: '', warning: '', confirmText: 'Confirm', danger: false, onConfirm: null });
  function openConfirm(cfg) {
    confirmState = { open: true, title: '', message: '', warning: '', confirmText: 'Confirm', danger: false, onConfirm: null, ...cfg };
  }
  function closeConfirm() { confirmState = { ...confirmState, open: false, onConfirm: null }; }
  async function executeConfirm() {
    const cb = confirmState.onConfirm;
    closeConfirm();
    if (cb) await cb();
  }

  beforeNavigate(({ cancel, to }) => {
    // Skip the guard for in-page hash changes
    if (to?.url.pathname === $page.url.pathname && to?.url.search === $page.url.search) return;
    if (dirty && !confirm('You have unsaved changes. Leave without saving?')) {
      cancel();
    }
  });

  const categories = ['All', 'Protein', 'Vegetable', 'Fruit', 'Grain', 'Dairy', 'Fat & Oil', 'Nut & Seed', 'Legume', 'Beverage', 'Condiment', 'Other'];

  let slots = $state({ breakfast: [], lunch: [], dinner: [], snack: [] });
  const slotLabels = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snack: 'Snack' };

  const goals = $derived($auth.user?.goals || { calories: 2000, protein: 150, netCarbs: 100, fat: 65 });

  // DnD source arrays
  let foodDndItems = $state([]);
  let mealDndItems = $state([]);
  let suggDndItems = $state([]);

  // Track which items were just added (for flash animation)
  let flashItems = $state(new Set());

  onMount(async () => {
    await Promise.all([
      foodStore.load({ limit: 200 }),
      mealStore.load(),
      templateMode && !isNewTemplate ? dayTemplateStore.load() : Promise.resolve(),
    ]);
    syncSources();
    if (isNewTemplate) {
      // Empty state for new plan creation; user gets blank slots and an immediate name editor
      slots = { breakfast: [], lunch: [], dinner: [], snack: [] };
      templateNameValue = '';
      templateNameDraft = '';
    } else if (templateMode) {
      await loadTemplate();
    } else {
      await loadPlan();
    }
    takeSavedSnapshot();
    syncSuggestions();
    setTimeout(() => mounted = true, 50);
  });

  async function loadTemplate() {
    const tpl = $dayTemplateStore.templates.find(t => t._id === editingTemplateId);
    if (!tpl) {
      showToast('Day plan not found', 'error');
      slots = { breakfast: [], lunch: [], dinner: [], snack: [] };
      templateNameValue = '';
      return;
    }
    templateNameValue = tpl.name;
    const newSlots = { breakfast: [], lunch: [], dinner: [], snack: [] };
    for (const meal of (tpl.meals || [])) {
      if (newSlots[meal.slot]) {
        newSlots[meal.slot] = meal.items.map(item => ({
          id: nextId++, type: item.type, refId: item.refId, quantity: item.quantity,
          ...getItemMacros(item),
        }));
      }
    }
    slots = newSlots;
  }

  function syncSources() {
    const q = search.toLowerCase();
    const filtered = $foodStore.foods.filter(f =>
      f.name.toLowerCase().includes(q) &&
      (activeCategory === 'All' || f.category === activeCategory)
    );
    foodDndItems = filtered.slice(0, 50).map(f => ({
      id: `sf-${f._id}`, _id: f._id,
      name: f.name, calories: f.calories, protein: f.protein,
      netCarbs: f.netCarbs, fat: f.fat, category: f.category,
    }));
    mealDndItems = $mealStore.meals.map(m => ({
      id: `sm-${m._id}`, _id: m._id,
      name: m.name, calories: Math.round(m.totalMacros?.calories || 0),
      protein: Math.round(m.totalMacros?.protein || 0),
      netCarbs: Math.round(m.totalMacros?.netCarbs || 0),
      fat: Math.round(m.totalMacros?.fat || 0),
    }));
  }

  async function loadPlan() {
    await plannerStore.loadDaily(currentDate);
    const plan = $plannerStore.dailyPlan;
    if (plan?.meals) {
      const newSlots = { breakfast: [], lunch: [], dinner: [], snack: [] };
      for (const meal of plan.meals) {
        if (newSlots[meal.slot]) {
          newSlots[meal.slot] = meal.items.map(item => ({
            id: nextId++, type: item.type, refId: item.refId, quantity: item.quantity,
            ...getItemMacros(item),
          }));
        }
      }
      slots = newSlots;
    } else {
      slots = { breakfast: [], lunch: [], dinner: [], snack: [] };
    }
  }

  function getItemMacros(item) {
    const mult = item.quantity / 100;
    if (item.type === 'food') {
      const f = $foodStore.foods.find(fd => fd._id === item.refId);
      return {
        name: f?.name || 'Unknown', cal: Math.round((f?.calories || 0) * mult),
        protein: Math.round((f?.protein || 0) * mult * 10) / 10,
        netCarbs: Math.round((f?.netCarbs || 0) * mult * 10) / 10,
        fat: Math.round((f?.fat || 0) * mult * 10) / 10,
      };
    }
    const m = $mealStore.meals.find(ml => ml._id === item.refId);
    const tm = m?.totalMacros || {};
    return {
      name: m?.name || 'Unknown', cal: Math.round((tm.calories || 0) * mult),
      protein: Math.round((tm.protein || 0) * mult * 10) / 10,
      netCarbs: Math.round((tm.netCarbs || 0) * mult * 10) / 10,
      fat: Math.round((tm.fat || 0) * mult * 10) / 10,
    };
  }

  const totals = $derived.by(() => {
    const all = Object.values(slots).flat();
    return {
      cal: all.reduce((s, i) => s + (i.cal || 0), 0),
      protein: Math.round(all.reduce((s, i) => s + (i.protein || 0), 0) * 10) / 10,
      netCarbs: Math.round(all.reduce((s, i) => s + (i.netCarbs || 0), 0) * 10) / 10,
      fat: Math.round(all.reduce((s, i) => s + (i.fat || 0), 0) * 10) / 10,
    };
  });

  function slotTotal(items) { return items.reduce((s, i) => s + (i.cal || 0), 0); }

  // Suggestions that fit remaining goals — only show foods that won't exceed any tracked macro
  const suggestions = $derived.by(() => {
    const rem = {
      cal: (goals.calories || 2000) - totals.cal,
      protein: goals.protein != null ? goals.protein - totals.protein : Infinity,
      netCarbs: goals.netCarbs != null ? goals.netCarbs - totals.netCarbs : Infinity,
      fat: goals.fat != null ? goals.fat - totals.fat : Infinity,
    };
    if (rem.cal <= 50) return [];
    return $foodStore.foods
      .filter(f =>
        f.calories > 0 &&
        f.calories <= rem.cal &&
        f.netCarbs <= rem.netCarbs &&
        f.fat <= rem.fat
      )
      .map(f => {
        let score = 0;
        if (goals.protein != null && rem.protein > 10) score += (f.protein / Math.max(f.calories, 1)) * 100;
        return { ...f, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 4);
  });

  function syncSuggestions() {
    suggDndItems = suggestions.map(f => ({
      id: `sg-${f._id}`, _id: f._id,
      name: f.name, calories: f.calories, protein: f.protein,
      netCarbs: f.netCarbs, fat: f.fat, category: f.category,
    }));
  }

  // Click-to-add with flash
  function flashItem(id) {
    flashItems = new Set([...flashItems, id]);
    setTimeout(() => {
      flashItems = new Set([...flashItems].filter(x => x !== id));
    }, 400);
  }

  function addFood(food) {
    const id = nextId++;
    slots[activeSlot] = [...slots[activeSlot], {
      id, type: 'food', refId: food._id, quantity: 100,
      name: food.name, cal: Math.round(food.calories),
      protein: Math.round(food.protein * 10) / 10,
      netCarbs: Math.round(food.netCarbs * 10) / 10,
      fat: Math.round(food.fat * 10) / 10,
    }];
    slots = { ...slots };
    flashItem(id);
    syncSuggestions();
  }
  function addMeal(meal) {
    const id = nextId++;
    const tm = meal.totalMacros || {};
    slots[activeSlot] = [...slots[activeSlot], {
      id, type: 'compositeMeal', refId: meal._id, quantity: 100,
      name: meal.name, cal: Math.round(tm.calories || 0),
      protein: Math.round((tm.protein || 0) * 10) / 10,
      netCarbs: Math.round((tm.netCarbs || 0) * 10) / 10,
      fat: Math.round((tm.fat || 0) * 10) / 10,
    }];
    slots = { ...slots };
    flashItem(id);
    syncSuggestions();
  }

  // DnD Source handlers (copy pattern — always restore on finalize)
  function handleFoodConsider(e) { foodDndItems = e.detail.items; }
  function handleFoodFinalize(e) { syncSources(); syncSuggestions(); }
  function handleMealConsider(e) { mealDndItems = e.detail.items; }
  function handleMealFinalize(e) { syncSources(); syncSuggestions(); }
  function handleSuggConsider(e) { suggDndItems = e.detail.items; }
  function handleSuggFinalize(e) { syncSuggestions(); }

  // DnD Slot handlers
  function handleSlotConsider(slot, e) { slots[slot] = e.detail.items; slots = { ...slots }; }
  function handleSlotFinalize(slot, e) {
    slots[slot] = e.detail.items.map(item => {
      if (item[SHADOW_ITEM_MARKER_PROPERTY_NAME]) return item;
      const sid = String(item.id);
      if (sid.startsWith('sf-') || sid.startsWith('sg-')) {
        const food = $foodStore.foods.find(f => f._id === item._id);
        const id = nextId++;
        flashItem(id);
        return {
          id, type: 'food', refId: item._id,
          name: food?.name || 'Unknown', quantity: 100,
          cal: Math.round(food?.calories || 0),
          protein: Math.round((food?.protein || 0) * 10) / 10,
          netCarbs: Math.round((food?.netCarbs || 0) * 10) / 10,
          fat: Math.round((food?.fat || 0) * 10) / 10,
        };
      }
      if (sid.startsWith('sm-')) {
        const meal = $mealStore.meals.find(m => m._id === item._id);
        const tm = meal?.totalMacros || {};
        const id = nextId++;
        flashItem(id);
        return {
          id, type: 'compositeMeal', refId: item._id,
          name: meal?.name || 'Unknown', quantity: 100,
          cal: Math.round(tm.calories || 0),
          protein: Math.round((tm.protein || 0) * 10) / 10,
          netCarbs: Math.round((tm.netCarbs || 0) * 10) / 10,
          fat: Math.round((tm.fat || 0) * 10) / 10,
        };
      }
      return item;
    });
    slots = { ...slots };
    syncSuggestions();
  }

  function updateQuantity(slot, itemId, newQty) {
    if (isNaN(newQty) || newQty <= 0) return;
    const item = slots[slot].find(i => i.id === itemId);
    if (!item) return;
    const mult = newQty / 100;
    if (item.type === 'food') {
      const food = $foodStore.foods.find(f => f._id === item.refId);
      if (food) {
        item.quantity = newQty;
        item.cal = Math.round(food.calories * mult);
        item.protein = Math.round(food.protein * mult * 10) / 10;
        item.netCarbs = Math.round(food.netCarbs * mult * 10) / 10;
        item.fat = Math.round(food.fat * mult * 10) / 10;
      }
    } else {
      const meal = $mealStore.meals.find(m => m._id === item.refId);
      if (meal?.totalMacros) {
        item.quantity = newQty;
        item.cal = Math.round(meal.totalMacros.calories * mult);
        item.protein = Math.round(meal.totalMacros.protein * mult * 10) / 10;
        item.netCarbs = Math.round(meal.totalMacros.netCarbs * mult * 10) / 10;
        item.fat = Math.round(meal.totalMacros.fat * mult * 10) / 10;
      }
    }
    slots = { ...slots };
    syncSuggestions();
  }

  function removeItem(slot, id) { slots[slot] = slots[slot].filter(i => i.id !== id); slots = { ...slots }; syncSuggestions(); }

  async function savePlan() {
    if (!dirty || saving) return;
    saving = true;
    try {
      if (templateMode) {
        if (!templateNameValue.trim()) {
          showToast('Day plan needs a name', 'error');
          saving = false;
          return;
        }
        const meals = Object.entries(slots)
          .filter(([, items]) => items.length > 0)
          .map(([slot, items]) => ({
            slot,
            items: items.map(i => ({ type: i.type, refId: i.refId, quantity: i.quantity })),
          }));
        if (meals.length === 0) {
          showToast('Day plan needs at least one item', 'error');
          saving = false;
          return;
        }
        if (isNewTemplate) {
          const created = await dayTemplateStore.create(templateNameValue.trim(), meals);
          isNewTemplate = false;
          editingTemplateId = created._id;
          // Update URL so refresh / back nav works correctly without re-creating
          if (typeof history !== 'undefined') {
            history.replaceState(null, '', `/day?templateId=${created._id}`);
          }
          takeSavedSnapshot();
          showToast('Day plan created');
        } else {
          await dayTemplateStore.update(editingTemplateId, { name: templateNameValue.trim(), meals });
          takeSavedSnapshot();
          showToast('Day plan saved');
        }
      } else {
        const meals = Object.entries(slots).map(([slot, items]) => ({
          slot, items: items.map(i => ({ type: i.type, refId: i.refId, quantity: i.quantity })),
        }));
        await plannerStore.saveDaily(currentDate, meals);
        takeSavedSnapshot();
        showToast('Day saved');
      }
    } catch (err) {
      showToast('Save failed: ' + err.message, 'error');
    }
    saving = false;
  }

  function startNameEdit() {
    if (!templateMode) return;
    templateNameDraft = templateNameValue;
    editingTemplateName = true;
  }
  function commitNameEdit() {
    const v = templateNameDraft.trim();
    if (v) templateNameValue = v;
    editingTemplateName = false;
  }
  function cancelNameEdit() {
    editingTemplateName = false;
  }

  // ── Save as Day Template ──
  let showTemplateModal = $state(false);
  let templateName = $state('');
  let savingTemplate = $state(false);

  function openTemplateModal() {
    const totalItems = Object.values(slots).flat().length;
    if (totalItems === 0) { showToast('Add some items first', 'error'); return; }
    templateName = templateMode ? `Copy of ${templateNameValue}` : '';
    showTemplateModal = true;
  }

  async function saveAsTemplate() {
    if (!templateName.trim()) return;
    savingTemplate = true;
    try {
      const meals = Object.entries(slots)
        .filter(([, items]) => items.length > 0)
        .map(([slot, items]) => ({
          slot, items: items.map(i => ({ type: i.type, refId: i.refId, quantity: i.quantity })),
        }));
      await dayTemplateStore.create(templateName.trim(), meals);
      showTemplateModal = false;
      showToast(templateMode ? 'Saved as new Day Plan' : 'Day plan saved');
    } catch (err) { showToast('Failed to save: ' + err.message, 'error'); }
    savingTemplate = false;
  }

  // ── Revert ──
  function askRevert() {
    if (!dirty || saving) return;
    openConfirm({
      title: 'Revert changes?',
      message: 'Discard all unsaved changes since the last save?',
      confirmText: 'Revert',
      onConfirm: async () => {
        if (templateMode) {
          await loadTemplate();
        } else {
          await loadPlan();
        }
        takeSavedSnapshot();
        syncSuggestions();
        showToast('Changes reverted');
      },
    });
  }

  // ── Delete day plan (template-edit mode only) ──
  function askDeletePlan() {
    if (!templateMode || !editingTemplateId) return;
    openConfirm({
      title: 'Delete this Day Plan?',
      message: `Delete "${templateNameValue}"?`,
      warning: 'This cannot be undone.',
      confirmText: 'Delete',
      danger: true,
      onConfirm: async () => {
        try {
          await dayTemplateStore.remove(editingTemplateId);
          // Bypass dirty navigation guard — the plan no longer exists.
          savedSnapshot = snapshot();
          await goto('/library/templates');
        } catch (err) { showToast('Failed to delete: ' + err.message, 'error'); }
      },
    });
  }

  const templateSummary = $derived.by(() => {
    const filledSlots = Object.entries(slots).filter(([, items]) => items.length > 0);
    const totalItems = Object.values(slots).flat().length;
    return { slotCount: filledSlots.length, totalItems, filledSlots };
  });

  function prevDay() {
    if (templateMode) return;
    const d = new Date(currentDate);
    d.setDate(d.getDate() - 1);
    currentDate = formatDate(d);
    loadPlan().then(() => { takeSavedSnapshot(); syncSuggestions(); });
  }
  function nextDay() {
    if (templateMode) return;
    const d = new Date(currentDate);
    d.setDate(d.getDate() + 1);
    currentDate = formatDate(d);
    loadPlan().then(() => { takeSavedSnapshot(); syncSuggestions(); });
  }
</script>

<svelte:window onbeforeunload={(e) => { if (dirty) { e.preventDefault(); e.returnValue = ''; } }} />

<svelte:head><title>Daily Planner — MacroX</title></svelte:head>

<div class="page-container">
  {#if templateMode}
    <div class="tpl-toolbar animate-slide-up">
      <a class="back-link" href="/library/templates"><ArrowLeft size={13} strokeWidth={1.5} /><span>Back to Day Plans</span></a>
      <div class="top-actions">
        {#if dirty}
          <button class="revert-btn" onclick={askRevert} title="Revert unsaved changes" type="button">
            <Undo2 size={13} strokeWidth={1.5} /><span>Revert</span>
          </button>
        {/if}
        {#if !isNewTemplate}
          <button class="btn btn-secondary btn-sm" onclick={openTemplateModal} type="button">
            <Copy size={13} strokeWidth={1.5} />Save a Copy
          </button>
        {/if}
        <SaveButton dirty={dirty} saving={saving} onclick={savePlan} />
      </div>
    </div>

    <div class="tpl-center animate-slide-up stagger-1">
      <span class="tpl-prefix">{isNewTemplate ? 'New Day Plan' : 'Editing'}</span>
      {#if editingTemplateName}
        <!-- svelte-ignore a11y_autofocus -->
        <input
          class="tpl-name-input"
          bind:value={templateNameDraft}
          onblur={commitNameEdit}
          onkeydown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); commitNameEdit(); }
            if (e.key === 'Escape') { e.preventDefault(); cancelNameEdit(); }
          }}
          autofocus
          maxlength="200"
          placeholder="Name your plan…"
        />
      {:else}
        <button class="tpl-name" onclick={startNameEdit} type="button" title="Click to rename">
          <span>{templateNameValue || 'Untitled'}</span>
          <Pencil size={12} strokeWidth={1.5} />
        </button>
      {/if}
      {#if !isNewTemplate}
        <button class="tpl-delete" onclick={askDeletePlan} type="button" title="Delete this Day Plan">
          <Trash2 size={13} strokeWidth={1.5} />
        </button>
      {/if}
    </div>
  {:else}
    <div class="top-bar animate-slide-up">
      <div>
        <h1 class="page-title">Daily Planner</h1>
        <p class="page-subtitle">Build your perfect day</p>
      </div>
      <div class="top-actions">
        {#if dirty}
          <button class="revert-btn" onclick={askRevert} title="Revert unsaved changes" type="button">
            <Undo2 size={13} strokeWidth={1.5} /><span>Revert</span>
          </button>
        {/if}
        <button class="btn btn-secondary btn-sm" onclick={openTemplateModal} type="button">
          <Bookmark size={13} strokeWidth={1.5} />Save as Template
        </button>
        <SaveButton dirty={dirty} saving={saving} onclick={savePlan} />
      </div>
    </div>
    <DateNav date={currentDate} onprev={prevDay} onnext={nextDay} class="animate-slide-up stagger-1" style="margin-bottom: var(--space-5)" />
  {/if}

  <!-- Macro Summary -->
  <div class="macro-summary animate-slide-up stagger-2 ">
    <div class="macro-stat">
      <div class="ms-top"><span class="ms-label">Calories</span><span class="ms-val mono">{totals.cal} {goals.calories != null ? `/ ${goals.calories}` : ''} <span class="ms-unit">kcal</span></span></div>
      <div class="progress-track"><div class="progress-fill" style="width: {mounted && goals.calories ? Math.min(getPercentage(totals.cal, goals.calories), 100) : 0}%; background: var(--cal)"></div></div>
    </div>
    {#if goals.protein != null}
    <div class="macro-stat">
      <div class="ms-top"><span class="ms-label">Protein</span><span class="ms-val mono">{totals.protein} / {goals.protein} <span class="ms-unit">g</span></span></div>
      <div class="progress-track"><div class="progress-fill" style="width: {mounted ? Math.min(getPercentage(totals.protein, goals.protein), 100) : 0}%; background: var(--pro)"></div></div>
    </div>
    {/if}
    {#if goals.netCarbs != null}
    <div class="macro-stat">
      <div class="ms-top"><span class="ms-label">Net Carbs</span><span class="ms-val mono">{totals.netCarbs} / {goals.netCarbs} <span class="ms-unit">g</span></span></div>
      <div class="progress-track"><div class="progress-fill" style="width: {mounted ? Math.min(getPercentage(totals.netCarbs, goals.netCarbs), 100) : 0}%; background: var(--carb)"></div></div>
    </div>
    {/if}
    {#if goals.fat != null}
    <div class="macro-stat">
      <div class="ms-top"><span class="ms-label">Fat</span><span class="ms-val mono">{totals.fat} / {goals.fat} <span class="ms-unit">g</span></span></div>
      <div class="progress-track"><div class="progress-fill" style="width: {mounted ? Math.min(getPercentage(totals.fat, goals.fat), 100) : 0}%; background: var(--fat)"></div></div>
    </div>
    {/if}
  </div>

  <!-- Main Layout -->
  <div class="planner-layout">
    <!-- Source Panel -->
    <div class="source-panel animate-slide-up stagger-3">
      <input type="text" class="input" placeholder="Search foods..." value={search} oninput={(e) => { search = e.target.value; syncSources(); }} />

      <div class="category-chips">
        {#each categories as cat}
          <button class="chip" class:chip-active={activeCategory === cat} onclick={() => { activeCategory = cat; syncSources(); }}>{cat}</button>
        {/each}
      </div>

      <!-- Slot picker — always visible -->
      <div class="slot-picker-section">
        <span class="slot-picker-label">Add to</span>
        <div class="slot-picker">
          {#each Object.entries(slotLabels) as [key, label]}
            <button class="pick-btn" class:pick-active={activeSlot === key} onclick={() => activeSlot = key}>{label}</button>
          {/each}
        </div>
      </div>

      <!-- Suggestions (draggable + clickable) -->
      {#if suggDndItems.length > 0}
        <div class="source-section">
          <div class="section-header"><Sparkles size={12} strokeWidth={1.5} /><span class="section-tag">Suggested for you</span></div>
          <div
            class="card-grid dnd-source"
            use:dndzone={{ items: suggDndItems, flipDurationMs: FLIP_MS, type: ZONE, dropFromOthersDisabled: true, dropTargetStyle: {} }}
            onconsider={handleSuggConsider}
            onfinalize={handleSuggFinalize}
          >
            {#each suggDndItems as item (item.id)}
              <div class="food-card food-card-draggable" animate:flip={{ duration: FLIP_MS }}>
                <div class="fc-grip"><GripVertical size={11} strokeWidth={1.5} /></div>
                <div class="fc-content">
                  <span class="fc-name">{item.name}</span>
                  <div class="fc-macros">
                    <span class="fc-macro mono" style="color: var(--cal)">{item.calories} cal</span>
                    <span class="fc-macro mono" style="color: var(--pro)">{item.protein}p</span>
                    <span class="fc-macro mono" style="color: var(--carb)">{item.netCarbs}c</span>
                    <span class="fc-macro mono" style="color: var(--fat)">{item.fat}f</span>
                  </div>
                </div>
                <button class="fc-add" onclick={(e) => { e.stopPropagation(); addFood(item); }} aria-label="Add {item.name}">
                  <Plus size={13} strokeWidth={1.5} />
                </button>
              </div>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Foods (draggable + clickable) -->
      <div class="source-section">
        <div class="section-header"><span class="section-tag">Foods</span><span class="section-count">{foodDndItems.length}</span></div>
        <div
          class="card-grid dnd-source"
          use:dndzone={{ items: foodDndItems, flipDurationMs: FLIP_MS, type: ZONE, dropFromOthersDisabled: true, dropTargetStyle: {} }}
          onconsider={handleFoodConsider}
          onfinalize={handleFoodFinalize}
        >
          {#each foodDndItems as item (item.id)}
            <div class="food-card food-card-draggable" animate:flip={{ duration: FLIP_MS }}>
              <div class="fc-grip"><GripVertical size={11} strokeWidth={1.5} /></div>
              <div class="fc-content">
                <span class="fc-name">{item.name}</span>
                <div class="fc-macros">
                  <span class="fc-macro mono" style="color: var(--cal)">{item.calories} cal</span>
                  <span class="fc-macro mono" style="color: var(--pro)">{item.protein}p</span>
                  <span class="fc-macro mono" style="color: var(--carb)">{item.netCarbs}c</span>
                  <span class="fc-macro mono" style="color: var(--fat)">{item.fat}f</span>
                </div>
              </div>
              <button class="fc-add" onclick={(e) => { e.stopPropagation(); addFood(item); }} aria-label="Add {item.name}">
                <Plus size={13} strokeWidth={1.5} />
              </button>
            </div>
          {/each}
        </div>
        {#if foodDndItems.length === 0}
          <p class="source-empty">No foods match your search</p>
        {/if}
      </div>

      <!-- My Meals (draggable + clickable) -->
      {#if mealDndItems.length > 0}
        <div class="source-section">
          <div class="section-header"><span class="section-tag">My Meals</span><span class="section-count">{mealDndItems.length}</span></div>
          <div
            class="card-grid dnd-source"
            onconsider={handleMealConsider}
            onfinalize={handleMealFinalize}
          >
            {#each mealDndItems as item (item.id)}
              <div class="food-card food-card-draggable" animate:flip={{ duration: FLIP_MS }}>
                <div class="fc-grip"><GripVertical size={11} strokeWidth={1.5} /></div>
                <div class="fc-content">
                  <span class="fc-name">{item.name}</span>
                  <div class="fc-macros">
                    <span class="fc-macro mono" style="color: var(--cal)">{item.calories} cal</span>
                    <span class="fc-macro mono" style="color: var(--pro)">{item.protein}p</span>
                    <span class="fc-macro mono" style="color: var(--carb)">{item.netCarbs}c</span>
                    <span class="fc-macro mono" style="color: var(--fat)">{item.fat}f</span>
                  </div>
                </div>
                <button class="fc-add" onclick={(e) => { e.stopPropagation(); addMeal(item); }} aria-label="Add {item.name}">
                  <Plus size={13} strokeWidth={1.5} />
                </button>
              </div>
            {/each}
          </div>
        </div>
      {/if}
    </div>

    <!-- Meal Slots -->
    <div class="slots-panel">
      {#each Object.entries(slotLabels) as [key, label], i}
        {@const items = slots[key]}
        <div class="meal-slot animate-slide-up stagger-{i + 4}" class:slot-active-target={activeSlot === key}>
          <div class="slot-header">
            <div class="slot-left">
              <span class="slot-name">{label}</span>
              {#if items.length > 0}<span class="slot-count">{items.length}</span>{/if}
            </div>
            <span class="slot-total mono">{slotTotal(items)} <span class="slot-unit">kcal</span></span>
          </div>

          <div
            class="slot-zone"
            class:slot-zone-empty={items.length === 0}
            use:dndzone={{ items, flipDurationMs: FLIP_MS, type: ZONE, dropTargetClasses: ['slot-drop-highlight'], dropTargetStyle: {} }}
            onconsider={(e) => handleSlotConsider(key, e)}
            onfinalize={(e) => handleSlotFinalize(key, e)}
          >
            {#each items as item (item.id)}
              <div class="slot-item" class:slot-item-flash={flashItems.has(item.id)} animate:flip={{ duration: FLIP_MS }}>
                <div class="si-main">
                  <span class="si-name">{item.name}</span>
                  <div class="si-macros">
                    <span class="si-macro mono" style="color: var(--cal)">{item.cal} cal</span>
                    <span class="si-macro mono" style="color: var(--pro)">{item.protein}p</span>
                    <span class="si-macro mono" style="color: var(--carb)">{item.netCarbs}c</span>
                    <span class="si-macro mono" style="color: var(--fat)">{item.fat}f</span>
                  </div>
                </div>
                <div class="si-controls">
                  <div class="si-qty">
                    <input type="number" class="qty-input mono" value={item.quantity} min="1"
                      oninput={(e) => updateQuantity(key, item.id, Number(e.target.value))} />
                    <span class="qty-label">g</span>
                  </div>
                  <button class="si-rm" onclick={() => removeItem(key, item.id)}><X size={13} strokeWidth={1.5} /></button>
                </div>
              </div>
            {/each}
          </div>

          {#if items.length === 0}
            <div class="slot-empty">
              <span class="slot-empty-text">Drag or click + to add items</span>
            </div>
          {/if}
        </div>
      {/each}
    </div>
  </div>
</div>

{#if showTemplateModal}
  <div class="modal-overlay" onclick={() => showTemplateModal = false}>
    <div class="modal-content" onclick={(e) => e.stopPropagation()}>
      <h2 style="font-size: var(--font-lg); font-weight: 600; margin-bottom: var(--space-1);">Save as Day Template</h2>
      <p style="font-size: var(--font-xs); color: var(--text-2); margin-bottom: var(--space-5);">Save today's meal plan as a reusable template</p>

      <label class="label" for="tpl-name">TEMPLATE NAME</label>
      <input id="tpl-name" type="text" class="input" placeholder="e.g. Lean Day, High Protein..." bind:value={templateName} style="margin-bottom: var(--space-4);" />

      <div style="padding: var(--space-3); border: var(--border-width) solid var(--border); border-radius: var(--radius-md); margin-bottom: var(--space-5);">
        <span style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-3); font-weight: 600;">{templateSummary.slotCount} meals · {templateSummary.totalItems} items</span>
        <div style="margin-top: var(--space-2); display: flex; gap: var(--space-2); flex-wrap: wrap;">
          <span class="mono" style="font-size: var(--font-xs); color: var(--cal);">{totals.cal} kcal</span>
          <span class="mono" style="font-size: var(--font-xs); color: var(--pro);">{totals.protein}p</span>
          <span class="mono" style="font-size: var(--font-xs); color: var(--carb);">{totals.netCarbs}c</span>
          <span class="mono" style="font-size: var(--font-xs); color: var(--fat);">{totals.fat}f</span>
        </div>
        <div style="margin-top: var(--space-2); font-size: var(--font-xs); color: var(--text-2);">
          {#each templateSummary.filledSlots as [slot, items]}
            <span>{slot.charAt(0).toUpperCase() + slot.slice(1)} ({items.length}){templateSummary.filledSlots.indexOf([slot, items]) < templateSummary.filledSlots.length - 1 ? ' · ' : ''}</span>
          {/each}
        </div>
      </div>

      <div style="display: flex; gap: var(--space-2); justify-content: flex-end;">
        <button class="btn btn-secondary" onclick={() => showTemplateModal = false}>Cancel</button>
        <button class="btn btn-primary" onclick={saveAsTemplate} disabled={savingTemplate || !templateName.trim()}>{savingTemplate ? 'Saving...' : 'Save Template'}</button>
      </div>
    </div>
  </div>
{/if}

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

{#if toast.visible}
  <div class="day-toast-wrap">
    <div class="day-toast day-toast-{toast.type}" role="alert">
      <Check size={14} strokeWidth={2} />
      <span>{toast.message}</span>
    </div>
  </div>
{/if}

<style>
  .top-bar { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--space-4); gap: var(--space-4); }
  .top-actions { display: flex; gap: var(--space-3); align-items: center; }

  /* ── Template-edit header ── */
  .back-link {
    display: inline-flex; align-items: center; gap: 4px;
    font-size: var(--font-xs); color: var(--text-3);
    margin-bottom: var(--space-2);
    transition: color var(--transition-fast);
  }
  .back-link:hover { color: var(--text-1); }

  /* ── Template-edit toolbar (top row: back link + actions) ── */
  .tpl-toolbar {
    display: flex; align-items: center; justify-content: space-between;
    gap: var(--space-4);
    margin-bottom: var(--space-4);
  }

  /* ── Centered template header ── */
  .tpl-center {
    display: flex; align-items: center; justify-content: center;
    gap: var(--space-2);
    margin-bottom: var(--space-6);
    padding-bottom: var(--space-5);
    border-bottom: var(--border-width) solid var(--surface-border);
  }
  .tpl-prefix {
    font-size: var(--font-md);
    color: var(--text-3);
    font-weight: 400;
    letter-spacing: -0.01em;
  }
  .tpl-prefix::after { content: ':'; margin-right: 2px; }

  .tpl-name {
    display: inline-flex; align-items: center; gap: var(--space-2);
    background: none; border: none; padding: 4px 8px;
    font-family: var(--font-sans);
    font-size: var(--font-2xl);
    font-weight: 600;
    letter-spacing: -0.025em;
    color: var(--text-0);
    cursor: pointer;
    border-radius: var(--radius-sm);
    transition: background var(--transition-fast);
  }
  .tpl-name :global(svg) {
    color: var(--text-3);
    opacity: 0;
    transition: opacity var(--transition-fast);
  }
  .tpl-name:hover { background: var(--bg-hover); }
  .tpl-name:hover :global(svg) { opacity: 1; }

  .tpl-name-input {
    background: transparent;
    border: none;
    border-bottom: var(--border-width) solid var(--text-2);
    padding: 4px 8px;
    font-family: var(--font-sans);
    font-size: var(--font-2xl);
    font-weight: 600;
    letter-spacing: -0.025em;
    color: var(--text-0);
    outline: none;
    min-width: 320px;
    text-align: center;
  }

  .tpl-delete {
    display: inline-flex; align-items: center; justify-content: center;
    width: 32px; height: 32px;
    padding: 0;
    margin-left: var(--space-2);
    color: var(--text-3);
    background: transparent;
    border: var(--border-width) solid transparent;
    border-radius: var(--radius-sm);
    cursor: pointer;
    transition: all var(--transition-fast);
  }
  .tpl-delete:hover {
    color: var(--danger);
    border-color: rgba(201, 112, 112, 0.18);
    background: var(--danger-bg);
  }

  .revert-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: var(--space-2) var(--space-5);
    font-size: var(--font-sm);
    font-family: var(--font-sans);
    font-weight: 600;
    line-height: 1.4;
    color: var(--text-2);
    background: transparent;
    border: var(--border-width) solid var(--border);
    border-radius: var(--radius-md);
    cursor: pointer;
    letter-spacing: -0.01em;
    transition: all var(--transition-fast);
  }
  .revert-btn:hover {
    color: var(--text-0);
    border-color: var(--border-strong);
    background: var(--bg-hover);
  }
  .revert-btn:active { transform: scale(0.98); }

  /* ── Toast ── */
  .day-toast-wrap {
    position: fixed; bottom: var(--space-4); right: var(--space-4); z-index: 2000;
  }
  .day-toast {
    display: flex; align-items: center; gap: var(--space-3);
    padding: var(--space-3) var(--space-5);
    border-radius: var(--radius-md);
    font-size: var(--font-sm); font-weight: 500;
    border: var(--border-width) solid var(--border);
    background: var(--bg-modal);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
    animation: slideUp 200ms ease both;
  }
  .day-toast-success { color: var(--success); border-color: var(--success); }
  .day-toast-error { color: var(--danger); border-color: var(--danger); }


  /* ── Macro Summary ── */
  .macro-summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: var(--space-4); margin-bottom: var(--space-8); padding-top: var(--space-4);padding-bottom: var(--space-5);  }
  .macro-stat { display: flex; flex-direction: column; gap: var(--space-2); }
  .ms-top { display: flex; justify-content: space-between; align-items: baseline; }
  .ms-label { font-size: var(--font-xs); color: var(--text-2); text-transform: uppercase; letter-spacing: 0.04em; font-weight: 500; }
  .ms-val { font-size: var(--font-sm); font-weight: 500; }
  .ms-unit { font-size: var(--font-xs); color: var(--text-3); font-weight: 400; }
  .progress-track { height: 4px; background: var(--border); border-radius: 99px; overflow: hidden; }
  .progress-fill { height: 100%; border-radius: 99px; transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1); }

  /* ── Layout ── */
  .planner-layout { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-6); align-items: start; }

  /* ── Source Panel ── */
  .source-panel {
    border: var(--border-width) solid var(--border);
    border-radius: var(--radius-md);
    padding: var(--space-5);
    position: sticky;
    top: calc(var(--navbar-height) + var(--space-4));
    max-height: calc(100vh - var(--navbar-height) - var(--space-8));
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .category-chips { display: flex; gap: var(--space-1); flex-wrap: wrap; }
  .chip {
    padding: 2px 10px; font-size: var(--font-xs); font-family: var(--font-sans); font-weight: 500;
    border: var(--border-width) solid var(--border); border-radius: var(--radius-full);
    background: transparent; color: var(--text-3); cursor: pointer; transition: all var(--transition-fast); white-space: nowrap;
  }
  .chip:hover { border-color: var(--border-strong); color: var(--text-1); }
  .chip-active { border-color: var(--text-2); color: var(--text-0); }

  /* Slot picker — always visible */
  .slot-picker-section { display: flex; align-items: center; gap: var(--space-3); }
  .slot-picker-label { font-size: 11px; color: var(--text-3); text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600; white-space: nowrap; }
  .slot-picker { display: flex; gap: 1px; background: var(--border); border-radius: var(--radius-sm); overflow: hidden; flex: 1; }
  .pick-btn {
    flex: 1; padding: 4px 0; font-size: 11px; font-family: var(--font-sans); font-weight: 500;
    border: none; background: var(--bg-0); color: var(--text-3); cursor: pointer; transition: all var(--transition-fast);
  }
  .pick-btn:hover { color: var(--text-1); }
  .pick-active { color: var(--text-0); background: var(--bg-active); }

  .source-section { display: flex; flex-direction: column; gap: var(--space-3); }
  .section-header { display: flex; align-items: center; gap: var(--space-2); color: var(--text-2); }
  .section-tag { font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600; }
  .section-count { font-size: 11px; color: var(--text-3); margin-left: auto; }

  /* ── Food Cards ── */
  .card-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--space-2); }

  .food-card {
    position: relative;
    display: flex; flex-direction: column; gap: var(--space-2);
    padding: var(--space-3); border: var(--border-width) solid var(--border);
    border-radius: var(--radius-md); background: transparent;
    text-align: left; font-family: var(--font-sans);
    transition: border-color var(--transition-fast), background var(--transition-fast);
  }

  /* Draggable cards: row layout with grip + content + add button */
  .food-card-draggable {
    flex-direction: row;
    align-items: center;
    gap: var(--space-2);
    cursor: grab;
    user-select: none;
  }
  .food-card-draggable:hover { border-color: var(--border-strong); background: var(--bg-hover); }
  .food-card-draggable:active { cursor: grabbing; }

  .fc-grip { color: var(--text-3); opacity: 0.35; flex-shrink: 0; display: flex; transition: opacity var(--transition-fast); }
  .food-card-draggable:hover .fc-grip { opacity: 0.7; }

  .fc-content { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }

  .fc-add {
    flex-shrink: 0; display: flex; align-items: center; justify-content: center;
    width: 24px; height: 24px; border-radius: var(--radius-sm);
    border: var(--border-width) solid var(--border); background: transparent;
    color: var(--text-3); cursor: pointer; transition: all var(--transition-fast);
    opacity: 0;
  }
  .food-card-draggable:hover .fc-add { opacity: 1; }
  .fc-add:hover { border-color: var(--text-2); color: var(--text-0); background: var(--bg-active); }
  .fc-add:active { transform: scale(0.9); }

  .fc-name {
    font-size: var(--font-xs); color: var(--text-0); font-weight: 500; line-height: 1.3;
    display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2;
    -webkit-box-orient: vertical; overflow: hidden;
  }
  .fc-macros { display: flex; gap: var(--space-2); flex-wrap: wrap; }
  .fc-macro { font-size: 10.5px; opacity: 0.7; }
  .source-empty { text-align: center; font-size: var(--font-xs); color: var(--text-3); padding: var(--space-5); }

  /* ── Shadow items in source (copy pattern) ── */
  .dnd-source :global([data-is-dnd-shadow-item-hint]) {
    opacity: 0.25 !important;
    border-style: dashed !important;
    background: transparent !important;
  }

  /* ── Meal Slots ── */
  .slots-panel { display: flex; flex-direction: column; gap: var(--space-4); }

  .meal-slot {
    border: var(--border-width) solid var(--border); border-radius: var(--radius-md);
    padding: var(--space-4) var(--space-5); transition: border-color var(--transition-base);
  }
  .slot-active-target { border-color: var(--border-strong); }

  .slot-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-3); }
  .slot-left { display: flex; align-items: baseline; gap: var(--space-2); }
  .slot-name { font-size: var(--font-base); font-weight: 600; }
  .slot-count { font-size: 11px; color: var(--text-3); }
  .slot-total { font-size: var(--font-sm); font-weight: 500; }
  .slot-unit { font-size: var(--font-xs); color: var(--text-3); font-weight: 400; }

  .slot-zone {
    display: flex; flex-direction: column; gap: var(--space-2);
    min-height: 48px; border-radius: var(--radius-sm);
    transition: background var(--transition-fast), outline-color var(--transition-fast);
    padding: var(--space-1);
  }
  .slot-zone-empty {
    min-height: 56px;
  }

  /* Drop target highlight when dragging over */
  :global(.slot-drop-highlight) {
    outline: 1.5px dashed var(--text-1) !important;
    outline-offset: -1px;
  }

  .slot-item {
    display: flex; align-items: center; justify-content: space-between; gap: var(--space-3);
    padding: var(--space-3); border: var(--border-width) solid var(--border);
    border-radius: var(--radius-sm); cursor: grab; transition: all var(--transition-fast);
  }
  .slot-item:hover { background: var(--bg-hover); border-color: var(--border-strong); }
  .slot-item:active { cursor: grabbing; }

  /* Flash animation when item is added */
  .slot-item-flash {
    animation: itemFlash 400ms ease;
  }
  @keyframes itemFlash {
    0% { background: var(--accent-subtle); opacity: 0.6; }
    50% { background: var(--accent-subtle); opacity: 1; }
    100% { background: transparent; opacity: 1; }
  }

  /* Shadow items in slots during reorder */
  .slot-zone :global([data-is-dnd-shadow-item-hint]) {
    opacity: 0.35 !important;
    border-style: dashed !important;
  }

  .si-main { display: flex; flex-direction: column; gap: 3px; min-width: 0; flex: 1; }
  .si-name { font-size: var(--font-sm); font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .si-macros { display: flex; gap: var(--space-2); }
  .si-macro { font-size: 11px; opacity: 0.65; }

  .si-controls { display: flex; align-items: center; gap: var(--space-2); flex-shrink: 0; }
  .si-qty { display: flex; align-items: center; gap: 2px; }
  .qty-input {
    width: 52px; padding: 3px 6px; font-size: var(--font-xs); background: transparent;
    border: var(--border-width) solid var(--border); border-radius: var(--radius-sm);
    color: var(--text-0); text-align: right; transition: border-color var(--transition-fast);
  }
  .qty-input:focus { outline: none; border-color: var(--text-2); }
  .qty-input::-webkit-inner-spin-button, .qty-input::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
  .qty-label { font-size: var(--font-xs); color: var(--text-3); }

  .si-rm {
    background: none; border: none; color: var(--text-3); cursor: pointer;
    display: flex; padding: 3px; border-radius: var(--radius-sm); transition: all var(--transition-fast);
  }
  .si-rm:hover { color: var(--danger); background: var(--danger-bg); }

  .slot-empty {
    display: flex; align-items: center; justify-content: center; min-height: 56px;
    border: var(--border-width) dashed var(--border); border-radius: var(--radius-sm);
  }
  .slot-empty-text { font-size: var(--font-xs); color: var(--text-3); }

  @media (max-width: 900px) {
    .planner-layout { grid-template-columns: 1fr; }
    .source-panel { position: static; max-height: 450px; }
  }
  @media (max-width: 600px) {
    .card-grid { grid-template-columns: 1fr; }
    .macro-summary { grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); }
  }
</style>
