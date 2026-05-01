<script>
  import { foodStore } from "$lib/stores/foods.js";
  import { mealStore } from "$lib/stores/meals.js";
  import { plannerStore } from "$lib/stores/planner.js";
  import { dayTemplateStore } from "$lib/stores/dayTemplates.js";
  import { auth } from "$lib/stores/auth.js";
  import { onMount, flushSync } from "svelte";
  import { beforeNavigate, goto } from '$app/navigation';
  import { Search, X as XIcon, Copy, Check, AlertTriangle, Undo2 } from "lucide-svelte";
  import { getWeekStart, getDayNames, formatDate } from "$lib/utils/macros.js";
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
  } from "lucide-svelte";
  import { dndzone } from "svelte-dnd-action";
  import { flip } from "svelte/animate";
  import DateNav from "$lib/components/ui/DateNav.svelte";
  import SaveButton from "$lib/components/ui/SaveButton.svelte";
  import ConfirmModal from "$lib/components/ui/ConfirmModal.svelte";

  let { data } = $props();

  const FLIP_MS = 150;
  const DOCK_ZONE = "weekly-dock-zone";
  const DOCK_ITEM_ID = "dock-container";
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
  const initialDockPos =
    typeof window !== "undefined"
      ? localStorage.getItem("macrox-dock-pos") || "bottom"
      : "bottom";
  let dockPosition = $state(initialDockPos);
  let draggingTemplate = $state(null);
  let hoverDay = $state(-1);
  let selectedTemplate = $state(null);
  let dockSearch = $state('');
  let expandedDays = $state(Array(7).fill(false));
  let dayMealsEls = $state(Array(7).fill(null));
  let daysOverflow = $state(Array(7).fill(false));
  function toggleExpanded(i) {
    expandedDays[i] = !expandedDays[i];
  }
  // Signature that changes whenever any item is added/removed in any slot.
  const contentSig = $derived(
    days.map((d) => Object.values(d.meals).map((s) => s.length).join(',')).join('|')
  );
  // Detect whether each day's content overflows the default (collapsed) cap.
  // While expanded, the day-meals area is taller, so a fresh measurement
  // would falsely report "fits" — keep the prior value instead.
  $effect(() => {
    void contentSig;
    void weekStart;
    requestAnimationFrame(() => {
      daysOverflow = daysOverflow.map((prev, i) => {
        if (expandedDays[i]) return prev;
        const el = dayMealsEls[i];
        if (!el) return false;
        return el.scrollHeight > el.clientHeight + 1;
      });
    });
  });
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

  // Dock repositioning via dndzone — mirrors the daily page's item-move pattern
  let dockDragDisabled = $state(true);
  let dockDragActive = $state(false);
  let dockItems = $state({
    top: initialDockPos === "top" ? [{ id: DOCK_ITEM_ID }] : [],
    bottom: initialDockPos === "bottom" ? [{ id: DOCK_ITEM_ID }] : [],
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
    takeSavedSnapshot();
    ready = true;
  }


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
  function setDockPosition(pos) {
    dockPosition = pos;
    localStorage.setItem("macrox-dock-pos", pos);
    dockItems = {
      top: pos === "top" ? [{ id: DOCK_ITEM_ID }] : [],
      bottom: pos === "bottom" ? [{ id: DOCK_ITEM_ID }] : [],
    };
  }

  function toggleDock() {
    setDockPosition(dockPosition === "bottom" ? "top" : "bottom");
  }

  // Dock drag-to-reposition via dndzone
  // Enable drag on hover of the handle (fires well before mousedown, so by the time
  // the user presses, the dndzone wrapper already has draggable=true — first drag works).
  function onHandleEnter() {
    dockDragDisabled = false;
  }
  function onHandleLeave() {
    // Don't disable mid-drag — cursor leaves the handle as the dock starts moving.
    if (!dockDragActive) dockDragDisabled = true;
  }
  // Touch fallback: no hover on touch devices, so flushSync on pointerdown.
  function onHandlePointerDown() {
    flushSync(() => {
      dockDragDisabled = false;
    });
  }

  function handleDockConsider(pos, e) {
    dockDragActive = true;
    dockItems[pos] = e.detail.items;
    dockItems = { ...dockItems };
  }

  function handleDockFinalize(pos, e) {
    dockItems[pos] = e.detail.items;
    dockItems = { ...dockItems };
    const newPos = dockItems.top.length > 0 ? "top" : "bottom";
    if (newPos !== dockPosition) {
      dockPosition = newPos;
      localStorage.setItem("macrox-dock-pos", newPos);
    }
    // Keep the active state on through the flip animation so the source zone
    // holds its reserved height. Then release — the min-height transition collapses smoothly.
    setTimeout(() => {
      dockDragActive = false;
      dockDragDisabled = true;
    }, FLIP_MS);
  }

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
    const d = new Date(weekStart);
    d.setDate(d.getDate() - 7);
    weekStart = formatDate(d);
    loadPlan();
  }
  function nextWeek() {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 7);
    weekStart = formatDate(d);
    loadPlan();
  }
  function getDateNum(i) {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d.getDate();
  }
  function getDateStr(i) {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return formatDate(d);
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
  // ── Today indicator ──
  const todayIndex = $derived.by(() => {
    const today = new Date();
    const start = new Date(weekStart + 'T00:00');
    const diff = Math.floor((today - start) / (1000 * 60 * 60 * 24));
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
      t.closest('.day-action-btn') ||
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

  <!-- Dock zone (top) — always rendered; expands during drag when empty -->
  <div
    class="dock-zone dock-zone-top"
    class:dock-zone-empty={dockItems.top.length === 0}
    class:dock-zone-dragging={dockDragActive}
    style:--dock-h="{dockHeight}px"
    use:dndzone={{
      items: dockItems.top,
      flipDurationMs: FLIP_MS,
      type: DOCK_ZONE,
      dragDisabled: dockDragDisabled,
      dropTargetClasses: ["dock-zone-highlight"],
      dropTargetStyle: {},
    }}
    onconsider={(e) => handleDockConsider("top", e)}
    onfinalize={(e) => handleDockFinalize("top", e)}
  >
    {#each dockItems.top as item (item.id)}
      <div animate:flip={{ duration: FLIP_MS }}>
        {@render templateDock()}
      </div>
    {/each}
  </div>

  <!-- 4+3 Grid -->
  <div class="week-grid animate-slide-up stagger-2">
    <!-- Row 1: Mon–Thu -->
    {#each [0, 1, 2, 3] as i}
      {@render dayColumn(i)}
    {/each}
    <!-- Row 2: Fri–Sun + Weekly Summary -->
    {#each [4, 5, 6] as i}
      {@render dayColumn(i)}
    {/each}
    <!-- Weekly Summary Card -->
    <div class="summary-card">
      <span class="summary-label">WEEK TOTAL</span>
      <span class="summary-cal mono">{weekTotals.cal.toLocaleString()}<span class="summary-unit"> kcal</span></span>
      <div class="summary-macros">
        <span class="mono" style="color: var(--pro)">{weekTotals.pro}p</span>
        <span class="summary-dot">·</span>
        <span class="mono" style="color: var(--carb)">{weekTotals.carb}c</span>
        <span class="summary-dot">·</span>
        <span class="mono" style="color: var(--fat)">{weekTotals.fat}f</span>
      </div>
      <div class="summary-planned">
        <div class="planned-dots">
          {#each Array(7) as _, di}
            <span class="planned-dot" class:planned-dot-on={Object.values(days[di].meals).flat().length > 0}></span>
          {/each}
        </div>
        <span class="planned-text">{weekTotals.planned} of 7 days planned</span>
      </div>
    </div>
  </div>

  <!-- Dock zone (bottom) — always rendered; expands during drag when empty -->
  <div
    class="dock-zone dock-zone-bottom"
    class:dock-zone-empty={dockItems.bottom.length === 0}
    class:dock-zone-dragging={dockDragActive}
    style:--dock-h="{dockHeight}px"
    use:dndzone={{
      items: dockItems.bottom,
      flipDurationMs: FLIP_MS,
      type: DOCK_ZONE,
      dragDisabled: dockDragDisabled,
      dropTargetClasses: ["dock-zone-highlight"],
      dropTargetStyle: {},
    }}
    onconsider={(e) => handleDockConsider("bottom", e)}
    onfinalize={(e) => handleDockFinalize("bottom", e)}
  >
    {#each dockItems.bottom as item (item.id)}
      <div animate:flip={{ duration: FLIP_MS }}>
        {@render templateDock()}
      </div>
    {/each}
  </div>
</div>

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
    <div class="day-head">
      <div class="day-head-left">
        <span class="day-name">{dayNames[i]}</span>
        <span class="day-num">{getDateNum(i)}</span>
        {#if todayIndex === i}<span class="today-dot"></span>{/if}
      </div>
      {#if hasItems}
        {@const goalPct = Math.min(100, Math.max(0, (macros.cal / (goals.calories || 2000)) * 100))}
        <div class="day-head-right">
          <div class="day-kcal-wrap" title="{Math.round(goalPct)}% of {goals.calories || 2000} kcal goal">
            <svg class="ring" viewBox="0 0 24 24" width="22" height="22">
              <circle cx="12" cy="12" r="9" class="ring-bg" />
              <circle cx="12" cy="12" r="9" class="ring-fg" style="stroke-dasharray: {goalPct * 0.566} 56.6;" />
            </svg>
            <span class="day-kcal mono">{macros.cal}</span>
          </div>
          {#if daysOverflow[i]}
            <button
              type="button"
              class="day-collapse-btn"
              aria-label={expandedDays[i] ? 'Collapse day' : 'Expand day'}
              title={expandedDays[i] ? 'Collapse day' : 'Expand day'}
              onclick={(e) => { e.stopPropagation(); toggleExpanded(i); }}
            >
              {#if expandedDays[i]}
                <ChevronUp size={13} strokeWidth={1.75} />
              {:else}
                <ChevronDown size={13} strokeWidth={1.75} />
              {/if}
            </button>
          {/if}
        </div>
      {/if}
    </div>

    {#if hasItems}
      <div class="day-macros">
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
          {@const SlotIcon = slotIcons[slot]}
          <div class="meal-group">
            <span class="meal-slot-label">
              <SlotIcon size={11} strokeWidth={1.75} />
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

    {#if draggingTemplate}
      <div class="drop-indicator" class:drop-indicator-active={hoverDay === i}>
        <span class="drop-indicator-text">{hoverDay === i ? 'Drop here' : 'Drop to apply'}</span>
      </div>
    {/if}

    {#if hasItems && !draggingTemplate}
      <div class="day-bottom-actions">
        <a href="/day?date={getDateStr(i)}" class="day-edit" onclick={(e) => {
          if (copySource >= 0 || selectedTemplate) { e.preventDefault(); } else { e.stopPropagation(); }
        }}>Edit</a>
        <button
          class="day-action-btn"
          onclick={(e) => {
            e.stopPropagation();
            startCopy(i);
          }}><Copy size={11} strokeWidth={1.5} />Copy</button
        >
        <button
          class="day-clear"
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
          }}>Clear</button
        >
      </div>
    {/if}
  </div>
{/snippet}

{#snippet templateDock()}
  <div
    class="dock animate-slide-up stagger-3"
    class:dock-top={dockPosition === "top"}
    bind:this={dockEl}
  >
    <div class="dock-header">
      <div
        class="dock-handle"
        onmouseenter={onHandleEnter}
        onmouseleave={onHandleLeave}
        onpointerdown={onHandlePointerDown}
        title="Drag to reposition"
        aria-label="Drag to reposition templates dock"
        role="button"
        tabindex="0"
      >
        <GripVertical size={14} strokeWidth={1.5} />
        <span class="dock-label">Day Plans</span>
      </div>
      <div class="dock-right-items-wrapper">
        <a href="/day?newPlan=1" class="btn btn-primary btn-sm dock-create">
          <Plus size={13} strokeWidth={1.5} />
          New Plan
        </a>

        <div class="dock-search-wrapper">

          <div class="dock-search">
            <Search size={13} class="dock-search-icon" />
            <input
            class="dock-search-input"
            type="text"
            placeholder="Search day plans…"
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
        <button
        class="btn btn-ghost btn-sm dock-toggle"
        onclick={toggleDock}
        aria-label="Move dock"
      >
        {#if dockPosition === "bottom"}<ChevronUp
            size={14}
            strokeWidth={1.5}
          />{:else}<ChevronDown size={14} strokeWidth={1.5} />{/if}
      </button>
    </div>
    </div>
    <div class="dock-cards">
      {#if templates.length === 0}
        <p class="dock-empty">
          No day plans yet. <a href="/day" class="dock-link"
            >Create one in My Day</a
          >
        </p>
      {:else if filteredDockTemplates.length === 0}
        <p class="dock-empty">No plans match "<strong>{dockSearch}</strong>"</p>
      {:else}
        {#each filteredDockTemplates as template}
          {@const totalItems = (template.meals || []).reduce((s, m) => s + (m.items?.length || 0), 0)}
          {@const filledSlots = new Set((template.meals || []).filter(m => m.items?.length > 0).map(m => m.slot))}
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
                ><X size={11} strokeWidth={2} /></button
              >
            </header>

            <div class="tpl-cal-row">
              <span class="tpl-cal-num mono">{Math.round(template.totalMacros?.calories || 0).toLocaleString()}</span>
              <span class="tpl-cal-unit">kcal</span>
            </div>

            <div class="tpl-macros mono">
              <span class="t-m" data-k="p">{Math.round(template.totalMacros?.protein || 0)}p</span>
              <span class="t-sep">·</span>
              <span class="t-m" data-k="c">{Math.round(template.totalMacros?.netCarbs || 0)}c</span>
              <span class="t-sep">·</span>
              <span class="t-m" data-k="f">{Math.round(template.totalMacros?.fat || 0)}f</span>
            </div>

            <footer class="tpl-foot">
              <div class="tpl-slots" aria-label="Filled meals">
                {#each slotOrder as slot}
                  <span class="tpl-slot" class:tpl-slot-on={filledSlots.has(slot)} title={slotLabels[slot]}>
                    {slotLabels[slot][0]}
                  </span>
                {/each}
              </div>
              <span class="tpl-count">{totalItems} {totalItems === 1 ? 'item' : 'items'}</span>
            </footer>

            <span class="tpl-grip" aria-hidden="true">
              <GripVertical size={11} strokeWidth={1.5} />
            </span>
          </div>
        {/each}
      {/if}
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

  /* ── 4+3 Grid ── */
  .week-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: var(--space-3);
    margin-bottom: var(--space-5);
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
    transition: max-height var(--transition-base), background var(--transition-base),
                border-color var(--transition-base);
    display: flex;
    flex-direction: column;
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

  /* When any day in the grid is expanded, raise every card's ceiling
     to 500px. CSS Grid rows still size to their tallest cell, so only
     the row containing the expanded card actually grows — the other
     row stays at its natural height. */
  .week-grid:has(.day-col-expanded) .day-col {
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
    display: grid; grid-template-columns: 1fr auto auto;
    gap: 6px; align-items: baseline;
    padding: 3px 4px;
    color: var(--text-1);
    border-radius: var(--radius-sm);
    transition: background var(--transition-fast), color var(--transition-fast);
  }
  .day-item:hover { background: var(--bg-hover); color: var(--text-0); }
  .di-name {
    font-size: var(--font-sm);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    letter-spacing: -0.005em;
  }
  /* Hover-reveal: kcal + macros */
  .di-detail {
    display: flex; gap: 4px;
    font-size: 10px; color: var(--text-3);
    opacity: 0;
    transition: opacity var(--transition-fast);
  }
  .day-item:hover .di-detail { opacity: 1; }
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
    padding: 2px;
    border-radius: var(--radius-sm);
    opacity: 0;
    transition: opacity var(--transition-fast), color var(--transition-fast), background var(--transition-fast);
  }
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
    margin-top: auto;
    padding-top: var(--space-3);
    display: flex;
    justify-content: center;
    gap: var(--space-3);
  }
  .day-edit {
    background: none;
    border: none;
    font-size: var(--font-xs);
    color: var(--text-2);
    cursor: pointer;
    font-family: var(--font-sans);
    text-align: center;
    transition: color var(--transition-fast);
    text-decoration: none;
  }
  .day-edit:hover {
    color: var(--text-0);
  }
  .day-clear {
    margin-top: 0;
    padding-top: 0;
    background: none;
    border: none;
    font-size: var(--font-xs);
    color: var(--text-3);
    cursor: pointer;
    font-family: var(--font-sans);
    text-align: center;
    transition: color var(--transition-fast);
  }
  .day-clear:hover {
    color: var(--danger);
  }

  /* ── Summary Card ── */
  .summary-card {
    border: var(--border-width) solid var(--border);
    border-radius: var(--radius-lg);
    padding: var(--space-5);
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    justify-content: center;
    min-height: 280px;
  }
  .summary-label {
    font-size: var(--font-xs);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--text-3);
    font-weight: 600;
  }
  .summary-cal {
    font-size: var(--font-2xl);
    font-weight: 600;
    color: var(--cal);
  }
  .summary-unit {
    font-size: var(--font-sm);
    font-weight: 400;
    color: var(--text-3);
  }
  .summary-macros {
    display: flex;
    gap: var(--space-2);
    align-items: baseline;
    font-size: var(--font-base);
  }
  .summary-dot {
    color: var(--text-3);
  }
  .summary-planned {
    display: flex; flex-direction: column; gap: 6px;
    padding-top: var(--space-2);
    border-top: 1px solid var(--border);
  }
  .planned-dots { display: flex; gap: 4px; }
  .planned-dot {
    width: 18px; height: 5px; border-radius: 99px;
    background: var(--border);
    transition: background var(--transition-fast);
  }
  .planned-dot-on { background: var(--text-1); }
  .planned-text { font-size: var(--font-xs); color: var(--text-3); }

  /* ── Template Dock ── */
  .dock {
    border: var(--border-width) solid var(--border);
    border-radius: var(--radius-lg);
    padding: var(--space-4) var(--space-5);
    margin-bottom: var(--space-4);
    background: var(--bg-hover);
  }
  .dock-top {
    margin-bottom: var(--space-5);
  }
  .dock-header {
    display: flex;
    justify-content: space-between;
    gap: var(--space-3);
    margin-bottom: var(--space-3);
  }
  .dock-right-items-wrapper {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }
  .dock-create {
    flex-shrink: 0;
  }
  .dock-label {
    font-size: var(--font-sm);
    font-weight: 600;
    color: var(--text-1);
    white-space: nowrap;
  }
  .dock-toggle {
    width: 28px;
    height: 28px;
    padding: 0;
    color: var(--text-3);
    flex-shrink: 0;
  }
  .dock-handle {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    cursor: grab;
    user-select: none;
    padding: 2px 4px;
    border-radius: var(--radius-sm);
    color: var(--text-3);
    transition: color var(--transition-fast);
  }
  .dock-handle:hover {
    color: var(--text-1);
  }
  .dock-handle:active {
    cursor: grabbing;
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

  
  .dock-search {
    flex: 1;
    display: flex; align-items: center; gap: var(--space-2);
    border: var(--border-width) solid var(--border); border-radius: var(--radius-md);
    background: transparent; padding: 0 var(--space-3);
    transition: border-color var(--transition-fast);
    max-width: 200px;
    min-width: 0;
  }
  .dock-search:focus-within { border-color: var(--border-strong); }
  :global(.dock-search-icon) { color: var(--text-3); flex-shrink: 0; }
  .dock-search-input {
    flex: 1; border: none; background: transparent;
    padding: 6px 0; font-size: var(--font-xs); color: var(--text-1);
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
    display: flex;
    gap: var(--space-3);
    overflow-x: auto;
    overflow-y: hidden;
    padding: 2px 2px var(--space-2);
    margin: -2px -2px 0;
    scroll-snap-type: x proximity;
    scrollbar-width: thin;
  }
  .dock-cards::-webkit-scrollbar { height: 6px; }
  .dock-cards::-webkit-scrollbar-track { background: transparent; }
  .dock-cards::-webkit-scrollbar-thumb {
    background: var(--bg-3);
    border-radius: var(--radius-full);
  }
  .dock-cards::-webkit-scrollbar-thumb:hover { background: var(--text-3); }
  .dock-empty {
    font-size: var(--font-sm);
    color: var(--text-3);
  }
  .dock-link {
    color: var(--text-1);
    text-decoration: underline;
  }
  .dock-link:hover {
    color: var(--text-0);
  }

  /* ── Plan card ── */
  .tpl-card {
    position: relative;
    display: flex; flex-direction: column; gap: var(--space-2);
    padding: var(--space-3) var(--space-4) var(--space-3);
    /* Solid colour that matches the dock's perceived surface (bg-0 + bg-hover blended).
       Pure bg-0 reads as a darker rectangle here because the dock already paints
       bg-hover on top of bg-0; bg-elevated is the rendered equivalent as a solid. */
    background: var(--bg-elevated);
    border: var(--border-width) solid var(--border);
    border-radius: var(--radius-md);
    cursor: grab;
    user-select: none;
    width: 210px;
    flex-shrink: 0;
    scroll-snap-align: start;
    overflow: hidden;
    transition: border-color var(--transition-fast), background var(--transition-fast),
                transform var(--transition-fast), box-shadow var(--transition-fast);
  }
  /* Subtle accent stripe along the left edge — appears on hover/select */
  .tpl-card::before {
    content: '';
    position: absolute; left: 0; top: 0; bottom: 0;
    width: 3px;
    background: var(--text-2);
    opacity: 0;
    transition: opacity var(--transition-fast);
  }
  .tpl-card:hover {
    border-color: var(--border-strong);
    background: var(--bg-hover);
  }
  .tpl-card:hover::before { opacity: 0.7; }
  .tpl-card:active {
    cursor: grabbing;
    transform: scale(0.99);
  }
  .tpl-selected {
    border-color: var(--text-0);
    background: var(--bg-hover);
  }
  .tpl-selected::before { opacity: 1; background: var(--text-0); }

  .tpl-head {
    display: flex; align-items: flex-start; justify-content: space-between; gap: var(--space-2);
  }
  .tpl-name {
    font-size: var(--font-sm); font-weight: 600; color: var(--text-0);
    letter-spacing: -0.01em;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    flex: 1; min-width: 0;
  }
  .tpl-del {
    background: none; border: none; color: var(--text-3);
    cursor: pointer; display: flex; padding: 2px;
    border-radius: var(--radius-sm); flex-shrink: 0;
    opacity: 0;
    transition: opacity var(--transition-fast), color var(--transition-fast), background var(--transition-fast);
  }
  .tpl-card:hover .tpl-del { opacity: 1; }
  .tpl-del:hover { color: var(--danger); background: var(--danger-bg); }

  /* Hero kcal */
  .tpl-cal-row { display: flex; align-items: baseline; gap: 4px; }
  .tpl-cal-num {
    font-size: var(--font-xl); font-weight: 700; color: var(--cal);
    letter-spacing: -0.03em; line-height: 1;
  }
  .tpl-cal-unit {
    font-size: 10px; font-weight: 500; color: var(--text-3);
    letter-spacing: 0.02em; text-transform: uppercase;
  }

  .tpl-macros {
    display: flex; gap: 5px; align-items: baseline;
    font-size: var(--font-xs);
  }
  .t-m { transition: color var(--transition-fast); }
  .t-m[data-k="p"] { color: var(--pro); opacity: 0.85; }
  .t-m[data-k="c"] { color: var(--carb); opacity: 0.85; }
  .t-m[data-k="f"] { color: var(--fat); opacity: 0.85; }
  .tpl-card:hover .t-m { opacity: 1; }
  .t-sep { color: var(--text-3); opacity: 0.5; }

  .tpl-foot {
    display: flex; justify-content: space-between; align-items: center;
    padding-top: 6px;
    border-top: 1px solid var(--border);
  }
  /* Slot indicators — filled = highlighted, empty = muted */
  .tpl-slots { display: inline-flex; gap: 3px; }
  .tpl-slot {
    display: inline-flex; align-items: center; justify-content: center;
    width: 16px; height: 16px;
    background: transparent;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    font-size: 9px; font-weight: 700; letter-spacing: 0;
    color: var(--text-3);
    transition: all var(--transition-fast);
  }
  .tpl-slot-on {
    background: var(--bg-active);
    border-color: var(--text-2);
    color: var(--text-0);
  }
  .tpl-card:hover .tpl-slot-on { background: var(--text-0); color: var(--bg-0); border-color: var(--text-0); }

  .tpl-count {
    font-size: 10px; color: var(--text-3); font-weight: 500;
    letter-spacing: 0.02em;
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
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--text-0);
    display: inline-block;
    margin-left: var(--space-1);
  }

  /* ── Per-day macros ── */
  .day-macros {
    display: flex; align-items: center; gap: 4px;
    margin-bottom: var(--space-2);
    font-size: 10.5px; color: var(--text-3);
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
  .day-action-btn {
    background: none;
    border: none;
    font-size: var(--font-xs);
    color: var(--text-2);
    cursor: pointer;
    font-family: var(--font-sans);
    display: flex;
    align-items: center;
    gap: 3px;
    transition: color var(--transition-fast);
  }
  .day-action-btn:hover {
    color: var(--text-0);
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

  @media (max-width: 1024px) {
    .week-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }
  @media (max-width: 640px) {
    .week-grid {
      grid-template-columns: 1fr;
    }
    .top-bar {
      flex-direction: column;
      gap: var(--space-3);
    }
  }
</style>
