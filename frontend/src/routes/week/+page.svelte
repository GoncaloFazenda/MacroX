<script>
  import { foodStore } from "$lib/stores/foods.js";
  import { mealStore } from "$lib/stores/meals.js";
  import { plannerStore } from "$lib/stores/planner.js";
  import { dayTemplateStore } from "$lib/stores/dayTemplates.js";
  import { auth } from "$lib/stores/auth.js";
  import { onMount, flushSync } from "svelte";
  import { beforeNavigate, goto } from '$app/navigation';
  import { Search, X as XIcon, Copy, Check, AlertTriangle, Undo2 } from "lucide-svelte";
  import { getWeekStart, getDayNames, formatDate, addDays, dayOffset, todayDateString } from "$lib/utils/macros.js";
  import {
    X,
    GripVertical,
    Plus,
    ChevronUp,
    ChevronDown,
    Sunrise,
    Sun,
    Moon,
    Cookie,
    Bookmark,
    Pencil,
    Trash2,
  } from "lucide-svelte";
  import { dndzone } from "svelte-dnd-action";
  import { flip } from "svelte/animate";
  import { fade } from "svelte/transition";
  import DateNav from "$lib/components/ui/DateNav.svelte";
  import SaveButton from "$lib/components/ui/SaveButton.svelte";
  import ConfirmModal from "$lib/components/ui/ConfirmModal.svelte";

  let { data } = $props();

  const FLIP_MS = 150;
  const initialWeekStart = data.weekStart || getWeekStart();

  let weekStart = $state(initialWeekStart);
  let saving = $state(false);
  let saved = $state(false);
  let ready = $state(true);
  let nextId = 1;
  let storesHydrated = $state(false);

  // ── Undo & dirty tracking ──
  let savedSnapshot = $state(JSON.stringify(
    Array.from({ length: 7 }, () => ({ breakfast: [], lunch: [], dinner: [], snack: [] }))
  ));
  let history = $state([]);
  const MAX_HISTORY = 30;
  const dirty = $derived(ready && JSON.stringify(days.map(d => d.meals)) !== savedSnapshot);

  function snapshotMeals() {
    return JSON.stringify(days.map(d => d.meals));
  }
  function takeSavedSnapshot() {
    savedSnapshot = snapshotMeals();
    history = [];
  }
  function pushHistory() {
    history = [...history.slice(-(MAX_HISTORY - 1)), JSON.parse(JSON.stringify(days))];
  }
  function undo() {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    history = history.slice(0, -1);
    days = prev;
  }
  let draggingTemplate = $state(null);
  let hoverDay = $state(-1);
  let selectedTemplate = $state(null);
  let dockSearch = $state('');
  let expandedDays = $state(Array(7).fill(false));
  let dayMealsEls = $state(Array(7).fill(null));
  let seeMoreEls = $state(Array(7).fill(null));
  function toggleExpanded(i) {
    expandedDays[i] = !expandedDays[i];
  }
  // Heuristic estimate so the "See more" appears in the right places on the first paint,
  // before the post-mount DOM measurement refines it. Approximates the visible height of
  // the collapsed .day-meals area: ~28px per slot label + ~22px per item + gaps.
  function estimateDayOverflow(meals) {
    let groups = 0, items = 0;
    for (const slot of ['breakfast', 'lunch', 'dinner', 'snack']) {
      const arr = meals?.[slot] || [];
      if (arr.length > 0) { groups++; items += arr.length; }
    }
    return groups * 28 + items * 22 + Math.max(0, groups - 1) * 12 > 240;
  }
  // Signature that changes whenever any item is added/removed in any slot.
  const contentSig = $derived(
    days.map((d) => Object.values(d.meals).map((s) => s.length).join(',')).join('|')
  );
  // Signature that changes whenever any day's expansion state toggles.
  // When one card in a row is expanded, the row stretches and the OTHER cards
  // in that row gain visible height — their overflow may now be false (their
  // content fits in the stretched row), so we need to re-measure them.
  const expandSig = $derived(expandedDays.join(','));

  // Re-measure each day's overflow. While a day is itself expanded, keep its
  // prior value — its visible area grew, so a fresh measurement would say it
  // fits, but we still want the "See less" affordance.
  // The "See more" button is positioned absolutely so it overlays the bottom
  // of .day-meals without consuming layout space, meaning clientHeight is
  // already the full available area. Plain overflow check — no buffer needed.
  function measureOverflows() {
    daysOverflow = daysOverflow.map((prev, i) => {
      if (expandedDays[i]) return prev;
      const el = dayMealsEls[i];
      if (!el) return false;
      return el.scrollHeight > el.clientHeight + 1;
    });
  }

  // Content / week change → next-frame measurement is enough.
  $effect(() => {
    void contentSig;
    void weekStart;
    const id = requestAnimationFrame(measureOverflows);
    return () => cancelAnimationFrame(id);
  });

  // Expansion toggle triggers a CSS max-height transition (~200ms). Wait for
  // it to settle, then re-measure neighbours so their "See more" can disappear
  // once the row has stretched enough to fit their content.
  $effect(() => {
    void expandSig;
    const id = setTimeout(measureOverflows, 240);
    return () => clearTimeout(id);
  });

  // Dock-cards scroll-fade element binding (logic below, after `filteredDockTemplates`).
  let dockCardsEl = $state(null);
  let dockAtTop = $state(true);
  let dockAtBottom = $state(true);
  const foods = $derived(storesHydrated ? $foodStore.foods : data.foods);
  const meals = $derived(storesHydrated ? $mealStore.meals : data.meals);
  const templates = $derived(storesHydrated ? $dayTemplateStore.templates : data.templates);

  const filteredDockTemplates = $derived.by(() => {
    const q = dockSearch.trim().toLowerCase();
    if (!q) return templates;
    return templates.filter(t => {
      if (t.name.toLowerCase().includes(q)) return true;
      for (const meal of t.meals || []) {
        for (const item of meal.items || []) {
          const name = item.type === 'food'
            ? foods.find(f => f._id === item.refId)?.name || ''
            : meals.find(m => m._id === item.refId)?.name || '';
          if (name.toLowerCase().includes(q)) return true;
        }
      }
      return false;
    });
  });

  let dockEl = $state(null);
  let dockHeight = $state(0);

  $effect(() => {
    if (!dockEl) return;
    const measure = () => {
      const h = dockEl.offsetHeight;
      if (h > 0) dockHeight = h;
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(dockEl);
    return () => ro.disconnect();
  });

  // Keep the Day Plans dock exactly as tall as the two rows of week cards
  // (combined). Without this, the dock can grow taller than the rows when it
  // has many cards, leaving a visible gap below the week-rows column.
  let weekRowsEl = $state(null);
  let dockZoneEl = $state(null);

  $effect(() => {
    if (!weekRowsEl || !dockZoneEl) return;
    const apply = () => {
      const h = weekRowsEl.offsetHeight;
      if (h > 0) dockZoneEl.style.height = `${h}px`;
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(weekRowsEl);
    return () => ro.disconnect();
  });

  // Dock-cards scroll fades — show top/bottom mask only when there's more
  // content in that direction. Fully visible (no fade) when at the edges
  // or when content fits without scrolling.
  function updateDockScroll() {
    const el = dockCardsEl;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    dockAtTop = scrollTop <= 1;
    dockAtBottom = scrollTop + clientHeight >= scrollHeight - 1;
  }

  $effect(() => {
    if (!dockCardsEl) return;
    // Re-evaluate when templates/search change so the fade reflects new content.
    void filteredDockTemplates;
    requestAnimationFrame(updateDockScroll);
    const ro = new ResizeObserver(updateDockScroll);
    ro.observe(dockCardsEl);
    return () => ro.disconnect();
  });

  const slotLabels = {
    breakfast: "Breakfast",
    lunch: "Lunch",
    dinner: "Dinner",
    snack: "Snack",
  };
  const slotIcons = {
    breakfast: Sunrise,
    lunch: Sun,
    dinner: Moon,
    snack: Cookie,
  };
  const slotOrder = ["breakfast", "lunch", "dinner", "snack"];

  const goals = $derived($auth.user?.goals || { calories: 2000, protein: 150, netCarbs: 100, fat: 65 });

  function getName(item) {
    if (item.type === "food")
      return foods.find((f) => f._id === item.refId)?.name || "?";
    return meals.find((m) => m._id === item.refId)?.name || "?";
  }
  function getCal(item) {
    const mult = item.quantity / 100;
    if (item.type === "food") {
      const f = foods.find((food) => food._id === item.refId);
      return Math.round((f?.calories || 0) * mult);
    }
    const m = meals.find((meal) => meal._id === item.refId);
    return Math.round((m?.totalMacros?.calories || 0) * mult);
  }
  function getItemMacros(item) {
    const mult = item.quantity / 100;
    const round = (v) => Math.round(v * 10) / 10;
    if (item.type === "food") {
      const f = foods.find((food) => food._id === item.refId);
      return {
        p: round((f?.protein || 0) * mult),
        c: round((f?.netCarbs || 0) * mult),
        f: round((f?.fat || 0) * mult),
      };
    }
    const m = meals.find((meal) => meal._id === item.refId);
    const tm = m?.totalMacros || {};
    return {
      p: round((tm.protein || 0) * mult),
      c: round((tm.netCarbs || 0) * mult),
      f: round((tm.fat || 0) * mult),
    };
  }

  function emptyDay(dayOfWeek) {
    return {
      dayOfWeek,
      meals: { breakfast: [], lunch: [], dinner: [], snack: [] },
      templateName: null,
    };
  }

  function buildDays(plan) {
    if (!plan?.days) {
      return Array.from({ length: 7 }, (_, i) => emptyDay(i));
    }

    return Array.from({ length: 7 }, (_, i) => {
      const dayData = plan.days.find((d) => d.dayOfWeek === i);
      if (!dayData) return emptyDay(i);

      const builtMeals = { breakfast: [], lunch: [], dinner: [], snack: [] };
      for (const meal of dayData.meals || []) {
        if (builtMeals[meal.slot]) {
          builtMeals[meal.slot] = meal.items.map((item) => ({
            id: nextId++,
            type: item.type,
            refId: item.refId,
            quantity: item.quantity,
            name: getName(item),
            cal: getCal(item),
            ...getItemMacros(item),
          }));
        }
      }

      return { dayOfWeek: i, meals: builtMeals, templateName: null };
    });
  }

  const initialDays = buildDays(data.weeklyPlan);
  let days = $state(initialDays);
  let daysOverflow = $state(initialDays.map(d => estimateDayOverflow(d.meals)));
  const dayNames = getDayNames();

  takeSavedSnapshot();

  onMount(() => {
    foodStore.hydrate(data.foods, data.foodPagination);
    mealStore.hydrate(data.meals);
    dayTemplateStore.hydrate(data.templates);
    plannerStore.hydrateWeekly(data.weeklyPlan);
    storesHydrated = true;
  });

  async function loadPlan() {
    ready = false;
    await plannerStore.loadWeekly(weekStart);
    const plan = $plannerStore.weeklyPlan;
    days = buildDays(plan);
    daysOverflow = days.map(d => estimateDayOverflow(d.meals));
    takeSavedSnapshot();
    ready = true;
  }


  const dayLetters = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  const weekTotals = $derived.by(() => {
    let cal = 0,
      pro = 0,
      carb = 0,
      fat = 0,
      planned = 0;
    for (const day of days) {
      const items = Object.values(day.meals).flat();
      if (items.length > 0) planned++;
      for (const i of items) {
        cal += i.cal || 0;
        const ref =
          i.type === "food"
            ? foods.find((f) => f._id === i.refId)
            : meals.find((m) => m._id === i.refId);
        if (ref) {
          const mult = i.quantity / 100;
          if (i.type === "food") {
            pro += (ref.protein || 0) * mult;
            carb += (ref.netCarbs || 0) * mult;
            fat += (ref.fat || 0) * mult;
          } else {
            pro += (ref.totalMacros?.protein || 0) * mult;
            carb += (ref.totalMacros?.netCarbs || 0) * mult;
            fat += (ref.totalMacros?.fat || 0) * mult;
          }
        }
      }
    }
    return {
      cal: Math.round(cal),
      pro: Math.round(pro),
      carb: Math.round(carb),
      fat: Math.round(fat),
      planned,
    };
  });

  const macroShare = $derived.by(() => {
    const pCal = weekTotals.pro * 4;
    const cCal = weekTotals.carb * 4;
    const fCal = weekTotals.fat * 9;
    const total = pCal + cCal + fCal;
    if (total === 0) return { p: 0, c: 0, f: 0 };
    return {
      p: Math.round((pCal / total) * 100),
      c: Math.round((cCal / total) * 100),
      f: Math.round((fCal / total) * 100),
    };
  });

  const avgDayKcal = $derived(
    weekTotals.planned > 0 ? Math.round(weekTotals.cal / weekTotals.planned) : 0
  );

  const weekCalGoal = $derived((goals.calories || 2000) * 7);
  const weekCalPct = $derived(
    Math.min(100, Math.max(0, (weekTotals.cal / weekCalGoal) * 100))
  );

  function applyTemplate(di, template) {
    pushHistory();
    const meals = { breakfast: [], lunch: [], dinner: [], snack: [] };
    for (const meal of template.meals || []) {
      if (meals[meal.slot]) {
        meals[meal.slot] = meal.items.map((item) => ({
          id: nextId++,
          type: item.type,
          refId: item.refId,
          quantity: item.quantity,
          name: getName(item),
          cal: getCal(item),
          ...getItemMacros(item),
        }));
      }
    }
    days[di] = { ...days[di], meals, templateName: template.name };
    days = [...days];
  }

  function removeItem(di, slot, id) {
    pushHistory();
    days[di].meals[slot] = days[di].meals[slot].filter((i) => i.id !== id);
    days = [...days];
  }

  function clearDay(di) {
    pushHistory();
    days[di] = {
      ...days[di],
      meals: { breakfast: [], lunch: [], dinner: [], snack: [] },
      templateName: null,
    };
    days = [...days];
  }

  // Drag template handlers
  function onDragStart(e, template) {
    draggingTemplate = template;
    e.dataTransfer.effectAllowed = "copy";
    e.dataTransfer.setData("text/plain", template._id);
  }
  function onDragEnd() {
    draggingTemplate = null;
    hoverDay = -1;
  }
  function onDayDragOver(e, di) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    hoverDay = di;
  }
  function onDayDragLeave(di) {
    if (hoverDay === di) hoverDay = -1;
  }
  function onDayDrop(e, di) {
    e.preventDefault();
    if (draggingTemplate) {
      const template = draggingTemplate;
      draggingTemplate = null;
      hoverDay = -1;
      const hasItems = Object.values(days[di].meals).flat().length > 0;
      if (hasItems) {
        openConfirm({
          title: `Replace ${dayNames[di]}'s plan?`,
          message: `This will replace ${dayNames[di]}'s current items with "${template.name}".`,
          warning: 'You can undo this from the Undo button.',
          confirmText: 'Replace',
          onConfirm: () => { applyTemplate(di, template); showToast(`Applied to ${dayNames[di]}`); },
        });
        return;
      }
      applyTemplate(di, template);
      showToast(`Applied to ${dayNames[di]}`);
      return;
    }
    draggingTemplate = null;
    hoverDay = -1;
  }

  // Click-to-apply
  function handleTemplateClick(template) {
    if (selectedTemplate?._id === template._id) {
      selectedTemplate = null;
      return;
    }
    selectedTemplate = template;
  }
  function handleDayClick(di) {
    if (copySource >= 0) { handleDayCopyClick(di); return; }
    if (!selectedTemplate) return;
    const template = selectedTemplate;
    const hasItems = Object.values(days[di].meals).flat().length > 0;
    if (hasItems) {
      openConfirm({
        title: `Replace ${dayNames[di]}'s plan?`,
        message: `This will replace ${dayNames[di]}'s current items with "${template.name}".`,
        warning: 'You can undo this from the Undo button.',
        confirmText: 'Replace',
        onConfirm: () => { applyTemplate(di, template); selectedTemplate = null; showToast(`Applied to ${dayNames[di]}`); },
      });
      return;
    }
    applyTemplate(di, template);
    selectedTemplate = null;
    showToast(`Applied to ${dayNames[di]}`);
  }

  // Dock position

  async function savePlan() {
    saving = true;
    saved = false;
    try {
      const planDays = days.map((day) => ({
        dayOfWeek: day.dayOfWeek,
        meals: slotOrder
          .map((slot) => ({
            slot,
            items: day.meals[slot].map((i) => ({
              type: i.type,
              refId: i.refId,
              quantity: i.quantity,
            })),
          }))
          .filter((m) => m.items.length > 0),
      }));
      await plannerStore.saveWeekly(weekStart, planDays);
      saved = true;
      takeSavedSnapshot();
      setTimeout(() => (saved = false), 2000);
      showToast('Week plan saved');
    } catch (err) {
      showToast('Save failed: ' + err.message, 'error');
    }
    saving = false;
  }

  function prevWeek() {
    weekStart = addDays(weekStart, -7);
    loadPlan();
  }
  function nextWeek() {
    weekStart = addDays(weekStart, 7);
    loadPlan();
  }
  function getDateNum(i) {
    // Parse the YYYY-MM-DD as UTC midnight, then read the UTC day so we
    // never roll into the previous/next day across timezones.
    const d = new Date(addDays(weekStart, i) + 'T00:00:00Z');
    return d.getUTCDate();
  }
  function getDateStr(i) {
    return addDays(weekStart, i);
  }

  function getTemplatePreviewText(template) {
    const parts = [];
    for (const slot of slotOrder) {
      const meal = template.meals?.find((m) => m.slot === slot);
      if (meal?.items?.length) {
        const names = meal.items.map((it) => getName(it)).join(", ");
        parts.push(`${slotLabels[slot]}: ${names}`);
      }
    }
    return parts.join(" · ");
  }
  // ── Today indicator (UTC-aligned with backend storage keys) ──
  const todayIndex = $derived.by(() => {
    const diff = dayOffset(weekStart, todayDateString());
    return diff >= 0 && diff < 7 ? diff : -1;
  });

  function goToThisWeek() {
    weekStart = getWeekStart();
    loadPlan();
  }

  // ── Per-day macros ──
  function dayMacros(dayMeals) {
    let cal = 0, pro = 0, carb = 0, fat = 0;
    for (const items of Object.values(dayMeals)) {
      for (const i of items) {
        cal += i.cal || 0;
        const ref = i.type === 'food'
          ? foods.find(f => f._id === i.refId)
          : meals.find(m => m._id === i.refId);
        if (ref) {
          const mult = (i.quantity || 100) / 100;
          if (i.type === 'food') {
            pro += (ref.protein || 0) * mult;
            carb += (ref.netCarbs || 0) * mult;
            fat += (ref.fat || 0) * mult;
          } else {
            pro += (ref.totalMacros?.protein || 0) * mult;
            carb += (ref.totalMacros?.netCarbs || 0) * mult;
            fat += (ref.totalMacros?.fat || 0) * mult;
          }
        }
      }
    }
    return { cal: Math.round(cal), pro: Math.round(pro), carb: Math.round(carb), fat: Math.round(fat) };
  }

  // ── Copy day ──
  let copySource = $state(-1);

  function startCopy(di) {
    copySource = di;
    selectedTemplate = null;
  }

  function cancelCopy() { copySource = -1; }

  function handleDayCopyClick(di) {
    if (copySource < 0 || copySource === di) return;
    const sourceMeals = days[copySource].meals;
    const newMeals = {};
    for (const [slot, items] of Object.entries(sourceMeals)) {
      newMeals[slot] = items.map(item => ({ ...item, id: nextId++ }));
    }
    const hasItems = Object.values(days[di].meals).flat().length > 0;
    if (hasItems) {
      openConfirm({
        title: `Replace ${dayNames[di]}'s plan?`,
        message: `This will overwrite ${dayNames[di]} with a copy of ${dayNames[copySource]}.`,
        warning: 'You can undo this from the Undo button.',
        confirmText: 'Replace',
        onConfirm: () => {
          pushHistory();
          days[di] = { ...days[di], meals: newMeals, templateName: days[copySource].templateName };
          days = [...days];
          copySource = -1;
          showToast(`Copied to ${dayNames[di]}`);
        },
      });
    } else {
      pushHistory();
      days[di] = { ...days[di], meals: newMeals, templateName: days[copySource].templateName };
      days = [...days];
      copySource = -1;
      showToast(`Copied to ${dayNames[di]}`);
    }
  }

  // ── Confirmation modal ──
  const emptyConfirm = {
    open: false,
    title: '',
    message: '',
    warning: '',
    danger: false,
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    onConfirm: null,
    onCancel: null,
  };
  let confirmState = $state({ ...emptyConfirm });

  function openConfirm(opts) {
    confirmState = {
      open: true,
      title: opts.title,
      message: opts.message ?? '',
      warning: opts.warning ?? '',
      danger: opts.danger ?? false,
      confirmText: opts.confirmText ?? 'Confirm',
      cancelText: opts.cancelText ?? 'Cancel',
      onConfirm: opts.onConfirm ?? null,
      onCancel: opts.onCancel ?? null,
    };
  }
  function executeConfirm() {
    const fn = confirmState.onConfirm;
    confirmState = { ...emptyConfirm };
    fn?.();
  }
  function cancelConfirm() {
    const fn = confirmState.onCancel;
    confirmState = { ...emptyConfirm };
    fn?.();
  }

  // ── Toast ──
  let toast = $state({ visible: false, message: '', type: 'success' });
  let toastTimeout = null;

  function showToast(message, type = 'success') {
    if (toastTimeout) clearTimeout(toastTimeout);
    toast = { visible: true, message, type };
    toastTimeout = setTimeout(() => (toast = { ...toast, visible: false }), 3000);
  }

  // ── Unsaved-changes guard ──
  // Intercept SvelteKit navigation when there are unsaved edits, cancel it,
  // then surface our own ConfirmModal. If the user confirms "Leave", we set
  // a one-shot flag and re-trigger the navigation via goto().
  // Tab close/refresh is handled separately by onbeforeunload (browsers don't
  // allow custom modals there).
  let allowNextNav = false;
  beforeNavigate((nav) => {
    if (allowNextNav) {
      allowNextNav = false;
      return;
    }
    if (dirty && !nav.willUnload && nav.to) {
      const targetUrl = nav.to.url;
      nav.cancel();
      openConfirm({
        title: 'Leave without saving?',
        message: 'You have unsaved changes on the weekly plan.',
        warning: 'Your edits will be lost if you leave now.',
        danger: true,
        confirmText: 'Leave',
        cancelText: 'Stay',
        onConfirm: () => {
          allowNextNav = true;
          goto(targetUrl);
        },
      });
    }
  });

  // ── Click-outside cancels pending action ──
  // Selecting a template (to apply) or starting a Copy puts the page into a
  // "click a day" state. Any click that isn't on a day, the action bar,
  // a template card, or a Copy button should cancel that pending action.
  function handleGlobalClick(e) {
    if (!selectedTemplate && copySource < 0) return;
    const t = e.target;
    if (!(t instanceof Element)) return;
    if (
      t.closest('.day-col') ||
      t.closest('.tpl-card') ||
      t.closest('.select-hint') ||
      t.closest('.day-chip') ||
      t.closest('.modal-overlay')
    ) {
      return;
    }
    selectedTemplate = null;
    copySource = -1;
  }
</script>

<svelte:window
  onbeforeunload={(e) => {
    if (dirty) {
      e.preventDefault();
      e.returnValue = '';
    }
  }}
  onclick={handleGlobalClick}
/>

<svelte:head><title>Weekly Planner — MacroX</title></svelte:head>

<div class="page-container">
  <div class="top-bar animate-slide-up">
    <div>
      <h1 class="page-title">Weekly Planner</h1>
      <p class="page-subtitle">Plan your week</p>
    </div>
  </div>

  <div class="date-row animate-slide-up stagger-1">
    <DateNav
      date={weekStart}
      onprev={prevWeek}
      onnext={nextWeek}
      ontoday={todayIndex === -1 ? goToThisWeek : undefined}
      formatOptions={{ month: 'long', day: 'numeric', year: 'numeric' }}
    />
  </div>
  <div class="save-row animate-slide-up stagger-1">
    {#if history.length > 0}
      <button class="undo-btn" onclick={undo} title="Undo last action" type="button">
        <Undo2 size={13} strokeWidth={1.5} />
        <span>Undo</span>
      </button>
    {/if}
    <SaveButton ready={ready} dirty={dirty} saving={saving} onclick={savePlan} />
  </div>

  {#if selectedTemplate}
    <div class="select-hint animate-fade-in">
      Click a day to apply "<strong>{selectedTemplate.name}</strong>" ·
      <button class="btn-link" onclick={() => (selectedTemplate = null)}
        >Cancel</button
      >
    </div>
  {/if}

  {#if copySource >= 0}
    <div class="select-hint animate-fade-in">
      <Copy size={13} strokeWidth={1.5} />
      Click a day to paste <strong>{dayNames[copySource]}</strong>'s plan ·
      <button class="btn-link" onclick={cancelCopy}>Cancel</button>
    </div>
  {/if}

  <!-- Main layout: Dock (left) + Grid (right) -->
  <div class="week-layout">
    <!-- Dock zone (left sidebar) -->
    <div class="dock-zone dock-zone-left" bind:this={dockZoneEl}>
      {@render templateDock()}
    </div>

    <!-- Two independent rows (right) -->
    <div class="week-rows animate-slide-up stagger-2" bind:this={weekRowsEl}>
    <!-- Row 1: Mon–Thu -->
    <div class="week-row">
      {#each [0, 1, 2, 3] as i}
        {@render dayColumn(i)}
      {/each}
    </div>
    <!-- Row 2: Fri–Sun + Weekly Summary -->
    <div class="week-row">
    {#each [4, 5, 6] as i}
      {@render dayColumn(i)}
    {/each}
    <!-- Weekly Summary Card -->
    <div class="summary-card">
      <div class="sm-head">
        <span class="sm-label">Week Summary</span>
      </div>

      <div class="sm-hero">
        <div class="sm-cal-row">
          <span class="sm-cal mono">{weekTotals.cal.toLocaleString()}</span>
          <span class="sm-cal-unit">kcal</span>
        </div>
        {#if weekTotals.planned > 0}
          <span class="sm-avg"><span class="mono">{avgDayKcal.toLocaleString()}</span> kcal daily avg</span>
        {:else}
          <span class="sm-avg sm-avg-empty">No days planned yet</span>
        {/if}
      </div>

      <div class="sm-macros">
        <div class="sm-macro" style="--mc: var(--cal)" title="{Math.round(weekCalPct)}% of {weekCalGoal.toLocaleString()} kcal weekly goal">
          <div class="sm-macro-row">
            <span class="sm-macro-label">Calories</span>
            <span class="sm-macro-val mono">{weekTotals.cal.toLocaleString()}<span class="sm-macro-unit">kcal</span></span>
          </div>
          <div class="sm-bar"><div class="sm-bar-fill" style="width: {weekCalPct}%"></div></div>
        </div>
        <div class="sm-macro" style="--mc: var(--pro)">
          <div class="sm-macro-row">
            <span class="sm-macro-label">Protein</span>
            <span class="sm-macro-val mono">{weekTotals.pro}<span class="sm-macro-unit">g</span></span>
          </div>
          <div class="sm-bar"><div class="sm-bar-fill" style="width: {macroShare.p}%"></div></div>
        </div>
        <div class="sm-macro" style="--mc: var(--carb)">
          <div class="sm-macro-row">
            <span class="sm-macro-label">Carbs</span>
            <span class="sm-macro-val mono">{weekTotals.carb}<span class="sm-macro-unit">g</span></span>
          </div>
          <div class="sm-bar"><div class="sm-bar-fill" style="width: {macroShare.c}%"></div></div>
        </div>
        <div class="sm-macro" style="--mc: var(--fat)">
          <div class="sm-macro-row">
            <span class="sm-macro-label">Fat</span>
            <span class="sm-macro-val mono">{weekTotals.fat}<span class="sm-macro-unit">g</span></span>
          </div>
          <div class="sm-bar"><div class="sm-bar-fill" style="width: {macroShare.f}%"></div></div>
        </div>
      </div>

      <div class="sm-planned">
        <div class="sm-day-track">
          {#each Array(7) as _, di}
            {@const planned = Object.values(days[di].meals).flat().length > 0}
            <div class="sm-day-cell" class:sm-day-on={planned} class:sm-day-today={todayIndex === di}>
              <span class="sm-day-letter">{dayLetters[di]}</span>
              <span class="sm-day-mark"></span>
            </div>
          {/each}
        </div>
        <span class="sm-planned-text"><strong class="mono">{weekTotals.planned}</strong> of 7 days planned</span>
      </div>
    </div>
    </div>
  </div>
  </div>
</div>

{#snippet coloredSlotIcon(slot)}
  {#if slot === 'breakfast'}
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#d4a574" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 2v8"/>
      <path d="m4.93 10.93 1.41 1.41"/>
      <path d="M2 18h2"/>
      <path d="M20 18h2"/>
      <path d="m19.07 10.93-1.41 1.41"/>
      <path d="M22 22H2"/>
      <path d="m8 6 4-4 4 4"/>
      <path d="M16 18a4 4 0 0 0-8 0" fill="#d4a574"/>
    </svg>
  {:else if slot === 'lunch'}
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#d4a574" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
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
  {:else if slot === 'dinner'}
    <svg width="12" height="12" viewBox="0 0 24 24" fill="#b8c0e0" stroke="#b8c0e0" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  {:else}
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#b8956d" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5" fill="#b8956d"/>
      <path d="M8.5 8.5v.01" stroke="#5a3820" stroke-width="2.2"/>
      <path d="M16 15.5v.01" stroke="#5a3820" stroke-width="2.2"/>
      <path d="M12 12v.01" stroke="#5a3820" stroke-width="2.2"/>
      <path d="M11 17v.01" stroke="#5a3820" stroke-width="2.2"/>
      <path d="M7 14v.01" stroke="#5a3820" stroke-width="2.2"/>
    </svg>
  {/if}
{/snippet}

{#snippet dayColumn(i)}
  {@const macros = dayMacros(days[i].meals)}
  {@const hasItems = Object.values(days[i].meals).flat().length > 0}
  <div
    class="day-col"
    class:day-col-today={todayIndex === i}
    class:day-col-drop={draggingTemplate && hoverDay === i}
    class:day-col-target={draggingTemplate && hoverDay !== i}
    class:day-col-selectable={selectedTemplate || copySource >= 0}
    class:day-col-copy-source={copySource === i}
    class:day-col-expanded={hasItems && expandedDays[i]}
    ondragover={(e) => onDayDragOver(e, i)}
    ondragleave={() => onDayDragLeave(i)}
    ondrop={(e) => onDayDrop(e, i)}
    onclick={() => handleDayClick(i)}
    role={selectedTemplate || copySource >= 0 ? "button" : undefined}
    tabindex={selectedTemplate || copySource >= 0 ? 0 : undefined}
  >
    <div class="card-glow"></div>
    <span class="day-watermark mono">{getDateNum(i)}</span>
    <div class="day-head">
      <div class="day-head-left">
        <span class="day-name">{dayNames[i]}</span>
        <span class="day-num">{getDateNum(i)}</span>
        {#if todayIndex === i}<span class="today-dot"></span>{/if}
      </div>
    </div>

    {#if hasItems}
      {@const goalPct = Math.min(100, Math.max(0, (macros.cal / (goals.calories || 2000)) * 100))}
      <div class="day-macros">
        <div class="day-kcal-wrap" title="{Math.round(goalPct)}% of {goals.calories || 2000} kcal goal">
          <svg class="ring" viewBox="0 0 24 24" width="22" height="22">
            <circle cx="12" cy="12" r="9" class="ring-bg" />
            <circle cx="12" cy="12" r="9" class="ring-fg" style="stroke-dasharray: {goalPct * 0.566} 56.6;" />
          </svg>
          <span class="day-kcal mono">{macros.cal}</span>
        </div>
        <span class="dm-sep">·</span>
        <span class="dm mono" data-k="p">{macros.pro}p</span>
        <span class="dm-sep">·</span>
        <span class="dm mono" data-k="c">{macros.carb}c</span>
        <span class="dm-sep">·</span>
        <span class="dm mono" data-k="f">{macros.fat}f</span>
      </div>
    {/if}

    {#if days[i].templateName}
      <div class="template-badge">
        <Bookmark size={9} strokeWidth={2} />
        {days[i].templateName}
      </div>
    {/if}

    <div class="day-meals" bind:this={dayMealsEls[i]}>
      {#each slotOrder as slot}
        {#if days[i].meals[slot].length > 0}
          <div class="meal-group">
            <span class="meal-slot-label">
              <span class="slot-color-icon">{@render coloredSlotIcon(slot)}</span>
              {slotLabels[slot]}
            </span>
            {#each days[i].meals[slot] as item}
              <div class="day-item">
                <span class="di-name">{item.name}</span>
                <span class="di-detail mono">
                  <span class="di-cal">{item.cal}<span class="di-cal-unit"> kcal</span></span>
                  <span class="di-sep">·</span>
                  <span class="di-m" data-k="p">{item.p}p</span>
                  <span class="di-sep">·</span>
                  <span class="di-m" data-k="c">{item.c}c</span>
                  <span class="di-sep">·</span>
                  <span class="di-m" data-k="f">{item.f}f</span>
                </span>
                <button
                  class="di-rm"
                  onclick={(e) => {
                    e.stopPropagation();
                    removeItem(i, slot, item.id);
                  }}><X size={10} strokeWidth={2} /></button
                >
              </div>
            {/each}
          </div>
        {/if}
      {/each}
      {#if !hasItems && !draggingTemplate}
        <a href="/day?date={getDateStr(i)}" class="day-add-link" onclick={(e) => {
          if (copySource >= 0 || selectedTemplate) { e.preventDefault(); } else { e.stopPropagation(); }
        }}>
          <Plus size={20} strokeWidth={1.5} />
          <span class="day-add-text">Plan this day</span>
        </a>
      {/if}
    </div>

    {#if hasItems && daysOverflow[i] && !draggingTemplate}
      <button
        type="button"
        class="see-more"
        bind:this={seeMoreEls[i]}
        transition:fade|global={{ duration: 180 }}
        aria-label={expandedDays[i] ? 'Show less' : 'Show more'}
        onclick={(e) => { e.stopPropagation(); toggleExpanded(i); }}
      >
        {#if expandedDays[i]}
          See less<ChevronUp size={10} strokeWidth={1.75} />
        {:else}
          See more<ChevronDown size={10} strokeWidth={1.75} />
        {/if}
      </button>
    {/if}

    {#if draggingTemplate}
      <div class="drop-indicator" class:drop-indicator-active={hoverDay === i}>
        <span class="drop-indicator-text">{hoverDay === i ? 'Drop here' : 'Drop to apply'}</span>
      </div>
    {/if}

    {#if hasItems && !draggingTemplate}
      <div class="day-bottom-actions">
        <a href="/day?date={getDateStr(i)}" class="day-chip day-chip-edit" onclick={(e) => {
          if (copySource >= 0 || selectedTemplate) { e.preventDefault(); } else { e.stopPropagation(); }
        }}><Pencil size={11} strokeWidth={1.75} />Edit</a>
        <button
          type="button"
          class="day-chip"
          onclick={(e) => {
            e.stopPropagation();
            startCopy(i);
          }}><Copy size={11} strokeWidth={1.75} />Copy</button
        >
        <button
          type="button"
          class="day-chip day-chip-clear"
          onclick={(e) => {
            e.stopPropagation();
            openConfirm({
            title: `Clear ${dayNames[i]}?`,
            message: `This removes every item from ${dayNames[i]}.`,
            warning: 'You can undo this from the Undo button.',
            danger: true,
            confirmText: 'Clear day',
            onConfirm: () => { clearDay(i); showToast(`${dayNames[i]} cleared`); },
          });
          }}><Trash2 size={11} strokeWidth={1.75} />Clear</button
        >
      </div>
    {/if}
  </div>
{/snippet}

{#snippet templateDock()}
  <div class="dock animate-slide-up stagger-3" bind:this={dockEl}>
    <span class="dock-bar" aria-hidden="true"></span>
    <div class="dock-content">
    <div class="dock-header">
      <div class="dock-title-row">
        <h3 class="dock-label">Day Plans</h3>
        {#if templates.length > 0}
          <span class="dock-count mono">{templates.length}</span>
        {/if}
        <span class="dock-underline" aria-hidden="true"></span>
      </div>
      <div class="dock-search">
        <Search size={12} class="dock-search-icon" />
        <input
          class="dock-search-input"
          type="text"
          placeholder="Search…"
          bind:value={dockSearch}
          onpointerdown={(e) => e.stopPropagation()}
          onmousedown={(e) => e.stopPropagation()}
        />
        {#if dockSearch}
          <button class="dock-search-clear" onclick={() => dockSearch = ''} aria-label="Clear search">
            <XIcon size={11} />
          </button>
        {/if}
      </div>
    </div>

    <div
      class="dock-cards"
      class:dock-cards-at-top={dockAtTop}
      class:dock-cards-at-bottom={dockAtBottom}
      bind:this={dockCardsEl}
      onscroll={updateDockScroll}
    >
      {#if templates.length === 0}
        <div class="dock-empty">
          <span class="dock-empty-icon"><Bookmark size={20} strokeWidth={1.5} /></span>
          <span class="dock-empty-title">No day plans yet</span>
          <a href="/day" class="dock-empty-link">Create one in My Day</a>
        </div>
      {:else if filteredDockTemplates.length === 0}
        <div class="dock-empty">
          <span class="dock-empty-icon"><Search size={18} strokeWidth={1.5} /></span>
          <span class="dock-empty-title">No matches for "{dockSearch}"</span>
        </div>
      {:else}
        {#each filteredDockTemplates as template}
          {@const totalItems = (template.meals || []).reduce((s, m) => s + (m.items?.length || 0), 0)}
          {@const filledSlots = new Set((template.meals || []).filter(m => m.items?.length > 0).map(m => m.slot))}
          {@const tplCal = Math.round(template.totalMacros?.calories || 0)}
          {@const tplPro = Math.round(template.totalMacros?.protein || 0)}
          {@const tplCarb = Math.round(template.totalMacros?.netCarbs || 0)}
          {@const tplFat = Math.round(template.totalMacros?.fat || 0)}
          <div
            class="tpl-card"
            class:tpl-selected={selectedTemplate?._id === template._id}
            draggable="true"
            title={getTemplatePreviewText(template) || 'No items'}
            ondragstart={(e) => {
              e.stopPropagation();
              onDragStart(e, template);
            }}
            ondragend={onDragEnd}
            onpointerdown={(e) => e.stopPropagation()}
            onmousedown={(e) => e.stopPropagation()}
            ontouchstart={(e) => e.stopPropagation()}
            onclick={() => handleTemplateClick(template)}
            role="button"
            tabindex="0"
          >
            <header class="tpl-head">
              <span class="tpl-name">{template.name}</span>
              <button
                class="tpl-del"
                onclick={(e) => {
                  e.stopPropagation();
                  openConfirm({
                    title: `Delete "${template.name}"?`,
                    message: 'This day plan will be removed from your library.',
                    warning: 'This cannot be undone.',
                    danger: true,
                    confirmText: 'Delete',
                    onConfirm: () => dayTemplateStore.remove(template._id),
                  });
                }}
                aria-label="Delete template"
              ><X size={11} strokeWidth={2} /></button>
            </header>

            <div class="tpl-hero">
              <span class="tpl-cal mono">{tplCal.toLocaleString()}</span>
              <span class="tpl-cal-unit">kcal</span>
            </div>

            <div class="tpl-macros">
              <div class="tpl-m">
                <span class="tpl-m-label">Protein</span>
                <span class="tpl-m-val mono" style="color: var(--pro)">{tplPro}<span class="tpl-m-unit">g</span></span>
              </div>
              <div class="tpl-m">
                <span class="tpl-m-label">Carbs</span>
                <span class="tpl-m-val mono" style="color: var(--carb)">{tplCarb}<span class="tpl-m-unit">g</span></span>
              </div>
              <div class="tpl-m">
                <span class="tpl-m-label">Fat</span>
                <span class="tpl-m-val mono" style="color: var(--fat)">{tplFat}<span class="tpl-m-unit">g</span></span>
              </div>
            </div>

            <footer class="tpl-foot">
              <div class="tpl-slot-icons" aria-label="Filled meals">
                {#each slotOrder as slot}
                  <span
                    class="tpl-slot-mini"
                    class:tpl-slot-mini-on={filledSlots.has(slot)}
                    title={slotLabels[slot]}
                  >
                    {@render coloredSlotIcon(slot)}
                  </span>
                {/each}
              </div>
              <span class="tpl-count mono">{totalItems}<span class="tpl-count-unit"> {totalItems === 1 ? 'item' : 'items'}</span></span>
            </footer>

            <span class="tpl-grip" aria-hidden="true">
              <GripVertical size={11} strokeWidth={1.5} />
            </span>
          </div>
        {/each}
      {/if}
    </div>

    <a href="/day?newPlan=1" class="dock-new-plan">
      <Plus size={12} strokeWidth={1.75} />
      New plan
    </a>
    </div>
  </div>
{/snippet}

<ConfirmModal
  open={confirmState.open}
  title={confirmState.title}
  message={confirmState.message}
  warning={confirmState.warning}
  danger={confirmState.danger}
  confirmText={confirmState.confirmText}
  cancelText={confirmState.cancelText}
  onconfirm={executeConfirm}
  oncancel={cancelConfirm}
/>

<!-- Toast -->
{#if toast.visible}
  <div class="toast-container">
    <div class="app-toast app-toast-{toast.type}" role="alert">
      <span class="app-toast-icon">
        {#if toast.type === 'success'}
          <Check size={16} strokeWidth={2.5} />
        {:else}
          <AlertTriangle size={16} strokeWidth={2} />
        {/if}
      </span>
      <span>{toast.message}</span>
    </div>
  </div>
{/if}

<style>
  .top-bar {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: var(--space-4);
  }
  /* ── Date Row ── */
  .date-row {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    margin-bottom: var(--space-4);
  }

  .save-row {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: var(--space-3);
    margin-bottom: var(--space-4);
  }
  .undo-btn {
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
  .undo-btn:hover {
    color: var(--text-0);
    border-color: var(--border-strong);
    background: var(--bg-hover);
  }
  .undo-btn:active { transform: scale(0.98); }

  .select-hint {
    padding: var(--space-3) var(--space-5);
    margin-bottom: var(--space-4);
    border: var(--border-width) dashed var(--border-strong);
    border-radius: var(--radius-md);
    font-size: var(--font-sm);
    color: var(--text-1);
    text-align: center;
  }
  .btn-link {
    background: none;
    border: none;
    color: var(--text-2);
    cursor: pointer;
    font-size: var(--font-sm);
    font-family: var(--font-sans);
    text-decoration: underline;
  }

  /* ── Week Layout: Left dock sidebar + right grid ── */
  .week-layout {
    display: flex;
    gap: var(--space-6);
    /* flex-start so the week-rows takes its natural content height —
       a JS ResizeObserver then mirrors that height onto the dock so they
       stay equal regardless of how many plan cards the dock holds. */
    align-items: flex-start;
    width: 100%;
  }

  /* ── Dock zone (left sidebar) — height is set via JS to match week-rows ── */
  .dock-zone-left {
    flex-shrink: 0;
    width: 290px;
    display: flex;
    flex-direction: column;
    min-height: 0;
  }

  /* ── Two independent rows: each row equalizes its own card heights ── */
  .week-rows {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    margin-bottom: var(--space-5);
    flex: 1;
    min-width: 0;
  }
  .week-row {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: var(--space-4);
    min-width: 0;
  }

  /* ── Day Column ── */
  .day-col {
    background: var(--bg-1);
    border: var(--border-width) solid var(--border);
    border-radius: var(--radius-lg);
    padding: var(--space-4) var(--space-4) var(--space-3);
    min-height: 280px;
    max-height: 400px;
    position: relative;
    transition: max-height var(--transition-base),
                background var(--transition-fast),
                border-color var(--transition-fast);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  .card-glow {
    position: absolute;
    top: -150px;
    right: -150px;
    width: 260px;
    height: 260px;
    background: radial-gradient(circle, var(--cal) 0%, transparent 65%);
    filter: blur(70px);
    pointer-events: none;
    opacity: 0.15;
    transition: opacity 130ms ease-out,
                width 180ms cubic-bezier(0.2, 0.8, 0.2, 1),
                height 180ms cubic-bezier(0.2, 0.8, 0.2, 1),
                top 180ms cubic-bezier(0.2, 0.8, 0.2, 1),
                right 180ms cubic-bezier(0.2, 0.8, 0.2, 1);
  }
  .day-col:hover .card-glow {
    opacity: 0.55;
    width: 320px;
    height: 320px;
    top: -170px;
    right: -170px;
  }
  .day-col-today .card-glow {
    opacity: 0.3;
  }
  .day-col-today:hover .card-glow {
    opacity: 0.7;
  }
  .day-col:hover {
    border-color: var(--border-strong);
  }
  .day-col-target {
    border-style: dashed;
  }
  .day-col-drop {
    border-color: var(--text-1);
    border-style: dashed;
    animation: dayColDropPulse 1.2s ease-in-out infinite;
  }
  @keyframes dayColDropPulse {
    0%, 100% { background: var(--accent-subtle); }
    50%      { background: var(--bg-active); }
  }
  .day-col-selectable {
    cursor: pointer;
  }
  .day-col-selectable:hover {
    border-color: var(--text-2);
    background: var(--bg-hover);
  }

  .day-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-3);
    min-height: 24px;
  }
  .day-head-left {
    display: flex;
    align-items: baseline;
    gap: var(--space-2);
  }
  .day-name {
    font-size: var(--font-lg);
    font-weight: 700;
    letter-spacing: -0.02em;
  }
  .day-num {
    font-size: var(--font-base);
    color: var(--text-3);
    font-weight: 400;
  }
  /* Right-side controls in the day header */
  .day-head-right {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
  }
  .day-collapse-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    padding: 0;
    border: none;
    background: transparent;
    color: var(--text-3);
    border-radius: var(--radius-sm);
    cursor: pointer;
    transition: color var(--transition-fast), background var(--transition-fast);
  }
  .day-collapse-btn:hover {
    color: var(--text-0);
    background: var(--bg-hover);
  }

  /* Kcal with goal ring */
  .day-kcal-wrap { display: inline-flex; align-items: center; gap: 5px; }
  .day-kcal {
    font-size: var(--font-sm);
    color: var(--cal);
    font-weight: 600;
    letter-spacing: -0.01em;
  }
  .ring { transform: rotate(-90deg); flex-shrink: 0; }
  .ring-bg { fill: none; stroke: var(--border); stroke-width: 2; }
  .ring-fg {
    fill: none; stroke: var(--cal); stroke-width: 2; stroke-linecap: round;
    transition: stroke-dasharray 600ms cubic-bezier(0.4, 0, 0.2, 1);
  }

  .template-badge {
    display: inline-flex; align-items: center; gap: 4px;
    align-self: flex-start;
    font-size: 10px; font-weight: 500; letter-spacing: -0.005em;
    padding: 3px 8px; margin-bottom: var(--space-3);
    background: var(--accent-subtle); color: var(--text-2);
    border-radius: var(--radius-full);
  }
  .template-badge :global(svg) { color: var(--text-3); }

  .drop-indicator {
    padding: var(--space-2);
    margin-top: var(--space-2);
    border: var(--border-width) dashed var(--border);
    border-radius: var(--radius-md);
    text-align: center;
    transition: all var(--transition-fast);
  }
  .drop-indicator-active {
    border-color: var(--text-1);
    background: var(--accent-subtle);
  }
  .drop-indicator-text {
    font-size: var(--font-xs);
    color: var(--text-3);
    font-weight: 500;
  }
  .drop-indicator-active .drop-indicator-text {
    color: var(--text-1);
  }

  /* ── Meal Groups ── */
  .day-meals {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }

  /* When any card in a row is expanded, raise every card's ceiling
     to 500px — but ONLY for cards within that same row. CSS Grid then
     stretches all cards in the row to match the expanded one, while
     the other row stays at its natural height. */
  .week-row:has(.day-col-expanded) .day-col {
    max-height: 500px;
  }
  .day-col-expanded {
    max-height: 500px;
  }
  .day-col-expanded .day-meals {
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: var(--border) transparent;
  }
  .day-col-expanded .day-meals::-webkit-scrollbar { width: 4px; }
  .day-col-expanded .day-meals::-webkit-scrollbar-track { background: transparent; }
  .day-col-expanded .day-meals::-webkit-scrollbar-thumb { background: var(--border); border-radius: var(--radius-full); }
  .day-col-expanded .day-meals::-webkit-scrollbar-thumb:hover { background: var(--text-3); }

  /* ── V8: Watermark day number + gradient day name ── */
  .day-watermark {
    position: absolute;
    top: -10px;
    right: 8px;
    font-size: 96px;
    font-weight: 700;
    line-height: 1;
    color: var(--text-1);
    opacity: 0.04;
    letter-spacing: -0.05em;
    pointer-events: none;
  }
  .day-name {
    /* Theme-adaptive metallic gradient + depth shadow (per-theme in app.css) */
    background: var(--title-gradient);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    text-shadow: var(--title-shadow);
  }

  .meal-group {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .meal-slot-label {
    display: inline-flex; align-items: center; gap: 5px;
    font-size: 10px; font-weight: 600; letter-spacing: 0.04em;
    color: var(--text-2); text-transform: uppercase;
    padding-bottom: 4px; margin-bottom: 4px;
    box-shadow: inset 0 -1px 0 var(--border);
  }
  .meal-slot-label :global(svg) { color: var(--text-3); }

  .day-item {
    display: flex; align-items: baseline;
    gap: 6px;
    padding: 3px 4px;
    color: var(--text-1);
    border-radius: var(--radius-sm);
    transition: background var(--transition-fast), color var(--transition-fast);
  }
  .day-item:hover { background: var(--bg-hover); color: var(--text-0); }
  .di-name {
    flex: 1;
    min-width: 0;
    font-size: var(--font-sm);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    letter-spacing: -0.005em;
  }
  /* Hover-reveal: kcal + macros. Width collapses to 0 by default so the name
     gets the full row, then expands smoothly on hover. Stays in flex flow so
     it baseline-aligns with the name. */
  .di-detail {
    display: flex; gap: 4px;
    align-items: baseline;
    font-size: 10px; color: var(--text-3);
    flex-shrink: 0;
    max-width: 0;
    overflow: hidden;
    opacity: 0;
    transition: max-width var(--transition-fast), opacity var(--transition-fast);
  }
  .day-item:hover .di-detail { max-width: 200px; opacity: 1; }
  .di-cal { color: var(--cal); font-weight: 500; }
  .di-cal-unit { color: var(--text-3); font-weight: 400; font-size: 9px; }
  .di-sep { color: var(--text-3); opacity: 0.5; }
  .di-m { transition: color var(--transition-fast); }
  .di-m[data-k="p"] { color: var(--pro); opacity: 0.85; }
  .di-m[data-k="c"] { color: var(--carb); opacity: 0.85; }
  .di-m[data-k="f"] { color: var(--fat); opacity: 0.85; }

  .di-rm {
    background: none;
    border: none;
    color: var(--text-3);
    cursor: pointer;
    display: flex;
    align-items: center;
    padding: 2px;
    border-radius: var(--radius-sm);
    flex-shrink: 0;
    max-width: 0;
    overflow: hidden;
    opacity: 0;
    pointer-events: none;
    transition: max-width var(--transition-fast), opacity var(--transition-fast),
                color var(--transition-fast), background var(--transition-fast);
  }
  .day-item:hover .di-rm { max-width: 24px; opacity: 1; pointer-events: auto; }
  .day-item:hover .di-rm { opacity: 1; }
  .di-rm:hover { color: var(--danger); background: var(--danger-bg); }
  .day-add-link {
    text-align: center;
    color: var(--text-3);
    padding: var(--space-6);
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-md);
    transition: all var(--transition-fast);
    border: var(--border-width) dashed transparent;
  }
  .day-add-link:hover {
    color: var(--text-1);
    border-color: var(--border);
    background: var(--bg-hover);
  }
  .day-bottom-actions {
    padding-top: var(--space-3);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    border-top: 1px solid var(--border);
    margin-top: var(--space-3);
  }
  .day-chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 9px;
    font-size: var(--font-xs);
    font-family: var(--font-sans);
    font-weight: 500;
    color: var(--text-1);
    background: var(--bg-hover);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    cursor: pointer;
    text-decoration: none;
    line-height: 1;
    transition: color var(--transition-fast),
                background var(--transition-fast),
                border-color var(--transition-fast);
  }
  .day-chip :global(svg) {
    color: var(--text-3);
    transition: color var(--transition-fast);
  }
  .day-chip:hover {
    color: var(--text-0);
    background: var(--bg-active);
    border-color: var(--border-strong);
  }
  .day-chip:hover :global(svg) {
    color: var(--text-1);
  }
  .day-chip-clear:hover {
    color: var(--danger);
    background: var(--danger-bg);
    border-color: rgba(201, 112, 112, 0.3);
  }
  .day-chip-clear:hover :global(svg) {
    color: var(--danger);
  }

  /* ── Summary Card ── */
  .summary-card {
    background: var(--bg-1);
    border: var(--border-width) solid var(--border);
    border-radius: var(--radius-lg);
    padding: var(--space-5) var(--space-4) var(--space-4);
    display: flex;
    flex-direction: column;
    gap: var(--space-5);
    min-height: 280px;
    align-items: center;
    text-align: center;
  }
  .sm-head {
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  .sm-label {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--text-3);
  }
  .sm-hero {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
  }
  .sm-cal-row {
    display: flex;
    align-items: baseline;
    justify-content: center;
    gap: 6px;
  }
  .sm-cal {
    font-size: var(--font-2xl);
    font-weight: 700;
    color: var(--text-0);
    letter-spacing: -0.04em;
    line-height: 1;
    text-shadow: 0 0 18px rgba(212, 165, 116, 0.1);
  }
  .sm-cal-unit {
    font-size: 11px;
    font-weight: 500;
    color: var(--text-3);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
  .sm-avg {
    font-size: 11px;
    color: var(--text-3);
    letter-spacing: 0.005em;
  }
  .sm-avg .mono { color: var(--text-2); font-weight: 500; }
  .sm-avg-empty { color: var(--text-3); font-style: italic; }

  .sm-macros {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }
  .sm-macro {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .sm-macro-row {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
  }
  .sm-macro-label {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--text-2);
  }
  .sm-macro-val {
    font-size: var(--font-sm);
    font-weight: 600;
    color: var(--mc);
    letter-spacing: -0.02em;
    line-height: 1.1;
  }
  .sm-macro-unit {
    font-size: 9px;
    font-weight: 500;
    color: var(--text-3);
    margin-left: 2px;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
  .sm-bar {
    width: 100%;
    height: 4px;
    background: var(--bg-hover);
    border-radius: var(--radius-full);
    position: relative;
  }
  .sm-bar-fill {
    height: 100%;
    border-radius: var(--radius-full);
    background: var(--mc);
    opacity: 0.92;
    box-shadow:
      0 0 4px color-mix(in srgb, var(--mc) 50%, transparent),
      0 0 8px color-mix(in srgb, var(--mc) 22%, transparent);
    transition: width 600ms cubic-bezier(0.4, 0, 0.2, 1);
    animation: barPulse 3.6s ease-in-out infinite;
    min-width: 4px;
  }
  @keyframes barPulse {
    0%, 100% {
      box-shadow:
        0 0 3px color-mix(in srgb, var(--mc) 40%, transparent),
        0 0 6px color-mix(in srgb, var(--mc) 18%, transparent);
    }
    50% {
      box-shadow:
        0 0 5px color-mix(in srgb, var(--mc) 55%, transparent),
        0 0 10px color-mix(in srgb, var(--mc) 28%, transparent);
    }
  }

  .sm-planned {
    margin-top: auto;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding-top: var(--space-4);
    border-top: 1px solid var(--border);
  }
  .sm-day-track {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 4px;
  }
  .sm-day-cell {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }
  .sm-day-letter {
    font-size: 9px;
    font-weight: 600;
    letter-spacing: 0.04em;
    color: var(--text-3);
    text-transform: uppercase;
    transition: color var(--transition-fast);
  }
  .sm-day-mark {
    width: 100%;
    height: 4px;
    border-radius: var(--radius-full);
    background: var(--border);
    transition: background var(--transition-fast), box-shadow var(--transition-fast);
  }
  .sm-day-on .sm-day-mark { background: var(--text-1); }
  .sm-day-on .sm-day-letter { color: var(--text-1); }
  .sm-day-today .sm-day-letter { color: var(--text-0); font-weight: 700; }
  .sm-day-today .sm-day-mark {
    background: #6ec9a8;
    box-shadow: 0 0 6px rgba(110, 201, 168, 0.55);
  }
  .sm-planned-text {
    font-size: var(--font-xs);
    color: var(--text-3);
    letter-spacing: -0.005em;
  }
  .sm-planned-text strong {
    color: var(--text-1);
    font-weight: 600;
  }

  /* ── Day Plans Dock — vertical brand-bar layout (variant 16) ── */
  .dock {
    display: flex;
    flex-direction: row;
    gap: 0;
    width: 100%;
    height: 100%;
    min-height: 0;
    background: transparent;
    border: none;
    padding: 0;
    align-items: stretch;
  }
  .dock-bar {
    width: 2px;
    background: linear-gradient(180deg, var(--cal), transparent);
    border-radius: var(--radius-full);
    flex-shrink: 0;
  }
  .dock-content {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    padding: 4px 0 4px var(--space-4);
  }
  .dock-header {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    flex-shrink: 0;
  }
  /* Variant 17 chrome — gradient title, count, amber underline accent */
  .dock-title-row {
    position: relative;
    display: flex;
    align-items: baseline;
    gap: 8px;
    padding-bottom: 6px;
  }
  .dock-label {
    margin: 0;
    font-size: var(--font-xl);
    font-weight: 700;
    letter-spacing: -0.03em;
    /* Slightly relaxed line-height so descenders ("y" in "Day") aren't clipped */
    line-height: 1.2;
    /* Theme-adaptive metallic gradient + depth shadow (defined per theme in app.css) */
    background: var(--title-gradient);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    -webkit-text-fill-color: transparent;
    text-shadow: var(--title-shadow);
  }
  .dock-count {
    font-size: 11px;
    color: var(--text-3);
    font-weight: 600;
    letter-spacing: 0.04em;
    line-height: 1;
  }
  .dock-underline {
    position: absolute;
    left: 0; bottom: 0;
    width: 28px;
    height: 2px;
    background: var(--cal);
    border-radius: var(--radius-full);
    opacity: 0.7;
  }
  .dock-new-plan {
    align-self: center;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    margin-top: var(--space-2);
    padding: 5px 12px;
    background: transparent;
    border: 1px dashed var(--border-strong);
    border-radius: var(--radius-full);
    color: var(--text-2);
    font-size: var(--font-xs);
    font-weight: 500;
    font-family: var(--font-sans);
    text-decoration: none;
    cursor: pointer;
    flex-shrink: 0;
    transition: color var(--transition-fast), border-color var(--transition-fast);
  }
  .dock-new-plan:hover {
    color: var(--text-0);
    border-color: var(--text-2);
  }

  /* ── Dock zones (dndzone-based) ── */
  .dock-zone {
    min-height: 0;
    border-radius: var(--radius-lg);
    box-sizing: border-box;
    transition:
      min-height 180ms ease,
      outline-color var(--transition-fast),
      outline-width var(--transition-fast),
      outline-style var(--transition-fast);
  }
  .dock-zone-empty {
    min-height: 0;
  }
  /* During a dock drag, BOTH zones show a dashed drop-target outline so the user
     sees every valid place they can drop. Outline doesn't affect layout, so the
     source zone (which still holds the dock) gets the indicator too. */
  .dock-zone-dragging {
    outline: 1.5px dashed var(--text-2);
    outline-offset: -1.5px;
  }
  /* Empty zone reserves the exact dock height so dropping never causes a layout shift. */
  .dock-zone-empty.dock-zone-dragging {
    min-height: var(--dock-h, 0px);
  }
  .dock-zone-top.dock-zone-empty.dock-zone-dragging {
    margin-bottom: var(--space-4);
  }
  .dock-zone-bottom.dock-zone-empty.dock-zone-dragging {
    margin-top: var(--space-4);
  }
  /* Cursor is over this zone — confirms a valid drop spot with a brighter dashed outline. */
  :global(.dock-zone-highlight) {
    outline-color: var(--text-0) !important;
  }

  /* Borderless search with bottom border that lights amber on focus (variant 17) */
  .dock-search {
    display: flex;
    align-items: center;
    gap: 6px;
    background: transparent;
    border: none;
    border-bottom: 1px solid var(--border);
    border-radius: 0;
    padding: 4px 0;
    transition: border-bottom-color var(--transition-fast);
    width: 100%;
  }
  .dock-search:focus-within {
    border-bottom-color: var(--cal);
  }
  :global(.dock-search-icon) { color: var(--text-3); flex-shrink: 0; }
  .dock-search-input {
    flex: 1; border: none; background: transparent;
    padding: 2px 0; font-size: 11px; color: var(--text-1);
    font-family: var(--font-sans); outline: none; min-width: 0;
  }
  .dock-search-input::placeholder { color: var(--text-3); }
  .dock-search-clear {
    background: none; border: none; color: var(--text-3); cursor: pointer;
    display: flex; padding: 2px; border-radius: var(--radius-sm);
    transition: color var(--transition-fast);
  }
  .dock-search-clear:hover { color: var(--text-1); }

  .dock-cards {
    --fade-top: 60px;
    --fade-bottom: 60px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    overflow-y: auto;
    overflow-x: hidden;
    flex: 1;
    min-height: 0;
    padding: 2px;
    /* Hide scrollbar — Firefox + IE/Edge */
    scrollbar-width: none;
    -ms-overflow-style: none;
    /* Top + bottom fade hints that there's scrollable content beyond.
       Fade size collapses to 0 on whichever edge is fully reached. */
    mask-image: linear-gradient(
      to bottom,
      transparent 0,
      #000 var(--fade-top),
      #000 calc(100% - var(--fade-bottom)),
      transparent 100%
    );
    -webkit-mask-image: linear-gradient(
      to bottom,
      transparent 0,
      #000 var(--fade-top),
      #000 calc(100% - var(--fade-bottom)),
      transparent 100%
    );
    transition: --fade-top 160ms ease, --fade-bottom 160ms ease;
  }
  .dock-cards-at-top    { --fade-top: 0px; }
  .dock-cards-at-bottom { --fade-bottom: 0px; }
  /* Hide scrollbar — Chromium/WebKit */
  .dock-cards::-webkit-scrollbar { width: 0; height: 0; display: none; }

  .dock-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding: var(--space-6) var(--space-3);
    text-align: center;
    color: var(--text-3);
  }
  .dock-empty-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    background: var(--bg-hover);
    border-radius: var(--radius-full);
    color: var(--text-3);
    margin-bottom: 4px;
  }
  .dock-empty-title {
    font-size: var(--font-sm);
    color: var(--text-2);
    font-weight: 500;
  }
  .dock-empty-link {
    font-size: var(--font-xs);
    color: var(--text-1);
    text-decoration: underline;
    text-decoration-color: var(--border-strong);
    text-underline-offset: 3px;
  }
  .dock-empty-link:hover { color: var(--text-0); }

  /* ── Plan card ── */
  .tpl-card {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 10px var(--space-3) var(--space-3);
    background: var(--bg-1);
    border: none;
    border-radius: var(--radius-md);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.18), 0 1px 2px rgba(0, 0, 0, 0.08);
    cursor: grab;
    user-select: none;
    width: 100%;
    flex-shrink: 0;
    overflow: hidden;
    transition: box-shadow var(--transition-fast),
                background var(--transition-fast),
                transform var(--transition-fast),
                box-shadow var(--transition-fast);
  }
  /* Left accent bar — matches the week card hover border color */
  .tpl-card::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3px;
    background: var(--border-strong);
    transition: background var(--transition-fast);
  }
  .tpl-card:hover {
    background: var(--bg-hover);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.22), 0 2px 4px rgba(0, 0, 0, 0.12);
  }
  .tpl-card:active { cursor: grabbing; transform: scale(0.99); }
  .tpl-selected {
    background: var(--bg-hover);
    box-shadow: 0 0 0 1.5px var(--text-0) inset, 0 4px 12px rgba(0, 0, 0, 0.22);
  }

  .tpl-head {
    display: flex; align-items: center; justify-content: space-between; gap: var(--space-2);
  }
  .tpl-name {
    font-size: var(--font-sm); font-weight: 600; color: var(--text-0);
    letter-spacing: -0.015em;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    flex: 1; min-width: 0;
    line-height: 1.3;
  }
  .tpl-del {
    background: transparent; border: none; color: var(--text-3);
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    padding: 0;
    border-radius: var(--radius-sm); flex-shrink: 0;
    opacity: 0;
    transition: opacity var(--transition-fast), color var(--transition-fast), background var(--transition-fast);
  }
  .tpl-card:hover .tpl-del,
  .tpl-card:focus-within .tpl-del { opacity: 1; }
  .tpl-del:hover { color: var(--danger); background: var(--danger-bg); }

  /* Hero kcal */
  .tpl-hero {
    display: flex;
    align-items: baseline;
    gap: 5px;
  }
  .tpl-cal {
    font-size: var(--font-xl);
    font-weight: 600;
    color: var(--text-0);
    letter-spacing: -0.03em;
    line-height: 1;
  }
  .tpl-cal-unit {
    font-size: 10px;
    font-weight: 500;
    color: var(--text-3);
  }

  /* Macros — simple inline values like the summary card */
  .tpl-macros {
    display: flex;
    align-items: baseline;
    gap: var(--space-3);
  }
  .tpl-m {
    display: flex;
    flex-direction: column;
    gap: 1px;
  }
  .tpl-m-label {
    font-size: 9px;
    font-weight: 500;
    color: var(--text-3);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .tpl-m-val {
    font-size: var(--font-sm);
    font-weight: 600;
    line-height: 1.1;
    letter-spacing: -0.02em;
  }
  .tpl-m-unit {
    font-size: 9px;
    font-weight: 400;
    color: var(--text-3);
    margin-left: 1px;
  }

  /* Footer */
  .tpl-foot {
    display: flex; justify-content: space-between; align-items: center;
    padding-top: 8px;
    border-top: 1px solid var(--border);
    position: relative;
    z-index: 1;
  }
  .tpl-slot-icons { display: inline-flex; gap: 4px; align-items: center; }
  .tpl-slot-mini {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 14px;
    height: 14px;
    opacity: 0.25;
    filter: grayscale(100%);
    transition: opacity var(--transition-fast), filter var(--transition-fast);
  }
  .tpl-slot-mini-on {
    opacity: 1;
    filter: grayscale(0%);
  }

  .tpl-count {
    font-size: var(--font-xs);
    color: var(--text-1);
    font-weight: 600;
    letter-spacing: -0.005em;
  }
  .tpl-count-unit {
    font-size: 9px;
    color: var(--text-3);
    font-weight: 400;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  /* Drag grip — corner watermark, only visible on hover */
  .tpl-grip {
    position: absolute; bottom: 6px; right: 6px;
    display: flex; align-items: center;
    color: var(--text-3); opacity: 0;
    transition: opacity var(--transition-fast);
    pointer-events: none;
  }
  .tpl-card:hover .tpl-grip { opacity: 0.4; }

  /* ── Today indicator ── */
  .day-col-today {
    border-color: var(--border-strong);
  }
  .today-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #6ec9a8;
    display: inline-block;
    margin-left: var(--space-1);
    box-shadow:
      0 0 6px rgba(110, 201, 168, 0.85),
      0 0 12px rgba(110, 201, 168, 0.45);
    animation: todayDotPulse 2.4s ease-in-out infinite;
  }
  @keyframes todayDotPulse {
    0%, 100% {
      box-shadow:
        0 0 6px rgba(110, 201, 168, 0.85),
        0 0 12px rgba(110, 201, 168, 0.45);
    }
    50% {
      box-shadow:
        0 0 9px rgba(110, 201, 168, 1),
        0 0 18px rgba(110, 201, 168, 0.6);
    }
  }

  /* ── Per-day macros ── */
  .day-macros {
    display: flex; align-items: center; gap: 6px;
    margin-bottom: var(--space-2);
    font-size: 10.5px; color: var(--text-3);
  }
  .day-macros .day-kcal-wrap { margin-right: 2px; }
  .slot-color-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 12px;
    height: 12px;
  }
  .see-more {
    position: absolute;
    bottom: 56px;
    left: 0;
    right: 0;
    z-index: 3;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    padding: 6px 0;
    background: var(--bg-0);
    border: none;
    font-family: var(--font-sans);
    font-size: 10.5px;
    font-weight: 500;
    color: var(--text-2);
    cursor: pointer;
    letter-spacing: -0.005em;
    transition: color var(--transition-fast);
  }
  .see-more :global(svg) {
    color: var(--text-3);
    transition: color var(--transition-fast);
  }
  .see-more:hover {
    color: var(--text-0);
  }
  .see-more:hover :global(svg) {
    color: var(--text-1);
  }
  .dm { transition: color var(--transition-fast); }
  .dm-sep { opacity: 0.55; }
  .day-col:hover .dm[data-k="p"] { color: var(--pro); }
  .day-col:hover .dm[data-k="c"] { color: var(--carb); }
  .day-col:hover .dm[data-k="f"] { color: var(--fat); }

  /* ── Copy day ── */
  .day-col-copy-source {
    border-color: var(--text-2);
    background: var(--accent-subtle);
  }
  .day-add-text {
    font-size: var(--font-xs);
    color: var(--text-3);
  }

  /* ── Confirmation modal ── */
  .cm-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-5);
  }
  .cm-title {
    font-size: var(--font-lg);
    font-weight: 600;
  }
  .cm-body {
    font-size: var(--font-sm);
    color: var(--text-2);
    margin-bottom: var(--space-4);
    line-height: 1.6;
  }
  .cm-warn {
    display: flex;
    align-items: flex-start;
    gap: var(--space-3);
    padding: var(--space-3) var(--space-4);
    background: var(--danger-bg);
    border: var(--border-width) solid rgba(201, 112, 112, 0.15);
    border-radius: var(--radius-md);
    font-size: var(--font-sm);
    color: var(--text-1);
    line-height: 1.5;
    margin-bottom: var(--space-5);
  }
  .cm-warn :global(svg) {
    flex-shrink: 0;
    margin-top: 2px;
    color: var(--danger);
  }
  .cm-actions {
    display: flex;
    gap: var(--space-3);
    justify-content: flex-end;
  }

  @media (max-width: 1400px) {
    .week-layout {
      flex-direction: column;
      align-items: stretch;
    }
    .dock-zone-left {
      width: 100%;
    }
    .dock {
      height: auto;
    }
    .dock-cards {
      flex-direction: row;
      overflow-x: auto;
      overflow-y: hidden;
      flex: none;
      max-height: 220px;
    }
    .tpl-card {
      min-width: 220px;
    }
  }
  @media (max-width: 1024px) {
    .week-row {
      grid-template-columns: repeat(2, 1fr);
    }
  }
  @media (max-width: 640px) {
    .week-row {
      grid-template-columns: 1fr;
    }
    .top-bar {
      flex-direction: column;
      gap: var(--space-3);
    }
  }
</style>
