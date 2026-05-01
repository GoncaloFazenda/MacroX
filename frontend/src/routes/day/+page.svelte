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
  import { X, Sparkles, Search, SlidersHorizontal, ChevronDown, ChevronLeft, ChevronRight, Bookmark, ArrowLeft, Pencil, Check, Trash2, Undo2, Copy, Sunrise, Sun, Moon, Cookie } from 'lucide-svelte';
  import DateNav from '$lib/components/ui/DateNav.svelte';
  import SaveButton from '$lib/components/ui/SaveButton.svelte';
  import AnimatedNumber from '$lib/components/ui/AnimatedNumber.svelte';
  import { dndzone, SHADOW_ITEM_MARKER_PROPERTY_NAME } from 'svelte-dnd-action';
  import { flip } from 'svelte/animate';
  import { fade, slide, scale, fly } from 'svelte/transition';
  import { quintOut, backOut } from 'svelte/easing';

  let { data } = $props();

  const FLIP_MS = 150;
  const ZONE = 'planner';

  let currentDate = $state(data.currentDate);
  let search = $state('');
  let activeCategory = $state('All');
  let activeSlot = $state('breakfast');
  let activeTab = $state('foods');
  let showFilters = $state(false);
  let filtersEl = $state(null);
  let canScrollLeft = $state(false);
  let canScrollRight = $state(false);
  let slotMenuOpen = $state(false);

  function updateFiltersScrollState() {
    const el = filtersEl;
    if (!el) return;
    canScrollLeft = el.scrollLeft > 2;
    canScrollRight = el.scrollLeft + el.clientWidth < el.scrollWidth - 2;
  }
  function scrollFilters(dir) {
    const el = filtersEl;
    if (!el) return;
    const step = Math.max(120, el.clientWidth * 0.6);
    const max = el.scrollWidth - el.clientWidth;
    let target = el.scrollLeft + dir * step;
    const SNAP = 40;
    if (dir > 0 && max - target < SNAP) target = max;
    else if (dir < 0 && target < SNAP) target = 0;
    el.scrollTo({ left: Math.max(0, Math.min(max, target)), behavior: 'smooth' });
  }
  $effect(() => {
    if (!showFilters) return;
    requestAnimationFrame(updateFiltersScrollState);
  });
  let suggOpen = $state(true);
  let suggHeaderSparkle = $state(false);
  let newSuggIds = $state(new Set());      // items showing the border/glow effect
  let unseenNewIds = $state(new Set());    // subset still showing the NEW tag
  let userHasInteractedSugg = $state(false); // gate for treating list deltas as "new arrivals"
  let suggGridEl = $state(null);           // bound to the 2-row suggestion grid for measurement
  let overflowSuggIds = $state(new Set()); // ids that don't fit in the visible 2 rows
  let suggSingleRow = $state(false);       // collapse to one row when row 2 would be sparse (≤2 items)
  let suggMeasureRaf = null;
  let prevSuggIds = new Set();
  let suggHeaderSparkleTimer = null;
  let newSuggClearTimer = null;
  let unseenTagClearTimer = null;
  let saving = $state(false);
  let mounted = $state(false);
  let ready = $state(true);

  function pickSlot(s) { activeSlot = s; slotMenuOpen = false; }
  let nextId = 1;
  let pendingNavigation = $state(null);
  let allowNextNavigation = false;
  let storesHydrated = $state(false);

  // ── Template-edit / new-plan mode ──
  let templateMode = $state(data.templateMode);
  let isNewTemplate = $state(data.isNewTemplate);
  let editingTemplateId = $state(data.editingTemplateId);
  let templateNameValue = $state(data.template?.name || '');
  let editingTemplateName = $state(data.isNewTemplate); // open name editor immediately when creating
  let templateNameDraft = $state('');

  // ── Dirty tracking ──
  let savedSnapshot = $state(JSON.stringify({
    slots: { breakfast: [], lunch: [], dinner: [], snack: [] },
    name: null,
  }));
  const dirty = $derived(ready && snapshot() !== savedSnapshot);

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
    if (allowNextNavigation) {
      allowNextNavigation = false;
      return;
    }
    if (dirty) {
      cancel();
      pendingNavigation = to?.url ? `${to.url.pathname}${to.url.search}${to.url.hash}` : '/overview';
      openConfirm({
        title: 'Discard these edits?',
        message: 'This day still has unsaved changes.',
        warning: 'Leaving now will remove the edits you made since the last save.',
        confirmText: 'Discard edits',
        cancelText: 'Keep editing',
        danger: true,
        onConfirm: async () => {
          const target = pendingNavigation;
          pendingNavigation = null;
          allowNextNavigation = true;
          await goto(target || '/overview');
        },
      });
    }
  });

  const categories = ['All', 'Protein', 'Vegetable', 'Fruit', 'Grain', 'Dairy', 'Fat & Oil', 'Nut & Seed', 'Legume', 'Beverage', 'Condiment', 'Other'];

  const foods = $derived(storesHydrated ? $foodStore.foods : data.foods);
  const meals = $derived(storesHydrated ? $mealStore.meals : data.meals);
  const templates = $derived(storesHydrated ? $dayTemplateStore.templates : data.templates);

  function emptySlots() {
    return { breakfast: [], lunch: [], dinner: [], snack: [] };
  }

  let slots = $state(emptySlots());
  const slotLabels = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snack: 'Snack' };
  const slotIcons = { breakfast: Sunrise, lunch: Sun, dinner: Moon, snack: Cookie };

  const goals = $derived($auth.user?.goals || { calories: 2000, protein: 150, netCarbs: 100, fat: 65 });

  // DnD source arrays
  let foodDndItems = $state([]);
  let mealDndItems = $state([]);
  let suggDndItems = $state([]);

  // Track which items were just added (for flash animation)
  let flashItems = $state(new Set());

  function buildSlotsFromMeals(sourceMeals) {
    const newSlots = emptySlots();
    for (const meal of sourceMeals || []) {
      if (newSlots[meal.slot]) {
        newSlots[meal.slot] = meal.items.map(item => ({
          id: nextId++, type: item.type, refId: item.refId, quantity: item.quantity,
          ...getItemMacros(item),
        }));
      }
    }
    return newSlots;
  }

  if (isNewTemplate) {
    slots = emptySlots();
    templateNameValue = '';
    templateNameDraft = '';
  } else if (templateMode) {
    slots = buildSlotsFromMeals(data.template?.meals || []);
  } else {
    slots = buildSlotsFromMeals(data.dailyPlan?.meals || []);
  }

  onMount(() => {
    foodStore.hydrate(data.foods, data.foodPagination);
    mealStore.hydrate(data.meals);
    dayTemplateStore.hydrate(data.templates);
    plannerStore.hydrateDaily(data.dailyPlan);
    storesHydrated = true;
    syncSources();
    takeSavedSnapshot();
    syncSuggestions();
    setTimeout(() => mounted = true, 50);

    // Recompute which suggestion cards fit in 2 rows whenever the grid resizes.
    let ro = null;
    const ensureObserver = () => {
      if (ro || !suggGridEl) return;
      ro = new ResizeObserver(scheduleSuggMeasure);
      ro.observe(suggGridEl);
      scheduleSuggMeasure();
    };
    ensureObserver();
    // The grid mounts conditionally ({#if suggDndItems.length > 0}); retry until bound.
    const bindCheck = setInterval(ensureObserver, 200);
    return () => {
      clearInterval(bindCheck);
      if (ro) ro.disconnect();
      cancelAnimationFrame(suggMeasureRaf);
    };
  });

  async function loadTemplate() {
    const tpl = templates.find(t => t._id === editingTemplateId);
    if (!tpl) {
      showToast('Day plan not found', 'error');
      slots = emptySlots();
      templateNameValue = '';
      return;
    }
    templateNameValue = tpl.name;
    slots = buildSlotsFromMeals(tpl.meals || []);
  }

  function syncSources() {
    const q = search.toLowerCase();
    const filtered = foods.filter(f =>
      f.name.toLowerCase().includes(q) &&
      (activeCategory === 'All' || f.category === activeCategory)
    );
    foodDndItems = filtered.slice(0, 50).map(f => ({
      id: `sf-${f._id}`, _id: f._id,
      name: f.name, calories: Math.round(f.calories),
      protein: Math.round(f.protein * 10) / 10,
      netCarbs: Math.round(f.netCarbs * 10) / 10,
      fat: Math.round(f.fat * 10) / 10,
      category: f.category,
    }));
    mealDndItems = meals.map(m => ({
      id: `sm-${m._id}`, _id: m._id,
      name: m.name, calories: Math.round(m.totalMacros?.calories || 0),
      protein: Math.round(m.totalMacros?.protein || 0),
      netCarbs: Math.round(m.totalMacros?.netCarbs || 0),
      fat: Math.round(m.totalMacros?.fat || 0),
    }));
  }

  async function loadPlan() {
    ready = false;
    await plannerStore.loadDaily(currentDate);
    const plan = $plannerStore.dailyPlan;
    if (plan?.meals) {
      slots = buildSlotsFromMeals(plan.meals);
    } else {
      slots = emptySlots();
    }
    ready = true;
  }

  function getItemMacros(item) {
    const mult = item.quantity / 100;
    if (item.type === 'food') {
      const f = foods.find(fd => fd._id === item.refId);
      return {
        name: f?.name || 'Unknown', cal: Math.round((f?.calories || 0) * mult),
        protein: Math.round((f?.protein || 0) * mult * 10) / 10,
        netCarbs: Math.round((f?.netCarbs || 0) * mult * 10) / 10,
        fat: Math.round((f?.fat || 0) * mult * 10) / 10,
      };
    }
    const m = meals.find(ml => ml._id === item.refId);
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

  // Suggestions that best fit remaining goals — soft scoring, not hard exclusion
  const suggestions = $derived.by(() => {
    const calGoal = goals.calories || 2000;
    const proteinGoal = goals.protein ?? 0;
    const carbGoal = goals.netCarbs ?? 0;
    const fatGoal = goals.fat ?? 0;

    const rem = {
      cal: calGoal - totals.cal,
      protein: proteinGoal - totals.protein,
      netCarbs: carbGoal - totals.netCarbs,
      fat: fatGoal - totals.fat,
    };

    // No meaningful budget left — stop suggesting
    if (rem.cal <= 30) return [];

    // Skip foods already added to the day to keep suggestions fresh
    const addedFoodIds = new Set();
    for (const slot of Object.values(slots)) {
      for (const item of slot) {
        if (item.type === 'food' && item.refId) addedFoodIds.add(item.refId);
      }
    }

    // Soft cap: a single 100g serving can use up to 1.3× remaining calories.
    // We score for fit instead of hard-excluding once macros go negative.
    const calCap = Math.max(rem.cal * 1.3, 100);

    return foods
      .filter(f =>
        f.calories > 0 &&
        f.calories <= calCap &&
        !addedFoodIds.has(f._id)
      )
      .map(f => {
        let score = 0;

        // Fit calories well — prefer foods that take a reasonable bite of remaining budget
        const calRatio = f.calories / Math.max(rem.cal, 1);
        if (calRatio <= 1) score += (1 - Math.abs(calRatio - 0.25)) * 8;
        else score -= (calRatio - 1) * 6;

        // Reward foods that contribute to under-met macros (per kcal density)
        const perKcal = (v) => v / Math.max(f.calories, 1);
        if (rem.protein > 5)   score += perKcal(f.protein) * 120;
        if (rem.netCarbs > 5)  score += perKcal(f.netCarbs) * 30;
        if (rem.fat > 3)       score += perKcal(f.fat) * 40;

        // Penalise foods that push further into already-overshot macros
        if (rem.netCarbs <= 0 && f.netCarbs > 1) score -= f.netCarbs * 0.6;
        if (rem.fat <= 0 && f.fat > 1)           score -= f.fat * 0.8;
        if (rem.protein <= 0 && f.protein > 30)  score -= (f.protein - 30) * 0.2;

        return { ...f, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);
  });

  // suggDndItems mirrors `suggestions` but is mutable so svelte-dnd-action
  // can reorder during a drag. A $effect keeps it in sync reactively.
  let isSuggDragging = $state(false);
  // Header icon indicator runs as long as any card still wears the new-glow,
  // so the icon and the cards stop animating at the same moment.
  // Plus: on a fresh page (before the user has interacted with the panel) the
  // icon sparks continuously so the user notices the suggestions exist, while
  // no individual card glows. The continuous icon spark stops on first interaction.
  const hasNewSuggs = $derived(
    newSuggIds.size > 0 || (!userHasInteractedSugg && suggDndItems.length > 0)
  );

  function markUserInteractedSugg() {
    if (!userHasInteractedSugg) userHasInteractedSugg = true;
  }

  function syncSuggestions() {
    suggDndItems = suggestions.map(f => ({
      id: `sg-${f._id}`, _id: f._id,
      name: f.name, calories: Math.round(f.calories),
      protein: Math.round(f.protein * 10) / 10,
      netCarbs: Math.round(f.netCarbs * 10) / 10,
      fat: Math.round(f.fat * 10) / 10,
      category: f.category,
    }));
  }

  $effect(() => {
    // Re-run whenever the derived suggestions list changes (foods/totals/goals/slots)
    suggestions;
    if (!isSuggDragging) syncSuggestions();
  });

  // Track which suggestion ids are *new* compared to the previous render so
  // we can highlight them and sparkle the header/icon when they arrive.
  $effect(() => {
    const currentIds = new Set(suggDndItems.map(s => s.id));
    if (isSuggDragging) { prevSuggIds = currentIds; return; }

    // Drop newSuggIds entries that are no longer in the list
    const stillNew = new Set();
    for (const id of newSuggIds) if (currentIds.has(id)) stillNew.add(id);
    if (stillNew.size !== newSuggIds.size) newSuggIds = stillNew;

    const stillUnseen = new Set();
    for (const id of unseenNewIds) if (currentIds.has(id)) stillUnseen.add(id);
    if (stillUnseen.size !== unseenNewIds.size) unseenNewIds = stillUnseen;

    const fresh = new Set();
    for (const id of currentIds) if (!prevSuggIds.has(id)) fresh.add(id);

    // Don't treat list deltas as "new arrivals" until the user has actually
    // interacted with the panel. This is interaction-gated rather than
    // time-gated so it stays correct regardless of when stores hydrate
    // (auth/planner/templates can settle long after mount).
    if (fresh.size > 0 && userHasInteractedSugg) {
      newSuggIds = new Set([...newSuggIds, ...fresh]);
      unseenNewIds = new Set([...unseenNewIds, ...fresh]);
      suggHeaderSparkle = true;

      clearTimeout(suggHeaderSparkleTimer);
      suggHeaderSparkleTimer = setTimeout(() => { suggHeaderSparkle = false; }, 1200);

      // Border/glow effect lingers as a "newness" marker (~10s)
      clearTimeout(newSuggClearTimer);
      newSuggClearTimer = setTimeout(() => { newSuggIds = new Set(); }, 10000);

      // NEW tag clears once seen — auto-clear if panel is open
      if (suggOpen) {
        clearTimeout(unseenTagClearTimer);
        unseenTagClearTimer = setTimeout(() => { unseenNewIds = new Set(); }, 1800);
      }
    }
    prevSuggIds = currentIds;
  });

  function toggleSugg() {
    markUserInteractedSugg();
    suggOpen = !suggOpen;
    if (suggOpen) {
      // Once the user opens the panel, schedule the NEW tags to clear
      clearTimeout(unseenTagClearTimer);
      unseenTagClearTimer = setTimeout(() => { unseenNewIds = new Set(); }, 1800);
    }
  }

  // Walk the rendered cards' offsetTop, find the first 2 unique row positions,
  // and mark every card on row 3+ as "overflow" (hidden visually + a11y).
  function measureSuggOverflow() {
    // Never measure (and never toggle the overflow class) while the user is
    // dragging a suggestion. dnd-action mutates suggDndItems on every
    // pointermove, and clipping the dragged card mid-flight makes it vanish
    // under the cursor and breaks dropping into slots.
    if (!suggGridEl || isSuggDragging) return;
    const cards = Array.from(suggGridEl.querySelectorAll('[data-sugg-id]'));
    if (cards.length === 0) {
      if (overflowSuggIds.size > 0) overflowSuggIds = new Set();
      if (suggSingleRow) suggSingleRow = false;
      return;
    }

    // Group cards by their row's offsetTop
    const rowMap = new Map();
    for (const card of cards) {
      const top = card.offsetTop;
      if (!rowMap.has(top)) rowMap.set(top, []);
      rowMap.get(top).push(card);
    }
    const rows = [...rowMap.entries()].sort((a, b) => a[0] - b[0]);

    // If row 2 would only hold 2 or fewer items, hide them — collapse to 1 row.
    const row2Sparse = rows.length >= 2 && rows[1][1].length <= 2;
    const visibleRowCount = row2Sparse ? 1 : Math.min(rows.length, 2);

    const next = new Set();
    for (let i = visibleRowCount; i < rows.length; i++) {
      for (const card of rows[i][1]) {
        const id = card.dataset.suggId;
        if (id) next.add(id);
      }
    }

    const wantSingle = visibleRowCount === 1;
    if (suggSingleRow !== wantSingle) suggSingleRow = wantSingle;
    if (next.size !== overflowSuggIds.size ||
        [...next].some(id => !overflowSuggIds.has(id))) {
      overflowSuggIds = next;
    }
  }
  function scheduleSuggMeasure() {
    cancelAnimationFrame(suggMeasureRaf);
    suggMeasureRaf = requestAnimationFrame(measureSuggOverflow);
  }
  // Re-measure whenever the rendered list changes (items added/removed/reordered).
  $effect(() => {
    suggDndItems;
    if (suggGridEl) scheduleSuggMeasure();
  });

  // Hovering / focusing a new card "acknowledges" it: drop its glow + tag.
  // The header icon stops only once newSuggIds is empty (handled by hasNewSuggs).
  function acknowledgeNewSugg(id) {
    // dnd-action fires pointerenter on every card the cursor crosses while
    // dragging. Don't mutate state mid-flight or we cause re-renders on the
    // suggestion grid while the drag is active.
    if (isSuggDragging) return;
    markUserInteractedSugg();
    if (newSuggIds.has(id)) {
      const next = new Set(newSuggIds);
      next.delete(id);
      newSuggIds = next;
    }
    if (unseenNewIds.has(id)) {
      const nextU = new Set(unseenNewIds);
      nextU.delete(id);
      unseenNewIds = nextU;
    }
  }

  // Click-to-add with flash
  function flashItem(id) {
    flashItems = new Set([...flashItems, id]);
    setTimeout(() => {
      flashItems = new Set([...flashItems].filter(x => x !== id));
    }, 400);
  }

  function addFood(food) {
    markUserInteractedSugg();
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
    markUserInteractedSugg();
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
  function handleSuggConsider(e) { markUserInteractedSugg(); isSuggDragging = true; suggDndItems = e.detail.items; }
  function handleSuggFinalize(e) {
    isSuggDragging = false;
    syncSuggestions();
    // Drag is over — let layout settle and then re-evaluate which cards fit.
    requestAnimationFrame(() => requestAnimationFrame(scheduleSuggMeasure));
  }

  // DnD Slot handlers
  function handleSlotConsider(slot, e) {
    // Don't touch activeSlot here — it fires on every pointermove while
    // dragging and re-renders the slot's active styling mid-drag, which
    // disturbs dnd-action's drop-target geometry. Set activeSlot at
    // finalize (drop) instead.
    slots[slot] = e.detail.items;
    slots = { ...slots };
  }
  function handleSlotFinalize(slot, e) {
    markUserInteractedSugg();
    // Whatever slot the drop landed in is now the active one.
    if (activeSlot !== slot) activeSlot = slot;
    slots[slot] = e.detail.items.map(item => {
      if (item[SHADOW_ITEM_MARKER_PROPERTY_NAME]) return item;
      const sid = String(item.id);
      if (sid.startsWith('sf-') || sid.startsWith('sg-')) {
        const food = foods.find(f => f._id === item._id);
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
        const meal = meals.find(m => m._id === item._id);
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
      const food = foods.find(f => f._id === item.refId);
      if (food) {
        item.quantity = newQty;
        item.cal = Math.round(food.calories * mult);
        item.protein = Math.round(food.protein * mult * 10) / 10;
        item.netCarbs = Math.round(food.netCarbs * mult * 10) / 10;
        item.fat = Math.round(food.fat * mult * 10) / 10;
      }
    } else {
      const meal = meals.find(m => m._id === item.refId);
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

  function removeItem(slot, id) { markUserInteractedSugg(); slots[slot] = slots[slot].filter(i => i.id !== id); slots = { ...slots }; syncSuggestions(); }

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

<svelte:window
  onbeforeunload={(e) => { if (dirty) { e.preventDefault(); e.returnValue = ''; } }}
  onclick={() => { if (slotMenuOpen) slotMenuOpen = false; }}
/>

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
        <SaveButton ready={ready} dirty={dirty} saving={saving} onclick={savePlan} />
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
        <SaveButton ready={ready} dirty={dirty} saving={saving} onclick={savePlan} />
      </div>
    </div>
    <DateNav date={currentDate} onprev={prevDay} onnext={nextDay} class="animate-slide-up stagger-1" style="margin-bottom: var(--space-5)" />
  {/if}

  <!-- Macro Summary -->
  <div class="macro-summary animate-slide-up stagger-2 ">
    <div class="macro-stat">
      <div class="ms-top"><span class="ms-label">Calories</span><span class="ms-val mono"><AnimatedNumber value={totals.cal} duration={700} /> {goals.calories != null ? `/ ${goals.calories}` : ''} <span class="ms-unit">kcal</span></span></div>
      <div class="progress-track"><div class="progress-fill" style="width: {mounted && goals.calories ? Math.min(getPercentage(totals.cal, goals.calories), 100) : 0}%; background: var(--cal)"></div></div>
    </div>
    {#if goals.protein != null}
    <div class="macro-stat">
      <div class="ms-top"><span class="ms-label">Protein</span><span class="ms-val mono"><AnimatedNumber value={totals.protein} decimals={1} duration={700} /> / {goals.protein} <span class="ms-unit">g</span></span></div>
      <div class="progress-track"><div class="progress-fill" style="width: {mounted ? Math.min(getPercentage(totals.protein, goals.protein), 100) : 0}%; background: var(--pro)"></div></div>
    </div>
    {/if}
    {#if goals.netCarbs != null}
    <div class="macro-stat">
      <div class="ms-top"><span class="ms-label">Net Carbs</span><span class="ms-val mono"><AnimatedNumber value={totals.netCarbs} decimals={1} duration={700} /> / {goals.netCarbs} <span class="ms-unit">g</span></span></div>
      <div class="progress-track"><div class="progress-fill" style="width: {mounted ? Math.min(getPercentage(totals.netCarbs, goals.netCarbs), 100) : 0}%; background: var(--carb)"></div></div>
    </div>
    {/if}
    {#if goals.fat != null}
    <div class="macro-stat">
      <div class="ms-top"><span class="ms-label">Fat</span><span class="ms-val mono"><AnimatedNumber value={totals.fat} decimals={1} duration={700} /> / {goals.fat} <span class="ms-unit">g</span></span></div>
      <div class="progress-track"><div class="progress-fill" style="width: {mounted ? Math.min(getPercentage(totals.fat, goals.fat), 100) : 0}%; background: var(--fat)"></div></div>
    </div>
    {/if}
  </div>

  <!-- Main Layout -->
  <div class="planner-layout">
    <!-- Source Panel -->
    <div class="source-panel animate-slide-up stagger-3">
      <!-- Combined search row: slot chip + search + filter toggle -->
      <div class="search-row">
        <div class="slot-chip-wrap">
          <button
            class="slot-chip"
            class:slot-chip-open={slotMenuOpen}
            onclick={(e) => { e.stopPropagation(); slotMenuOpen = !slotMenuOpen; }}
            type="button"
            aria-haspopup="menu"
            aria-expanded={slotMenuOpen}
          >
            <span class="slot-chip-label">Add to</span>
            <span class="slot-chip-value">{slotLabels[activeSlot]}</span>
            <span class="slot-chip-caret" class:slot-chip-caret-open={slotMenuOpen}>
              <ChevronDown size={12} strokeWidth={1.75} />
            </span>
          </button>
          {#if slotMenuOpen}
            <div class="slot-menu" role="menu" transition:scale={{ duration: 140, start: 0.94, easing: quintOut }}>
              {#each Object.entries(slotLabels) as [key, label]}
                <button
                  class="slot-menu-item"
                  class:slot-menu-active={activeSlot === key}
                  onclick={(e) => { e.stopPropagation(); pickSlot(key); }}
                  type="button"
                  role="menuitem"
                >
                  <span>{label}</span>
                  {#if activeSlot === key}<Check size={11} strokeWidth={2} />{/if}
                </button>
              {/each}
            </div>
          {/if}
        </div>

        <div class="search-wrap">
          <span class="search-icon"><Search size={13} strokeWidth={1.75} /></span>
          <input
            type="text"
            class="search-input"
            placeholder="Search foods…"
            value={search}
            oninput={(e) => { search = e.target.value; syncSources(); }}
          />
          {#if search}
            <button class="search-clear" onclick={() => { search = ''; syncSources(); }} type="button" aria-label="Clear search" transition:fade={{ duration: 100 }}>
              <X size={11} strokeWidth={2} />
            </button>
          {/if}
        </div>

        <button
          class="filter-btn"
          class:filter-active={showFilters || activeCategory !== 'All'}
          onclick={() => showFilters = !showFilters}
          type="button"
          aria-label="Filters"
          aria-pressed={showFilters}
          title="Filter by category"
        >
          <SlidersHorizontal size={13} strokeWidth={1.75} />
          {#if activeCategory !== 'All' && !showFilters}
            <span class="filter-dot" transition:scale={{ duration: 150, start: 0.4 }}></span>
          {/if}
        </button>
      </div>

      <!-- Collapsible filters drawer — minimalist text-tab row -->
      <div class="filters-wrap" class:filters-open={showFilters} aria-hidden={!showFilters}>
        <div class="filters-inner">
          <button
            class="filters-nav filters-nav-left"
            class:filters-nav-disabled={!canScrollLeft}
            onclick={() => scrollFilters(-1)}
            type="button"
            tabindex={showFilters && canScrollLeft ? 0 : -1}
            aria-label="Scroll filters left"
          >
            <ChevronLeft size={14} strokeWidth={1.75} />
          </button>
          <div
            class="filters"
            class:filters-fade-left={canScrollLeft}
            class:filters-fade-right={canScrollRight}
            bind:this={filtersEl}
            onscroll={updateFiltersScrollState}
          >
            {#each categories as cat (cat)}
              <button
                class="chip"
                class:chip-active={activeCategory === cat}
                onclick={() => { activeCategory = cat; syncSources(); }}
                type="button"
                tabindex={showFilters ? 0 : -1}
              >
                <span class="chip-label">{cat}</span>
              </button>
            {/each}
          </div>
          <button
            class="filters-nav filters-nav-right"
            class:filters-nav-disabled={!canScrollRight}
            onclick={() => scrollFilters(1)}
            type="button"
            tabindex={showFilters && canScrollRight ? 0 : -1}
            aria-label="Scroll filters right"
          >
            <ChevronRight size={14} strokeWidth={1.75} />
          </button>
        </div>
      </div>

      <!-- Suggestions: collapsible, draggable -->
      {#if suggDndItems.length > 0}
        <div class="sugg-row" transition:slide={{ duration: 200, easing: quintOut }}>
          <button
            class="sugg-header"
            class:sugg-header-sparkle={suggHeaderSparkle}
            onclick={toggleSugg}
            type="button"
            aria-expanded={suggOpen}
            aria-controls="sugg-body"
          >
            <span class="sugg-icon" class:sugg-icon-pulse={hasNewSuggs}>
              <Sparkles size={11} strokeWidth={1.75} />
              {#if hasNewSuggs}
                <span class="sugg-icon-spark sugg-icon-spark-1" aria-hidden="true"></span>
                <span class="sugg-icon-spark sugg-icon-spark-2" aria-hidden="true"></span>
                <span class="sugg-icon-spark sugg-icon-spark-3" aria-hidden="true"></span>
              {/if}
            </span>
            <span class="sugg-tag">Suggested for you</span>
            <span class="sugg-caret" class:sugg-caret-open={suggOpen}>
              <ChevronDown size={11} strokeWidth={2} />
            </span>
          </button>
          <div class="sugg-body" class:sugg-body-open={suggOpen} id="sugg-body" aria-hidden={!suggOpen}>
            <div
              class="sugg-grid dnd-source"
              class:sugg-grid-single-row={suggSingleRow}
              class:sugg-grid-dragging={isSuggDragging}
              bind:this={suggGridEl}
              use:dndzone={{ items: suggDndItems, flipDurationMs: FLIP_MS, type: ZONE, dropFromOthersDisabled: true, dropTargetStyle: {}, centreDraggedOnCursor: true }}
              onconsider={handleSuggConsider}
              onfinalize={handleSuggFinalize}
            >
              {#each suggDndItems as item, i (item.id)}
                <button
                  class="sugg-card"
                  class:sugg-card-new={newSuggIds.has(item.id)}
                  class:sugg-card-overflow={overflowSuggIds.has(item.id)}
                  data-sugg-id={item.id}
                  type="button"
                  tabindex={suggOpen && !overflowSuggIds.has(item.id) ? 0 : -1}
                  aria-hidden={overflowSuggIds.has(item.id) ? 'true' : undefined}
                  onclick={() => addFood(item)}
                  onpointerenter={() => acknowledgeNewSugg(item.id)}
                  onfocus={() => acknowledgeNewSugg(item.id)}
                  animate:flip={{ duration: FLIP_MS }}
                >
                  {#if newSuggIds.has(item.id)}
                    <span class="sc-spark sc-spark-1" aria-hidden="true"></span>
                    <span class="sc-spark sc-spark-2" aria-hidden="true"></span>
                    <span class="sc-spark sc-spark-3" aria-hidden="true"></span>
                  {/if}
                  {#if unseenNewIds.has(item.id)}
                    <span class="sc-new-tag" aria-hidden="true" transition:scale={{ duration: 220, start: 0.4, easing: backOut }}>NEW</span>
                  {/if}
                  <span class="sc-name">{item.name}</span>
                  <span class="sc-meta mono">
                    <span class="sc-cal">{item.calories}</span>
                    <span class="sc-unit">kcal</span>
                    <span class="sc-sep">·</span>
                    <span class="sc-pro">{item.protein}p</span>
                  </span>
                </button>
              {/each}
            </div>
          </div>
        </div>
      {/if}

      <!-- Tabs: Foods / My Meals -->
      <div class="tabs" role="tablist">
        <button
          class="tab"
          class:tab-active={activeTab === 'foods'}
          onclick={() => activeTab = 'foods'}
          type="button"
          role="tab"
          aria-selected={activeTab === 'foods'}
        >
          <span>Foods</span>
          <span class="tab-count">{foodDndItems.length}</span>
        </button>
        <button
          class="tab"
          class:tab-active={activeTab === 'meals'}
          onclick={() => activeTab = 'meals'}
          type="button"
          role="tab"
          aria-selected={activeTab === 'meals'}
        >
          <span>My Meals</span>
          <span class="tab-count">{mealDndItems.length}</span>
        </button>
      </div>

      <!-- List -->
      {#if activeTab === 'foods'}
        <div
          class="list dnd-source"
          use:dndzone={{ items: foodDndItems, flipDurationMs: FLIP_MS, type: ZONE, dropFromOthersDisabled: true, dropTargetStyle: {} }}
          onconsider={handleFoodConsider}
          onfinalize={handleFoodFinalize}
        >
          {#each foodDndItems as item (item.id)}
            <button
              class="row"
              type="button"
              onclick={() => addFood(item)}
              animate:flip={{ duration: FLIP_MS }}
            >
              <div class="row-top">
                <span class="row-name">{item.name}</span>
                <span class="row-cal mono">{item.calories}<span class="row-cal-unit"> kcal</span></span>
              </div>
              <div class="row-macros mono">
                <span class="rm" data-k="p">{item.protein}p</span>
                <span class="rm-sep">·</span>
                <span class="rm" data-k="c">{item.netCarbs}c</span>
                <span class="rm-sep">·</span>
                <span class="rm" data-k="f">{item.fat}f</span>
              </div>
            </button>
          {/each}
        </div>
        {#if foodDndItems.length === 0}
          <p class="empty" transition:fade={{ duration: 150 }}>No foods match your search</p>
        {/if}
      {:else}
        <div
          class="list dnd-source"
          use:dndzone={{ items: mealDndItems, flipDurationMs: FLIP_MS, type: ZONE, dropFromOthersDisabled: true, dropTargetStyle: {} }}
          onconsider={handleMealConsider}
          onfinalize={handleMealFinalize}
        >
          {#each mealDndItems as item (item.id)}
            <button
              class="row"
              type="button"
              onclick={() => addMeal(item)}
              animate:flip={{ duration: FLIP_MS }}
            >
              <div class="row-top">
                <span class="row-name">{item.name}</span>
                <span class="row-cal mono">{item.calories}<span class="row-cal-unit"> kcal</span></span>
              </div>
              <div class="row-macros mono">
                <span class="rm" data-k="p">{item.protein}p</span>
                <span class="rm-sep">·</span>
                <span class="rm" data-k="c">{item.netCarbs}c</span>
                <span class="rm-sep">·</span>
                <span class="rm" data-k="f">{item.fat}f</span>
              </div>
            </button>
          {/each}
        </div>
        {#if mealDndItems.length === 0}
          <p class="empty" transition:fade={{ duration: 150 }}>No saved meals yet</p>
        {/if}
      {/if}
    </div>

    <!-- Meal Slots -->
    <div class="slots-panel">
      {#each Object.entries(slotLabels) as [key, label], i}
        {@const items = slots[key]}
        {@const SlotIcon = slotIcons[key]}
        <div
          class="meal-slot animate-slide-up stagger-{i + 4}"
          class:slot-active-target={activeSlot === key}
          onclick={() => { activeSlot = key; }}
          onkeydown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && e.target === e.currentTarget) { e.preventDefault(); activeSlot = key; } }}
          role="button"
          tabindex="0"
          aria-pressed={activeSlot === key}
          aria-label={`Activate ${label} slot`}
        >
          <div class="slot-header">
            <div class="slot-left">
              <span class="slot-icon slot-icon-{key}">
                <span class="ic-outline"><SlotIcon size={18} strokeWidth={1.5} /></span>
                <span class="ic-filled" aria-hidden="true">
                  {#if key === 'breakfast'}
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d4a574" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M12 2v8"/>
                      <path d="m4.93 10.93 1.41 1.41"/>
                      <path d="M2 18h2"/>
                      <path d="M20 18h2"/>
                      <path d="m19.07 10.93-1.41 1.41"/>
                      <path d="M22 22H2"/>
                      <path d="m8 6 4-4 4 4"/>
                      <path d="M16 18a4 4 0 0 0-8 0" fill="#d4a574"/>
                    </svg>
                  {:else if key === 'lunch'}
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d4a574" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                      <circle cx="12" cy="12" r="4" fill="#d4a574"/>
                      <path d="M12 2v2"/>
                      <path d="M12 20v2"/>
                      <path d="m4.93 4.93 1.41 1.41"/>
                      <path d="m17.66 17.66 1.41 1.41"/>
                      <path d="M2 12h2"/>
                      <path d="M20 12h2"/>
                      <path d="m6.34 17.66-1.41 1.41"/>
                      <path d="m19.07 4.93-1.41 1.41"/>
                    </svg>
                  {:else if key === 'dinner'}
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="#b8c0e0" stroke="#b8c0e0" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                    </svg>
                  {:else}
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#b8956d" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5" fill="#b8956d"/>
                      <path d="M8.5 8.5v.01" stroke="#5a3820" stroke-width="2.2"/>
                      <path d="M16 15.5v.01" stroke="#5a3820" stroke-width="2.2"/>
                      <path d="M12 12v.01" stroke="#5a3820" stroke-width="2.2"/>
                      <path d="M11 17v.01" stroke="#5a3820" stroke-width="2.2"/>
                      <path d="M7 14v.01" stroke="#5a3820" stroke-width="2.2"/>
                    </svg>
                  {/if}
                </span>
              </span>
              <span class="slot-name">{label}</span>
              {#if items.length > 0}<span class="slot-count">{items.length}</span>{/if}
            </div>
            <span class="slot-total mono">{slotTotal(items)} <span class="slot-unit">kcal</span></span>
          </div>

          <div
            class="slot-zone"
            class:slot-zone-empty={items.length === 0}
            use:dndzone={{ items, flipDurationMs: FLIP_MS, type: ZONE, dropTargetClasses: ['slot-drop-highlight'], dropTargetStyle: {}, centreDraggedOnCursor: true, morphDisabled: true }}
            onconsider={(e) => handleSlotConsider(key, e)}
            onfinalize={(e) => handleSlotFinalize(key, e)}
          >
            {#each items as item (item.id)}
              <div class="slot-item" class:slot-item-flash={flashItems.has(item.id)} animate:flip={{ duration: FLIP_MS }}>
                <div class="si-main">
                  <span class="si-name">{item.name}</span>
                  <div class="si-macros mono">
                    <span class="rm" data-k="p">{item.protein}p</span>
                    <span class="rm-sep">·</span>
                    <span class="rm" data-k="c">{item.netCarbs}c</span>
                    <span class="rm-sep">·</span>
                    <span class="rm" data-k="f">{item.fat}f</span>
                  </div>
                </div>
                <div class="si-controls">
                  <span class="si-cal mono">{item.cal}<span class="si-cal-unit"> kcal</span></span>
                  <div class="si-qty">
                    <input type="number" class="qty-input mono" value={item.quantity} min="1"
                      oninput={(e) => updateQuantity(key, item.id, Number(e.target.value))} />
                    <span class="qty-label">g</span>
                  </div>
                  <button class="si-rm" onclick={() => removeItem(key, item.id)} aria-label="Remove"><X size={12} strokeWidth={1.5} /></button>
                </div>
              </div>
            {/each}
          </div>

          {#if items.length === 0}
            <div class="slot-empty">
              <span class="slot-empty-text">
                {activeSlot === key ? 'Click a food to add it here' : 'Drag a food here'}
              </span>
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
    /* Use sibling-margin instead of gap so slide-in elements can animate
       their spacing too (gap is instant, margin is transitionable). */
  }
  .source-panel > * + * { margin-top: var(--space-4); }

  /* ── Combined search row (slot chip + search + filter toggle) ── */
  .search-row {
    display: flex;
    align-items: stretch;
    gap: var(--space-2);
  }

  .slot-chip-wrap { position: relative; }

  .slot-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 34px;
    padding: 0 10px;
    background: var(--bg-hover);
    border: var(--border-width) solid var(--border);
    border-radius: var(--radius-md);
    font-family: var(--font-sans);
    font-size: var(--font-xs);
    color: var(--text-1);
    cursor: pointer;
    transition: border-color var(--transition-fast), background var(--transition-fast), color var(--transition-fast);
    white-space: nowrap;
  }
  .slot-chip:hover { border-color: var(--border-strong); color: var(--text-0); }
  .slot-chip-open { border-color: var(--border-strong); background: var(--bg-active); }
  .slot-chip-label { color: var(--text-3); font-weight: 500; }
  .slot-chip-value { font-weight: 600; color: var(--text-0); }
  .slot-chip-caret {
    display: inline-flex;
    color: var(--text-3);
    transition: transform var(--transition-fast), color var(--transition-fast);
    margin-left: 1px;
  }
  .slot-chip:hover .slot-chip-caret { color: var(--text-1); }
  .slot-chip-caret-open { transform: rotate(180deg); color: var(--text-1); }

  .slot-menu {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    min-width: 150px;
    background: var(--bg-modal);
    border: var(--border-width) solid var(--border);
    border-radius: var(--radius-md);
    padding: 4px;
    z-index: 30;
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.28);
    display: flex;
    flex-direction: column;
    transform-origin: top left;
  }
  .slot-menu-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-2);
    text-align: left;
    padding: 7px 10px;
    background: transparent;
    border: none;
    border-radius: var(--radius-sm);
    font-family: var(--font-sans);
    font-size: var(--font-xs);
    color: var(--text-1);
    cursor: pointer;
    transition: background var(--transition-fast), color var(--transition-fast);
  }
  .slot-menu-item:hover { background: var(--bg-hover); color: var(--text-0); }
  .slot-menu-active { color: var(--text-0); background: var(--bg-active); font-weight: 600; }

  .search-wrap {
    position: relative;
    flex: 1;
    display: flex;
    align-items: center;
  }
  .search-icon {
    position: absolute;
    left: 10px;
    display: inline-flex;
    color: var(--text-3);
    pointer-events: none;
    transition: color var(--transition-fast);
  }
  .search-wrap:focus-within .search-icon { color: var(--text-1); }
  .search-input {
    width: 100%;
    height: 34px;
    padding: 0 30px 0 32px;
    background: transparent;
    border: var(--border-width) solid var(--border);
    border-radius: var(--radius-md);
    font-family: var(--font-sans);
    font-size: var(--font-xs);
    color: var(--text-0);
    transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
  }
  .search-input::placeholder { color: var(--text-3); }
  .search-input:focus {
    outline: none;
    border-color: var(--text-2);
    box-shadow: 0 0 0 3px var(--accent-subtle);
  }
  .search-clear {
    position: absolute;
    right: 8px;
    width: 18px; height: 18px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    color: var(--text-3);
    cursor: pointer;
    border-radius: var(--radius-sm);
    transition: color var(--transition-fast), background var(--transition-fast);
  }
  .search-clear:hover { color: var(--text-0); background: var(--bg-hover); }

  .filter-btn {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    background: transparent;
    border: var(--border-width) solid var(--border);
    border-radius: var(--radius-md);
    color: var(--text-2);
    cursor: pointer;
    transition: border-color var(--transition-fast), color var(--transition-fast), background var(--transition-fast);
    flex-shrink: 0;
  }
  .filter-btn:hover { border-color: var(--border-strong); color: var(--text-0); }
  .filter-active { border-color: var(--text-2); color: var(--text-0); background: var(--bg-hover); }
  .filter-dot {
    position: absolute;
    top: 5px; right: 5px;
    width: 6px; height: 6px;
    border-radius: 50%;
    background: var(--accent);
    box-shadow: 0 0 0 2px var(--bg-0);
  }

  /* ── Filters drawer — grid-rows trick for reliable smooth open/close ── */
  .filters-wrap {
    display: grid;
    grid-template-rows: 0fr;
    transition: grid-template-rows 280ms cubic-bezier(0.34, 1.2, 0.64, 1),
                margin-top 280ms cubic-bezier(0.34, 1.2, 0.64, 1),
                opacity 220ms ease;
    margin-top: 0 !important;
    opacity: 0;
    pointer-events: none;
  }
  .filters-wrap.filters-open {
    grid-template-rows: 1fr;
    margin-top: var(--space-3) !important;
    opacity: 1;
    pointer-events: auto;
  }
  .filters-inner {
    position: relative;
    min-height: 0;
    overflow: hidden;
    display: flex;
    align-items: stretch;
    border-bottom: var(--border-width) solid var(--surface-border);
  }
  .filters-nav {
    position: absolute;
    top: 0;
    bottom: 1px;
    width: 36px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(to right, var(--bg-0) 0, var(--bg-0) 60%, transparent);
    border: none;
    color: var(--text-1);
    cursor: pointer;
    z-index: 2;
    transition: color 180ms ease, opacity 180ms ease;
  }
  .filters-nav-left { left: 0; justify-content: flex-start; padding-left: 2px; }
  .filters-nav-right {
    right: 0;
    justify-content: flex-end;
    padding-right: 2px;
    background: linear-gradient(to left, var(--bg-0) 0, var(--bg-0) 60%, transparent);
  }
  .filters-nav:hover { color: var(--text-0); }
  .filters-nav-disabled {
    opacity: 0;
    pointer-events: none;
  }
  .filters {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-wrap: nowrap;
    gap: 4px;
    overflow-x: auto;
    overflow-y: hidden;
    scrollbar-width: none;
    scroll-behavior: smooth;
    scroll-snap-type: x proximity;
  }
  .filters::-webkit-scrollbar { display: none; }
  .filters-fade-left {
    -webkit-mask-image: linear-gradient(to right, transparent 0, #000 16px);
            mask-image: linear-gradient(to right, transparent 0, #000 16px);
  }
  .filters-fade-right {
    -webkit-mask-image: linear-gradient(to left, transparent 0, #000 16px);
            mask-image: linear-gradient(to left, transparent 0, #000 16px);
  }
  .filters-fade-left.filters-fade-right {
    -webkit-mask-image: linear-gradient(to right, transparent 0, #000 16px, #000 calc(100% - 16px), transparent 100%);
            mask-image: linear-gradient(to right, transparent 0, #000 16px, #000 calc(100% - 16px), transparent 100%);
  }

  .chip {
    position: relative;
    display: inline-flex;
    align-items: center;
    padding: 11px 16px;
    font-size: 13px;
    font-family: var(--font-sans);
    font-weight: 500;
    border: none;
    background: transparent;
    color: var(--text-3);
    cursor: pointer;
    white-space: nowrap;
    letter-spacing: 0.005em;
    flex-shrink: 0;
    scroll-snap-align: center;
    transition: color 180ms ease;
  }
  .chip::after {
    content: '';
    position: absolute;
    left: 16px;
    right: 16px;
    bottom: -1px;
    height: 1.5px;
    background: var(--text-0);
    transform: scaleX(0);
    transform-origin: center;
    transition: transform 220ms cubic-bezier(0.4, 0, 0.2, 1);
  }
  .chip-label { display: inline-block; }
  .chip:hover { color: var(--text-1); }
  .chip-active {
    color: var(--text-0);
    font-weight: 600;
    letter-spacing: -0.005em;
  }
  .chip-active::after { transform: scaleX(1); }
  .chip:focus-visible {
    outline: none;
    color: var(--text-0);
  }

  /* ── Suggestions: collapsible ── */
  .sugg-row { display: flex; flex-direction: column; gap: 4px; }
  .sugg-header {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    align-self: flex-start;
    padding: 4px 8px 4px 4px;
    background: transparent;
    border: none;
    border-radius: var(--radius-md);
    color: var(--text-3);
    cursor: pointer;
    transition: color var(--transition-fast), background var(--transition-fast);
  }
  .sugg-header:hover { color: var(--text-1); background: var(--bg-hover); }
  .sugg-header :global(svg) { color: var(--text-2); transition: color var(--transition-fast); }
  .sugg-header:hover :global(svg) { color: var(--text-0); }
  .sugg-tag {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-weight: 600;
  }
  .sugg-icon {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
  }
  .sugg-icon-pulse :global(svg) {
    color: var(--cal);
    animation: suggIconPulse 1.6s ease-in-out infinite;
  }
  .sugg-icon-spark {
    position: absolute;
    width: 3px;
    height: 3px;
    border-radius: 50%;
    pointer-events: none;
    opacity: 0;
    animation: iconSparkLoop 1800ms ease-out infinite;
  }
  .sugg-icon-spark-1 { top: -2px; left: -2px; background: var(--cal); box-shadow: 0 0 6px var(--cal); animation-delay: 0ms; }
  .sugg-icon-spark-2 { bottom: -2px; right: 0px; background: var(--pro); box-shadow: 0 0 6px var(--pro); animation-delay: 600ms; }
  .sugg-icon-spark-3 { top: 40%; right: -3px; background: var(--carb); box-shadow: 0 0 6px var(--carb); animation-delay: 1200ms; }
  .sugg-header-sparkle .sugg-tag {
    animation: textShimmer 1100ms ease-out 1;
  }
  .sugg-header-sparkle :global(svg) {
    animation: iconWiggle 700ms cubic-bezier(0.34, 1.56, 0.64, 1) 1;
  }
  .sugg-caret {
    display: inline-flex;
    color: var(--text-3);
    transition: transform 220ms cubic-bezier(0.34, 1.2, 0.64, 1);
    margin-left: 2px;
  }
  .sugg-caret-open { transform: rotate(180deg); }

  /* Collapsible body using the grid-rows trick */
  .sugg-body {
    display: grid;
    grid-template-rows: 0fr;
    transition: grid-template-rows 260ms cubic-bezier(0.34, 1.2, 0.64, 1),
                opacity 200ms ease;
    opacity: 0;
    pointer-events: none;
  }
  .sugg-body-open {
    grid-template-rows: 1fr;
    opacity: 1;
    pointer-events: auto;
  }
  /* 2-row wrap grid — no scroll. Card height + max-height ensure that any
     card flowing onto a 3rd row is fully clipped (never partially visible). */
  .sugg-grid {
    --sc-h: 50px;
    --sc-row-gap: 6px;
    --sc-pt: 10px;
    --sc-pb: 6px;
    min-height: 0;
    display: flex;
    flex-wrap: wrap;
    align-content: flex-start;
    gap: var(--sc-row-gap);
    padding: var(--sc-pt) 2px var(--sc-pb);
    box-sizing: border-box;
    max-height: calc(2 * var(--sc-h) + var(--sc-row-gap) + var(--sc-pt) + var(--sc-pb));
    overflow: hidden;
    transition: max-height 220ms cubic-bezier(0.34, 1.2, 0.64, 1);
  }
  /* Collapse to a single row when row 2 would only contain ≤2 items */
  .sugg-grid-single-row {
    max-height: calc(var(--sc-h) + var(--sc-pt) + var(--sc-pb));
  }
  /* During an active drag: freeze any height/transition motion and let cards
     escape the clip box, so the dragged element doesn't visually fight the
     grid's reflow + max-height transition. */
  .sugg-grid-dragging {
    transition: none;
    overflow: visible;
  }

  @keyframes suggIconPulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.18); }
  }
  @keyframes iconSparkLoop {
    0%   { transform: scale(0) translateY(0); opacity: 0; }
    25%  { transform: scale(1.2) translateY(-2px); opacity: 1; }
    50%  { transform: scale(0.7) translateY(-4px); opacity: 0.4; }
    70%  { transform: scale(0) translateY(-6px); opacity: 0; }
    100% { transform: scale(0) translateY(0); opacity: 0; }
  }
  @keyframes textShimmer {
    0% { color: var(--text-3); }
    40% { color: var(--cal); text-shadow: 0 0 8px var(--cal); }
    100% { color: var(--text-3); text-shadow: none; }
  }
  @keyframes iconWiggle {
    0%   { transform: rotate(0deg) scale(1); }
    25%  { transform: rotate(-12deg) scale(1.25); }
    55%  { transform: rotate(10deg) scale(1.15); }
    100% { transform: rotate(0deg) scale(1); }
  }

  /* Compact suggestion card — leaner look with calorie accent on the left */
  .sugg-card {
    position: relative;
    display: inline-flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
    gap: 3px;
    padding: 7px 13px 7px 15px;
    height: 50px;
    min-width: 110px;
    max-width: 200px;
    box-sizing: border-box;
    background: transparent;
    border: var(--border-width) solid var(--border);
    border-radius: var(--radius-sm);
    font-family: var(--font-sans);
    color: var(--text-1);
    cursor: grab;
    user-select: none;
    transition: border-color var(--transition-fast), background var(--transition-fast),
                color var(--transition-fast), transform var(--transition-fast),
                box-shadow var(--transition-fast),
                opacity 160ms ease;
    flex-shrink: 0;
    overflow: visible;
    text-align: left;
  }
  /* Vertical accent stripe on the left in the calorie macro color */
  .sugg-card::before {
    content: '';
    position: absolute;
    left: 0;
    top: 6px;
    bottom: 6px;
    width: 3px;
    border-radius: 3px;
    background: var(--cal);
    opacity: 0.6;
    transition: opacity var(--transition-fast), background var(--transition-fast);
  }
  .sugg-card:hover {
    background: var(--bg-hover);
    border-color: var(--border-strong);
    color: var(--text-0);
    transform: translateY(-1px);
    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.10);
  }
  .sugg-card:hover::before { opacity: 1; }
  .sugg-card:active { cursor: grabbing; transform: translateY(0) scale(0.97); }

  /* Cards beyond the visible 2 rows: invisible, non-interactive, but stay in
     the dnd source list and the DOM so their layout slot exists for measurement. */
  .sugg-card-overflow {
    opacity: 0;
    pointer-events: none;
    visibility: hidden;
  }
  .sc-name {
    font-size: 12.5px;
    font-weight: 500;
    letter-spacing: -0.01em;
    color: var(--text-0);
    line-height: 1.2;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .sc-meta {
    display: inline-flex;
    align-items: baseline;
    gap: 5px;
    font-size: 11px;
    line-height: 1.1;
    color: var(--text-3);
  }
  .sc-cal { color: var(--cal); font-weight: 600; font-size: 11.5px; letter-spacing: -0.01em; }
  .sc-unit { color: var(--text-3); font-size: 9.5px; font-weight: 400; }
  .sc-sep { opacity: 0.4; padding: 0 1px; }
  .sc-pro { color: var(--pro); font-weight: 500; font-size: 11px; }

  /* New-arrival card: persistent border + glow + sheen on entry */
  .sugg-card-new {
    border-color: var(--cal);
    background: linear-gradient(180deg, rgba(227, 189, 131, 0.10), rgba(227, 189, 131, 0.02));
    box-shadow: 0 0 0 1px rgba(227, 189, 131, 0.18), 0 0 12px rgba(227, 189, 131, 0.18);
  }
  .sugg-card-new:hover {
    border-color: var(--cal);
    background: linear-gradient(180deg, rgba(227, 189, 131, 0.16), rgba(227, 189, 131, 0.04));
    box-shadow: 0 0 0 1px rgba(227, 189, 131, 0.28), 0 4px 14px rgba(227, 189, 131, 0.22);
  }
  .sugg-card-new::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: linear-gradient(
      110deg,
      transparent 30%,
      rgba(255, 255, 255, 0.20) 48%,
      rgba(255, 255, 255, 0.34) 50%,
      rgba(255, 255, 255, 0.20) 52%,
      transparent 70%
    );
    background-size: 220% 100%;
    background-position: 150% 0;
    pointer-events: none;
    animation: pillSheen 1100ms cubic-bezier(0.4, 0, 0.2, 1) 1;
    opacity: 0;
  }
  .sc-new-tag {
    position: absolute;
    top: -6px;
    right: 8px;
    padding: 1px 5px 1.5px;
    font-size: 8px;
    font-weight: 700;
    letter-spacing: 0.08em;
    line-height: 1;
    color: var(--bg-0);
    background: var(--cal);
    border-radius: var(--radius-full);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.22);
    pointer-events: none;
    z-index: 2;
  }

  /* Sparkle particles around newly-arrived cards */
  .sc-spark {
    position: absolute;
    width: 3px;
    height: 3px;
    border-radius: 50%;
    pointer-events: none;
    opacity: 0;
    animation: sparkleTwinkle 900ms ease-out 1;
  }
  .sc-spark-1 { top: -4px; left: 18%; background: var(--cal); box-shadow: 0 0 6px var(--cal); animation-delay: 60ms; }
  .sc-spark-2 { bottom: -3px; right: 18%; background: var(--pro); box-shadow: 0 0 6px var(--pro); animation-delay: 180ms; }
  .sc-spark-3 { top: 35%; right: -4px; background: var(--carb); box-shadow: 0 0 6px var(--carb); animation-delay: 320ms; }

  @keyframes pillSheen {
    0% { opacity: 0; background-position: 150% 0; }
    20% { opacity: 1; }
    100% { opacity: 0; background-position: -50% 0; }
  }
  @keyframes sparkleTwinkle {
    0% { transform: scale(0) translateY(0); opacity: 0; }
    40% { transform: scale(1.2) translateY(-3px); opacity: 1; }
    70% { transform: scale(0.8) translateY(-6px); opacity: 0.6; }
    100% { transform: scale(0) translateY(-10px); opacity: 0; }
  }

  /* ── Tabs ── */
  .tabs {
    position: relative;
    display: flex;
    gap: 0;
    border-bottom: 1px solid var(--border);
    margin-bottom: 2px;
  }
  .tab {
    position: relative;
    padding: 8px 14px 9px;
    background: transparent;
    border: none;
    font-family: var(--font-sans);
    font-size: var(--font-xs);
    font-weight: 500;
    color: var(--text-3);
    cursor: pointer;
    transition: color var(--transition-fast);
    display: inline-flex;
    align-items: center;
    gap: 6px;
    z-index: 1;
  }
  .tab:hover { color: var(--text-1); }
  .tab-active {
    color: var(--text-0);
    box-shadow: inset 0 -2px 0 0 var(--text-1);
  }
  .tab-count {
    font-size: 10px;
    color: var(--text-3);
    padding: 1px 7px;
    background: var(--bg-hover);
    border-radius: var(--radius-full);
    font-weight: 500;
    transition: color var(--transition-fast), background var(--transition-fast);
  }
  .tab-active .tab-count { color: var(--text-1); background: var(--bg-active); }

  /* ── List of rows (calm cards) ── */
  .list {
    display: flex;
    flex-direction: column;
    gap: 0;
    min-height: 60px;
  }
  .row {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 3px;
    padding: 10px 12px 10px 14px;
    background: transparent;
    border: none;
    border-radius: var(--radius-sm);
    text-align: left;
    font-family: var(--font-sans);
    cursor: grab;
    user-select: none;
    transition: background var(--transition-fast), transform var(--transition-fast),
                box-shadow var(--transition-fast);
  }
  /* Subtle separator between consecutive rows; hidden when adjacent to hover */
  .row + .row::before {
    content: '';
    position: absolute;
    top: 0;
    left: 14px;
    right: 12px;
    height: 1px;
    background: var(--border);
    opacity: 0.5;
    pointer-events: none;
    transition: opacity var(--transition-fast);
  }
  .row:hover::before, .row:hover + .row::before { opacity: 0; }
  /* Calorie-color accent stripe on the left, brightens on hover */
  .row::after {
    content: '';
    position: absolute;
    left: 4px;
    top: 12px;
    bottom: 12px;
    width: 2px;
    border-radius: 2px;
    background: var(--cal);
    opacity: 0;
    transition: opacity var(--transition-fast);
  }
  .row:hover::after { opacity: 0.7; }
  .row:hover {
    background: var(--bg-hover);
    transform: translateX(2px);
    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.10);
  }
  .row:active {
    cursor: grabbing;
    background: var(--bg-active);
    transform: translateX(2px) scale(0.995);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.14);
  }

  .row-top {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--space-3);
  }
  .row-name {
    font-size: 13.5px;
    color: var(--text-0);
    font-weight: 500;
    line-height: 1.25;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    letter-spacing: -0.01em;
  }
  .row-cal {
    font-size: 13px;
    color: var(--cal);
    font-weight: 600;
    letter-spacing: -0.01em;
    flex-shrink: 0;
  }
  .row-cal-unit { color: var(--text-3); font-weight: 400; font-size: 10px; margin-left: 2px; }

  .row-macros {
    display: flex;
    gap: 6px;
    align-items: center;
    font-size: 11px;
    color: var(--text-2);
  }
  .rm { transition: color var(--transition-fast), font-weight var(--transition-fast); }
  .rm-sep { color: var(--text-3); opacity: 0.5; }
  /* Reveal full color on hover */
  .row:hover .rm[data-k="p"] { color: var(--pro); font-weight: 600; }
  .row:hover .rm[data-k="c"] { color: var(--carb); font-weight: 600; }
  .row:hover .rm[data-k="f"] { color: var(--fat); font-weight: 600; }

  .empty {
    text-align: center;
    font-size: var(--font-xs);
    color: var(--text-3);
    padding: var(--space-6) var(--space-3);
  }

  /* ── Shadow items in source while dragging (copy pattern) ── */
  .dnd-source :global([data-is-dnd-shadow-item-hint]) {
    opacity: 0.25 !important;
    border-style: dashed !important;
    background: transparent !important;
  }

  /* ── Meal Slots ── */
  .slots-panel { display: flex; flex-direction: column; gap: var(--space-4); }

  .meal-slot {
    border: var(--border-width) solid var(--border); border-radius: var(--radius-md);
    padding: var(--space-3) var(--space-4);
    cursor: pointer;
    transition: border-color var(--transition-base), box-shadow var(--transition-base);
  }
  /* Inner interactive controls keep their own cursor so the pointer doesn't
     misrepresent text inputs / drag handles / remove buttons. */
  .meal-slot input,
  .meal-slot button,
  .meal-slot .slot-item { cursor: auto; }
  .meal-slot .si-rm { cursor: pointer; }
  .meal-slot .slot-item { cursor: grab; }
  .meal-slot .slot-item:active { cursor: grabbing; }

  .slot-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: var(--space-3);
    margin-bottom: var(--space-3);
    box-shadow: inset 0 -1px 0 var(--border);
  }
  .slot-left { display: flex; align-items: center; gap: var(--space-3); }
  .slot-icon {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    color: var(--text-3);
    transition: color var(--transition-base);
  }
  .slot-icon .ic-outline,
  .slot-icon .ic-filled {
    position: absolute;
    inset: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: opacity 200ms ease, transform 240ms cubic-bezier(0.34, 1.4, 0.64, 1);
  }
  .slot-icon .ic-filled {
    opacity: 0;
    transform: scale(0.85);
    pointer-events: none;
  }
  .meal-slot:hover .ic-outline,
  .slot-active-target .ic-outline {
    opacity: 0;
    transform: scale(1.1);
  }
  .meal-slot:hover .ic-filled,
  .slot-active-target .ic-filled {
    opacity: 1;
    transform: scale(1);
  }
  .slot-name {
    font-size: var(--font-lg);
    font-weight: 700;
    letter-spacing: -0.025em;
    color: var(--text-0);
    line-height: 1.2;
  }
  .slot-count {
    font-size: 10px;
    color: var(--text-3);
    background: var(--bg-hover);
    padding: 1px 7px;
    border-radius: var(--radius-full);
    font-weight: 500;
  }
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

  /* Drop target highlight when dragging over — pulsing accent */
  :global(.slot-drop-highlight) {
    outline: 1.5px dashed var(--text-1) !important;
    outline-offset: -1px;
    animation: slotDropPulse 1.2s ease-in-out infinite !important;
  }
  @keyframes slotDropPulse {
    0%, 100% { background: var(--accent-subtle); }
    50%      { background: var(--bg-active); }
  }
  .slot-active-target {
    border-color: var(--border-strong);
    box-shadow: inset 3px 0 0 var(--text-1);
  }
  .slot-active-target .slot-name { color: var(--text-0); }
  .slot-active-target .slot-header { box-shadow: inset 0 -1px 0 var(--border-strong); }

  .slot-item {
    display: flex; align-items: center; justify-content: space-between; gap: var(--space-3);
    padding: 8px 10px; border: var(--border-width) solid var(--border);
    border-radius: var(--radius-sm); cursor: grab;
    transition: background var(--transition-fast), border-color var(--transition-fast),
                transform var(--transition-fast), box-shadow var(--transition-fast);
  }
  .slot-item:hover {
    background: var(--bg-hover);
    border-color: var(--border-strong);
    transform: translateY(-1px);
    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.08);
  }
  .slot-item:active { cursor: grabbing; transform: translateY(0) scale(0.99); }
  /* Hover reveals macro colors (mockup pattern) */
  .slot-item:hover .rm[data-k="p"] { color: var(--pro); }
  .slot-item:hover .rm[data-k="c"] { color: var(--carb); }
  .slot-item:hover .rm[data-k="f"] { color: var(--fat); }

  /* Flash + bounce when item is added (drop or click) */
  .slot-item-flash {
    animation: itemFlash 480ms ease, itemBounce 380ms cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  @keyframes itemFlash {
    0%   { background: var(--accent-subtle); opacity: 0.6; }
    40%  { background: var(--accent-subtle); opacity: 1; }
    100% { background: transparent; opacity: 1; }
  }
  @keyframes itemBounce {
    0%   { transform: scale(0.92); }
    60%  { transform: scale(1.025); }
    100% { transform: scale(1); }
  }

  /* Shadow items in slots during reorder */
  .slot-zone :global([data-is-dnd-shadow-item-hint]) {
    opacity: 0.35 !important;
    border-style: dashed !important;
  }

  .si-main { display: flex; flex-direction: column; gap: 3px; min-width: 0; flex: 1; }
  .si-name {
    font-size: var(--font-sm); font-weight: 500;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    letter-spacing: -0.005em;
  }
  .si-macros {
    display: flex; align-items: center; gap: 5px;
    font-size: 11px; color: var(--text-3);
  }
  .si-macros .rm { transition: color var(--transition-fast); }
  .si-macros .rm-sep { color: var(--text-3); opacity: 0.55; }

  .si-controls { display: flex; align-items: center; gap: var(--space-3); flex-shrink: 0; }
  .si-cal { font-size: var(--font-xs); color: var(--cal); font-weight: 500; }
  .si-cal-unit { color: var(--text-3); font-weight: 400; font-size: 10px; }
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
    .macro-summary { grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); }
    .search-row { flex-wrap: wrap; }
    .slot-chip-wrap { order: -1; }
    .search-wrap { flex: 1 1 100%; order: 1; }
    .filter-btn { order: 2; }
  }
</style>
