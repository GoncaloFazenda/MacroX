<script>
  import {
    Sunrise, Sun, Moon, Cookie, Search, Plus, X, ChevronLeft, ChevronRight,
    Bookmark, Save, Undo2, Sparkles, Flame, GripVertical
  } from 'lucide-svelte';

  const day = {
    label: 'Today',
    weekday: 'Saturday',
    dateLong: 'May 2, 2026',
    dateNum: 2,
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
      key: 'breakfast', label: 'Breakfast', icon: Sunrise, time: '07:00 – 09:00',
      items: [
        { name: 'Greek Yogurt + Berries', cal: 280, pro: 22, carb: 28, fat: 8, qty: 250 },
        { name: 'Black Coffee',           cal:   5, pro:  0, carb:  1, fat: 0, qty: 250 },
      ],
    },
    {
      key: 'lunch', label: 'Lunch', icon: Sun, time: '12:30 – 14:00',
      items: [
        { name: 'Chicken & Rice Bowl',    cal: 620, pro: 55, carb: 62, fat: 14, qty: 350 },
      ],
    },
    {
      key: 'dinner', label: 'Dinner', icon: Moon, time: '19:30 – 21:00',
      items: [
        { name: 'Salmon + Asparagus',     cal: 540, pro: 48, carb: 12, fat: 28, qty: 280 },
        { name: 'Sweet Potato',           cal: 180, pro:  4, carb: 38, fat:  1, qty: 200 },
      ],
    },
    {
      key: 'snack', label: 'Snack', icon: Cookie, time: 'between meals',
      items: [
        { name: 'Whey Shake',             cal: 215, pro: 33, carb:  6, fat:  4, qty: 30 },
      ],
    },
  ];
  function slotTotal(s) {
    return s.items.reduce((acc, i) => acc + i.cal, 0);
  }
  const foods = [
    { name: 'Chicken Breast',  cal: 165, pro: 31 },
    { name: 'Brown Rice',      cal: 112, pro:  2.6 },
    { name: 'Salmon Fillet',   cal: 208, pro: 22 },
    { name: 'Sweet Potato',    cal:  86, pro:  1.6 },
    { name: 'Avocado',         cal: 160, pro:  2 },
    { name: 'Greek Yogurt',    cal:  59, pro: 10 },
    { name: 'Whole Eggs',      cal: 155, pro: 13 },
    { name: 'Almonds',         cal: 579, pro: 21 },
    { name: 'Olive Oil',       cal: 884, pro:  0 },
    { name: 'Spinach',         cal:  23, pro:  3 },
  ];
  const calPct  = Math.min(100, Math.round(day.cal  / day.goalCal  * 100));
  const proPct  = Math.min(100, Math.round(day.pro  / day.goalPro  * 100));
  const carbPct = Math.min(100, Math.round(day.carb / day.goalCarb * 100));
  const fatPct  = Math.min(100, Math.round(day.fat  / day.goalFat  * 100));
</script>

<svelte:head><title>My Day — Mockup V1 (Editorial Day)</title></svelte:head>

<div class="page">
  <!-- ── Top bar: date nav + actions ── -->
  <header class="topbar">
    <div class="datebar">
      <button class="nav-btn" aria-label="Previous day"><ChevronLeft size={14} strokeWidth={1.75} /></button>
      <div class="date-content">
        <span class="date-eyebrow">{day.label}</span>
        <h1 class="date-title">{day.weekday}<span class="date-num">, {day.dateLong}</span></h1>
      </div>
      <button class="nav-btn" aria-label="Next day"><ChevronRight size={14} strokeWidth={1.75} /></button>
    </div>
    <div class="top-actions">
      <button class="undo-btn"><Undo2 size={13} strokeWidth={1.5} /> Revert</button>
      <button class="tpl-btn"><Bookmark size={13} strokeWidth={1.5} /> Save as Template</button>
      <button class="save-btn"><Save size={13} strokeWidth={1.75} /> Save day</button>
    </div>
  </header>

  <!-- ── Hero: ring + macro bars ── -->
  <section class="hero-card">
    <span class="hero-bar" aria-hidden="true"></span>
    <div class="hero-content">
      <div class="hero-ring-wrap">
        <svg viewBox="0 0 36 36" width="120" height="120">
          <circle cx="18" cy="18" r="14" fill="none" stroke="var(--bg-hover)" stroke-width="3" />
          <circle cx="18" cy="18" r="14" fill="none" stroke="var(--cal)" stroke-width="3"
            stroke-linecap="round"
            stroke-dasharray="{calPct * 0.88} 88"
            transform="rotate(-90 18 18)" />
        </svg>
        <div class="hero-ring-inner">
          <span class="hero-ring-cal mono">{day.cal.toLocaleString()}</span>
          <span class="hero-ring-unit">kcal</span>
          <span class="hero-ring-pct mono">{calPct}%</span>
        </div>
      </div>
      <div class="hero-macros">
        <span class="hero-eyebrow">Today's macros</span>
        {#each [
          { k: 'p', label: 'Protein', val: day.pro,  goal: day.goalPro,  pct: proPct,  color: 'var(--pro)'  },
          { k: 'c', label: 'Carbs',   val: day.carb, goal: day.goalCarb, pct: carbPct, color: 'var(--carb)' },
          { k: 'f', label: 'Fat',     val: day.fat,  goal: day.goalFat,  pct: fatPct,  color: 'var(--fat)'  },
        ] as m}
          <div class="hero-row" style="--mc: {m.color}">
            <div class="hero-row-head">
              <span class="hero-row-label">{m.label}</span>
              <span class="hero-row-val mono">{m.val}<small>g</small> <span class="hero-row-goal">/ {m.goal}</span></span>
            </div>
            <div class="hero-row-bar"><span style="width: {m.pct}%"></span></div>
          </div>
        {/each}
      </div>
    </div>
  </section>

  <!-- ── Main: dock (food picker) + slots grid ── -->
  <div class="main">
    <!-- Food picker dock (variant 16 style) -->
    <aside class="dock">
      <span class="dock-bar" aria-hidden="true"></span>
      <div class="dock-content">
        <header class="dock-head">
          <h3 class="dock-title">Foods</h3>
          <span class="dock-count mono">{foods.length}</span>
          <span class="dock-underline" aria-hidden="true"></span>
        </header>
        <div class="dock-search">
          <Search size={12} strokeWidth={1.75} />
          <input type="text" placeholder="Search foods or meals…" />
        </div>

        <!-- Suggestions strip -->
        <div class="dock-section">
          <div class="dock-sec-head">
            <Sparkles size={11} strokeWidth={1.75} />
            <span>Suggested</span>
          </div>
          <div class="suggested">
            {#each foods.slice(0, 3) as f}
              <article class="sug-card">
                <span class="sug-name">{f.name}</span>
                <span class="sug-meta mono"><span class="sug-cal">{f.cal}</span> kcal · {f.pro}p</span>
              </article>
            {/each}
          </div>
        </div>

        <!-- Tabs -->
        <div class="tabs">
          <button class="tab tab-on">Foods <span class="tab-count">{foods.length}</span></button>
          <button class="tab">Meals <span class="tab-count">12</span></button>
        </div>

        <!-- Foods list -->
        <div class="dock-cards">
          {#each foods as f}
            <article class="food-card">
              <div class="food-info">
                <span class="food-name">{f.name}</span>
                <span class="food-meta mono"><span class="food-cal">{f.cal}</span> kcal · {f.pro}p</span>
              </div>
              <button class="food-add" aria-label="Add {f.name}"><Plus size={13} strokeWidth={1.75} /></button>
            </article>
          {/each}
        </div>
      </div>
    </aside>

    <!-- Slots grid -->
    <div class="slots">
      {#each slots as s, idx}
        <article class="slot-card" class:slot-active={idx === 1}>
          <span class="slot-watermark"><svelte:component this={s.icon} size={120} strokeWidth={1} /></span>
          <header class="slot-head">
            <div class="slot-head-left">
              <span class="slot-icon"><svelte:component this={s.icon} size={14} strokeWidth={1.75} /></span>
              <span class="slot-name">{s.label}</span>
              <span class="slot-time">{s.time}</span>
            </div>
            <span class="slot-cal mono">{slotTotal(s)}<small> kcal</small></span>
          </header>

          <div class="slot-items">
            {#each s.items as it}
              <div class="item">
                <span class="item-name">{it.name}</span>
                <span class="item-qty mono">{it.qty}<small>g</small></span>
                <span class="item-cal mono">{it.cal}</span>
                <button class="item-rm" aria-label="Remove"><X size={11} strokeWidth={2} /></button>
              </div>
            {/each}
            {#if s.items.length === 0}
              <div class="slot-empty">
                <Plus size={16} strokeWidth={1.5} />
                <span>Drag a food here, or click one to add</span>
              </div>
            {/if}
          </div>

          {#if s.items.length > 0}
            <footer class="slot-foot">
              <span class="slot-macros mono">
                <span style="color: var(--pro)">{s.items.reduce((a,i)=>a+i.pro,0)}p</span>
                <span style="color: var(--carb)">{s.items.reduce((a,i)=>a+i.carb,0)}c</span>
                <span style="color: var(--fat)">{s.items.reduce((a,i)=>a+i.fat,0)}f</span>
              </span>
              <span class="slot-count">{s.items.length} {s.items.length === 1 ? 'item' : 'items'}</span>
            </footer>
          {/if}
        </article>
      {/each}
    </div>
  </div>
</div>

<style>
  :global(html) { scrollbar-gutter: auto; }
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
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-4);
  }
  .datebar {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }
  .nav-btn {
    width: 30px; height: 30px;
    display: inline-flex;
    align-items: center; justify-content: center;
    background: transparent;
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    color: var(--text-2);
    cursor: pointer;
    transition: color var(--transition-fast), border-color var(--transition-fast);
  }
  .nav-btn:hover { color: var(--text-0); border-color: var(--border-strong); }
  .date-content {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .date-eyebrow {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--text-3);
  }
  .date-title {
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
  .date-num {
    font-weight: 500;
    color: var(--text-2);
    -webkit-text-fill-color: var(--text-2);
    text-shadow: none;
  }
  .top-actions { display: flex; gap: 8px; align-items: center; }
  .undo-btn, .tpl-btn, .save-btn {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 7px 12px;
    font-size: var(--font-xs);
    font-weight: 600;
    font-family: var(--font-sans);
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: all var(--transition-fast);
  }
  .undo-btn, .tpl-btn {
    background: transparent;
    border: 1px solid var(--border);
    color: var(--text-2);
  }
  .undo-btn:hover, .tpl-btn:hover { color: var(--text-0); border-color: var(--border-strong); }
  .save-btn {
    background: var(--text-0);
    color: var(--bg-0);
    border: 1px solid var(--text-0);
  }
  .save-btn:hover { opacity: 0.9; }

  /* ── Hero card ── */
  .hero-card {
    position: relative;
    display: flex;
    background: var(--bg-1);
    border-radius: var(--radius-lg);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.18), 0 1px 2px rgba(0, 0, 0, 0.08);
    overflow: hidden;
    min-height: 200px;
  }
  .hero-bar {
    width: 3px;
    background: linear-gradient(180deg, var(--cal), transparent);
    flex-shrink: 0;
  }
  .hero-content {
    flex: 1;
    display: grid;
    grid-template-columns: auto 1fr;
    align-items: center;
    gap: var(--space-6);
    padding: var(--space-5) var(--space-6);
  }
  .hero-ring-wrap {
    position: relative;
    width: 120px; height: 120px;
    flex-shrink: 0;
  }
  .hero-ring-inner {
    position: absolute; inset: 0;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    gap: 2px;
  }
  .hero-ring-cal {
    font-size: var(--font-xl);
    font-weight: 700;
    color: var(--text-0);
    letter-spacing: -0.04em;
    line-height: 1;
    text-shadow: var(--title-shadow);
  }
  .hero-ring-unit {
    font-size: 9px;
    color: var(--text-3);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    font-weight: 500;
  }
  .hero-ring-pct {
    margin-top: 2px;
    font-size: 11px;
    font-weight: 700;
    color: var(--cal);
    padding: 2px 8px;
    background: color-mix(in srgb, var(--cal) 12%, transparent);
    border-radius: var(--radius-full);
  }
  .hero-macros {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .hero-eyebrow {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--text-3);
  }
  .hero-row { display: flex; flex-direction: column; gap: 4px; }
  .hero-row-head {
    display: flex; align-items: baseline; justify-content: space-between;
  }
  .hero-row-label {
    font-size: var(--font-xs);
    color: var(--text-1);
    font-weight: 600;
  }
  .hero-row-val {
    font-size: var(--font-sm);
    font-weight: 700;
    color: var(--mc);
    letter-spacing: -0.02em;
  }
  .hero-row-val small { font-size: 9px; color: var(--text-3); margin-left: 1px; font-weight: 400; }
  .hero-row-goal { color: var(--text-3); font-size: 10px; font-weight: 500; margin-left: 4px; }
  .hero-row-bar {
    width: 100%; height: 4px;
    background: var(--bg-hover);
    border-radius: var(--radius-full);
    overflow: hidden;
  }
  .hero-row-bar > span {
    display: block; height: 100%;
    background: var(--mc);
    border-radius: var(--radius-full);
    box-shadow:
      0 0 4px color-mix(in srgb, var(--mc) 50%, transparent),
      0 0 8px color-mix(in srgb, var(--mc) 22%, transparent);
    transition: width 600ms cubic-bezier(0.4, 0, 0.2, 1);
  }

  /* ── Main grid ── */
  .main {
    display: grid;
    grid-template-columns: 320px 1fr;
    gap: var(--space-5);
  }

  /* ── Food dock (variant 16 style) ── */
  .dock {
    display: flex;
    align-items: stretch;
    gap: 0;
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
  .dock-head {
    position: relative;
    display: flex;
    align-items: baseline;
    gap: 8px;
    padding-bottom: 6px;
  }
  .dock-title {
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
  .dock-count {
    font-size: 11px;
    color: var(--text-3);
    font-weight: 600;
    letter-spacing: 0.04em;
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
  .dock-search {
    display: flex; align-items: center; gap: 6px;
    background: transparent;
    border: none;
    border-bottom: 1px solid var(--border);
    padding: 4px 0;
    transition: border-bottom-color var(--transition-fast);
  }
  .dock-search:focus-within { border-bottom-color: var(--cal); }
  .dock-search :global(svg) { color: var(--text-3); flex-shrink: 0; }
  .dock-search input {
    flex: 1; border: none; background: transparent; outline: none;
    font-family: var(--font-sans); color: var(--text-1);
    font-size: 11px; padding: 2px 0; min-width: 0;
  }
  .dock-search input::placeholder { color: var(--text-3); }

  .dock-section { display: flex; flex-direction: column; gap: 6px; }
  .dock-sec-head {
    display: flex; align-items: center; gap: 6px;
    font-size: 10px; color: var(--text-3); font-weight: 600;
    text-transform: uppercase; letter-spacing: 0.06em;
  }
  .dock-sec-head :global(svg) { color: var(--cal); }
  .suggested { display: flex; flex-direction: column; gap: 6px; }
  .sug-card {
    position: relative;
    padding: 8px var(--space-3);
    background: var(--bg-1);
    border-radius: var(--radius-md);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.18), 0 1px 2px rgba(0, 0, 0, 0.08);
    cursor: grab;
    display: flex; flex-direction: column; gap: 2px;
  }
  .sug-card::before {
    content: ''; position: absolute; left: 0; top: 0; bottom: 0;
    width: 3px; background: var(--cal);
    border-radius: var(--radius-md) 0 0 var(--radius-md);
  }
  .sug-name { font-size: var(--font-sm); font-weight: 600; color: var(--text-0); letter-spacing: -0.01em; }
  .sug-meta { font-size: 10.5px; color: var(--text-3); }
  .sug-cal { color: var(--cal); font-weight: 600; }

  .tabs {
    display: flex; gap: 2px;
    padding: 2px;
    background: var(--bg-hover);
    border-radius: var(--radius-md);
  }
  .tab {
    flex: 1;
    padding: 5px 10px;
    background: transparent;
    border: none;
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
  .tab-count {
    font-size: 9px; color: var(--text-3); font-weight: 500;
  }

  .dock-cards {
    display: flex; flex-direction: column; gap: 6px;
    overflow-y: auto;
    max-height: 600px;
    padding: 2px;
    scrollbar-width: none;
    -ms-overflow-style: none;
    mask-image: linear-gradient(to bottom, transparent, #000 24px, #000 calc(100% - 24px), transparent);
    -webkit-mask-image: linear-gradient(to bottom, transparent, #000 24px, #000 calc(100% - 24px), transparent);
  }
  .dock-cards::-webkit-scrollbar { display: none; }

  .food-card {
    position: relative;
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: 8px var(--space-3);
    background: var(--bg-1);
    border-radius: var(--radius-md);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.16), 0 1px 2px rgba(0, 0, 0, 0.06);
    cursor: grab;
    transition: box-shadow var(--transition-fast);
  }
  .food-card:hover { box-shadow: 0 4px 12px rgba(0, 0, 0, 0.22), 0 2px 4px rgba(0, 0, 0, 0.1); }
  .food-card::before {
    content: ''; position: absolute; left: 0; top: 0; bottom: 0;
    width: 3px; background: var(--border-strong);
    border-radius: var(--radius-md) 0 0 var(--radius-md);
  }
  .food-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
  .food-name {
    font-size: var(--font-sm); font-weight: 600; color: var(--text-0);
    letter-spacing: -0.01em;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .food-meta { font-size: 10px; color: var(--text-3); }
  .food-cal { color: var(--cal); font-weight: 600; }
  .food-add {
    width: 22px; height: 22px;
    display: inline-flex; align-items: center; justify-content: center;
    background: var(--bg-hover);
    border: none;
    border-radius: var(--radius-full);
    color: var(--text-2);
    cursor: pointer;
    flex-shrink: 0;
    transition: all var(--transition-fast);
  }
  .food-add:hover { background: var(--text-0); color: var(--bg-0); }

  /* ── Slot grid (2x2) ── */
  .slots {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-4);
  }
  .slot-card {
    position: relative;
    background: var(--bg-1);
    border-radius: var(--radius-lg);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.18), 0 1px 2px rgba(0, 0, 0, 0.08);
    padding: var(--space-4);
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    overflow: hidden;
    min-height: 240px;
    transition: box-shadow var(--transition-fast);
  }
  .slot-card:hover { box-shadow: 0 4px 12px rgba(0, 0, 0, 0.22), 0 2px 4px rgba(0, 0, 0, 0.12); }
  .slot-card::before {
    content: ''; position: absolute; left: 0; top: 0; bottom: 0;
    width: 3px;
    background: var(--border-strong);
    border-radius: var(--radius-lg) 0 0 var(--radius-lg);
    transition: background var(--transition-fast);
  }
  .slot-active::before {
    background: var(--cal);
  }
  .slot-watermark {
    position: absolute;
    bottom: -20px; right: -20px;
    color: var(--text-1);
    opacity: 0.04;
    pointer-events: none;
    line-height: 0;
  }
  .slot-head { display: flex; align-items: center; justify-content: space-between; gap: var(--space-2); }
  .slot-head-left { display: flex; align-items: center; gap: 8px; }
  .slot-icon { display: inline-flex; color: var(--cal); }
  .slot-name {
    font-size: var(--font-md);
    font-weight: 700;
    letter-spacing: -0.02em;
    background: var(--title-gradient);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    -webkit-text-fill-color: transparent;
  }
  .slot-time {
    font-size: 9px;
    color: var(--text-3);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-weight: 600;
    margin-left: 4px;
  }
  .slot-cal {
    font-size: var(--font-md);
    font-weight: 700;
    color: var(--cal);
    letter-spacing: -0.025em;
  }
  .slot-cal small { font-size: 9px; color: var(--text-3); font-weight: 400; text-transform: uppercase; letter-spacing: 0.06em; }

  .slot-items {
    display: flex; flex-direction: column;
    gap: 2px;
    flex: 1;
    min-height: 0;
  }
  .item {
    display: grid;
    grid-template-columns: 1fr auto auto auto;
    align-items: center;
    gap: var(--space-2);
    padding: 6px 8px;
    border-radius: var(--radius-sm);
    transition: background var(--transition-fast);
  }
  .item:hover { background: var(--bg-hover); }
  .item-name {
    font-size: var(--font-sm); color: var(--text-1);
    font-weight: 500;
    letter-spacing: -0.005em;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .item-qty { font-size: 10px; color: var(--text-3); }
  .item-qty small { font-size: 8px; opacity: 0.7; }
  .item-cal {
    font-size: 11px; color: var(--cal); font-weight: 600;
  }
  .item-rm {
    width: 18px; height: 18px;
    display: inline-flex; align-items: center; justify-content: center;
    background: transparent; border: none;
    color: var(--text-3); cursor: pointer;
    border-radius: var(--radius-sm);
    opacity: 0;
    transition: all var(--transition-fast);
  }
  .item:hover .item-rm { opacity: 1; }
  .item-rm:hover { color: var(--danger); background: var(--danger-bg); }

  .slot-empty {
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    gap: 6px;
    flex: 1;
    color: var(--text-3);
    font-size: var(--font-xs);
    border: 1px dashed var(--border);
    border-radius: var(--radius-md);
    padding: var(--space-4);
  }

  .slot-foot {
    display: flex; align-items: baseline; justify-content: space-between;
    padding-top: var(--space-2);
    border-top: 1px solid var(--border);
  }
  .slot-macros { display: flex; gap: 8px; font-size: 10.5px; }
  .slot-count { font-size: 10px; color: var(--text-3); text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600; }

  @media (max-width: 1024px) {
    .main { grid-template-columns: 1fr; }
    .slots { grid-template-columns: 1fr; }
  }
</style>
