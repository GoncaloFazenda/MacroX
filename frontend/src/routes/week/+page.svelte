<script>
  import { foodStore } from "$lib/stores/foods.js";
  import { mealStore } from "$lib/stores/meals.js";
  import { plannerStore } from "$lib/stores/planner.js";
  import { dayTemplateStore } from "$lib/stores/dayTemplates.js";
  import { onMount, flushSync } from "svelte";
  import { Search, X as XIcon } from "lucide-svelte";
  import { getWeekStart, getDayNames, formatDate } from "$lib/utils/macros.js";
  import {
    ChevronLeft,
    ChevronRight,
    X,
    GripVertical,
    Plus,
    ChevronUp,
    ChevronDown,
  } from "lucide-svelte";
  import { dndzone } from "svelte-dnd-action";
  import { flip } from "svelte/animate";

  const FLIP_MS = 150;
  const DOCK_ZONE = "weekly-dock-zone";
  const DOCK_ITEM_ID = "dock-container";

  let weekStart = $state(getWeekStart());
  let saving = $state(false);
  let saved = $state(false);
  let nextId = 1;
  const initialDockPos =
    typeof window !== "undefined"
      ? localStorage.getItem("macrox-dock-pos") || "bottom"
      : "bottom";
  let dockPosition = $state(initialDockPos);
  let draggingTemplate = $state(null);
  let hoverDay = $state(-1);
  let selectedTemplate = $state(null);
  let hoverPreview = $state(null);
  let dockSearch = $state('');

  const filteredDockTemplates = $derived.by(() => {
    const q = dockSearch.trim().toLowerCase();
    if (!q) return $dayTemplateStore.templates;
    return $dayTemplateStore.templates.filter(t => {
      if (t.name.toLowerCase().includes(q)) return true;
      for (const meal of t.meals || []) {
        for (const item of meal.items || []) {
          const name = item.type === 'food'
            ? $foodStore.foods.find(f => f._id === item.refId)?.name || ''
            : $mealStore.meals.find(m => m._id === item.refId)?.name || '';
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
  const slotOrder = ["breakfast", "lunch", "dinner", "snack"];

  let days = $state(
    Array.from({ length: 7 }, (_, i) => ({
      dayOfWeek: i,
      meals: { breakfast: [], lunch: [], dinner: [], snack: [] },
      templateName: null,
    })),
  );
  const dayNames = getDayNames();

  onMount(async () => {
    await Promise.all([
      foodStore.load({ limit: 200 }),
      mealStore.load(),
      dayTemplateStore.load(),
    ]);
    await loadPlan();
  });

  async function loadPlan() {
    await plannerStore.loadWeekly(weekStart);
    const plan = $plannerStore.weeklyPlan;
    if (plan?.days) {
      days = Array.from({ length: 7 }, (_, i) => {
        const dayData = plan.days.find((d) => d.dayOfWeek === i);
        if (!dayData)
          return {
            dayOfWeek: i,
            meals: { breakfast: [], lunch: [], dinner: [], snack: [] },
            templateName: null,
          };
        const meals = { breakfast: [], lunch: [], dinner: [], snack: [] };
        for (const meal of dayData.meals || []) {
          if (meals[meal.slot]) {
            meals[meal.slot] = meal.items.map((item) => ({
              id: nextId++,
              type: item.type,
              refId: item.refId,
              quantity: item.quantity,
              name: getName(item),
              cal: getCal(item),
            }));
          }
        }
        return { dayOfWeek: i, meals, templateName: null };
      });
    } else {
      days = Array.from({ length: 7 }, (_, i) => ({
        dayOfWeek: i,
        meals: { breakfast: [], lunch: [], dinner: [], snack: [] },
        templateName: null,
      }));
    }
  }

  function getName(item) {
    if (item.type === "food")
      return $foodStore.foods.find((f) => f._id === item.refId)?.name || "?";
    return $mealStore.meals.find((m) => m._id === item.refId)?.name || "?";
  }
  function getCal(item) {
    const mult = item.quantity / 100;
    if (item.type === "food") {
      const f = $foodStore.foods.find((f) => f._id === item.refId);
      return Math.round((f?.calories || 0) * mult);
    }
    const m = $mealStore.meals.find((m) => m._id === item.refId);
    return Math.round((m?.totalMacros?.calories || 0) * mult);
  }

  function dayTotal(meals) {
    return Object.values(meals)
      .flat()
      .reduce((s, i) => s + (i.cal || 0), 0);
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
            ? $foodStore.foods.find((f) => f._id === i.refId)
            : $mealStore.meals.find((m) => m._id === i.refId);
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
        }));
      }
    }
    days[di] = { ...days[di], meals, templateName: template.name };
    days = [...days];
  }

  function removeItem(di, slot, id) {
    days[di].meals[slot] = days[di].meals[slot].filter((i) => i.id !== id);
    days = [...days];
  }

  function clearDay(di) {
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
      const hasItems = Object.values(days[di].meals).flat().length > 0;
      if (hasItems) {
        if (
          !confirm(
            `Replace ${dayNames[di]}'s meals with "${draggingTemplate.name}"?`,
          )
        ) {
          draggingTemplate = null;
          hoverDay = -1;
          return;
        }
      }
      applyTemplate(di, draggingTemplate);
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
    if (!selectedTemplate) return;
    const hasItems = Object.values(days[di].meals).flat().length > 0;
    if (
      hasItems &&
      !confirm(
        `Replace ${dayNames[di]}'s meals with "${selectedTemplate.name}"?`,
      )
    )
      return;
    applyTemplate(di, selectedTemplate);
    selectedTemplate = null;
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
      setTimeout(() => (saved = false), 2000);
    } catch (err) {
      alert("Save failed: " + err.message);
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
</script>

<svelte:head><title>Weekly Planner — MacroX</title></svelte:head>

<div class="page-container">
  <div class="top-bar animate-slide-up">
    <div>
      <h1 class="page-title">Weekly Planner</h1>
      <p class="page-subtitle">Plan your week</p>
    </div>
    <div class="top-right">
      <div class="week-nav">
        <button class="btn btn-ghost btn-sm" onclick={prevWeek}
          ><ChevronLeft size={16} /></button
        >
        <span class="week-label"
          >Week of {new Date(weekStart + "T00:00").toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}</span
        >
        <button class="btn btn-ghost btn-sm" onclick={nextWeek}
          ><ChevronRight size={16} /></button
        >
      </div>
      <div class="top-actions">
        {#if saved}<span class="saved-msg">Saved</span>{/if}
        <button class="btn btn-primary" onclick={savePlan} disabled={saving}
          >{saving ? "Saving…" : "Save"}</button
        >
      </div>
    </div>
  </div>

  {#if selectedTemplate}
    <div class="select-hint animate-fade-in">
      Click a day to apply "<strong>{selectedTemplate.name}</strong>" ·
      <button class="btn-link" onclick={() => (selectedTemplate = null)}
        >Cancel</button
      >
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
      <span class="summary-cal mono"
        >{weekTotals.cal.toLocaleString()}<span class="summary-unit">
          kcal</span
        ></span
      >
      <div class="summary-macros">
        <span class="mono" style="color: var(--pro)">{weekTotals.pro}p</span>
        <span class="summary-dot">·</span>
        <span class="mono" style="color: var(--carb)">{weekTotals.carb}c</span>
        <span class="summary-dot">·</span>
        <span class="mono" style="color: var(--fat)">{weekTotals.fat}f</span>
      </div>
      <span class="summary-planned">{weekTotals.planned} of 7 days planned</span
      >
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
  <div
    class="day-col"
    class:day-col-drop={draggingTemplate && hoverDay === i}
    class:day-col-target={draggingTemplate && hoverDay !== i}
    class:day-col-selectable={selectedTemplate}
    ondragover={(e) => onDayDragOver(e, i)}
    ondragleave={() => onDayDragLeave(i)}
    ondrop={(e) => onDayDrop(e, i)}
    onclick={() => handleDayClick(i)}
    role={selectedTemplate ? "button" : undefined}
    tabindex={selectedTemplate ? 0 : undefined}
  >
    <div class="day-head">
      <div class="day-head-left">
        <span class="day-name">{dayNames[i]}</span>
        <span class="day-num">{getDateNum(i)}</span>
      </div>
      <span class="day-kcal mono">{dayTotal(days[i].meals)}</span>
    </div>

    {#if days[i].templateName}
      <div class="template-badge">{days[i].templateName}</div>
    {/if}

    {#if draggingTemplate && hoverDay === i}
      <div class="drop-overlay">
        <span class="drop-text">Drop template here</span>
      </div>
    {:else if draggingTemplate && hoverDay !== i}
      <div class="drop-hint">
        <span class="drop-hint-text">Drop here</span>
      </div>
    {:else}
      <div class="day-meals">
        {#each slotOrder as slot}
          {#if days[i].meals[slot].length > 0}
            <div class="meal-group">
              <span class="meal-slot-label">{slotLabels[slot]}</span>
              {#each days[i].meals[slot] as item}
                <div class="day-item">
                  <span class="di-name">{item.name}</span>
                  <button
                    class="di-rm"
                    onclick={(e) => {
                      e.stopPropagation();
                      removeItem(i, slot, item.id);
                    }}><X size={10} strokeWidth={1.5} /></button
                  >
                </div>
              {/each}
            </div>
          {/if}
        {/each}
        {#if Object.values(days[i].meals).flat().length === 0}
          <a href="/day?date={getDateStr(i)}" class="day-add-link" onclick={(e) => e.stopPropagation()}>
            <Plus size={20} strokeWidth={1.5} />
          </a>
        {/if}
      </div>
    {/if}

    {#if Object.values(days[i].meals).flat().length > 0 && !draggingTemplate}
      <div class="day-bottom-actions">
        <a href="/day?date={getDateStr(i)}" class="day-edit" onclick={(e) => e.stopPropagation()}>Edit</a>
        <button
          class="day-clear"
          onclick={(e) => {
            e.stopPropagation();
            clearDay(i);
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
      <div class="dock-actions">
        <a href="/day" class="btn btn-secondary btn-sm"
          ><Plus size={14} strokeWidth={1.5} />Add in My Day</a
        >
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
    <!-- Dock search -->
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
    <div class="dock-cards">
      {#if $dayTemplateStore.templates.length === 0}
        <p class="dock-empty">
          No day plans yet. <a href="/day" class="dock-link"
            >Create one in My Day</a
          >
        </p>
      {:else if filteredDockTemplates.length === 0}
        <p class="dock-empty">No plans match "<strong>{dockSearch}</strong>"</p>
      {:else}
        {#each filteredDockTemplates as template}
          <div
            class="tpl-card"
            class:tpl-selected={selectedTemplate?._id === template._id}
            draggable="true"
            ondragstart={(e) => {
              e.stopPropagation();
              onDragStart(e, template);
            }}
            ondragend={onDragEnd}
            onpointerdown={(e) => e.stopPropagation()}
            onmousedown={(e) => e.stopPropagation()}
            ontouchstart={(e) => e.stopPropagation()}
            onclick={() => handleTemplateClick(template)}
            onmouseenter={() => (hoverPreview = template._id)}
            onmouseleave={() => (hoverPreview = null)}
            role="button"
            tabindex="0"
          >
            <div class="tpl-grip">
              <GripVertical size={13} strokeWidth={1.5} />
            </div>
            <div class="tpl-info">
              <span class="tpl-name">{template.name}</span>
              <div class="tpl-macros">
                <span class="mono" style="color: var(--cal)"
                  >{Math.round(template.totalMacros?.calories || 0)} kcal</span
                >
                <span class="tpl-sep">·</span>
                <span class="mono" style="color: var(--pro)"
                  >{Math.round(template.totalMacros?.protein || 0)}p</span
                >
                <span class="tpl-sep">·</span>
                <span class="mono" style="color: var(--carb)"
                  >{Math.round(template.totalMacros?.netCarbs || 0)}c</span
                >
                <span class="tpl-sep">·</span>
                <span class="mono" style="color: var(--fat)"
                  >{Math.round(template.totalMacros?.fat || 0)}f</span
                >
              </div>
            </div>
            <button
              class="tpl-del"
              onclick={(e) => {
                e.stopPropagation();
                if (confirm("Delete this day plan?"))
                  dayTemplateStore.remove(template._id);
              }}
              aria-label="Delete template"
              ><X size={12} strokeWidth={1.5} /></button
            >
            {#if hoverPreview === template._id}
              <div class="tpl-preview">
                {getTemplatePreviewText(template) || "No items"}
              </div>
            {/if}
          </div>
        {/each}
      {/if}
    </div>
  </div>
{/snippet}

<style>
  .top-bar {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: var(--space-6);
  }
  .top-right {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: var(--space-2);
  }
  .top-actions {
    display: flex;
    gap: var(--space-2);
    align-items: center;
  }
  .saved-msg {
    font-size: var(--font-sm);
    color: var(--success);
    font-weight: 500;
  }
  .week-nav {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }
  .week-label {
    font-size: var(--font-base);
    font-weight: 500;
    min-width: 160px;
    text-align: center;
  }

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
    position: relative;
    transition: all var(--transition-base);
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
    align-items: baseline;
    margin-bottom: var(--space-3);
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
  .day-kcal {
    font-size: var(--font-sm);
    color: var(--cal);
    font-weight: 500;
  }

  .template-badge {
    font-size: var(--font-xs);
    padding: 2px 8px;
    border-radius: var(--radius-sm);
    background: var(--accent-subtle);
    color: var(--text-2);
    font-weight: 500;
    align-self: flex-start;
    margin-bottom: var(--space-3);
    letter-spacing: 0.02em;
  }

  .drop-overlay {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    border: var(--border-width) dashed var(--text-1);
    border-radius: var(--radius-md);
  }
  .drop-text {
    font-size: var(--font-sm);
    color: var(--text-1);
    font-weight: 500;
  }
  .drop-hint {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    border: var(--border-width) dashed var(--border);
    border-radius: var(--radius-md);
  }
  .drop-hint-text {
    font-size: var(--font-sm);
    color: var(--text-3);
  }

  /* ── Meal Groups ── */
  .day-meals {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    flex: 1;
  }
  .meal-group {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .meal-slot-label {
    font-size: var(--font-xs);
    font-weight: 600;
    color: var(--text-2);
    letter-spacing: 0.03em;
    padding-bottom: 3px;
    margin-bottom: 3px;
    border-bottom: var(--border-width) solid var(--border);
  }
  .day-item {
    padding: 3px 2px;
    background: transparent;
    border-radius: 0;
    font-size: var(--font-sm);
    display: flex;
    align-items: center;
    gap: var(--space-1);
    color: var(--text-1);
  }
  .day-item:hover {
    color: var(--text-0);
  }
  .di-name {
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .di-rm {
    background: none;
    border: none;
    color: var(--text-3);
    cursor: pointer;
    display: flex;
    padding: 0;
    opacity: 0;
  }
  .day-item:hover .di-rm {
    opacity: 1;
  }
  .di-rm:hover {
    color: var(--danger);
  }
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
    font-size: var(--font-sm);
    color: var(--text-3);
  }

  /* ── Template Dock ── */
  .dock {
    border: var(--border-width) solid var(--border);
    border-radius: var(--radius-lg);
    padding: var(--space-4) var(--space-5);
    margin-bottom: var(--space-4);
  }
  .dock-top {
    margin-bottom: var(--space-5);
  }
  .dock-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--space-3);
  }
  .dock-label {
    font-size: var(--font-sm);
    font-weight: 600;
    color: var(--text-1);
  }
  .dock-actions {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }
  .dock-toggle {
    width: 28px;
    height: 28px;
    padding: 0;
    color: var(--text-3);
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
    display: flex; align-items: center; gap: var(--space-2);
    border: var(--border-width) solid var(--border); border-radius: var(--radius-md);
    background: var(--bg-0); padding: 0 var(--space-3);
    margin-bottom: var(--space-3);
    transition: border-color var(--transition-fast);
  }
  .dock-search:focus-within { border-color: var(--border-strong); }
  :global(.dock-search-icon) { color: var(--text-3); flex-shrink: 0; }
  .dock-search-input {
    flex: 1; border: none; background: transparent;
    padding: 7px 0; font-size: var(--font-xs); color: var(--text-1);
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
    flex-wrap: wrap;
  }
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

  .tpl-card {
    position: relative;
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-3) var(--space-4);
    border: var(--border-width) solid var(--border);
    border-radius: var(--radius-md);
    cursor: grab;
    user-select: none;
    min-width: 220px;
    transition: all var(--transition-fast);
    background: transparent;
  }
  .tpl-card:hover {
    border-color: var(--border-strong);
    background: var(--bg-hover);
  }
  .tpl-card:active {
    cursor: grabbing;
  }
  .tpl-selected {
    border-color: var(--text-2);
    background: var(--accent-subtle);
  }
  .tpl-grip {
    color: var(--text-3);
    opacity: 0.3;
    flex-shrink: 0;
    display: flex;
  }
  .tpl-card:hover .tpl-grip {
    opacity: 0.7;
  }
  .tpl-info {
    flex: 1;
    min-width: 0;
  }
  .tpl-name {
    font-size: var(--font-base);
    font-weight: 500;
    display: block;
    margin-bottom: 2px;
  }
  .tpl-macros {
    display: flex;
    gap: var(--space-2);
    align-items: baseline;
    flex-wrap: wrap;
  }
  .tpl-macros .mono {
    font-size: var(--font-xs);
    opacity: 0.7;
  }
  .tpl-sep {
    font-size: var(--font-xs);
    color: var(--text-3);
  }
  .tpl-del {
    background: none;
    border: none;
    color: var(--text-3);
    cursor: pointer;
    display: flex;
    padding: 3px;
    border-radius: var(--radius-sm);
    opacity: 0;
    transition: all var(--transition-fast);
  }
  .tpl-card:hover .tpl-del {
    opacity: 1;
  }
  .tpl-del:hover {
    color: var(--danger);
    background: var(--danger-bg);
  }

  .tpl-preview {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    margin-top: var(--space-1);
    padding: var(--space-3) var(--space-4);
    background: var(--bg-modal);
    border: var(--border-width) solid var(--border-strong);
    border-radius: var(--radius-md);
    font-size: var(--font-xs);
    color: var(--text-1);
    z-index: 20;
    line-height: 1.6;
    pointer-events: none;
    animation: fadeIn 150ms ease;
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
    .top-right {
      align-items: flex-start;
    }
  }
</style>
