<script>
  import { dayTemplateStore } from '$lib/stores/dayTemplates.js';
  import { foodStore } from '$lib/stores/foods.js';
  import { mealStore } from '$lib/stores/meals.js';
  import { plannerStore } from '$lib/stores/planner.js';
  import { onMount } from 'svelte';
  import { Trash2, ChevronRight, Search, CalendarCheck, Pencil, X, Check, AlertTriangle } from 'lucide-svelte';

  let loading = $state(true);
  let searchQuery = $state('');

  // Modal
  let confirmModal = $state({ open: false, template: null, hasExisting: false });
  let confirmLoading = $state(false);

  // Toast
  let toast = $state({ visible: false, message: '', type: 'success' });
  let toastTimeout = null;

  const slotLabels = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snack: 'Snack' };
  const slotOrder = ['breakfast', 'lunch', 'dinner', 'snack'];

  onMount(async () => {
    loading = true;
    await Promise.all([
      foodStore.load({ limit: 200 }),
      mealStore.load(),
      dayTemplateStore.load(),
    ]);
    loading = false;
  });

  async function deleteTemplate(id) {
    if (!confirm('Delete this day plan?')) return;
    await dayTemplateStore.remove(id);
  }

  function getName(item) {
    if (item.type === 'food') return $foodStore.foods.find(f => f._id === item.refId)?.name || '?';
    return $mealStore.meals.find(m => m._id === item.refId)?.name || '?';
  }

  function getTotalFoods(template) {
    return (template.meals || []).reduce((sum, m) => sum + (m.items?.length || 0), 0);
  }

  function getFilledSlots(template) {
    return (template.meals || []).filter(m => m.items?.length > 0).length;
  }

  const filteredTemplates = $derived.by(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return $dayTemplateStore.templates;
    return $dayTemplateStore.templates.filter(t => {
      if (t.name.toLowerCase().includes(q)) return true;
      for (const meal of t.meals || []) {
        for (const item of meal.items || []) {
          if (getName(item).toLowerCase().includes(q)) return true;
        }
      }
      return false;
    });
  });

  // Use Today
  async function openUseToday(template) {
    confirmLoading = true;
    confirmModal = { open: true, template, hasExisting: false };
    try {
      const today = getTodayDate();
      await plannerStore.loadDaily(today);
      const plan = $plannerStore.dailyPlan;
      const hasItems = plan?.meals?.some(m => m.items?.length > 0);
      confirmModal = { open: true, template, hasExisting: !!hasItems };
    } catch {
      confirmModal = { open: true, template, hasExisting: false };
    }
    confirmLoading = false;
  }

  function closeModal() {
    confirmModal = { open: false, template: null, hasExisting: false };
  }

  async function confirmUseToday() {
    const { template } = confirmModal;
    if (!template) return;
    confirmLoading = true;
    try {
      const today = getTodayDate();
      const meals = slotOrder
        .map(slot => {
          const m = (template.meals || []).find(m => m.slot === slot);
          return {
            slot,
            items: (m?.items || []).map(i => ({ type: i.type, refId: i.refId, quantity: i.quantity })),
          };
        })
        .filter(m => m.items.length > 0);
      await plannerStore.saveDaily(today, meals);
      closeModal();
      showToast('Day plan applied to today', 'success');
    } catch (err) {
      closeModal();
      showToast('Failed to apply: ' + err.message, 'error');
    }
    confirmLoading = false;
  }

  function getTodayDate() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  function showToast(message, type = 'success') {
    if (toastTimeout) clearTimeout(toastTimeout);
    toast = { visible: true, message, type };
    toastTimeout = setTimeout(() => (toast = { ...toast, visible: false }), 3500);
  }
</script>

<svelte:head><title>Day Plans — MacroX</title></svelte:head>

<div class="page-container">
  <div class="top-bar animate-slide-up">
    <div>
      <h1 class="page-title">Day Plans</h1>
      <p class="page-subtitle">Your saved full-day meal plans</p>
    </div>
    <a href="/day" class="btn btn-secondary btn-sm">Create in My Day <ChevronRight size={14} /></a>
  </div>

  {#if loading}
    <div class="skeleton" style="height: 44px; max-width: 320px; margin-bottom: var(--space-5);"></div>
    <div class="grid-sk">
      {#each [1,2,3] as _}
        <div class="skeleton" style="height: 300px;"></div>
      {/each}
    </div>
  {:else if $dayTemplateStore.templates.length === 0}
    <div class="empty-state">
      <p class="empty-state-text">No day plans yet. <a href="/day" class="empty-link">Create one from My Day</a></p>
    </div>
  {:else}
    <!-- Search -->
    <div class="search-box animate-slide-up stagger-1">
      <Search size={14} strokeWidth={1.5} />
      <input
        class="search-input"
        type="text"
        placeholder="Search by name or food…"
        bind:value={searchQuery}
      />
      {#if searchQuery}
        <button class="search-clear" onclick={() => searchQuery = ''} aria-label="Clear search">
          <X size={13} />
        </button>
      {/if}
    </div>

    {#if filteredTemplates.length === 0}
      <div class="empty-state">
        <p class="empty-state-text">No day plans match "{searchQuery}"</p>
      </div>
    {:else}
      <div class="grid animate-slide-up stagger-2">
        {#each filteredTemplates as t, idx}
          <div class="card" style="animation-delay: {idx * 25}ms">
            <!-- Header -->
            <div class="card-head">
              <div class="card-title-row">
                <span class="card-name">{t.name}</span>
                <button class="card-del" onclick={() => deleteTemplate(t._id)} aria-label="Delete">
                  <Trash2 size={13} strokeWidth={1.5} />
                </button>
              </div>
              <div class="card-meta">
                <span class="badge">{getTotalFoods(t)} foods</span>
                <span class="badge">{getFilledSlots(t)} meals</span>
              </div>
            </div>

            <!-- Macros -->
            <div class="card-macros">
              <div class="macro">
                <span class="macro-val mono" style="color: var(--cal)">{Math.round(t.totalMacros?.calories || 0)}</span>
                <span class="macro-lbl">kcal</span>
              </div>
              <div class="macro">
                <span class="macro-val mono" style="color: var(--pro)">{Math.round(t.totalMacros?.protein || 0)}</span>
                <span class="macro-lbl">protein</span>
              </div>
              <div class="macro">
                <span class="macro-val mono" style="color: var(--carb)">{Math.round(t.totalMacros?.netCarbs || 0)}</span>
                <span class="macro-lbl">carbs</span>
              </div>
              <div class="macro">
                <span class="macro-val mono" style="color: var(--fat)">{Math.round(t.totalMacros?.fat || 0)}</span>
                <span class="macro-lbl">fat</span>
              </div>
            </div>

            <!-- Slot breakdown -->
            <div class="card-slots">
              {#each slotOrder as slot}
                {#each (t.meals || []).filter(m => m.slot === slot && m.items?.length > 0) as meal}
                  <div class="slot-row">
                    <span class="slot-label">{slotLabels[slot]}</span>
                    <span class="slot-foods">{meal.items.map(i => getName(i)).join(', ')}</span>
                  </div>
                {/each}
              {/each}
            </div>

            <!-- Actions -->
            <div class="card-actions">
              <button class="btn btn-primary btn-sm card-action-btn" onclick={() => openUseToday(t)}>
                <CalendarCheck size={13} strokeWidth={1.5} />Use Today
              </button>
              <button class="btn btn-ghost btn-sm card-action-btn" disabled>
                <Pencil size={13} strokeWidth={1.5} />Edit
              </button>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  {/if}
</div>

<!-- Confirmation Modal -->
{#if confirmModal.open}
  <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
  <div class="modal-overlay" onclick={closeModal}>
    <div class="modal-content" onclick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
      {#if confirmLoading}
        <div class="modal-spinner-wrap">
          <div class="modal-spinner"></div>
          <p class="modal-spinner-text">Checking today's plan…</p>
        </div>
      {:else}
        <div class="modal-head">
          <h2 class="modal-title">Apply to Today</h2>
          <button class="btn btn-ghost btn-sm" onclick={closeModal}><X size={14} /></button>
        </div>

        <p class="modal-body">
          Apply "<strong>{confirmModal.template?.name}</strong>" as today's meal plan?
        </p>

        {#if confirmModal.hasExisting}
          <div class="modal-warn">
            <AlertTriangle size={14} strokeWidth={1.5} />
            <span>Today already has a saved plan. This will <strong>replace</strong> it.</span>
          </div>
        {/if}

        <div class="modal-actions">
          <button class="btn btn-ghost" onclick={closeModal}>Cancel</button>
          <button
            class="btn {confirmModal.hasExisting ? 'btn-danger' : 'btn-primary'}"
            onclick={confirmUseToday}
            disabled={confirmLoading}
          >
            {confirmModal.hasExisting ? 'Replace & Apply' : 'Apply'}
          </button>
        </div>
      {/if}
    </div>
  </div>
{/if}

<!-- Toast -->
{#if toast.visible}
  <div class="toast-container">
    <div class="toast toast-{toast.type}" role="alert">
      {#if toast.type === 'success'}
        <Check size={14} strokeWidth={2} />
      {:else}
        <AlertTriangle size={14} strokeWidth={1.5} />
      {/if}
      <span>{toast.message}</span>
    </div>
  </div>
{/if}

<style>
  /* ── Layout ── */
  .top-bar { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--space-5); }
  .empty-link { color: var(--text-1); text-decoration: underline; }
  .empty-link:hover { color: var(--text-0); }

  .grid-sk { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: var(--space-4); }

  /* ── Search ── */
  .search-box {
    display: flex; align-items: center; gap: var(--space-2);
    border: var(--border-width) solid var(--border); border-radius: var(--radius-md);
    padding: 0 var(--space-3); max-width: 320px; color: var(--text-3);
    margin-bottom: var(--space-5); transition: border-color var(--transition-fast);
  }
  .search-box:focus-within { border-color: var(--text-2); }
  .search-input {
    background: none; border: none; color: var(--text-0); font-family: var(--font-sans);
    font-size: var(--font-sm); padding: 8px 0; width: 100%; outline: none;
  }
  .search-input::placeholder { color: var(--text-3); }
  .search-clear {
    background: none; border: none; color: var(--text-3); cursor: pointer;
    display: flex; padding: 2px; border-radius: var(--radius-sm);
  }
  .search-clear:hover { color: var(--text-1); }

  /* ── Grid ── */
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: var(--space-4); }

  /* ── Card ── */
  .card {
    border: var(--border-width) solid var(--border); border-radius: var(--radius-lg);
    padding: var(--space-5); display: flex; flex-direction: column;
    transition: border-color var(--transition-fast);
    animation: slideUp 200ms ease both;
  }
  .card:hover { border-color: var(--border-strong); }

  .card-head { margin-bottom: var(--space-4); }
  .card-title-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--space-2); }
  .card-name { font-size: var(--font-lg); font-weight: 600; letter-spacing: -0.02em; }
  .card-del {
    background: none; border: none; color: var(--text-3); cursor: pointer;
    padding: var(--space-1); border-radius: var(--radius-sm);
    transition: all var(--transition-fast); opacity: 0; display: flex;
  }
  .card:hover .card-del { opacity: 1; }
  .card-del:hover { color: var(--danger); background: var(--danger-bg); }

  .card-meta { display: flex; gap: var(--space-2); }

  /* ── Macros ── */
  .card-macros {
    display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--space-2);
    padding: var(--space-3); margin-bottom: var(--space-4);
    border: var(--border-width) solid var(--border); border-radius: var(--radius-md);
  }
  .macro { text-align: center; }
  .macro-val { font-size: var(--font-base); font-weight: 600; display: block; }
  .macro-lbl { font-size: var(--font-xs); color: var(--text-3); }

  /* ── Slots ── */
  .card-slots { display: flex; flex-direction: column; gap: var(--space-2); flex: 1; margin-bottom: var(--space-4); }
  .slot-row { display: flex; gap: var(--space-3); align-items: baseline; }
  .slot-label { font-size: var(--font-xs); font-weight: 600; color: var(--text-2); min-width: 68px; flex-shrink: 0; }
  .slot-foods {
    font-size: var(--font-sm); color: var(--text-1); line-height: 1.5;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }

  /* ── Card Actions ── */
  .card-actions {
    display: flex; gap: var(--space-2); margin-top: auto;
    padding-top: var(--space-4); border-top: var(--border-width) solid var(--border);
  }
  .card-action-btn { flex: 1; }
  .card-action-btn:disabled { opacity: 0.4; cursor: not-allowed; }

  /* ── Modal (uses global .modal-overlay / .modal-content) ── */
  .modal-spinner-wrap { display: flex; flex-direction: column; align-items: center; gap: var(--space-4); padding: var(--space-8) 0; }
  .modal-spinner {
    width: 22px; height: 22px; border: 2px solid var(--border);
    border-top-color: var(--text-1); border-radius: 50%;
    animation: spin 600ms linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  .modal-spinner-text { font-size: var(--font-sm); color: var(--text-3); }

  .modal-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-5); }
  .modal-title { font-size: var(--font-lg); font-weight: 600; }
  .modal-body { font-size: var(--font-sm); color: var(--text-2); margin-bottom: var(--space-4); line-height: 1.6; }

  .modal-warn {
    display: flex; align-items: flex-start; gap: var(--space-3);
    padding: var(--space-3) var(--space-4);
    background: var(--danger-bg); border: var(--border-width) solid rgba(201, 112, 112, 0.15);
    border-radius: var(--radius-md); font-size: var(--font-sm); color: var(--text-1);
    line-height: 1.5; margin-bottom: var(--space-5);
  }
  .modal-warn :global(svg) { flex-shrink: 0; margin-top: 2px; color: var(--danger); }

  .modal-actions { display: flex; gap: var(--space-3); justify-content: flex-end; }

  /* ── Toast (uses global .toast-container) ── */
  .toast {
    display: flex; align-items: center; gap: var(--space-3);
    padding: var(--space-3) var(--space-5); border-radius: var(--radius-md);
    font-size: var(--font-sm); font-weight: 500;
    border: var(--border-width) solid var(--border);
    background: var(--bg-modal);
    box-shadow: 0 4px 16px rgba(0,0,0,0.15);
    animation: slideUp 200ms ease both;
  }
  .toast-success { color: var(--success); border-color: var(--success); }
  .toast-error   { color: var(--danger);  border-color: var(--danger); }

  @media (max-width: 640px) {
    .top-bar { flex-direction: column; gap: var(--space-3); }
    .grid, .grid-sk { grid-template-columns: 1fr; }
    .search-box { max-width: 100%; }
  }
</style>
