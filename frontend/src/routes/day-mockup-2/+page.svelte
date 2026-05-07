<script>
  import {
    Sunrise, Sun, Moon, Cookie, Search, Plus, X, ChevronLeft, ChevronRight,
    Bookmark, Save, Undo2, Sparkles, Flame, Calendar
  } from 'lucide-svelte';

  const day = {
    label: 'Today',
    weekday: 'Saturday',
    dateLong: 'May 2, 2026',
    cal: 1840,
    pro: 162,
    carb: 138,
    fat: 58,
    goalCal: 2000,
    goalPro: 180,
    goalCarb: 200,
    goalFat: 65,
  };
  const slots = [
    {
      key: 'breakfast', label: 'Breakfast', icon: Sunrise, time: 'Morning',
      items: [
        { name: 'Greek Yogurt + Berries', cal: 280, pro: 22, carb: 28, fat: 8, qty: 250 },
        { name: 'Black Coffee',           cal:   5, pro:  0, carb:  1, fat: 0, qty: 250 },
      ],
    },
    {
      key: 'lunch', label: 'Lunch', icon: Sun, time: 'Midday',
      items: [
        { name: 'Chicken & Rice Bowl',    cal: 620, pro: 55, carb: 62, fat: 14, qty: 350 },
      ],
    },
    {
      key: 'dinner', label: 'Dinner', icon: Moon, time: 'Evening',
      items: [
        { name: 'Salmon + Asparagus',     cal: 540, pro: 48, carb: 12, fat: 28, qty: 280 },
        { name: 'Sweet Potato',           cal: 180, pro:  4, carb: 38, fat:  1, qty: 200 },
      ],
    },
    {
      key: 'snack', label: 'Snack', icon: Cookie, time: 'Anytime',
      items: [
        { name: 'Whey Shake',             cal: 215, pro: 33, carb:  6, fat:  4, qty: 30 },
      ],
    },
  ];
  const slotTotal = (s) => s.items.reduce((a,i)=>a+i.cal, 0);
  const foods = [
    { name: 'Chicken Breast',  cal: 165, pro: 31 },
    { name: 'Brown Rice',      cal: 112, pro:  2.6 },
    { name: 'Salmon Fillet',   cal: 208, pro: 22 },
    { name: 'Sweet Potato',    cal:  86, pro:  1.6 },
    { name: 'Avocado',         cal: 160, pro:  2 },
    { name: 'Greek Yogurt',    cal:  59, pro: 10 },
  ];
  const calPct  = Math.min(100, Math.round(day.cal  / day.goalCal  * 100));
  const proPct  = Math.min(100, Math.round(day.pro  / day.goalPro  * 100));
  const carbPct = Math.min(100, Math.round(day.carb / day.goalCarb * 100));
  const fatPct  = Math.min(100, Math.round(day.fat  / day.goalFat  * 100));
  const proCal  = day.pro  * 4;
  const carbCal = day.carb * 4;
  const fatCal  = day.fat  * 9;
  const macroTotal = proCal + carbCal + fatCal;
  const proSplit  = Math.round(proCal  / macroTotal * 100);
  const carbSplit = Math.round(carbCal / macroTotal * 100);
  const fatSplit  = 100 - proSplit - carbSplit;

  let activeSlot = $state('lunch');
</script>

<svelte:head><title>My Day — Mockup V2 (Timeline Flow)</title></svelte:head>

<div class="page">
  <!-- ── Header strip ── -->
  <header class="head">
    <div class="head-left">
      <span class="head-eyebrow"><Calendar size={11} strokeWidth={1.75} /> Daily Plan</span>
      <h1 class="head-title">My Day</h1>
    </div>
    <nav class="datebar">
      <button class="nav-btn" aria-label="Previous day"><ChevronLeft size={14} strokeWidth={1.75} /></button>
      <div class="date-box">
        <span class="date-pill">Today</span>
        <span class="date-text mono">{day.dateLong}</span>
      </div>
      <button class="nav-btn" aria-label="Next day"><ChevronRight size={14} strokeWidth={1.75} /></button>
    </nav>
    <div class="head-actions">
      <button class="ghost-btn"><Undo2 size={13} strokeWidth={1.5} /> Revert</button>
      <button class="ghost-btn"><Bookmark size={13} strokeWidth={1.5} /> Template</button>
      <button class="primary-btn"><Save size={13} strokeWidth={1.75} /> Save day</button>
    </div>
  </header>

  <!-- ── Goal hero (centered) ── -->
  <section class="goal-card">
    <span class="goal-bar" aria-hidden="true"></span>
    <div class="goal-content">
      <span class="goal-eyebrow">Today's progress</span>
      <div class="goal-hero">
        <span class="goal-pct mono">{calPct}<span class="goal-pct-sym">%</span></span>
        <span class="goal-context"><span class="mono">{day.cal.toLocaleString()}</span> of <span class="mono">{day.goalCal.toLocaleString()}</span> kcal</span>
      </div>
      <div class="goal-bar-track">
        <div class="goal-segs">
          <span class="goal-seg" style="width: {proSplit}%; background: var(--pro)"></span>
          <span class="goal-seg" style="width: {carbSplit}%; background: var(--carb)"></span>
          <span class="goal-seg" style="width: {fatSplit}%; background: var(--fat)"></span>
        </div>
      </div>
      <div class="goal-macros">
        {#each [
          { label: 'Protein', val: day.pro,  goal: day.goalPro,  pct: proPct,  color: 'var(--pro)'  },
          { label: 'Carbs',   val: day.carb, goal: day.goalCarb, pct: carbPct, color: 'var(--carb)' },
          { label: 'Fat',     val: day.fat,  goal: day.goalFat,  pct: fatPct,  color: 'var(--fat)'  },
        ] as m}
          <div class="goal-macro" style="--mc: {m.color}">
            <span class="goal-macro-label">{m.label}</span>
            <div class="goal-macro-row">
              <span class="goal-macro-val mono">{m.val}<small>g</small></span>
              <span class="goal-macro-pct mono">{m.pct}%</span>
            </div>
            <div class="goal-macro-bar"><span style="width: {m.pct}%"></span></div>
          </div>
        {/each}
      </div>
    </div>
  </section>

  <!-- ── Timeline of meals ── -->
  <section class="timeline">
    <span class="timeline-bar" aria-hidden="true"></span>
    <div class="timeline-content">
      <header class="timeline-head">
        <h2 class="timeline-title">Today's meals</h2>
        <span class="timeline-count mono">{slots.reduce((a,s)=>a+s.items.length,0)} items</span>
      </header>

      {#each slots as s}
        <article class="meal" class:meal-active={activeSlot === s.key}>
          <div class="meal-marker">
            <span class="meal-dot"><svelte:component this={s.icon} size={14} strokeWidth={1.75} /></span>
          </div>
          <div class="meal-card">
            <header class="meal-head">
              <div class="meal-head-text">
                <span class="meal-eyebrow">{s.time}</span>
                <h3 class="meal-name">{s.label}</h3>
              </div>
              <div class="meal-stats">
                <span class="meal-cal mono">{slotTotal(s)}<small> kcal</small></span>
                <span class="meal-macros mono">
                  <span style="color: var(--pro)">{s.items.reduce((a,i)=>a+i.pro,0)}p</span>
                  <span style="color: var(--carb)">{s.items.reduce((a,i)=>a+i.carb,0)}c</span>
                  <span style="color: var(--fat)">{s.items.reduce((a,i)=>a+i.fat,0)}f</span>
                </span>
              </div>
            </header>
            <div class="meal-items">
              {#each s.items as it}
                <div class="meal-item">
                  <span class="meal-item-name">{it.name}</span>
                  <span class="meal-item-qty mono">{it.qty}<small>g</small></span>
                  <span class="meal-item-cal mono">{it.cal}<small> kcal</small></span>
                  <button class="meal-item-rm" aria-label="Remove"><X size={11} strokeWidth={2} /></button>
                </div>
              {/each}
            </div>

            {#if activeSlot === s.key}
              <!-- Inline contextual food picker for the active meal -->
              <div class="picker">
                <div class="picker-search">
                  <Search size={12} strokeWidth={1.75} />
                  <input type="text" placeholder="Search foods to add to {s.label}…" />
                </div>
                <div class="picker-grid">
                  {#each foods as f}
                    <button class="picker-card">
                      <span class="picker-name">{f.name}</span>
                      <span class="picker-meta mono"><span class="picker-cal">{f.cal}</span> kcal · {f.pro}p</span>
                    </button>
                  {/each}
                </div>
              </div>
            {:else}
              <button class="meal-add" onclick={() => (activeSlot = s.key)}>
                <Plus size={12} strokeWidth={1.75} /> Add to {s.label}
              </button>
            {/if}
          </div>
        </article>
      {/each}
    </div>
  </section>
</div>

<style>
  :global(html) { scrollbar-gutter: auto; }
  .page {
    max-width: 920px;
    margin: 0 auto;
    padding: var(--space-6);
    display: flex;
    flex-direction: column;
    gap: var(--space-5);
  }

  /* ── Header ── */
  .head {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    gap: var(--space-4);
  }
  .head-left { display: flex; flex-direction: column; gap: 2px; }
  .head-eyebrow {
    display: inline-flex; align-items: center; gap: 5px;
    font-size: 10px;
    color: var(--text-3);
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }
  .head-title {
    margin: 0;
    font-size: var(--font-2xl);
    font-weight: 700;
    letter-spacing: -0.04em;
    line-height: 1.2;
    background: var(--title-gradient);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    -webkit-text-fill-color: transparent;
    text-shadow: var(--title-shadow);
  }
  .datebar {
    display: flex; align-items: center; gap: 8px;
  }
  .nav-btn {
    width: 30px; height: 30px;
    display: inline-flex; align-items: center; justify-content: center;
    background: transparent;
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    color: var(--text-2);
    cursor: pointer;
    transition: all var(--transition-fast);
  }
  .nav-btn:hover { color: var(--text-0); border-color: var(--border-strong); }
  .date-box {
    display: flex; flex-direction: column;
    align-items: center; gap: 2px;
  }
  .date-pill {
    display: inline-flex;
    padding: 2px 8px;
    background: color-mix(in srgb, #6ec9a8 18%, transparent);
    color: #6ec9a8;
    border-radius: var(--radius-full);
    font-size: 9px; font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  .date-text {
    font-size: 11px; color: var(--text-1); font-weight: 500;
    letter-spacing: -0.01em;
  }

  .head-actions {
    display: flex; align-items: center; gap: 6px;
    justify-self: end;
  }
  .ghost-btn, .primary-btn {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 6px 11px;
    font-size: 11px; font-weight: 600;
    font-family: var(--font-sans);
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: all var(--transition-fast);
  }
  .ghost-btn {
    background: transparent;
    border: 1px solid var(--border);
    color: var(--text-2);
  }
  .ghost-btn:hover { color: var(--text-0); border-color: var(--border-strong); }
  .primary-btn {
    background: var(--text-0);
    color: var(--bg-0);
    border: 1px solid var(--text-0);
  }
  .primary-btn:hover { opacity: 0.9; }

  /* ── Goal hero ── */
  .goal-card {
    position: relative;
    display: flex;
    background: var(--bg-1);
    border-radius: var(--radius-lg);
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.18), 0 1px 2px rgba(0, 0, 0, 0.08);
    overflow: hidden;
  }
  .goal-bar {
    width: 3px;
    background: linear-gradient(180deg, var(--cal), transparent);
    flex-shrink: 0;
  }
  .goal-content {
    flex: 1;
    padding: var(--space-5) var(--space-6);
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }
  .goal-eyebrow {
    font-size: 10px;
    color: var(--text-3);
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }
  .goal-hero {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--space-3);
  }
  .goal-pct {
    font-size: 56px;
    font-weight: 700;
    color: var(--cal);
    letter-spacing: -0.05em;
    line-height: 1;
    text-shadow: var(--title-shadow);
  }
  .goal-pct-sym {
    font-size: 24px;
    color: var(--text-3);
    font-weight: 500;
  }
  .goal-context {
    font-size: var(--font-sm);
    color: var(--text-2);
  }
  .goal-context .mono { color: var(--text-0); font-weight: 700; }
  .goal-bar-track {
    width: 100%;
    height: 6px;
    background: var(--bg-hover);
    border-radius: var(--radius-full);
    overflow: hidden;
  }
  .goal-segs { display: flex; height: 100%; }
  .goal-seg {
    height: 100%;
    box-shadow: 0 0 6px currentColor;
    transition: width 240ms ease;
  }
  .goal-macros {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--space-3);
    padding-top: var(--space-2);
    border-top: 1px solid var(--border);
  }
  .goal-macro {
    display: flex; flex-direction: column; gap: 4px;
    padding-left: 8px;
    border-left: 2px solid var(--mc);
  }
  .goal-macro-label {
    font-size: 10px;
    color: var(--text-3);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    font-weight: 600;
  }
  .goal-macro-row {
    display: flex; align-items: baseline; justify-content: space-between;
  }
  .goal-macro-val {
    font-size: var(--font-md);
    font-weight: 700;
    color: var(--mc);
    letter-spacing: -0.025em;
  }
  .goal-macro-val small { font-size: 9px; color: var(--text-3); margin-left: 1px; font-weight: 400; }
  .goal-macro-pct { font-size: 10px; color: var(--text-3); font-weight: 500; }
  .goal-macro-bar {
    width: 100%; height: 3px;
    background: var(--bg-hover);
    border-radius: var(--radius-full);
    overflow: hidden;
  }
  .goal-macro-bar > span {
    display: block; height: 100%;
    background: var(--mc);
    border-radius: var(--radius-full);
    box-shadow:
      0 0 4px color-mix(in srgb, var(--mc) 50%, transparent),
      0 0 8px color-mix(in srgb, var(--mc) 22%, transparent);
    transition: width 600ms cubic-bezier(0.4, 0, 0.2, 1);
  }

  /* ── Timeline ── */
  .timeline {
    position: relative;
    display: flex;
    background: transparent;
  }
  .timeline-bar {
    width: 3px;
    background: linear-gradient(180deg, var(--cal), transparent);
    border-radius: var(--radius-full);
    flex-shrink: 0;
  }
  .timeline-content {
    flex: 1;
    min-width: 0;
    padding: 4px 0 4px var(--space-4);
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }
  .timeline-head {
    display: flex; align-items: baseline; justify-content: space-between;
    padding-bottom: 6px;
    border-bottom: 1px solid var(--border);
  }
  .timeline-title {
    margin: 0;
    font-size: var(--font-xl);
    font-weight: 700;
    letter-spacing: -0.03em;
    line-height: 1.2;
    background: var(--title-gradient);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    -webkit-text-fill-color: transparent;
    text-shadow: var(--title-shadow);
  }
  .timeline-count {
    font-size: 11px; color: var(--text-3);
    text-transform: uppercase; letter-spacing: 0.06em;
    font-weight: 600;
  }

  /* ── Each meal ── */
  .meal {
    display: grid;
    grid-template-columns: 36px 1fr;
    gap: var(--space-3);
    align-items: stretch;
  }
  .meal-marker {
    display: flex; flex-direction: column;
    align-items: center;
    position: relative;
  }
  .meal-marker::before {
    content: '';
    position: absolute;
    top: 36px; bottom: -16px;
    left: 50%;
    width: 1px;
    background: var(--border);
    transform: translateX(-50%);
  }
  .meal:last-child .meal-marker::before { display: none; }
  .meal-dot {
    width: 32px; height: 32px;
    display: inline-flex; align-items: center; justify-content: center;
    background: var(--bg-hover);
    border: 1px solid var(--border);
    border-radius: 50%;
    color: var(--text-2);
    flex-shrink: 0;
    z-index: 1;
    transition: all var(--transition-fast);
  }
  .meal-active .meal-dot {
    background: color-mix(in srgb, var(--cal) 15%, transparent);
    border-color: var(--cal);
    color: var(--cal);
    box-shadow: 0 0 12px color-mix(in srgb, var(--cal) 40%, transparent);
  }

  .meal-card {
    position: relative;
    background: var(--bg-1);
    border-radius: var(--radius-lg);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.16), 0 1px 2px rgba(0, 0, 0, 0.06);
    padding: var(--space-4);
    display: flex; flex-direction: column;
    gap: var(--space-3);
    transition: box-shadow var(--transition-fast);
    overflow: hidden;
  }
  .meal-active .meal-card {
    box-shadow:
      0 4px 16px rgba(0, 0, 0, 0.22),
      0 2px 4px rgba(0, 0, 0, 0.1),
      0 0 0 1px color-mix(in srgb, var(--cal) 25%, transparent);
  }
  .meal-card::before {
    content: ''; position: absolute; left: 0; top: 0; bottom: 0;
    width: 3px;
    background: var(--border-strong);
    border-radius: var(--radius-lg) 0 0 var(--radius-lg);
    transition: background var(--transition-fast);
  }
  .meal-active .meal-card::before { background: var(--cal); }

  .meal-head {
    display: flex; align-items: flex-start; justify-content: space-between;
    gap: var(--space-3);
  }
  .meal-head-text { display: flex; flex-direction: column; gap: 2px; }
  .meal-eyebrow {
    font-size: 9px;
    color: var(--text-3);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    font-weight: 600;
  }
  .meal-name {
    margin: 0;
    font-size: var(--font-lg);
    font-weight: 700;
    letter-spacing: -0.025em;
    background: var(--title-gradient);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    -webkit-text-fill-color: transparent;
  }
  .meal-stats {
    display: flex; flex-direction: column; align-items: flex-end; gap: 2px;
  }
  .meal-cal {
    font-size: var(--font-md);
    font-weight: 700;
    color: var(--cal);
    letter-spacing: -0.025em;
  }
  .meal-cal small { font-size: 9px; color: var(--text-3); font-weight: 400; text-transform: uppercase; letter-spacing: 0.05em; }
  .meal-macros { display: flex; gap: 6px; font-size: 10.5px; }

  .meal-items { display: flex; flex-direction: column; gap: 2px; }
  .meal-item {
    display: grid;
    grid-template-columns: 1fr auto auto auto;
    align-items: center;
    gap: var(--space-3);
    padding: 8px 10px;
    background: var(--bg-hover);
    border-radius: var(--radius-md);
    transition: background var(--transition-fast);
  }
  .meal-item:hover { background: var(--bg-active); }
  .meal-item-name {
    font-size: var(--font-sm); font-weight: 600;
    color: var(--text-0); letter-spacing: -0.01em;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .meal-item-qty { font-size: 11px; color: var(--text-3); }
  .meal-item-qty small { font-size: 9px; opacity: 0.7; }
  .meal-item-cal {
    font-size: var(--font-sm); color: var(--cal); font-weight: 700;
    letter-spacing: -0.02em;
  }
  .meal-item-cal small { font-size: 9px; color: var(--text-3); font-weight: 400; text-transform: uppercase; letter-spacing: 0.05em; }
  .meal-item-rm {
    width: 22px; height: 22px;
    display: inline-flex; align-items: center; justify-content: center;
    background: transparent; border: none;
    color: var(--text-3); cursor: pointer;
    border-radius: var(--radius-sm);
    transition: all var(--transition-fast);
  }
  .meal-item-rm:hover { color: var(--danger); background: var(--danger-bg); }

  .meal-add {
    align-self: flex-start;
    display: inline-flex; align-items: center; gap: 4px;
    padding: 5px 12px;
    background: transparent;
    border: 1px dashed var(--border-strong);
    border-radius: var(--radius-full);
    color: var(--text-2);
    font-size: 11px; font-weight: 600;
    font-family: var(--font-sans);
    cursor: pointer;
    transition: all var(--transition-fast);
  }
  .meal-add:hover { color: var(--text-0); border-color: var(--text-2); }

  /* ── Inline contextual food picker for active slot ── */
  .picker {
    display: flex; flex-direction: column;
    gap: var(--space-2);
    padding: var(--space-3);
    background: var(--bg-hover);
    border-radius: var(--radius-md);
    margin-top: 4px;
  }
  .picker-search {
    display: flex; align-items: center; gap: 6px;
    background: var(--bg-1);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    padding: 6px 10px;
  }
  .picker-search :global(svg) { color: var(--text-3); flex-shrink: 0; }
  .picker-search input {
    flex: 1; border: none; background: transparent; outline: none;
    font-family: var(--font-sans); color: var(--text-1);
    font-size: 11px; padding: 0; min-width: 0;
  }
  .picker-search input::placeholder { color: var(--text-3); }
  .picker-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 6px;
  }
  .picker-card {
    display: flex; flex-direction: column; gap: 2px;
    align-items: flex-start;
    padding: 8px var(--space-3);
    background: var(--bg-1);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: all var(--transition-fast);
    text-align: left;
  }
  .picker-card:hover {
    border-color: var(--cal);
    background: color-mix(in srgb, var(--cal) 6%, var(--bg-1));
  }
  .picker-name {
    font-size: var(--font-sm); font-weight: 600;
    color: var(--text-0); letter-spacing: -0.01em;
  }
  .picker-meta { font-size: 10px; color: var(--text-3); font-family: var(--font-mono); }
  .picker-cal { color: var(--cal); font-weight: 600; }

  @media (max-width: 720px) {
    .head { grid-template-columns: 1fr; }
    .head-actions { justify-self: stretch; flex-wrap: wrap; }
    .goal-macros { grid-template-columns: 1fr; }
    .goal-hero { flex-direction: column; align-items: flex-start; gap: 6px; }
  }
</style>
