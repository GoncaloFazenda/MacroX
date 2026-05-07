<script>
  import {
    Sunrise, Sun, Moon, Cookie, Search, Plus, X, ChevronLeft, ChevronRight,
    Bookmark, Save, Undo2, Sparkles, SlidersHorizontal, ChevronDown
  } from 'lucide-svelte';

  const day = {
    weekday: 'Saturday',
    dateLong: 'May 2, 2026',
    cal: 1840, pro: 162, carb: 138, fat: 58,
    goalCal: 2000, goalPro: 180, goalCarb: 200, goalFat: 65,
  };
  const slots = [
    { key: 'breakfast', label: 'Breakfast', icon: Sunrise,
      items: [
        { name: 'Greek Yogurt + Berries', cal: 280, pro: 22, carb: 28, fat: 8, qty: 250 },
        { name: 'Black Coffee',           cal:   5, pro:  0, carb:  1, fat: 0, qty: 250 },
      ] },
    { key: 'lunch', label: 'Lunch', icon: Sun,
      items: [
        { name: 'Chicken & Rice Bowl',    cal: 620, pro: 55, carb: 62, fat: 14, qty: 350 },
      ] },
    { key: 'dinner', label: 'Dinner', icon: Moon,
      items: [
        { name: 'Salmon + Asparagus',     cal: 540, pro: 48, carb: 12, fat: 28, qty: 280 },
        { name: 'Sweet Potato',           cal: 180, pro:  4, carb: 38, fat:  1, qty: 200 },
      ] },
    { key: 'snack', label: 'Snack', icon: Cookie,
      items: [
        { name: 'Whey Shake',             cal: 215, pro: 33, carb:  6, fat:  4, qty: 30 },
      ] },
  ];
  const slotTotal = (s) => s.items.reduce((a, i) => a + i.cal, 0);

  const foods = [
    { name: 'Chicken Breast', cal: 165, pro: 31 },
    { name: 'Brown Rice',     cal: 112, pro:  2.6 },
    { name: 'Salmon Fillet',  cal: 208, pro: 22 },
    { name: 'Sweet Potato',   cal:  86, pro:  1.6 },
    { name: 'Avocado',        cal: 160, pro:  2 },
    { name: 'Greek Yogurt',   cal:  59, pro: 10 },
    { name: 'Whole Eggs',     cal: 155, pro: 13 },
    { name: 'Almonds',        cal: 579, pro: 21 },
  ];
  const categories = ['All', 'Protein', 'Carbs', 'Fats', 'Veg', 'Snacks'];
  const macros = [
    { k: 'cal',  label: 'Calories', val: day.cal,  goal: day.goalCal,  unit: 'kcal', color: 'var(--cal)'  },
    { k: 'pro',  label: 'Protein',  val: day.pro,  goal: day.goalPro,  unit: 'g',    color: 'var(--pro)'  },
    { k: 'carb', label: 'Net Carbs',val: day.carb, goal: day.goalCarb, unit: 'g',    color: 'var(--carb)' },
    { k: 'fat',  label: 'Fat',      val: day.fat,  goal: day.goalFat,  unit: 'g',    color: 'var(--fat)'  },
  ];
</script>

<svelte:head><title>My Day — Mockup V3 (Refined Original)</title></svelte:head>

<div class="page">
  <!-- ── ORIGINAL STRUCTURE: Header (title/sub + date nav + actions) ── -->
  <header class="topbar">
    <div class="title-block">
      <span class="title-eyebrow">Daily Planner</span>
      <h1 class="title-main">Build your perfect day</h1>
    </div>
    <div class="date-nav">
      <button class="nav-btn" aria-label="Previous"><ChevronLeft size={14} strokeWidth={1.75} /></button>
      <span class="date-text mono">{day.weekday} · {day.dateLong}</span>
      <button class="nav-btn" aria-label="Next"><ChevronRight size={14} strokeWidth={1.75} /></button>
    </div>
    <div class="actions">
      <button class="btn-ghost"><Undo2 size={13} strokeWidth={1.5} /> Revert</button>
      <button class="btn-ghost"><Bookmark size={13} strokeWidth={1.5} /> Save as Template</button>
      <button class="btn-primary"><Save size={13} strokeWidth={1.75} /> Save day</button>
    </div>
  </header>

  <!-- ── ORIGINAL STRUCTURE: 4-column macro summary ── -->
  <section class="macro-summary">
    {#each macros as m}
      {@const pct = Math.min(100, Math.round((m.val / m.goal) * 100))}
      <article class="macro-card" style="--mc: {m.color}">
        <div class="macro-row">
          <span class="macro-label">{m.label}</span>
          <span class="macro-pct mono">{pct}%</span>
        </div>
        <div class="macro-vals">
          <span class="macro-current mono">{m.val.toLocaleString()}</span>
          <span class="macro-sep">/</span>
          <span class="macro-goal mono">{m.goal.toLocaleString()}</span>
          <span class="macro-unit">{m.unit}</span>
        </div>
        <div class="macro-bar"><span style="width: {pct}%"></span></div>
      </article>
    {/each}
  </section>

  <!-- ── ORIGINAL STRUCTURE: 2-column main planner ── -->
  <div class="planner">
    <!-- LEFT: Source Panel (food picker) -->
    <aside class="source">
      <span class="source-bar" aria-hidden="true"></span>
      <div class="source-content">
        <header class="source-head">
          <h2 class="source-title">Foods</h2>
          <span class="source-underline" aria-hidden="true"></span>
        </header>

        <div class="add-row">
          <button class="slot-chip">
            Add to <strong>Lunch</strong> <ChevronDown size={11} strokeWidth={1.75} />
          </button>
          <div class="search">
            <Search size={12} strokeWidth={1.75} />
            <input type="text" placeholder="Search foods…" />
          </div>
          <button class="filter-btn" aria-label="Filters"><SlidersHorizontal size={13} strokeWidth={1.5} /></button>
        </div>

        <div class="cat-strip">
          {#each categories as c, i}
            <button class="cat-chip" class:cat-chip-on={i === 0}>{c}</button>
          {/each}
        </div>

        <div class="suggested-block">
          <div class="sec-label">
            <Sparkles size={11} strokeWidth={1.75} /> Suggested for you
          </div>
          <div class="sug-grid">
            {#each foods.slice(0, 4) as f}
              <article class="sug-card">
                <span class="sug-name">{f.name}</span>
                <span class="sug-meta mono"><span class="sug-cal">{f.cal}</span> kcal · {f.pro}p</span>
              </article>
            {/each}
          </div>
        </div>

        <div class="tabs">
          <button class="tab tab-on">Foods <span class="tab-count">{foods.length}</span></button>
          <button class="tab">My Meals <span class="tab-count">12</span></button>
        </div>

        <div class="food-list">
          {#each foods as f}
            <article class="food-row">
              <span class="food-name">{f.name}</span>
              <span class="food-meta mono">
                <span class="food-cal">{f.cal}</span>
                <span class="food-sep">·</span>
                <span style="color: var(--pro)">{f.pro}p</span>
              </span>
            </article>
          {/each}
        </div>
      </div>
    </aside>

    <!-- RIGHT: Slots Panel (4 meal cards) -->
    <div class="slots">
      {#each slots as s, idx}
        <article class="slot-card" class:slot-active={idx === 1}>
          <header class="slot-head">
            <div class="slot-head-left">
              <span class="slot-icon"><svelte:component this={s.icon} size={14} strokeWidth={1.75} /></span>
              <h3 class="slot-name">{s.label}</h3>
              <span class="slot-count">{s.items.length} {s.items.length === 1 ? 'item' : 'items'}</span>
            </div>
            <span class="slot-cal mono">{slotTotal(s)}<small> kcal</small></span>
          </header>

          <div class="slot-zone">
            {#each s.items as it}
              <div class="item">
                <span class="item-name">{it.name}</span>
                <span class="item-macros mono">
                  <span style="color: var(--pro)">{it.pro}p</span>
                  <span style="color: var(--carb)">{it.carb}c</span>
                  <span style="color: var(--fat)">{it.fat}f</span>
                </span>
                <span class="item-cal mono">{it.cal}<small> kcal</small></span>
                <div class="item-qty mono">
                  <input type="number" value={it.qty} min="1" />
                  <span class="item-qty-unit">g</span>
                </div>
                <button class="item-rm" aria-label="Remove"><X size={11} strokeWidth={2} /></button>
              </div>
            {/each}
            {#if s.items.length === 0}
              <div class="slot-empty">
                <Plus size={14} strokeWidth={1.5} />
                <span>{idx === 1 ? 'Click a food to add it here' : 'Drag a food here'}</span>
              </div>
            {/if}
          </div>
        </article>
      {/each}
    </div>
  </div>
</div>

<style>
  .page {
    max-width: 1600px;
    margin: 0 auto;
    padding: var(--space-6);
    display: flex;
    flex-direction: column;
    gap: var(--space-5);
  }

  /* ── Topbar ── */
  .topbar {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    gap: var(--space-4);
  }
  .title-block { display: flex; flex-direction: column; gap: 2px; }
  .title-eyebrow {
    font-size: 10px;
    color: var(--text-3);
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }
  .title-main {
    margin: 0;
    font-size: var(--font-2xl);
    font-weight: 700;
    letter-spacing: -0.035em;
    line-height: 1.2;
    background: var(--title-gradient);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    -webkit-text-fill-color: transparent;
    text-shadow: var(--title-shadow);
  }

  .date-nav {
    display: flex; align-items: center; gap: 8px;
    padding: 5px 10px;
    background: var(--bg-1);
    border-radius: var(--radius-full);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.16), 0 1px 2px rgba(0, 0, 0, 0.06);
  }
  .nav-btn {
    width: 26px; height: 26px;
    display: inline-flex; align-items: center; justify-content: center;
    background: transparent; border: none;
    color: var(--text-2);
    border-radius: 50%;
    cursor: pointer;
    transition: all var(--transition-fast);
  }
  .nav-btn:hover { color: var(--text-0); background: var(--bg-hover); }
  .date-text {
    font-size: 11px; font-weight: 600;
    color: var(--text-1);
    letter-spacing: -0.005em;
    padding: 0 4px;
  }

  .actions { display: flex; gap: 6px; justify-self: end; }
  .btn-ghost, .btn-primary {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 7px 12px;
    font-size: 11px; font-weight: 600;
    font-family: var(--font-sans);
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: all var(--transition-fast);
  }
  .btn-ghost {
    background: transparent;
    border: 1px solid var(--border);
    color: var(--text-2);
  }
  .btn-ghost:hover { color: var(--text-0); border-color: var(--border-strong); }
  .btn-primary {
    background: var(--text-0);
    color: var(--bg-0);
    border: 1px solid var(--text-0);
  }
  .btn-primary:hover { opacity: 0.9; }

  /* ── Macro summary (4 columns, original structure) ── */
  .macro-summary {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: var(--space-4);
  }
  .macro-card {
    position: relative;
    background: var(--bg-1);
    border-radius: var(--radius-lg);
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.18), 0 1px 2px rgba(0, 0, 0, 0.08);
    padding: var(--space-3) var(--space-4) var(--space-4);
    display: flex;
    flex-direction: column;
    gap: 6px;
    overflow: hidden;
  }
  .macro-card::before {
    content: ''; position: absolute; left: 0; top: 0; bottom: 0;
    width: 3px; background: var(--mc);
    border-radius: var(--radius-lg) 0 0 var(--radius-lg);
    opacity: 0.85;
  }
  .macro-row { display: flex; align-items: baseline; justify-content: space-between; }
  .macro-label {
    font-size: 10px; color: var(--text-3); font-weight: 600;
    text-transform: uppercase; letter-spacing: 0.08em;
  }
  .macro-pct {
    font-size: 11px; font-weight: 700; color: var(--mc);
  }
  .macro-vals { display: flex; align-items: baseline; gap: 4px; }
  .macro-current {
    font-size: var(--font-2xl); font-weight: 700;
    color: var(--text-0); letter-spacing: -0.04em; line-height: 1;
    text-shadow: var(--title-shadow);
  }
  .macro-sep { font-size: 14px; color: var(--text-3); }
  .macro-goal { font-size: 12px; color: var(--text-3); }
  .macro-unit { font-size: 10px; color: var(--text-3); text-transform: uppercase; letter-spacing: 0.05em; margin-left: 2px; }
  .macro-bar {
    width: 100%; height: 4px;
    background: var(--bg-hover);
    border-radius: var(--radius-full);
    overflow: hidden;
    margin-top: 2px;
  }
  .macro-bar > span {
    display: block; height: 100%;
    background: var(--mc);
    border-radius: var(--radius-full);
    box-shadow:
      0 0 4px color-mix(in srgb, var(--mc) 50%, transparent),
      0 0 8px color-mix(in srgb, var(--mc) 22%, transparent);
    transition: width 600ms cubic-bezier(0.4, 0, 0.2, 1);
  }

  /* ── Planner grid (left source panel + right slots) ── */
  .planner {
    display: grid;
    grid-template-columns: 360px 1fr;
    gap: var(--space-5);
    align-items: start;
  }

  /* ── Source panel (variant 16 style chrome) ── */
  .source {
    display: flex;
    align-items: stretch;
    gap: 0;
  }
  .source-bar {
    width: 2px;
    background: linear-gradient(180deg, var(--cal), transparent);
    border-radius: var(--radius-full);
    flex-shrink: 0;
  }
  .source-content {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    padding: 4px 0 4px var(--space-4);
  }
  .source-head { position: relative; padding-bottom: 6px; }
  .source-title {
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
  .source-underline {
    position: absolute; left: 0; bottom: 0;
    width: 28px; height: 2px;
    background: var(--cal);
    border-radius: var(--radius-full);
    opacity: 0.7;
  }

  .add-row { display: flex; align-items: center; gap: 6px; }
  .slot-chip {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 6px 10px;
    background: var(--bg-hover);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    font-size: 11px; color: var(--text-1);
    font-family: var(--font-sans);
    cursor: pointer;
    flex-shrink: 0;
  }
  .slot-chip strong { color: var(--text-0); font-weight: 700; }
  .slot-chip:hover { border-color: var(--border-strong); }
  .search {
    flex: 1;
    display: flex; align-items: center; gap: 6px;
    background: transparent;
    border: none;
    border-bottom: 1px solid var(--border);
    padding: 4px 0;
    transition: border-bottom-color var(--transition-fast);
  }
  .search:focus-within { border-bottom-color: var(--cal); }
  .search :global(svg) { color: var(--text-3); flex-shrink: 0; }
  .search input {
    flex: 1; border: none; background: transparent; outline: none;
    font-family: var(--font-sans); color: var(--text-1);
    font-size: 11px; padding: 2px 0; min-width: 0;
  }
  .search input::placeholder { color: var(--text-3); }
  .filter-btn {
    width: 28px; height: 28px;
    display: inline-flex; align-items: center; justify-content: center;
    background: var(--bg-hover);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    color: var(--text-2);
    cursor: pointer;
    flex-shrink: 0;
  }

  .cat-strip {
    display: flex; gap: 4px; overflow-x: auto;
    padding-bottom: 2px;
    scrollbar-width: none;
  }
  .cat-strip::-webkit-scrollbar { display: none; }
  .cat-chip {
    padding: 4px 10px;
    background: transparent;
    border: 1px solid var(--border);
    border-radius: var(--radius-full);
    font-size: 10.5px; font-weight: 600;
    font-family: var(--font-sans);
    color: var(--text-3);
    cursor: pointer;
    flex-shrink: 0;
    transition: all var(--transition-fast);
  }
  .cat-chip:hover { color: var(--text-1); border-color: var(--border-strong); }
  .cat-chip-on { background: var(--text-0); color: var(--bg-0); border-color: var(--text-0); }

  .suggested-block { display: flex; flex-direction: column; gap: 6px; }
  .sec-label {
    display: flex; align-items: center; gap: 6px;
    font-size: 10px; color: var(--text-3); font-weight: 600;
    text-transform: uppercase; letter-spacing: 0.06em;
  }
  .sec-label :global(svg) { color: var(--cal); }
  .sug-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 6px;
  }
  .sug-card {
    position: relative;
    padding: 8px 10px;
    background: var(--bg-1);
    border-radius: var(--radius-md);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.16), 0 1px 2px rgba(0, 0, 0, 0.06);
    cursor: grab;
    display: flex; flex-direction: column; gap: 2px;
  }
  .sug-card::before {
    content: ''; position: absolute; left: 0; top: 0; bottom: 0;
    width: 3px; background: var(--cal);
    border-radius: var(--radius-md) 0 0 var(--radius-md);
  }
  .sug-name {
    font-size: var(--font-sm); font-weight: 600; color: var(--text-0);
    letter-spacing: -0.01em;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .sug-meta { font-size: 10px; color: var(--text-3); }
  .sug-cal { color: var(--cal); font-weight: 600; }

  .tabs {
    display: flex; gap: 2px; padding: 2px;
    background: var(--bg-hover);
    border-radius: var(--radius-md);
  }
  .tab {
    flex: 1;
    padding: 6px 10px;
    background: transparent; border: none;
    border-radius: var(--radius-sm);
    font-size: 11px; font-weight: 600;
    font-family: var(--font-sans);
    color: var(--text-3);
    cursor: pointer;
    display: flex; align-items: center; justify-content: center; gap: 5px;
    transition: all var(--transition-fast);
  }
  .tab:hover { color: var(--text-1); }
  .tab-on { background: var(--bg-1); color: var(--text-0); box-shadow: 0 1px 3px rgba(0,0,0,0.15); }
  .tab-count { font-size: 9px; color: var(--text-3); font-weight: 500; }

  .food-list {
    display: flex; flex-direction: column; gap: 4px;
    overflow-y: auto;
    max-height: 360px;
    padding: 2px;
    scrollbar-width: none;
    mask-image: linear-gradient(to bottom, transparent, #000 24px, #000 calc(100% - 24px), transparent);
    -webkit-mask-image: linear-gradient(to bottom, transparent, #000 24px, #000 calc(100% - 24px), transparent);
  }
  .food-list::-webkit-scrollbar { display: none; }
  .food-row {
    position: relative;
    display: flex; align-items: center; justify-content: space-between;
    gap: 8px;
    padding: 8px var(--space-3);
    background: var(--bg-1);
    border-radius: var(--radius-md);
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.12);
    cursor: grab;
    transition: all var(--transition-fast);
  }
  .food-row::before {
    content: ''; position: absolute; left: 0; top: 0; bottom: 0;
    width: 2px; background: var(--border-strong);
    border-radius: var(--radius-md) 0 0 var(--radius-md);
  }
  .food-row:hover { box-shadow: 0 3px 8px rgba(0, 0, 0, 0.18); }
  .food-name {
    font-size: var(--font-sm); font-weight: 600; color: var(--text-0);
    letter-spacing: -0.01em;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .food-meta { font-size: 10.5px; color: var(--text-3); display: flex; gap: 4px; }
  .food-cal { color: var(--cal); font-weight: 600; }
  .food-sep { opacity: 0.5; }

  /* ── Slots panel ── */
  .slots {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }
  .slot-card {
    position: relative;
    background: var(--bg-1);
    border-radius: var(--radius-lg);
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.18), 0 1px 2px rgba(0, 0, 0, 0.08);
    padding: var(--space-4);
    display: flex; flex-direction: column;
    gap: var(--space-3);
    overflow: hidden;
    transition: box-shadow var(--transition-fast);
  }
  .slot-card:hover { box-shadow: 0 4px 14px rgba(0, 0, 0, 0.22), 0 2px 4px rgba(0, 0, 0, 0.12); }
  .slot-card::before {
    content: ''; position: absolute; left: 0; top: 0; bottom: 0;
    width: 3px;
    background: var(--border-strong);
    border-radius: var(--radius-lg) 0 0 var(--radius-lg);
    transition: background var(--transition-fast);
  }
  .slot-active::before { background: var(--cal); }
  .slot-active {
    box-shadow:
      0 4px 14px rgba(0, 0, 0, 0.22),
      0 2px 4px rgba(0, 0, 0, 0.12),
      0 0 0 1px color-mix(in srgb, var(--cal) 22%, transparent);
  }

  .slot-head { display: flex; align-items: center; justify-content: space-between; }
  .slot-head-left { display: flex; align-items: center; gap: 8px; }
  .slot-icon { display: inline-flex; color: var(--cal); }
  .slot-name {
    margin: 0;
    font-size: var(--font-md);
    font-weight: 700;
    letter-spacing: -0.025em;
    background: var(--title-gradient);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    -webkit-text-fill-color: transparent;
  }
  .slot-count {
    font-size: 9px; color: var(--text-3);
    text-transform: uppercase; letter-spacing: 0.08em;
    font-weight: 600;
    padding: 2px 8px;
    background: var(--bg-hover);
    border-radius: var(--radius-full);
  }
  .slot-cal {
    font-size: var(--font-md);
    font-weight: 700;
    color: var(--cal);
    letter-spacing: -0.025em;
  }
  .slot-cal small { font-size: 9px; color: var(--text-3); font-weight: 400; text-transform: uppercase; letter-spacing: 0.05em; }

  .slot-zone {
    display: flex; flex-direction: column; gap: 4px;
  }
  .item {
    display: grid;
    grid-template-columns: 1fr auto auto auto auto;
    align-items: center;
    gap: var(--space-3);
    padding: 8px 10px;
    background: var(--bg-hover);
    border-radius: var(--radius-md);
    transition: background var(--transition-fast);
  }
  .item:hover { background: var(--bg-active); }
  .item-name {
    font-size: var(--font-sm); font-weight: 600;
    color: var(--text-0); letter-spacing: -0.01em;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .item-macros { display: flex; gap: 6px; font-size: 10.5px; }
  .item-cal {
    font-size: 11px; color: var(--cal); font-weight: 700;
  }
  .item-cal small { font-size: 9px; color: var(--text-3); font-weight: 400; text-transform: uppercase; letter-spacing: 0.05em; }
  .item-qty {
    display: inline-flex; align-items: center; gap: 2px;
    padding: 2px 8px;
    background: var(--bg-1);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
  }
  .item-qty input {
    width: 32px;
    background: transparent; border: none; outline: none;
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--text-0);
    text-align: right;
  }
  .item-qty-unit { font-size: 9px; color: var(--text-3); text-transform: uppercase; }
  .item-rm {
    width: 22px; height: 22px;
    display: inline-flex; align-items: center; justify-content: center;
    background: transparent; border: none;
    color: var(--text-3); cursor: pointer;
    border-radius: var(--radius-sm);
    transition: all var(--transition-fast);
  }
  .item-rm:hover { color: var(--danger); background: var(--danger-bg); }

  .slot-empty {
    display: flex; align-items: center; justify-content: center;
    gap: 6px;
    padding: var(--space-4);
    border: 1px dashed var(--border);
    border-radius: var(--radius-md);
    color: var(--text-3);
    font-size: var(--font-xs);
  }

  @media (max-width: 1024px) {
    .planner { grid-template-columns: 1fr; }
    .macro-summary { grid-template-columns: repeat(2, 1fr); }
  }
</style>
