<script>
  import {
    Sunrise, Sun, Moon, Cookie, Bookmark, Plus, X,
    ChevronDown, Copy, Flame, Calendar, Sparkles
  } from "lucide-svelte";

  // ── Sample data shared by every mockup ──────────────────────────────
  const sampleDay = {
    name: "Monday",
    num: 4,
    isToday: true,
    template: "High-Protein Lean",
    macros: { cal: 1840, pro: 162, carb: 138, fat: 58 },
    goalCal: 2000,
    meals: {
      breakfast: [
        { name: "Greek Yogurt + Berries", cal: 280, p: 22, c: 28, f: 8 },
        { name: "Black Coffee", cal: 5,  p: 0,  c: 1,  f: 0 },
      ],
      lunch: [
        { name: "Chicken & Rice Bowl", cal: 620, p: 55, c: 62, f: 14 },
      ],
      dinner: [
        { name: "Salmon + Asparagus",  cal: 540, p: 48, c: 12, f: 28 },
        { name: "Sweet Potato",        cal: 180, p: 4,  c: 38, f: 1  },
      ],
      snack: [
        { name: "Whey Shake", cal: 215, p: 33, c: 6, f: 4 },
      ],
    },
  };

  const slotIcons   = { breakfast: Sunrise, lunch: Sun, dinner: Moon, snack: Cookie };
  const slotLabels  = { breakfast: "Breakfast", lunch: "Lunch", dinner: "Dinner", snack: "Snack" };
  const slotOrder   = ["breakfast", "lunch", "dinner", "snack"];

  const goalPct = Math.min(100, (sampleDay.macros.cal / sampleDay.goalCal) * 100);

  // ── Derived data for Groups C & D ───────────────────────────────────
  const proKcal  = sampleDay.macros.pro  * 4;
  const carbKcal = sampleDay.macros.carb * 4;
  const fatKcal  = sampleDay.macros.fat  * 9;
  const totalKcal = proKcal + carbKcal + fatKcal;
  const proPct  = (proKcal  / totalKcal) * 100;
  const carbPct = (carbKcal / totalKcal) * 100;
  const fatPct  = (fatKcal  / totalKcal) * 100;

  // Per-macro target ratios (rough premium-cut: 35% pro · 35% carb · 30% fat)
  const proGoal  = (sampleDay.goalCal * 0.35) / 4;
  const carbGoal = (sampleDay.goalCal * 0.35) / 4;
  const fatGoal  = (sampleDay.goalCal * 0.30) / 9;
  const proRing  = Math.min(100, (sampleDay.macros.pro  / proGoal)  * 100);
  const carbRing = Math.min(100, (sampleDay.macros.carb / carbGoal) * 100);
  const fatRing  = Math.min(100, (sampleDay.macros.fat  / fatGoal)  * 100);

  // kcal per slot (for thermometer / sparkline)
  const slotKcals = slotOrder.map(s =>
    sampleDay.meals[s].reduce((sum, i) => sum + i.cal, 0)
  );
  const maxSlot = Math.max(...slotKcals);
</script>

<div class="page">
  <header class="page-head">
    <h1>Week Card — Mockups</h1>
    <p>12 explorations of the day card used on the <a href="/week">My Week</a> page.</p>
  </header>

  <!-- ════════════════════════════════════════════════════════════════
       GROUP A — Color framing the whole card (header, sides, bottom)
       ════════════════════════════════════════════════════════════════ -->
  <section class="group">
    <h2 class="group-title">A · Color all around the card</h2>
    <p class="group-sub">Color wraps header, sides and bottom — list area stays neutral.</p>

    <div class="mock-grid">

      <!-- 1 · Top accent bar + matching bottom rail -->
      <article class="card v1">
        <div class="v1-bar"></div>
        <header class="head">
          <div class="left">
            <span class="name">{sampleDay.name}</span>
            <span class="num">{sampleDay.num}</span>
            <span class="today-dot"></span>
          </div>
          <span class="kcal mono">{sampleDay.macros.cal}</span>
        </header>
        <div class="macros">
          <span class="m mono" data-k="p">{sampleDay.macros.pro}p</span>·
          <span class="m mono" data-k="c">{sampleDay.macros.carb}c</span>·
          <span class="m mono" data-k="f">{sampleDay.macros.fat}f</span>
        </div>
        {@render mealList()}
        <div class="v1-foot">{@render footActions()}</div>
        <span class="variant-tag">1 · Top + bottom accent bars</span>
      </article>

      <!-- 2 · Full tinted frame (subtle wash on whole card border) -->
      <article class="card v2">
        <header class="head">
          <div class="left">
            <span class="name">{sampleDay.name}</span>
            <span class="num">{sampleDay.num}</span>
            <span class="today-dot"></span>
          </div>
          <span class="kcal mono">{sampleDay.macros.cal}</span>
        </header>
        <div class="macros">
          <span class="m mono" data-k="p">{sampleDay.macros.pro}p</span>·
          <span class="m mono" data-k="c">{sampleDay.macros.carb}c</span>·
          <span class="m mono" data-k="f">{sampleDay.macros.fat}f</span>
        </div>
        <div class="v2-list">{@render mealList()}</div>
        {@render footActions()}
        <span class="variant-tag">2 · Tinted frame, neutral list</span>
      </article>

      <!-- 3 · Colored header band + colored footer band -->
      <article class="card v3">
        <header class="v3-band">
          <div class="left">
            <span class="name">{sampleDay.name}</span>
            <span class="num">{sampleDay.num}</span>
            <span class="today-dot"></span>
          </div>
          <span class="kcal mono">{sampleDay.macros.cal}</span>
        </header>
        <div class="v3-body">
          <div class="macros">
            <span class="m mono" data-k="p">{sampleDay.macros.pro}p</span>·
            <span class="m mono" data-k="c">{sampleDay.macros.carb}c</span>·
            <span class="m mono" data-k="f">{sampleDay.macros.fat}f</span>
          </div>
          {@render mealList()}
        </div>
        <div class="v3-band v3-band-foot">{@render footActions()}</div>
        <span class="variant-tag">3 · Header + footer color bands</span>
      </article>

      <!-- 4 · Outline frame in accent color, full card -->
      <article class="card v4">
        <header class="head">
          <div class="left">
            <span class="name">{sampleDay.name}</span>
            <span class="num">{sampleDay.num}</span>
            <span class="today-dot"></span>
          </div>
          <span class="kcal mono">{sampleDay.macros.cal}</span>
        </header>
        <div class="macros">
          <span class="m mono" data-k="p">{sampleDay.macros.pro}p</span>·
          <span class="m mono" data-k="c">{sampleDay.macros.carb}c</span>·
          <span class="m mono" data-k="f">{sampleDay.macros.fat}f</span>
        </div>
        <div class="v4-inner">{@render mealList()}</div>
        {@render footActions()}
        <span class="variant-tag">4 · Accent outline, inset list</span>
      </article>

      <!-- 5 · Vertical gradient frame (top to bottom) -->
      <article class="card v5">
        <header class="head">
          <div class="left">
            <span class="name">{sampleDay.name}</span>
            <span class="num">{sampleDay.num}</span>
            <span class="today-dot"></span>
          </div>
          <span class="kcal mono">{sampleDay.macros.cal}</span>
        </header>
        <div class="macros">
          <span class="m mono" data-k="p">{sampleDay.macros.pro}p</span>·
          <span class="m mono" data-k="c">{sampleDay.macros.carb}c</span>·
          <span class="m mono" data-k="f">{sampleDay.macros.fat}f</span>
        </div>
        <div class="v5-list">{@render mealList()}</div>
        {@render footActions()}
        <span class="variant-tag">5 · Gradient frame top → bottom</span>
      </article>

      <!-- 6 · Two-tone: colored header dome + colored bottom dome, neutral middle -->
      <article class="card v6">
        <header class="v6-dome">
          <div class="left">
            <span class="name">{sampleDay.name}</span>
            <span class="num">{sampleDay.num}</span>
            <span class="today-dot"></span>
          </div>
          <span class="kcal mono">{sampleDay.macros.cal}</span>
        </header>
        <div class="v6-middle">
          <div class="macros">
            <span class="m mono" data-k="p">{sampleDay.macros.pro}p</span>·
            <span class="m mono" data-k="c">{sampleDay.macros.carb}c</span>·
            <span class="m mono" data-k="f">{sampleDay.macros.fat}f</span>
          </div>
          {@render mealList()}
        </div>
        <div class="v6-dome v6-dome-foot">{@render footActions()}</div>
        <span class="variant-tag">6 · Dome header + dome footer</span>
      </article>

    </div>
  </section>

  <!-- ════════════════════════════════════════════════════════════════
       GROUP B — Free-form variations
       ════════════════════════════════════════════════════════════════ -->
  <section class="group">
    <h2 class="group-title">B · Free-form variations</h2>
    <p class="group-sub">Direction-finding ideas — each takes a different shape.</p>

    <div class="mock-grid">

      <!-- 7 · Left rail accent only, ultra minimal -->
      <article class="card v7">
        <div class="v7-rail"></div>
        <div class="v7-body">
          <header class="head">
            <div class="left">
              <span class="name">{sampleDay.name}</span>
              <span class="num">{sampleDay.num}</span>
              <span class="today-dot"></span>
            </div>
            <span class="kcal mono">{sampleDay.macros.cal}</span>
          </header>
          <div class="macros">
            <span class="m mono" data-k="p">{sampleDay.macros.pro}p</span>·
            <span class="m mono" data-k="c">{sampleDay.macros.carb}c</span>·
            <span class="m mono" data-k="f">{sampleDay.macros.fat}f</span>
          </div>
          {@render mealList()}
          {@render footActions()}
        </div>
        <span class="variant-tag">7 · Left accent rail</span>
      </article>

      <!-- 8 · Big day number watermark -->
      <article class="card v8">
        <span class="v8-watermark mono">{sampleDay.num}</span>
        <header class="head v8-head">
          <div class="left">
            <span class="name v8-name">{sampleDay.name}</span>
            <span class="today-dot"></span>
          </div>
          <span class="kcal mono">{sampleDay.macros.cal}</span>
        </header>
        <div class="macros">
          <span class="m mono" data-k="p">{sampleDay.macros.pro}p</span>·
          <span class="m mono" data-k="c">{sampleDay.macros.carb}c</span>·
          <span class="m mono" data-k="f">{sampleDay.macros.fat}f</span>
        </div>
        {@render mealList()}
        {@render footActions()}
        <span class="variant-tag">8 · Watermark day number</span>
      </article>

      <!-- 9 · Frosted glow card -->
      <article class="card v9">
        <div class="v9-glow"></div>
        <header class="head">
          <div class="left">
            <span class="name">{sampleDay.name}</span>
            <span class="num">{sampleDay.num}</span>
            <span class="today-dot"></span>
          </div>
          <span class="kcal mono">{sampleDay.macros.cal}</span>
        </header>
        <div class="macros">
          <span class="m mono" data-k="p">{sampleDay.macros.pro}p</span>·
          <span class="m mono" data-k="c">{sampleDay.macros.carb}c</span>·
          <span class="m mono" data-k="f">{sampleDay.macros.fat}f</span>
        </div>
        {@render mealList()}
        {@render footActions()}
        <span class="variant-tag">9 · Frosted glow</span>
      </article>

      <!-- 10 · Goal ring takes the spotlight -->
      <article class="card v10">
        <header class="v10-head">
          <div class="v10-ring-wrap" title="{Math.round(goalPct)}% of {sampleDay.goalCal} kcal">
            <svg class="v10-ring" viewBox="0 0 44 44" width="44" height="44">
              <circle cx="22" cy="22" r="18" class="v10-bg" />
              <circle cx="22" cy="22" r="18" class="v10-fg"
                style="stroke-dasharray: {goalPct * 1.131} 113.1;" />
            </svg>
            <div class="v10-ring-inner">
              <span class="v10-kcal mono">{sampleDay.macros.cal}</span>
              <span class="v10-kcal-unit">kcal</span>
            </div>
          </div>
          <div class="v10-id">
            <span class="name">{sampleDay.name}</span>
            <span class="num">May {sampleDay.num}</span>
          </div>
        </header>
        <div class="macros">
          <span class="m mono" data-k="p">{sampleDay.macros.pro}p</span>·
          <span class="m mono" data-k="c">{sampleDay.macros.carb}c</span>·
          <span class="m mono" data-k="f">{sampleDay.macros.fat}f</span>
        </div>
        {@render mealList()}
        {@render footActions()}
        <span class="variant-tag">10 · Spotlight on goal ring</span>
      </article>

      <!-- 11 · Stacked tab header (tab-protruding-up) -->
      <article class="card v11">
        <div class="v11-tab">
          <span class="v11-tab-name">{sampleDay.name}</span>
          <span class="v11-tab-num mono">{sampleDay.num}</span>
        </div>
        <div class="v11-body">
          <header class="head">
            <span class="kcal mono v11-kcal">{sampleDay.macros.cal} kcal</span>
            <div class="macros v11-macros">
              <span class="m mono" data-k="p">{sampleDay.macros.pro}p</span>·
              <span class="m mono" data-k="c">{sampleDay.macros.carb}c</span>·
              <span class="m mono" data-k="f">{sampleDay.macros.fat}f</span>
            </div>
          </header>
          {@render mealList()}
          {@render footActions()}
        </div>
        <span class="variant-tag">11 · Tabbed day label</span>
      </article>

      <!-- 12 · Compact rail with a thin colored progress at the very bottom -->
      <article class="card v12">
        <header class="head">
          <div class="left">
            <span class="name">{sampleDay.name}</span>
            <span class="num">{sampleDay.num}</span>
            <span class="today-dot"></span>
          </div>
          <span class="kcal mono">{sampleDay.macros.cal}</span>
        </header>
        <div class="v12-bar-wrap">
          <div class="v12-bar" style="width: {goalPct}%"></div>
        </div>
        <div class="macros">
          <span class="m mono" data-k="p">{sampleDay.macros.pro}p</span>·
          <span class="m mono" data-k="c">{sampleDay.macros.carb}c</span>·
          <span class="m mono" data-k="f">{sampleDay.macros.fat}f</span>
        </div>
        {@render mealList()}
        {@render footActions()}
        <div class="v12-foot-bar"></div>
        <span class="variant-tag">12 · Bottom progress bar</span>
      </article>

    </div>
  </section>

  <!-- ════════════════════════════════════════════════════════════════
       GROUP C — Data-forward
       ════════════════════════════════════════════════════════════════ -->
  <section class="group">
    <h2 class="group-title">C · Data-forward</h2>
    <p class="group-sub">Cards that surface metrics — distribution, progress, grade.</p>

    <div class="mock-grid">

      <!-- 13 · Macro distribution stripe across the top -->
      <article class="card v13">
        <div class="v13-stripe" title="Macro split by kcal">
          <div class="v13-seg v13-seg-p" style="width: {proPct}%"></div>
          <div class="v13-seg v13-seg-c" style="width: {carbPct}%"></div>
          <div class="v13-seg v13-seg-f" style="width: {fatPct}%"></div>
        </div>
        <header class="head v13-head">
          <div class="left">
            <span class="name">{sampleDay.name}</span>
            <span class="num">{sampleDay.num}</span>
            <span class="today-dot"></span>
          </div>
          <span class="kcal mono">{sampleDay.macros.cal}</span>
        </header>
        <div class="v13-legend">
          <span class="v13-leg" data-k="p">{Math.round(proPct)}% protein</span>
          <span class="v13-leg" data-k="c">{Math.round(carbPct)}% carbs</span>
          <span class="v13-leg" data-k="f">{Math.round(fatPct)}% fat</span>
        </div>
        {@render mealList()}
        {@render footActions()}
        <span class="variant-tag">13 · Macro split stripe</span>
      </article>

      <!-- 14 · Three mini ring trio (P/C/F progress) -->
      <article class="card v14">
        <header class="head">
          <div class="left">
            <span class="name">{sampleDay.name}</span>
            <span class="num">{sampleDay.num}</span>
            <span class="today-dot"></span>
          </div>
          <span class="kcal mono">{sampleDay.macros.cal}</span>
        </header>
        <div class="v14-rings">
          {@render miniRing('p', proRing,  sampleDay.macros.pro,  'P')}
          {@render miniRing('c', carbRing, sampleDay.macros.carb, 'C')}
          {@render miniRing('f', fatRing,  sampleDay.macros.fat,  'F')}
        </div>
        {@render mealList()}
        {@render footActions()}
        <span class="variant-tag">14 · Mini macro rings</span>
      </article>

      <!-- 15 · Letter grade badge -->
      <article class="card v15">
        <header class="v15-head">
          <div class="v15-id">
            <span class="name">{sampleDay.name}</span>
            <span class="num">May {sampleDay.num}</span>
          </div>
          <div class="v15-grade">
            <span class="v15-letter mono">A</span>
            <span class="v15-sub">balanced</span>
          </div>
        </header>
        <div class="v15-meta">
          <span class="v15-meta-i mono">{sampleDay.macros.cal}<span class="v15-meta-u">kcal</span></span>
          <span class="v15-meta-i mono" data-k="p">{sampleDay.macros.pro}<span class="v15-meta-u">p</span></span>
          <span class="v15-meta-i mono" data-k="c">{sampleDay.macros.carb}<span class="v15-meta-u">c</span></span>
          <span class="v15-meta-i mono" data-k="f">{sampleDay.macros.fat}<span class="v15-meta-u">f</span></span>
        </div>
        {@render mealList()}
        {@render footActions()}
        <span class="variant-tag">15 · Letter grade</span>
      </article>

      <!-- 16 · Slot completion dots -->
      <article class="card v16">
        <header class="head">
          <div class="left">
            <span class="name">{sampleDay.name}</span>
            <span class="num">{sampleDay.num}</span>
            <span class="today-dot"></span>
          </div>
          <span class="kcal mono">{sampleDay.macros.cal}</span>
        </header>
        <div class="v16-dots">
          {#each slotOrder as slot, i}
            {@const SlotIcon = slotIcons[slot]}
            {@const filled = sampleDay.meals[slot].length > 0}
            <div class="v16-dot" class:v16-dot-on={filled} title={slotLabels[slot]}>
              <SlotIcon size={11} strokeWidth={1.75} />
              <span class="v16-dot-kcal mono">{slotKcals[i] || '—'}</span>
            </div>
          {/each}
        </div>
        <div class="macros">
          <span class="m mono" data-k="p">{sampleDay.macros.pro}p</span>·
          <span class="m mono" data-k="c">{sampleDay.macros.carb}c</span>·
          <span class="m mono" data-k="f">{sampleDay.macros.fat}f</span>
        </div>
        {@render mealList()}
        {@render footActions()}
        <span class="variant-tag">16 · Slot completion</span>
      </article>

      <!-- 17 · Vertical thermometer, side-by-side with content -->
      <article class="card v17">
        <div class="v17-therm" title="{Math.round(goalPct)}% of {sampleDay.goalCal} kcal goal">
          <div class="v17-fill" style="height: {goalPct}%"></div>
          <span class="v17-therm-label mono">{Math.round(goalPct)}%</span>
        </div>
        <div class="v17-content">
          <header class="head">
            <div class="left">
              <span class="name">{sampleDay.name}</span>
              <span class="num">{sampleDay.num}</span>
              <span class="today-dot"></span>
            </div>
            <span class="kcal mono">{sampleDay.macros.cal}</span>
          </header>
          <div class="macros">
            <span class="m mono" data-k="p">{sampleDay.macros.pro}p</span>·
            <span class="m mono" data-k="c">{sampleDay.macros.carb}c</span>·
            <span class="m mono" data-k="f">{sampleDay.macros.fat}f</span>
          </div>
          {@render mealList()}
          {@render footActions()}
        </div>
        <span class="variant-tag">17 · Goal thermometer</span>
      </article>

      <!-- 18 · Sparkline of kcal per slot -->
      <article class="card v18">
        <header class="head">
          <div class="left">
            <span class="name">{sampleDay.name}</span>
            <span class="num">{sampleDay.num}</span>
            <span class="today-dot"></span>
          </div>
          <span class="kcal mono">{sampleDay.macros.cal}</span>
        </header>
        <div class="v18-spark">
          {#each slotOrder as slot, i}
            {@const SlotIcon = slotIcons[slot]}
            {@const h = maxSlot ? (slotKcals[i] / maxSlot) * 100 : 0}
            <div class="v18-bar-wrap" title="{slotLabels[slot]} · {slotKcals[i]} kcal">
              <div class="v18-bar" style="height: {h}%"></div>
              <SlotIcon size={10} strokeWidth={1.75} class="v18-icon" />
            </div>
          {/each}
        </div>
        <div class="macros">
          <span class="m mono" data-k="p">{sampleDay.macros.pro}p</span>·
          <span class="m mono" data-k="c">{sampleDay.macros.carb}c</span>·
          <span class="m mono" data-k="f">{sampleDay.macros.fat}f</span>
        </div>
        {@render mealList()}
        {@render footActions()}
        <span class="variant-tag">18 · Per-slot sparkline</span>
      </article>

    </div>
  </section>

  <!-- ════════════════════════════════════════════════════════════════
       GROUP D — Editorial / typographic
       ════════════════════════════════════════════════════════════════ -->
  <section class="group">
    <h2 class="group-title">D · Editorial &amp; typographic</h2>
    <p class="group-sub">Type-led layouts that feel like a print masthead more than a tile.</p>

    <div class="mock-grid">

      <!-- 19 · Oversized headline day name -->
      <article class="card v19">
        <header class="v19-head">
          <h3 class="v19-display">{sampleDay.name}</h3>
          <div class="v19-sub">
            <span class="num">May {sampleDay.num}</span>
            <span class="v19-dot">·</span>
            <span class="kcal mono">{sampleDay.macros.cal} kcal</span>
          </div>
        </header>
        <div class="macros">
          <span class="m mono" data-k="p">{sampleDay.macros.pro}p</span>·
          <span class="m mono" data-k="c">{sampleDay.macros.carb}c</span>·
          <span class="m mono" data-k="f">{sampleDay.macros.fat}f</span>
        </div>
        {@render mealList()}
        {@render footActions()}
        <span class="variant-tag">19 · Display headline</span>
      </article>

      <!-- 20 · All-caps masthead -->
      <article class="card v20">
        <header class="v20-mast">
          <span class="v20-day">MON</span>
          <span class="v20-rule"></span>
          <span class="v20-date mono">04 · MAY</span>
        </header>
        <div class="v20-meta">
          <span class="kcal mono">{sampleDay.macros.cal}</span>
          <span class="v20-meta-sub">kcal today</span>
        </div>
        <div class="macros">
          <span class="m mono" data-k="p">{sampleDay.macros.pro}p</span>·
          <span class="m mono" data-k="c">{sampleDay.macros.carb}c</span>·
          <span class="m mono" data-k="f">{sampleDay.macros.fat}f</span>
        </div>
        {@render mealList()}
        {@render footActions()}
        <span class="variant-tag">20 · All-caps masthead</span>
      </article>

      <!-- 21 · Day-initial monogram in corner -->
      <article class="card v21">
        <div class="v21-mono" aria-hidden="true">M</div>
        <header class="head">
          <div class="left">
            <span class="name">{sampleDay.name}</span>
            <span class="num">{sampleDay.num}</span>
            <span class="today-dot"></span>
          </div>
          <span class="kcal mono">{sampleDay.macros.cal}</span>
        </header>
        <div class="macros">
          <span class="m mono" data-k="p">{sampleDay.macros.pro}p</span>·
          <span class="m mono" data-k="c">{sampleDay.macros.carb}c</span>·
          <span class="m mono" data-k="f">{sampleDay.macros.fat}f</span>
        </div>
        {@render mealList()}
        {@render footActions()}
        <span class="variant-tag">21 · Initial monogram</span>
      </article>

      <!-- 22 · Floating chip header -->
      <article class="card v22">
        <div class="v22-chip">
          <span class="v22-chip-name">{sampleDay.name}</span>
          <span class="v22-chip-num mono">·  {sampleDay.num}</span>
          <span class="today-dot"></span>
        </div>
        <div class="v22-body">
          <div class="head">
            <span class="kcal mono v22-kcal">{sampleDay.macros.cal}</span>
            <div class="macros v22-macros">
              <span class="m mono" data-k="p">{sampleDay.macros.pro}p</span>·
              <span class="m mono" data-k="c">{sampleDay.macros.carb}c</span>·
              <span class="m mono" data-k="f">{sampleDay.macros.fat}f</span>
            </div>
          </div>
          {@render mealList()}
          {@render footActions()}
        </div>
        <span class="variant-tag">22 · Floating chip header</span>
      </article>

      <!-- 23 · Hairline corner brackets -->
      <article class="card v23">
        <span class="v23-bracket v23-tl"></span>
        <span class="v23-bracket v23-tr"></span>
        <span class="v23-bracket v23-bl"></span>
        <span class="v23-bracket v23-br"></span>
        <header class="head">
          <div class="left">
            <span class="name">{sampleDay.name}</span>
            <span class="num">{sampleDay.num}</span>
            <span class="today-dot"></span>
          </div>
          <span class="kcal mono">{sampleDay.macros.cal}</span>
        </header>
        <div class="macros">
          <span class="m mono" data-k="p">{sampleDay.macros.pro}p</span>·
          <span class="m mono" data-k="c">{sampleDay.macros.carb}c</span>·
          <span class="m mono" data-k="f">{sampleDay.macros.fat}f</span>
        </div>
        {@render mealList()}
        {@render footActions()}
        <span class="variant-tag">23 · Corner brackets</span>
      </article>

      <!-- 24 · Marquee header — scrolling-style status strip -->
      <article class="card v24">
        <header class="v24-marquee">
          <span class="v24-name">{sampleDay.name}</span>
          <span class="v24-rule"></span>
          <span class="v24-stat mono">{sampleDay.macros.cal} kcal</span>
          <span class="v24-rule"></span>
          <span class="v24-stat mono" data-k="p">{sampleDay.macros.pro}p</span>
          <span class="v24-rule"></span>
          <span class="v24-stat mono" data-k="c">{sampleDay.macros.carb}c</span>
          <span class="v24-rule"></span>
          <span class="v24-stat mono" data-k="f">{sampleDay.macros.fat}f</span>
        </header>
        {@render mealList()}
        {@render footActions()}
        <span class="variant-tag">24 · Editorial marquee</span>
      </article>

    </div>
  </section>

  <!-- ════════════════════════════════════════════════════════════════
       GROUP E — Refined hybrids (combining best of earlier ideas)
       ════════════════════════════════════════════════════════════════ -->
  <section class="group">
    <h2 class="group-title">E · Refined hybrids</h2>
    <p class="group-sub">Combining the strongest elements from earlier sections.</p>

    <div class="mock-grid">

      <!-- 25 · Hero ring + macro split stripe (10 + 13 + 1) -->
      <article class="card v25">
        <div class="v25-stripe">
          <div class="v25-seg" style="width: {proPct}%; background: var(--pro);"></div>
          <div class="v25-seg" style="width: {carbPct}%; background: var(--carb);"></div>
          <div class="v25-seg" style="width: {fatPct}%; background: var(--fat);"></div>
        </div>
        <header class="v25-head">
          <div class="v25-ring-wrap" title="{Math.round(goalPct)}% of {sampleDay.goalCal} kcal">
            <svg class="v25-ring" viewBox="0 0 44 44" width="48" height="48">
              <circle cx="22" cy="22" r="18" class="v25-bg" />
              <circle cx="22" cy="22" r="18" class="v25-fg"
                style="stroke-dasharray: {goalPct * 1.131} 113.1;" />
            </svg>
            <div class="v25-ring-inner">
              <span class="v25-kcal mono">{sampleDay.macros.cal}</span>
              <span class="v25-kcal-unit">kcal</span>
            </div>
          </div>
          <div class="v25-id">
            <div class="v25-id-row">
              <span class="name">{sampleDay.name}</span>
              <span class="today-dot"></span>
            </div>
            <span class="num">May {sampleDay.num}</span>
          </div>
        </header>
        <div class="macros v25-macros">
          <span class="m mono" data-k="p">{sampleDay.macros.pro}p</span>·
          <span class="m mono" data-k="c">{sampleDay.macros.carb}c</span>·
          <span class="m mono" data-k="f">{sampleDay.macros.fat}f</span>
        </div>
        {@render mealList()}
        {@render footActions()}
        <span class="variant-tag">25 · Hero ring + split stripe</span>
      </article>

      <!-- 26 · Magazine + diagnostic grade (19 + 15 + 18) -->
      <article class="card v26">
        <header class="v26-head">
          <div class="v26-head-left">
            <h3 class="v26-display">{sampleDay.name}</h3>
            <span class="v26-date mono">MAY · 04</span>
          </div>
          <div class="v26-grade">
            <span class="v26-letter mono">A</span>
          </div>
        </header>
        <div class="v26-spark">
          {#each slotOrder as slot, i}
            {@const h = maxSlot ? (slotKcals[i] / maxSlot) * 100 : 0}
            <div class="v26-bar-wrap" title="{slotLabels[slot]}: {slotKcals[i]} kcal">
              <div class="v26-bar" style="height: {h}%"></div>
            </div>
          {/each}
        </div>
        <div class="macros">
          <span class="m mono" data-k="p">{sampleDay.macros.pro}p</span>·
          <span class="m mono" data-k="c">{sampleDay.macros.carb}c</span>·
          <span class="m mono" data-k="f">{sampleDay.macros.fat}f</span>
        </div>
        {@render mealList()}
        {@render footActions()}
        <span class="variant-tag">26 · Magazine diagnostic</span>
      </article>

      <!-- 27 · Pill + brackets (22 + 23) -->
      <article class="card v27">
        <span class="v27-bracket v27-tl"></span>
        <span class="v27-bracket v27-tr"></span>
        <span class="v27-bracket v27-bl"></span>
        <span class="v27-bracket v27-br"></span>
        <div class="v27-chip">
          <span>{sampleDay.name}</span>
          <span class="v27-chip-sep">·</span>
          <span class="mono v27-chip-num">{sampleDay.num}</span>
          <span class="today-dot"></span>
        </div>
        <div class="v27-body">
          <div class="v27-stat">
            <span class="kcal mono v27-kcal">{sampleDay.macros.cal}</span>
            <span class="v27-kcal-u">kcal</span>
          </div>
          <div class="macros">
            <span class="m mono" data-k="p">{sampleDay.macros.pro}p</span>·
            <span class="m mono" data-k="c">{sampleDay.macros.carb}c</span>·
            <span class="m mono" data-k="f">{sampleDay.macros.fat}f</span>
          </div>
          {@render mealList()}
          {@render footActions()}
        </div>
        <span class="variant-tag">27 · Pill + brackets</span>
      </article>

      <!-- 28 · Watermark + hero ring + slot dots (8 + 10 + 16) -->
      <article class="card v28">
        <span class="v28-watermark mono">{sampleDay.num}</span>
        <header class="v28-head">
          <div class="v28-id">
            <span class="name">{sampleDay.name}</span>
            <span class="today-dot"></span>
          </div>
          <div class="v28-ring-wrap" title="{Math.round(goalPct)}%">
            <svg class="v28-ring" viewBox="0 0 36 36" width="36" height="36">
              <circle cx="18" cy="18" r="15" class="v28-bg" />
              <circle cx="18" cy="18" r="15" class="v28-fg"
                style="stroke-dasharray: {goalPct * 0.942} 94.2;" />
            </svg>
            <span class="v28-ring-pct mono">{Math.round(goalPct)}</span>
          </div>
        </header>
        <div class="v28-meta">
          <span class="kcal mono">{sampleDay.macros.cal}</span>
          <span class="v28-meta-sep">·</span>
          <span class="m mono" data-k="p">{sampleDay.macros.pro}p</span>
          <span class="m mono" data-k="c">{sampleDay.macros.carb}c</span>
          <span class="m mono" data-k="f">{sampleDay.macros.fat}f</span>
        </div>
        <div class="v28-slots">
          {#each slotOrder as slot}
            {@const SlotIcon = slotIcons[slot]}
            {@const filled = sampleDay.meals[slot].length > 0}
            <span class="v28-slot" class:v28-slot-on={filled}>
              <SlotIcon size={9} strokeWidth={1.75} />
            </span>
          {/each}
        </div>
        {@render mealList()}
        {@render footActions()}
        <span class="variant-tag">28 · Watermark + hero ring</span>
      </article>

      <!-- 29 · Two-tone with sparkline footer (6 + 18) -->
      <article class="card v29">
        <header class="v29-band">
          <div class="left">
            <span class="name">{sampleDay.name}</span>
            <span class="num">{sampleDay.num}</span>
            <span class="today-dot"></span>
          </div>
          <span class="kcal mono">{sampleDay.macros.cal}</span>
        </header>
        <div class="v29-body">
          <div class="macros">
            <span class="m mono" data-k="p">{sampleDay.macros.pro}p</span>·
            <span class="m mono" data-k="c">{sampleDay.macros.carb}c</span>·
            <span class="m mono" data-k="f">{sampleDay.macros.fat}f</span>
          </div>
          {@render mealList()}
        </div>
        <div class="v29-foot">
          <div class="v29-spark">
            {#each slotOrder as slot, i}
              {@const h = maxSlot ? (slotKcals[i] / maxSlot) * 100 : 0}
              <div class="v29-bar" style="height: {h}%" title="{slotLabels[slot]}"></div>
            {/each}
          </div>
          {@render footActions()}
        </div>
        <span class="variant-tag">29 · Two-tone + sparkline foot</span>
      </article>

      <!-- 30 · Display headline + slot dots strip (19 + 16) -->
      <article class="card v30">
        <header class="v30-head">
          <div>
            <h3 class="v30-display">{sampleDay.name}</h3>
            <div class="v30-eyebrow">
              <span class="v30-date">MAY 04</span>
              <span class="v30-bullet">·</span>
              <span class="kcal mono">{sampleDay.macros.cal} kcal</span>
              <span class="today-dot"></span>
            </div>
          </div>
        </header>
        <div class="v30-strip">
          {#each slotOrder as slot}
            {@const SlotIcon = slotIcons[slot]}
            {@const filled = sampleDay.meals[slot].length > 0}
            <div class="v30-slot" class:v30-slot-on={filled}>
              <SlotIcon size={11} strokeWidth={1.75} />
              <span>{slotLabels[slot]}</span>
            </div>
          {/each}
        </div>
        <div class="macros">
          <span class="m mono" data-k="p">{sampleDay.macros.pro}p</span>·
          <span class="m mono" data-k="c">{sampleDay.macros.carb}c</span>·
          <span class="m mono" data-k="f">{sampleDay.macros.fat}f</span>
        </div>
        {@render mealList()}
        {@render footActions()}
        <span class="variant-tag">30 · Display + slot strip</span>
      </article>

    </div>
  </section>

  <!-- ════════════════════════════════════════════════════════════════
       GROUP F — Reference-grade designs
       ════════════════════════════════════════════════════════════════ -->
  <section class="group">
    <h2 class="group-title">F · Reference-grade</h2>
    <p class="group-sub">Pushing for the best — informed by Linear, Stripe, Apple Health, Vercel.</p>

    <div class="mock-grid">

      <!-- 31 · Linear-style: dense, monospace, restrained -->
      <article class="card v31">
        <header class="v31-head">
          <div class="v31-id">
            <span class="v31-name">{sampleDay.name}</span>
            <span class="v31-date mono">05/04</span>
            {#if sampleDay.isToday}<span class="v31-today">TODAY</span>{/if}
          </div>
          <div class="v31-stats">
            <span class="v31-stat">
              <span class="v31-stat-v mono">{sampleDay.macros.cal}</span>
              <span class="v31-stat-l">kcal</span>
            </span>
            <span class="v31-stat" data-k="p">
              <span class="v31-stat-v mono">{sampleDay.macros.pro}</span>
              <span class="v31-stat-l">p</span>
            </span>
            <span class="v31-stat" data-k="c">
              <span class="v31-stat-v mono">{sampleDay.macros.carb}</span>
              <span class="v31-stat-l">c</span>
            </span>
            <span class="v31-stat" data-k="f">
              <span class="v31-stat-v mono">{sampleDay.macros.fat}</span>
              <span class="v31-stat-l">f</span>
            </span>
          </div>
        </header>
        <div class="v31-progress">
          <div class="v31-progress-fill" style="width: {goalPct}%"></div>
        </div>
        {@render mealList()}
        {@render footActions()}
        <span class="variant-tag">31 · Linear-style</span>
      </article>

      <!-- 32 · Apple Health: rounded inset metrics panel -->
      <article class="card v32">
        <div class="v32-panel">
          <div class="v32-panel-top">
            <div class="v32-panel-id">
              <span class="v32-day">{sampleDay.name}</span>
              <span class="v32-date">May {sampleDay.num}</span>
            </div>
            {#if sampleDay.isToday}<span class="v32-today-pill">Today</span>{/if}
          </div>
          <div class="v32-kcal-row">
            <span class="v32-kcal mono">{sampleDay.macros.cal}</span>
            <span class="v32-kcal-goal">/ {sampleDay.goalCal} kcal</span>
          </div>
          <div class="v32-bar">
            <div class="v32-bar-fill" style="width: {goalPct}%"></div>
          </div>
          <div class="v32-macros">
            <div class="v32-m" data-k="p">
              <span class="v32-m-v mono">{sampleDay.macros.pro}g</span>
              <span class="v32-m-l">Protein</span>
            </div>
            <div class="v32-m" data-k="c">
              <span class="v32-m-v mono">{sampleDay.macros.carb}g</span>
              <span class="v32-m-l">Carbs</span>
            </div>
            <div class="v32-m" data-k="f">
              <span class="v32-m-v mono">{sampleDay.macros.fat}g</span>
              <span class="v32-m-l">Fat</span>
            </div>
          </div>
        </div>
        {@render mealList()}
        {@render footActions()}
        <span class="variant-tag">32 · Apple Health</span>
      </article>

      <!-- 33 · Stripe-style: thin top accent, monospace data grid -->
      <article class="card v33">
        <div class="v33-accent"></div>
        <header class="v33-head">
          <div class="v33-id">
            <span class="v33-name">{sampleDay.name}</span>
            <span class="today-dot"></span>
          </div>
          <span class="v33-date mono">May 4, 2026</span>
        </header>
        <div class="v33-grid">
          <div class="v33-cell">
            <span class="v33-l">Calories</span>
            <span class="v33-v mono">{sampleDay.macros.cal}</span>
          </div>
          <div class="v33-cell" data-k="p">
            <span class="v33-l">Protein</span>
            <span class="v33-v mono">{sampleDay.macros.pro}g</span>
          </div>
          <div class="v33-cell" data-k="c">
            <span class="v33-l">Carbs</span>
            <span class="v33-v mono">{sampleDay.macros.carb}g</span>
          </div>
          <div class="v33-cell" data-k="f">
            <span class="v33-l">Fat</span>
            <span class="v33-v mono">{sampleDay.macros.fat}g</span>
          </div>
        </div>
        {@render mealList()}
        {@render footActions()}
        <span class="variant-tag">33 · Stripe dashboard</span>
      </article>

      <!-- 34 · Vercel-style: status chip header, monospace details -->
      <article class="card v34">
        <header class="v34-head">
          <div class="v34-status">
            <span class="v34-pulse"></span>
            <span class="v34-status-text">{sampleDay.isToday ? 'Today' : 'Planned'}</span>
          </div>
          <div class="v34-id">
            <span class="v34-name">{sampleDay.name}</span>
            <span class="v34-date mono">2026-05-04</span>
          </div>
        </header>
        <div class="v34-meta">
          <div class="v34-meta-row">
            <span class="v34-meta-l">kcal</span>
            <span class="v34-meta-v mono">{sampleDay.macros.cal}</span>
            <span class="v34-meta-pct mono">{Math.round(goalPct)}%</span>
          </div>
          <div class="v34-meta-row">
            <span class="v34-meta-l">macros</span>
            <span class="v34-meta-v mono">
              <span data-k="p">{sampleDay.macros.pro}</span><span class="v34-sep">/</span><span data-k="c">{sampleDay.macros.carb}</span><span class="v34-sep">/</span><span data-k="f">{sampleDay.macros.fat}</span>
            </span>
          </div>
        </div>
        {@render mealList()}
        {@render footActions()}
        <span class="variant-tag">34 · Vercel-style</span>
      </article>

      <!-- 35 · Notion-style: icon-led title, contextual badges -->
      <article class="card v35">
        <header class="v35-head">
          <div class="v35-icon">
            <Calendar size={16} strokeWidth={1.5} />
          </div>
          <div class="v35-id">
            <h3 class="v35-name">{sampleDay.name}, May {sampleDay.num}</h3>
            <div class="v35-badges">
              {#if sampleDay.isToday}
                <span class="v35-badge v35-badge-today">Today</span>
              {/if}
              {#if sampleDay.template}
                <span class="v35-badge">
                  <Bookmark size={9} strokeWidth={2} />
                  {sampleDay.template}
                </span>
              {/if}
              <span class="v35-badge v35-badge-cal">
                <Flame size={9} strokeWidth={2} />
                {sampleDay.macros.cal} kcal
              </span>
            </div>
          </div>
        </header>
        <div class="macros v35-macros">
          <span class="m mono" data-k="p">{sampleDay.macros.pro}p</span>·
          <span class="m mono" data-k="c">{sampleDay.macros.carb}c</span>·
          <span class="m mono" data-k="f">{sampleDay.macros.fat}f</span>
        </div>
        {@render mealList()}
        {@render footActions()}
        <span class="variant-tag">35 · Notion-style</span>
      </article>

      <!-- 36 · The Apex — synthesizing the best -->
      <article class="card v36">
        <div class="v36-stripe">
          <div class="v36-seg" style="width: {proPct}%; background: var(--pro);"></div>
          <div class="v36-seg" style="width: {carbPct}%; background: var(--carb);"></div>
          <div class="v36-seg" style="width: {fatPct}%; background: var(--fat);"></div>
        </div>
        <header class="v36-head">
          <div class="v36-id">
            <div class="v36-id-row">
              <span class="v36-name">{sampleDay.name}</span>
              {#if sampleDay.isToday}<span class="v36-today">Today</span>{/if}
            </div>
            <span class="v36-date mono">May {sampleDay.num}</span>
          </div>
          <div class="v36-ring-wrap" title="{Math.round(goalPct)}% of goal">
            <svg class="v36-ring" viewBox="0 0 44 44" width="44" height="44">
              <circle cx="22" cy="22" r="18" class="v36-bg" />
              <circle cx="22" cy="22" r="18" class="v36-fg"
                style="stroke-dasharray: {goalPct * 1.131} 113.1;" />
            </svg>
            <div class="v36-ring-inner">
              <span class="v36-kcal mono">{sampleDay.macros.cal}</span>
              <span class="v36-kcal-unit">kcal</span>
            </div>
          </div>
        </header>
        <div class="v36-macros">
          <span class="v36-m" data-k="p">
            <span class="v36-m-v mono">{sampleDay.macros.pro}g</span>
            <span class="v36-m-l">protein</span>
          </span>
          <span class="v36-m" data-k="c">
            <span class="v36-m-v mono">{sampleDay.macros.carb}g</span>
            <span class="v36-m-l">carbs</span>
          </span>
          <span class="v36-m" data-k="f">
            <span class="v36-m-v mono">{sampleDay.macros.fat}g</span>
            <span class="v36-m-l">fat</span>
          </span>
        </div>
        {@render mealList()}
        {@render footActions()}
        <div class="v36-foot-spark">
          {#each slotOrder as slot, i}
            {@const h = maxSlot ? (slotKcals[i] / maxSlot) * 100 : 0}
            <div class="v36-bar-wrap" title="{slotLabels[slot]}: {slotKcals[i]}">
              <div class="v36-bar" style="height: {h}%"></div>
            </div>
          {/each}
        </div>
        <span class="variant-tag v36-tag">36 · The Apex ★</span>
      </article>

    </div>
  </section>

  <!-- ════════════════════════════════════════════════════════════════
       GROUP G — Whisper-quiet (one accent each, designed for 7-up)
       ════════════════════════════════════════════════════════════════ -->
  <section class="group">
    <h2 class="group-title">G · Whisper-quiet</h2>
    <p class="group-sub">
      One small accent each. Designed to sit calmly next to six siblings
      without competing — you can scan the row instead of being shouted at.
    </p>

    <div class="mock-grid">

      <!-- 37 · Soft accent border, nothing else -->
      <article class="card v37">
        <header class="head">
          <div class="left">
            <span class="name">{sampleDay.name}</span>
            <span class="num">{sampleDay.num}</span>
            <span class="today-dot"></span>
          </div>
          <span class="kcal mono">{sampleDay.macros.cal}</span>
        </header>
        <div class="macros">
          <span class="m mono" data-k="p">{sampleDay.macros.pro}p</span>·
          <span class="m mono" data-k="c">{sampleDay.macros.carb}c</span>·
          <span class="m mono" data-k="f">{sampleDay.macros.fat}f</span>
        </div>
        {@render mealList()}
        {@render footActions()}
        <span class="variant-tag">37 · Soft accent border</span>
      </article>

      <!-- 38 · Inset depth (no outer border, soft inner frame) -->
      <article class="card v38">
        <header class="head">
          <div class="left">
            <span class="name">{sampleDay.name}</span>
            <span class="num">{sampleDay.num}</span>
            <span class="today-dot"></span>
          </div>
          <span class="kcal mono">
            {sampleDay.macros.cal}<span class="v38-goal"> / {sampleDay.goalCal}</span>
          </span>
        </header>
        <div class="macros">
          <span class="m mono" data-k="p">{sampleDay.macros.pro}p</span>·
          <span class="m mono" data-k="c">{sampleDay.macros.carb}c</span>·
          <span class="m mono" data-k="f">{sampleDay.macros.fat}f</span>
        </div>
        {@render mealList()}
        {@render footActions()}
        <span class="variant-tag">38 · Inset depth</span>
      </article>

      <!-- 39 · Tonal step (elevated bg, no border) -->
      <article class="card v39">
        <header class="head">
          <div class="left">
            <span class="name">{sampleDay.name}</span>
            <span class="num">{sampleDay.num}</span>
            <span class="today-dot"></span>
          </div>
          <span class="kcal mono">{sampleDay.macros.cal}</span>
        </header>
        <div class="v39-rule">
          <div class="v39-rule-fill" style="width: {goalPct}%"></div>
        </div>
        <div class="macros">
          <span class="m mono" data-k="p">{sampleDay.macros.pro}p</span>·
          <span class="m mono" data-k="c">{sampleDay.macros.carb}c</span>·
          <span class="m mono" data-k="f">{sampleDay.macros.fat}f</span>
        </div>
        {@render mealList()}
        {@render footActions()}
        <span class="variant-tag">39 · Tonal step</span>
      </article>

      <!-- 40 · Date watermark only -->
      <article class="card v40">
        <span class="v40-watermark mono">{sampleDay.num}</span>
        <header class="head">
          <div class="left">
            <span class="name">{sampleDay.name}</span>
            <span class="today-dot"></span>
          </div>
          <span class="kcal mono">{sampleDay.macros.cal}</span>
        </header>
        <div class="macros">
          <span class="m mono" data-k="p">{sampleDay.macros.pro}p</span>·
          <span class="m mono" data-k="c">{sampleDay.macros.carb}c</span>·
          <span class="m mono" data-k="f">{sampleDay.macros.fat}f</span>
        </div>
        {@render mealList()}
        {@render footActions()}
        <span class="variant-tag">40 · Date watermark</span>
      </article>

      <!-- 41 · Whisper ring -->
      <article class="card v41">
        <header class="head">
          <div class="left">
            <span class="name">{sampleDay.name}</span>
            <span class="num">{sampleDay.num}</span>
            <span class="today-dot"></span>
          </div>
          <div class="v41-ring-wrap" title="{Math.round(goalPct)}% of goal">
            <svg class="v41-ring" viewBox="0 0 24 24" width="22" height="22">
              <circle cx="12" cy="12" r="10" class="v41-bg" />
              <circle cx="12" cy="12" r="10" class="v41-fg"
                style="stroke-dasharray: {goalPct * 0.628} 62.8;" />
            </svg>
            <span class="kcal mono v41-kcal">{sampleDay.macros.cal}</span>
          </div>
        </header>
        <div class="macros">
          <span class="m mono" data-k="p">{sampleDay.macros.pro}p</span>·
          <span class="m mono" data-k="c">{sampleDay.macros.carb}c</span>·
          <span class="m mono" data-k="f">{sampleDay.macros.fat}f</span>
        </div>
        {@render mealList()}
        {@render footActions()}
        <span class="variant-tag">41 · Whisper ring</span>
      </article>

      <!-- 42 · Inline ticker sparkline -->
      <article class="card v42">
        <header class="head">
          <div class="left">
            <span class="name">{sampleDay.name}</span>
            <span class="num">{sampleDay.num}</span>
            <span class="today-dot"></span>
          </div>
          <div class="v42-ticker">
            <svg class="v42-spark" viewBox="0 0 40 14" preserveAspectRatio="none" width="40" height="14">
              <polyline
                points={slotKcals.map((k, i) => `${i * (40/3)},${14 - (k / maxSlot) * 12}`).join(' ')}
                fill="none" stroke="var(--cal)" stroke-width="1.2"
                stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            <span class="kcal mono">{sampleDay.macros.cal}</span>
          </div>
        </header>
        <div class="macros">
          <span class="m mono" data-k="p">{sampleDay.macros.pro}p</span>·
          <span class="m mono" data-k="c">{sampleDay.macros.carb}c</span>·
          <span class="m mono" data-k="f">{sampleDay.macros.fat}f</span>
        </div>
        {@render mealList()}
        {@render footActions()}
        <span class="variant-tag">42 · Inline ticker</span>
      </article>

      <!-- 43 · Trace line at the bottom -->
      <article class="card v43">
        <header class="head">
          <div class="left">
            <span class="name">{sampleDay.name}</span>
            <span class="num">{sampleDay.num}</span>
            <span class="today-dot"></span>
          </div>
          <span class="kcal mono">{sampleDay.macros.cal}</span>
        </header>
        <div class="macros">
          <span class="m mono" data-k="p">{sampleDay.macros.pro}p</span>·
          <span class="m mono" data-k="c">{sampleDay.macros.carb}c</span>·
          <span class="m mono" data-k="f">{sampleDay.macros.fat}f</span>
        </div>
        {@render mealList()}
        {@render footActions()}
        <svg class="v43-trace" viewBox="0 0 100 8" preserveAspectRatio="none">
          <polyline
            points={slotKcals.map((k, i) => `${i * (100/3)},${8 - (k / maxSlot) * 7}`).join(' ')}
            fill="none" stroke="var(--cal)" stroke-width="1"
            stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        <span class="variant-tag">43 · Trace footline</span>
      </article>

      <!-- 44 · Corner glow -->
      <article class="card v44">
        <div class="v44-glow"></div>
        <header class="head">
          <div class="left">
            <span class="name">{sampleDay.name}</span>
            <span class="num">{sampleDay.num}</span>
            <span class="today-dot"></span>
          </div>
          <span class="kcal mono">{sampleDay.macros.cal}</span>
        </header>
        <div class="macros">
          <span class="m mono" data-k="p">{sampleDay.macros.pro}p</span>·
          <span class="m mono" data-k="c">{sampleDay.macros.carb}c</span>·
          <span class="m mono" data-k="f">{sampleDay.macros.fat}f</span>
        </div>
        {@render mealList()}
        {@render footActions()}
        <span class="variant-tag">44 · Corner glow</span>
      </article>

      <!-- 45 · Date stub split -->
      <article class="card v45">
        <aside class="v45-stub">
          <span class="v45-stub-name mono">MON</span>
          <span class="v45-stub-num">{sampleDay.num}</span>
          {#if sampleDay.isToday}<span class="v45-stub-today"></span>{/if}
        </aside>
        <div class="v45-body">
          <header class="v45-head">
            <span class="kcal mono">{sampleDay.macros.cal}</span>
            <div class="macros v45-macros">
              <span class="m mono" data-k="p">{sampleDay.macros.pro}p</span>·
              <span class="m mono" data-k="c">{sampleDay.macros.carb}c</span>·
              <span class="m mono" data-k="f">{sampleDay.macros.fat}f</span>
            </div>
          </header>
          {@render mealList()}
          {@render footActions()}
        </div>
        <span class="variant-tag">45 · Date stub split</span>
      </article>

      <!-- 46 · Pip indicator (slot count, no labels) -->
      <article class="card v46">
        <header class="head">
          <div class="left">
            <span class="name">{sampleDay.name}</span>
            <span class="num">{sampleDay.num}</span>
            <span class="today-dot"></span>
          </div>
          <div class="v46-right">
            <div class="v46-pips" title="Meals planned">
              {#each slotOrder as slot}
                <span class="v46-pip" class:v46-pip-on={sampleDay.meals[slot].length > 0}></span>
              {/each}
            </div>
            <span class="kcal mono">{sampleDay.macros.cal}</span>
          </div>
        </header>
        <div class="macros">
          <span class="m mono" data-k="p">{sampleDay.macros.pro}p</span>·
          <span class="m mono" data-k="c">{sampleDay.macros.carb}c</span>·
          <span class="m mono" data-k="f">{sampleDay.macros.fat}f</span>
        </div>
        {@render mealList()}
        {@render footActions()}
        <span class="variant-tag">46 · Slot pips</span>
      </article>

      <!-- 47 · Tonal header band, body is plain -->
      <article class="card v47">
        <header class="v47-head">
          <div class="left">
            <span class="name">{sampleDay.name}</span>
            <span class="num">{sampleDay.num}</span>
            <span class="today-dot"></span>
          </div>
          <span class="kcal mono">{sampleDay.macros.cal}</span>
        </header>
        <div class="v47-body">
          <div class="macros">
            <span class="m mono" data-k="p">{sampleDay.macros.pro}p</span>·
            <span class="m mono" data-k="c">{sampleDay.macros.carb}c</span>·
            <span class="m mono" data-k="f">{sampleDay.macros.fat}f</span>
          </div>
          {@render mealList()}
          {@render footActions()}
        </div>
        <span class="variant-tag">47 · Tonal header band</span>
      </article>

      <!-- 48 · Pure typography, single hairline -->
      <article class="card v48">
        <header class="v48-head">
          <div class="v48-id">
            <span class="v48-name">{sampleDay.name}</span>
            <span class="v48-date mono">May {sampleDay.num}</span>
            {#if sampleDay.isToday}<span class="today-dot"></span>{/if}
          </div>
          <div class="v48-stat">
            <span class="kcal mono v48-kcal">{sampleDay.macros.cal}</span>
            <span class="v48-kcal-u">kcal</span>
          </div>
        </header>
        <div class="v48-rule"></div>
        <div class="macros">
          <span class="m mono" data-k="p">{sampleDay.macros.pro}p</span>·
          <span class="m mono" data-k="c">{sampleDay.macros.carb}c</span>·
          <span class="m mono" data-k="f">{sampleDay.macros.fat}f</span>
        </div>
        {@render mealList()}
        {@render footActions()}
        <span class="variant-tag">48 · Pure typography</span>
      </article>

    </div>
  </section>

  <!-- ════════════════════════════════════════════════════════════════
       GROUP H — G38 base + watermark number + goal ring (8 variations)
       ════════════════════════════════════════════════════════════════ -->
  <section class="group">
    <h2 class="group-title">H · G38 + Watermark + Goal Ring</h2>
    <p class="group-sub">
      Base: G38's inset frame (no bg change). Added: watermark number (E4) + goal ring (without busying it).
      8 ways to compose them.
    </p>

    <div class="mock-grid">

      <!-- 49 · Hero ring right, watermark faded behind -->
      <article class="card v49">
        <span class="v49-watermark mono">{sampleDay.num}</span>
        <header class="head">
          <div class="left">
            <span class="name">{sampleDay.name}</span>
            <span class="num">{sampleDay.num}</span>
            <span class="today-dot"></span>
          </div>
          <div class="v49-ring" title="{Math.round(goalPct)}% of goal">
            <svg viewBox="0 0 44 44" width="44" height="44">
              <circle cx="22" cy="22" r="18" class="v49-bg" />
              <circle cx="22" cy="22" r="18" class="v49-fg"
                style="stroke-dasharray: {goalPct * 1.131} 113.1;" />
            </svg>
            <span class="v49-kcal mono">{sampleDay.macros.cal}</span>
          </div>
        </header>
        <div class="macros">
          <span class="m mono" data-k="p">{sampleDay.macros.pro}p</span>·
          <span class="m mono" data-k="c">{sampleDay.macros.carb}c</span>·
          <span class="m mono" data-k="f">{sampleDay.macros.fat}f</span>
        </div>
        {@render mealList()}
        {@render footActions()}
        <span class="variant-tag">49 · Ring right</span>
      </article>

      <!-- 50 · Ring left, kcal inline right -->
      <article class="card v50">
        <span class="v50-watermark mono">{sampleDay.num}</span>
        <header class="head">
          <div class="v50-ring" title="{Math.round(goalPct)}%">
            <svg viewBox="0 0 32 32" width="32" height="32">
              <circle cx="16" cy="16" r="13" class="v50-bg" />
              <circle cx="16" cy="16" r="13" class="v50-fg"
                style="stroke-dasharray: {goalPct * 0.817} 81.7;" />
            </svg>
            <span class="v50-kcal mono">{sampleDay.macros.cal}</span>
          </div>
          <div class="left">
            <span class="name">{sampleDay.name}</span>
            <span class="num">{sampleDay.num}</span>
            <span class="today-dot"></span>
          </div>
        </header>
        <div class="macros">
          <span class="m mono" data-k="p">{sampleDay.macros.pro}p</span>·
          <span class="m mono" data-k="c">{sampleDay.macros.carb}c</span>·
          <span class="m mono" data-k="f">{sampleDay.macros.fat}f</span>
        </div>
        {@render mealList()}
        {@render footActions()}
        <span class="variant-tag">50 · Ring left</span>
      </article>

      <!-- 51 · Tiny ring accent next to kcal -->
      <article class="card v51">
        <span class="v51-watermark mono">{sampleDay.num}</span>
        <header class="head">
          <div class="left">
            <span class="name">{sampleDay.name}</span>
            <span class="num">{sampleDay.num}</span>
            <span class="today-dot"></span>
          </div>
          <div class="v51-duo">
            <span class="kcal mono">{sampleDay.macros.cal}</span>
            <div class="v51-tiny-ring" title="{Math.round(goalPct)}%">
              <svg viewBox="0 0 20 20" width="20" height="20">
                <circle cx="10" cy="10" r="8" class="v51-bg" />
                <circle cx="10" cy="10" r="8" class="v51-fg"
                  style="stroke-dasharray: {goalPct * 0.503} 50.3;" />
              </svg>
              <span class="v51-pct">{Math.round(goalPct)}</span>
            </div>
          </div>
        </header>
        <div class="macros">
          <span class="m mono" data-k="p">{sampleDay.macros.pro}p</span>·
          <span class="m mono" data-k="c">{sampleDay.macros.carb}c</span>·
          <span class="m mono" data-k="f">{sampleDay.macros.fat}f</span>
        </div>
        {@render mealList()}
        {@render footActions()}
        <span class="variant-tag">51 · Tiny ring</span>
      </article>

      <!-- 52 · Ring below header as indicator row -->
      <article class="card v52">
        <span class="v52-watermark mono">{sampleDay.num}</span>
        <header class="head">
          <div class="left">
            <span class="name">{sampleDay.name}</span>
            <span class="num">{sampleDay.num}</span>
            <span class="today-dot"></span>
          </div>
          <span class="kcal mono">{sampleDay.macros.cal}</span>
        </header>
        <div class="v52-ring-row">
          <svg class="v52-ring" viewBox="0 0 36 36" width="36" height="36">
            <circle cx="18" cy="18" r="15" class="v52-bg" />
            <circle cx="18" cy="18" r="15" class="v52-fg"
              style="stroke-dasharray: {goalPct * 0.942} 94.2;" />
          </svg>
          <span class="v52-pct mono">{Math.round(goalPct)}%</span>
        </div>
        <div class="macros">
          <span class="m mono" data-k="p">{sampleDay.macros.pro}p</span>·
          <span class="m mono" data-k="c">{sampleDay.macros.carb}c</span>·
          <span class="m mono" data-k="f">{sampleDay.macros.fat}f</span>
        </div>
        {@render mealList()}
        {@render footActions()}
        <span class="variant-tag">52 · Ring row</span>
      </article>

      <!-- 53 · Ring in top-right corner float -->
      <article class="card v53">
        <span class="v53-watermark mono">{sampleDay.num}</span>
        <div class="v53-corner-ring" title="{Math.round(goalPct)}%">
          <svg viewBox="0 0 36 36" width="36" height="36">
            <circle cx="18" cy="18" r="15" class="v53-bg" />
            <circle cx="18" cy="18" r="15" class="v53-fg"
              style="stroke-dasharray: {goalPct * 0.942} 94.2;" />
          </svg>
          <span class="v53-kcal mono">{sampleDay.macros.cal}</span>
        </div>
        <header class="head">
          <div class="left">
            <span class="name">{sampleDay.name}</span>
            <span class="num">{sampleDay.num}</span>
            <span class="today-dot"></span>
          </div>
        </header>
        <div class="macros">
          <span class="m mono" data-k="p">{sampleDay.macros.pro}p</span>·
          <span class="m mono" data-k="c">{sampleDay.macros.carb}c</span>·
          <span class="m mono" data-k="f">{sampleDay.macros.fat}f</span>
        </div>
        {@render mealList()}
        {@render footActions()}
        <span class="variant-tag">53 · Corner ring</span>
      </article>

      <!-- 54 · Ring side-by-side with date number, tight -->
      <article class="card v54">
        <header class="head">
          <div class="left">
            <span class="name">{sampleDay.name}</span>
            <span class="today-dot"></span>
          </div>
          <div class="v54-pair">
            <div class="v54-ring" title="{Math.round(goalPct)}%">
              <svg viewBox="0 0 28 28" width="28" height="28">
                <circle cx="14" cy="14" r="11" class="v54-bg" />
                <circle cx="14" cy="14" r="11" class="v54-fg"
                  style="stroke-dasharray: {goalPct * 0.691} 69.1;" />
              </svg>
              <span class="v54-kcal mono">{sampleDay.macros.cal}</span>
            </div>
            <span class="v54-num mono">{sampleDay.num}</span>
          </div>
        </header>
        <div class="macros">
          <span class="m mono" data-k="p">{sampleDay.macros.pro}p</span>·
          <span class="m mono" data-k="c">{sampleDay.macros.carb}c</span>·
          <span class="m mono" data-k="f">{sampleDay.macros.fat}f</span>
        </div>
        {@render mealList()}
        {@render footActions()}
        <span class="variant-tag">54 · Pair</span>
      </article>

      <!-- 55 · Ring as underline arc below kcal -->
      <article class="card v55">
        <span class="v55-watermark mono">{sampleDay.num}</span>
        <header class="head">
          <div class="left">
            <span class="name">{sampleDay.name}</span>
            <span class="num">{sampleDay.num}</span>
            <span class="today-dot"></span>
          </div>
          <div class="v55-kcal-arc">
            <span class="kcal mono">{sampleDay.macros.cal}</span>
            <svg class="v55-arc" viewBox="0 0 40 14" preserveAspectRatio="none" width="40" height="8">
              <path class="v55-bg" d="M 2 12 Q 20 4 38 12" />
              <path class="v55-fg" d="M 2 12 Q 20 4 38 12"
                style="stroke-dasharray: {goalPct * 0.754} 75.4;" />
            </svg>
          </div>
        </header>
        <div class="macros">
          <span class="m mono" data-k="p">{sampleDay.macros.pro}p</span>·
          <span class="m mono" data-k="c">{sampleDay.macros.carb}c</span>·
          <span class="m mono" data-k="f">{sampleDay.macros.fat}f</span>
        </div>
        {@render mealList()}
        {@render footActions()}
        <span class="variant-tag">55 · Arc underline</span>
      </article>

      <!-- 56 · Ring as vertical bar on left edge -->
      <article class="card v56">
        <span class="v56-watermark mono">{sampleDay.num}</span>
        <div class="v56-edge" style="height: {goalPct}%;"></div>
        <header class="head">
          <div class="left">
            <span class="name">{sampleDay.name}</span>
            <span class="num">{sampleDay.num}</span>
            <span class="today-dot"></span>
          </div>
          <span class="kcal mono">{sampleDay.macros.cal}</span>
        </header>
        <div class="macros">
          <span class="m mono" data-k="p">{sampleDay.macros.pro}p</span>·
          <span class="m mono" data-k="c">{sampleDay.macros.carb}c</span>·
          <span class="m mono" data-k="f">{sampleDay.macros.fat}f</span>
        </div>
        {@render mealList()}
        {@render footActions()}
        <span class="variant-tag">56 · Left bar</span>
      </article>

    </div>
  </section>
</div>

{#snippet miniRing(k, pct, val, letter)}
  <div class="v14-ring-wrap" data-k={k}>
    <svg class="v14-ring" viewBox="0 0 32 32" width="36" height="36">
      <circle cx="16" cy="16" r="13" class="v14-bg" />
      <circle cx="16" cy="16" r="13" class="v14-fg"
        style="stroke-dasharray: {pct * 0.817} 81.7;" />
    </svg>
    <div class="v14-ring-inner">
      <span class="v14-letter mono">{letter}</span>
    </div>
    <span class="v14-val mono">{val}g</span>
  </div>
{/snippet}

<!-- ── Shared snippets ─────────────────────────────────────────────── -->
{#snippet mealList()}
  <div class="meals">
    {#each slotOrder as slot}
      {#if sampleDay.meals[slot].length > 0}
        {@const SlotIcon = slotIcons[slot]}
        <div class="meal-group">
          <span class="meal-slot-label">
            <SlotIcon size={11} strokeWidth={1.75} />
            {slotLabels[slot]}
          </span>
          {#each sampleDay.meals[slot] as item}
            <div class="day-item">
              <span class="di-name">{item.name}</span>
              <span class="di-detail mono">
                <span class="di-cal">{item.cal}</span>
                <span class="di-sep">·</span>
                <span class="di-m" data-k="p">{item.p}p</span>·
                <span class="di-m" data-k="c">{item.c}c</span>·
                <span class="di-m" data-k="f">{item.f}f</span>
              </span>
            </div>
          {/each}
        </div>
      {/if}
    {/each}
  </div>
{/snippet}

{#snippet footActions()}
  <div class="bottom-actions">
    <button class="day-edit" onclick={(e) => e.stopPropagation()}>Edit</button>
    <button class="day-action-btn" onclick={(e) => e.stopPropagation()}>
      <Copy size={11} strokeWidth={1.5} />Copy
    </button>
    <button class="day-clear" onclick={(e) => e.stopPropagation()}>Clear</button>
  </div>
{/snippet}

<style>
  /* ── Page chrome ── */
  .page {
    max-width: 1600px;
    margin: 0 auto;
    padding: var(--space-8) var(--space-6) var(--space-16);
    color: var(--text-0);
  }
  .page-head { margin-bottom: var(--space-10); }
  .page-head h1 {
    font-size: var(--font-3xl);
    letter-spacing: -0.03em;
    font-weight: 700;
    margin-bottom: var(--space-2);
  }
  .page-head p { color: var(--text-2); font-size: var(--font-sm); }
  .page-head a { color: var(--text-1); text-decoration: underline; text-decoration-color: var(--border); }

  .group { margin-top: var(--space-12); }
  .group-title {
    font-size: var(--font-xl);
    letter-spacing: -0.02em;
    font-weight: 600;
    margin-bottom: var(--space-1);
  }
  .group-sub {
    color: var(--text-2);
    font-size: var(--font-xs);
    margin-bottom: var(--space-6);
  }

  .mock-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: var(--space-5);
  }

  /* ── Base card ── */
  .card {
    position: relative;
    background: var(--bg-1);
    border: var(--border-width) solid var(--border);
    border-radius: var(--radius-lg);
    padding: var(--space-4);
    min-height: 380px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    transition: border-color var(--transition-base);
  }

  .variant-tag {
    position: absolute;
    bottom: 6px; right: 8px;
    font-size: 9px;
    color: var(--text-3);
    letter-spacing: 0.04em;
    text-transform: uppercase;
    pointer-events: none;
  }

  /* Header / macros / list (shared) */
  .head {
    display: flex; justify-content: space-between; align-items: center;
    margin-bottom: var(--space-3); min-height: 24px;
  }
  .left { display: flex; align-items: baseline; gap: var(--space-2); }
  .name {
    font-size: var(--font-lg); font-weight: 700; letter-spacing: -0.02em;
  }
  .num { font-size: var(--font-base); color: var(--text-3); font-weight: 400; }
  .today-dot {
    width: 6px; height: 6px; border-radius: 999px;
    background: var(--cal); display: inline-block;
    box-shadow: 0 0 8px var(--cal);
  }
  .kcal { font-size: var(--font-sm); color: var(--cal); font-weight: 600; }
  .mono { font-family: var(--font-mono); }

  .macros {
    font-family: var(--font-mono);
    font-size: var(--font-xs);
    color: var(--text-3);
    display: flex; gap: 6px;
    margin-bottom: var(--space-3);
  }
  .m[data-k="p"] { color: var(--pro); }
  .m[data-k="c"] { color: var(--carb); }
  .m[data-k="f"] { color: var(--fat); }

  .meals { display: flex; flex-direction: column; gap: var(--space-3); flex: 1; }
  .meal-group { display: flex; flex-direction: column; gap: 2px; }
  .meal-slot-label {
    display: inline-flex; align-items: center; gap: 5px;
    font-size: 10px; font-weight: 600; letter-spacing: 0.04em;
    color: var(--text-2); text-transform: uppercase;
    padding-bottom: 4px; margin-bottom: 4px;
    box-shadow: inset 0 -1px 0 var(--border);
  }
  .meal-slot-label :global(svg) { color: var(--text-3); }
  .day-item {
    display: grid; grid-template-columns: 1fr auto;
    gap: 6px; align-items: baseline;
    padding: 3px 4px;
    color: var(--text-1);
    border-radius: var(--radius-sm);
    transition: background var(--transition-fast);
  }
  .day-item:hover { background: var(--bg-hover); color: var(--text-0); }
  .di-name {
    font-size: var(--font-sm);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .di-detail { font-size: 10px; color: var(--text-3); display: flex; gap: 4px; }
  .di-cal { color: var(--text-3); font-weight: 500; transition: color var(--transition-fast); }
  .di-sep { color: var(--text-3); opacity: 0.5; }
  .di-m { color: var(--text-3); font-weight: 500; transition: color var(--transition-fast); }
  .day-item:hover .di-cal { color: var(--cal); }
  .day-item:hover .di-m[data-k="p"] { color: var(--pro); }
  .day-item:hover .di-m[data-k="c"] { color: var(--carb); }
  .day-item:hover .di-m[data-k="f"] { color: var(--fat); }

  .bottom-actions {
    display: flex; gap: var(--space-2);
    margin-top: var(--space-3);
    padding-top: var(--space-3);
    border-top: 1px solid var(--border);
  }
  .day-edit, .day-action-btn, .day-clear {
    font-size: var(--font-xs);
    color: var(--text-2);
    background: none;
    border: none;
    cursor: pointer;
    padding: 2px 6px;
    border-radius: var(--radius-sm);
    display: inline-flex;
    align-items: center;
    gap: 4px;
    text-decoration: none;
    transition: background var(--transition-fast), color var(--transition-fast);
  }
  .day-edit:hover, .day-action-btn:hover { background: var(--bg-hover); color: var(--text-0); }
  .day-clear:hover { color: var(--danger); background: var(--danger-bg); }

  /* ════════ Group A ════════════════════════════════════════════════ */

  /* 1 · Top + bottom accent bars */
  .v1 { padding-top: calc(var(--space-4) + 4px); }
  .v1-bar {
    position: absolute; top: 0; left: 0; right: 0; height: 3px;
    background: linear-gradient(90deg, var(--cal), var(--pro));
  }
  .v1-foot {
    margin-top: var(--space-3);
    border-top: 2px solid var(--cal);
    padding-top: var(--space-2);
  }
  .v1-foot .bottom-actions { border-top: none; padding-top: 0; margin-top: 0; }

  /* 2 · Tinted frame (border + soft tinted edges) */
  .v2 {
    border-color: var(--cal);
    background:
      linear-gradient(var(--bg-0), var(--bg-0)) padding-box,
      linear-gradient(135deg, var(--cal) 0%, var(--pro) 100%) border-box;
    border: 1.5px solid transparent;
    box-shadow: inset 0 0 0 1px var(--cal-bg);
  }
  .v2-list {
    background: var(--bg-0);
    border-radius: var(--radius-md);
    padding: var(--space-2);
    margin: 0 calc(var(--space-2) * -0.5);
  }

  /* 3 · Top + bottom colored bands */
  .v3 { padding: 0; overflow: hidden; }
  .v3-band {
    background: var(--cal-bg);
    padding: var(--space-3) var(--space-4);
    display: flex; justify-content: space-between; align-items: center;
    border-bottom: 1px solid var(--cal);
  }
  .v3-band-foot {
    border-bottom: none;
    border-top: 1px solid var(--cal);
  }
  .v3-band-foot .bottom-actions {
    border-top: none; padding-top: 0; margin-top: 0;
  }
  .v3-body {
    padding: var(--space-3) var(--space-4);
    flex: 1;
    display: flex; flex-direction: column;
  }

  /* 4 · Outline frame in accent, neutral inset */
  .v4 {
    border: 1.5px solid var(--pro);
    box-shadow: 0 0 0 4px var(--pro-bg);
  }
  .v4-inner {
    background: var(--bg-0);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    padding: var(--space-3);
    flex: 1;
  }

  /* 5 · Vertical gradient frame */
  .v5 {
    background:
      linear-gradient(var(--bg-0), var(--bg-0)) padding-box,
      linear-gradient(180deg, var(--cal) 0%, var(--carb) 50%, var(--fat) 100%) border-box;
    border: 2px solid transparent;
  }
  .v5-list {
    background: var(--bg-0);
    border-radius: var(--radius-md);
  }

  /* 6 · Dome header + dome footer */
  .v6 { padding: 0; }
  .v6-dome {
    background: var(--carb-bg);
    padding: var(--space-3) var(--space-4);
    display: flex; justify-content: space-between; align-items: center;
    border-bottom: 1.5px solid var(--carb);
  }
  .v6-dome-foot {
    border-bottom: none;
    border-top: 1.5px solid var(--carb);
  }
  .v6-dome-foot .bottom-actions {
    border-top: none; padding-top: 0; margin-top: 0;
  }
  .v6-middle {
    padding: var(--space-3) var(--space-4);
    flex: 1;
    display: flex; flex-direction: column;
  }

  /* ════════ Group B ════════════════════════════════════════════════ */

  /* 7 · Left rail accent */
  .v7 { padding: 0; flex-direction: row; }
  .v7-rail {
    width: 4px;
    background: linear-gradient(180deg, var(--cal), var(--pro));
    flex-shrink: 0;
  }
  .v7-body {
    flex: 1;
    padding: var(--space-4);
    display: flex; flex-direction: column;
  }

  /* 8 · Big watermark day number */
  .v8 { padding-top: var(--space-5); }
  .v8-watermark {
    position: absolute;
    top: -10px; right: 8px;
    font-size: 96px;
    font-weight: 700;
    line-height: 1;
    color: var(--text-1);
    opacity: 0.04;
    letter-spacing: -0.05em;
    pointer-events: none;
  }
  .v8-head { position: relative; z-index: 1; }
  .v8-name {
    background: linear-gradient(135deg, var(--text-0), var(--text-2));
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  /* 9 · Frosted glow */
  .v9 {
    background: rgba(255, 255, 255, 0.02);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.08);
  }
  .v9-glow {
    position: absolute;
    top: -40%; left: -20%;
    width: 200px; height: 200px;
    background: radial-gradient(circle, var(--pro-bg), transparent 70%);
    filter: blur(40px);
    pointer-events: none;
  }

  /* 10 · Spotlight on goal ring */
  .v10-head {
    display: flex; align-items: center; gap: var(--space-3);
    margin-bottom: var(--space-4);
  }
  .v10-ring-wrap { position: relative; flex-shrink: 0; }
  .v10-ring { transform: rotate(-90deg); }
  .v10-bg { fill: none; stroke: var(--border); stroke-width: 3; }
  .v10-fg {
    fill: none; stroke: var(--cal);
    stroke-width: 3; stroke-linecap: round;
  }
  .v10-ring-inner {
    position: absolute; inset: 0;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    line-height: 1;
  }
  .v10-kcal {
    font-size: 11px; font-weight: 700; color: var(--cal);
  }
  .v10-kcal-unit {
    font-size: 7px; color: var(--text-3);
    text-transform: uppercase; letter-spacing: 0.05em;
    margin-top: 1px;
  }
  .v10-id { display: flex; flex-direction: column; gap: 2px; }
  .v10-id .num { font-size: var(--font-xs); }

  /* 11 · Tabbed day label */
  .v11 {
    overflow: visible;
    margin-top: 14px;
  }
  .v11-tab {
    position: absolute;
    top: -14px; left: var(--space-4);
    padding: 4px 12px;
    background: var(--cal);
    color: var(--bg-0);
    border-radius: var(--radius-md) var(--radius-md) 0 0;
    font-size: var(--font-xs);
    font-weight: 700;
    display: inline-flex;
    align-items: baseline;
    gap: 6px;
    letter-spacing: -0.01em;
  }
  .v11-tab-num { font-size: 10px; opacity: 0.75; }
  .v11-body { display: flex; flex-direction: column; flex: 1; }
  .v11-kcal { font-size: var(--font-base); }
  .v11-macros { margin-bottom: 0; }

  /* 12 · Bottom progress bar */
  .v12 { padding-bottom: calc(var(--space-4) + 4px); }
  .v12-bar-wrap {
    height: 3px;
    background: var(--bg-3);
    border-radius: 999px;
    overflow: hidden;
    margin-bottom: var(--space-3);
  }
  .v12-bar {
    height: 100%;
    background: linear-gradient(90deg, var(--cal), var(--pro));
    border-radius: 999px;
    transition: width 600ms ease;
  }
  .v12-foot-bar {
    position: absolute;
    bottom: 0; left: 0; right: 0;
    height: 3px;
    background: linear-gradient(90deg, var(--cal), var(--pro));
  }

  /* ════════ Group C ════════════════════════════════════════════════ */

  /* 13 · Macro split stripe */
  .v13 { padding-top: 0; }
  .v13-stripe {
    display: flex;
    height: 4px;
    margin: 0 calc(var(--space-4) * -1) var(--space-4);
    overflow: hidden;
  }
  .v13-seg-p { background: var(--pro); }
  .v13-seg-c { background: var(--carb); }
  .v13-seg-f { background: var(--fat); }
  .v13-head { margin-bottom: var(--space-2); }
  .v13-legend {
    display: flex; gap: 8px; flex-wrap: wrap;
    font-size: 9px; color: var(--text-3);
    text-transform: uppercase; letter-spacing: 0.05em;
    margin-bottom: var(--space-3);
    padding-bottom: var(--space-3);
    border-bottom: 1px solid var(--border);
  }
  .v13-leg { display: inline-flex; align-items: center; gap: 4px; }
  .v13-leg::before {
    content: '';
    width: 6px; height: 6px; border-radius: 999px;
  }
  .v13-leg[data-k="p"]::before { background: var(--pro); }
  .v13-leg[data-k="c"]::before { background: var(--carb); }
  .v13-leg[data-k="f"]::before { background: var(--fat); }

  /* 14 · Mini macro rings */
  .v14-rings {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--space-2);
    padding: var(--space-3) 0;
    margin-bottom: var(--space-3);
    border-bottom: 1px solid var(--border);
  }
  .v14-ring-wrap {
    display: flex; flex-direction: column;
    align-items: center; gap: 4px;
    position: relative;
  }
  .v14-ring { transform: rotate(-90deg); }
  .v14-bg { fill: none; stroke: var(--border); stroke-width: 2.5; }
  .v14-fg { fill: none; stroke-width: 2.5; stroke-linecap: round; }
  .v14-ring-wrap[data-k="p"] .v14-fg { stroke: var(--pro); }
  .v14-ring-wrap[data-k="c"] .v14-fg { stroke: var(--carb); }
  .v14-ring-wrap[data-k="f"] .v14-fg { stroke: var(--fat); }
  .v14-ring-inner {
    position: absolute; top: 0; left: 50%;
    transform: translateX(-50%);
    width: 36px; height: 36px;
    display: flex; align-items: center; justify-content: center;
  }
  .v14-letter { font-size: 11px; font-weight: 700; color: var(--text-1); }
  .v14-val {
    font-size: 10px; color: var(--text-2); font-weight: 500;
  }

  /* 15 · Letter grade */
  .v15-head {
    display: flex; justify-content: space-between; align-items: flex-start;
    margin-bottom: var(--space-3);
  }
  .v15-id { display: flex; flex-direction: column; gap: 2px; }
  .v15-id .num { font-size: var(--font-xs); }
  .v15-grade {
    display: flex; flex-direction: column; align-items: center;
    background: var(--carb-bg);
    border: 1px solid var(--carb);
    padding: 4px 10px;
    border-radius: var(--radius-md);
  }
  .v15-letter {
    font-size: var(--font-2xl);
    font-weight: 700;
    color: var(--carb);
    line-height: 1;
  }
  .v15-sub {
    font-size: 8px; color: var(--text-3);
    text-transform: uppercase; letter-spacing: 0.06em;
    margin-top: 2px;
  }
  .v15-meta {
    display: flex; gap: var(--space-3);
    padding: var(--space-2) 0 var(--space-3);
    border-bottom: 1px solid var(--border);
    margin-bottom: var(--space-3);
  }
  .v15-meta-i {
    font-size: var(--font-sm); font-weight: 600;
    color: var(--text-1);
  }
  .v15-meta-i[data-k="p"] { color: var(--pro); }
  .v15-meta-i[data-k="c"] { color: var(--carb); }
  .v15-meta-i[data-k="f"] { color: var(--fat); }
  .v15-meta-u {
    font-size: 9px; color: var(--text-3);
    margin-left: 1px; font-weight: 400;
  }

  /* 16 · Slot completion dots */
  .v16-dots {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: var(--space-2);
    padding: var(--space-2) 0 var(--space-3);
    border-bottom: 1px solid var(--border);
    margin-bottom: var(--space-3);
  }
  .v16-dot {
    display: flex; flex-direction: column;
    align-items: center; gap: 4px;
    padding: 6px 4px;
    border-radius: var(--radius-sm);
    border: 1px dashed var(--border);
    color: var(--text-3);
  }
  .v16-dot-on {
    border: 1px solid var(--cal);
    background: var(--cal-bg);
    color: var(--cal);
  }
  .v16-dot :global(svg) { color: inherit; }
  .v16-dot-kcal {
    font-size: 9px;
    font-weight: 600;
    color: inherit;
  }
  .v16-dot:not(.v16-dot-on) .v16-dot-kcal { color: var(--text-3); opacity: 0.5; }

  /* 17 · Goal thermometer */
  .v17 { padding: 0; flex-direction: row; }
  .v17-therm {
    width: 28px;
    background: var(--bg-3);
    position: relative;
    flex-shrink: 0;
    overflow: hidden;
    display: flex; align-items: flex-end; justify-content: center;
  }
  .v17-fill {
    position: absolute; bottom: 0; left: 0; right: 0;
    background: linear-gradient(180deg, var(--cal), rgba(227, 189, 131, 0.4));
    transition: height 600ms ease;
  }
  .v17-therm-label {
    position: relative; z-index: 1;
    writing-mode: vertical-rl;
    transform: rotate(180deg);
    font-size: 9px; font-weight: 700;
    color: var(--text-0);
    padding: 6px 0;
    letter-spacing: 0.05em;
  }
  .v17-content {
    flex: 1;
    padding: var(--space-4);
    display: flex; flex-direction: column;
    min-width: 0;
  }

  /* 18 · Sparkline */
  .v18-spark {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: var(--space-2);
    height: 56px;
    padding: var(--space-2) 0 var(--space-3);
    border-bottom: 1px solid var(--border);
    margin-bottom: var(--space-3);
  }
  .v18-bar-wrap {
    position: relative;
    display: flex; flex-direction: column;
    align-items: center; justify-content: flex-end;
    gap: 4px;
  }
  .v18-bar {
    width: 100%;
    background: linear-gradient(180deg, var(--cal), var(--pro));
    border-radius: 2px 2px 0 0;
    min-height: 2px;
    transition: height 600ms ease;
  }
  .v18-bar-wrap :global(.v18-icon) {
    color: var(--text-3);
  }

  /* ════════ Group D ════════════════════════════════════════════════ */

  /* 19 · Display headline */
  .v19-head {
    margin-bottom: var(--space-4);
    padding-bottom: var(--space-3);
    border-bottom: 1px solid var(--border);
  }
  .v19-display {
    font-size: 38px;
    font-weight: 700;
    letter-spacing: -0.04em;
    line-height: 1;
    margin-bottom: 6px;
    background: linear-gradient(180deg, var(--text-0), var(--text-2));
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  .v19-sub {
    display: flex; gap: 8px; align-items: baseline;
    font-size: var(--font-xs);
    color: var(--text-3);
  }
  .v19-dot { opacity: 0.5; }

  /* 20 · All-caps masthead */
  .v20-mast {
    display: flex; align-items: center; gap: var(--space-3);
    padding-bottom: var(--space-2);
    border-bottom: 2px solid var(--text-0);
    margin-bottom: var(--space-3);
  }
  .v20-day {
    font-size: var(--font-md);
    font-weight: 700;
    letter-spacing: 0.08em;
  }
  .v20-rule {
    flex: 1;
    height: 1px;
    background: var(--border);
  }
  .v20-date {
    font-size: 10px;
    color: var(--text-3);
    letter-spacing: 0.1em;
  }
  .v20-meta {
    display: flex; align-items: baseline; gap: 6px;
    margin-bottom: var(--space-3);
  }
  .v20-meta .kcal { font-size: var(--font-xl); letter-spacing: -0.02em; }
  .v20-meta-sub {
    font-size: 9px;
    color: var(--text-3);
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  /* 21 · Initial monogram */
  .v21-mono {
    position: absolute;
    top: -16px; right: -10px;
    font-family: var(--font-sans);
    font-size: 130px;
    font-weight: 700;
    line-height: 1;
    color: var(--text-1);
    opacity: 0.05;
    letter-spacing: -0.06em;
    pointer-events: none;
  }

  /* 22 · Floating chip header */
  .v22 {
    overflow: visible;
    margin-top: 12px;
    padding-top: var(--space-3);
  }
  .v22-chip {
    position: absolute;
    top: -14px; left: 50%;
    transform: translateX(-50%);
    display: inline-flex;
    align-items: baseline;
    gap: 6px;
    padding: 6px 14px;
    background: var(--bg-elevated, #1a1a1a);
    border: 1px solid var(--border);
    border-radius: 999px;
    font-size: var(--font-xs);
    font-weight: 600;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    white-space: nowrap;
  }
  .v22-chip-name { letter-spacing: -0.01em; }
  .v22-chip-num { color: var(--text-3); font-size: 10px; }
  .v22-chip .today-dot { width: 5px; height: 5px; align-self: center; }
  .v22-body { display: flex; flex-direction: column; flex: 1; padding-top: var(--space-2); }
  .v22-kcal { font-size: var(--font-lg); }
  .v22-macros { margin-bottom: 0; }

  /* 23 · Corner brackets */
  .v23 {
    border: 1px solid transparent;
    background: var(--bg-1);
  }
  .v23-bracket {
    position: absolute;
    width: 14px; height: 14px;
    border: 1.5px solid var(--cal);
  }
  .v23-tl { top: 4px; left: 4px;  border-right: none; border-bottom: none; }
  .v23-tr { top: 4px; right: 4px; border-left: none;  border-bottom: none; }
  .v23-bl { bottom: 4px; left: 4px;  border-right: none; border-top: none; }
  .v23-br { bottom: 4px; right: 4px; border-left: none;  border-top: none; }

  /* 24 · Editorial marquee */
  .v24-marquee {
    display: flex; align-items: center; gap: 8px;
    padding: var(--space-2) 0 var(--space-3);
    margin-bottom: var(--space-3);
    border-top: 1px solid var(--text-1);
    border-bottom: 1px solid var(--text-1);
    padding-top: var(--space-2);
    overflow: hidden;
  }
  .v24-name {
    font-size: var(--font-md);
    font-weight: 700;
    letter-spacing: -0.01em;
    flex-shrink: 0;
  }
  .v24-rule {
    width: 6px;
    height: 1px;
    background: var(--text-2);
    flex-shrink: 0;
  }
  .v24-stat {
    font-size: 10px;
    color: var(--text-2);
    font-weight: 600;
    flex-shrink: 0;
  }
  .v24-stat[data-k="p"] { color: var(--pro); }
  .v24-stat[data-k="c"] { color: var(--carb); }
  .v24-stat[data-k="f"] { color: var(--fat); }

  /* ════════ Group E ════════════════════════════════════════════════ */

  /* 25 · Hero ring + macro split stripe */
  .v25 { padding-top: 0; }
  .v25-stripe {
    display: flex; height: 3px;
    margin: 0 calc(var(--space-4) * -1) var(--space-4);
  }
  .v25-seg { transition: width 600ms ease; }
  .v25-head {
    display: flex; align-items: center; gap: var(--space-3);
    margin-bottom: var(--space-3);
  }
  .v25-ring-wrap { position: relative; flex-shrink: 0; }
  .v25-ring { transform: rotate(-90deg); }
  .v25-bg { fill: none; stroke: var(--border); stroke-width: 3; }
  .v25-fg { fill: none; stroke: var(--cal); stroke-width: 3; stroke-linecap: round; }
  .v25-ring-inner {
    position: absolute; inset: 0;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    line-height: 1;
  }
  .v25-kcal { font-size: 12px; font-weight: 700; color: var(--cal); }
  .v25-kcal-unit { font-size: 7px; color: var(--text-3); text-transform: uppercase; letter-spacing: 0.05em; margin-top: 1px; }
  .v25-id { display: flex; flex-direction: column; gap: 2px; }
  .v25-id-row { display: flex; align-items: center; gap: 6px; }
  .v25-id-row .name { font-size: var(--font-md); }
  .v25-id .num { font-size: 11px; color: var(--text-3); }
  .v25-macros { padding-bottom: var(--space-3); border-bottom: 1px solid var(--border); }

  /* 26 · Magazine diagnostic */
  .v26-head {
    display: flex; justify-content: space-between; align-items: flex-start;
    margin-bottom: var(--space-3);
  }
  .v26-display {
    font-size: 28px; font-weight: 700; letter-spacing: -0.03em;
    line-height: 1; margin-bottom: 4px;
    background: linear-gradient(180deg, var(--text-0), var(--text-2));
    -webkit-background-clip: text; background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  .v26-date {
    font-size: 9px; color: var(--text-3);
    letter-spacing: 0.12em; font-weight: 600;
  }
  .v26-grade {
    width: 36px; height: 36px;
    display: flex; align-items: center; justify-content: center;
    background: var(--carb-bg);
    border: 1px solid var(--carb);
    border-radius: var(--radius-md);
  }
  .v26-letter { font-size: var(--font-lg); font-weight: 700; color: var(--carb); line-height: 1; }
  .v26-spark {
    display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px;
    height: 28px; margin-bottom: var(--space-3);
    padding-bottom: var(--space-2); border-bottom: 1px solid var(--border);
  }
  .v26-bar-wrap {
    display: flex; align-items: flex-end; justify-content: center;
  }
  .v26-bar {
    width: 100%;
    background: linear-gradient(180deg, var(--cal), var(--pro));
    border-radius: 1px 1px 0 0;
    min-height: 2px;
  }

  /* 27 · Pill + brackets */
  .v27 {
    overflow: visible;
    margin-top: 12px;
    padding-top: var(--space-5);
  }
  .v27-bracket {
    position: absolute;
    width: 10px; height: 10px;
    border: 1.5px solid var(--cal);
    pointer-events: none;
  }
  .v27-tl { top: 6px; left: 6px;  border-right: none; border-bottom: none; }
  .v27-tr { top: 6px; right: 6px; border-left: none;  border-bottom: none; }
  .v27-bl { bottom: 6px; left: 6px;  border-right: none; border-top: none; }
  .v27-br { bottom: 6px; right: 6px; border-left: none;  border-top: none; }
  .v27-chip {
    position: absolute;
    top: -14px; left: 50%;
    transform: translateX(-50%);
    display: inline-flex; align-items: center; gap: 6px;
    padding: 6px 14px;
    background: var(--bg-elevated, #1a1a1a);
    border: 1px solid var(--border);
    border-radius: 999px;
    font-size: var(--font-xs);
    font-weight: 600;
    box-shadow: 0 4px 14px rgba(0,0,0,0.35);
    white-space: nowrap;
  }
  .v27-chip-sep { color: var(--text-3); }
  .v27-chip-num { font-size: 10px; color: var(--text-3); }
  .v27-chip .today-dot { width: 5px; height: 5px; }
  .v27-body { display: flex; flex-direction: column; flex: 1; }
  .v27-stat { display: flex; align-items: baseline; gap: 4px; margin-bottom: var(--space-2); }
  .v27-kcal { font-size: var(--font-xl); letter-spacing: -0.02em; }
  .v27-kcal-u { font-size: 9px; color: var(--text-3); text-transform: uppercase; letter-spacing: 0.08em; }

  /* 28 · Watermark + hero ring */
  .v28-watermark {
    position: absolute;
    top: -14px; right: -8px;
    font-size: 110px; font-weight: 700; line-height: 1;
    color: var(--text-1); opacity: 0.05;
    letter-spacing: -0.06em;
    pointer-events: none;
  }
  .v28-head {
    display: flex; justify-content: space-between; align-items: center;
    margin-bottom: var(--space-3); position: relative; z-index: 1;
  }
  .v28-id { display: flex; align-items: center; gap: 6px; }
  .v28-id .name { font-size: var(--font-lg); }
  .v28-ring-wrap { position: relative; flex-shrink: 0; }
  .v28-ring { transform: rotate(-90deg); }
  .v28-bg { fill: none; stroke: var(--border); stroke-width: 2.5; }
  .v28-fg { fill: none; stroke: var(--cal); stroke-width: 2.5; stroke-linecap: round; }
  .v28-ring-pct {
    position: absolute; inset: 0;
    display: flex; align-items: center; justify-content: center;
    font-size: 10px; font-weight: 700; color: var(--cal);
  }
  .v28-meta {
    display: flex; gap: 6px; align-items: baseline;
    font-family: var(--font-mono); font-size: var(--font-xs);
    margin-bottom: var(--space-2);
  }
  .v28-meta .kcal { font-size: var(--font-sm); }
  .v28-meta-sep { color: var(--text-3); opacity: 0.5; }
  .v28-meta .m[data-k="p"] { color: var(--pro); }
  .v28-meta .m[data-k="c"] { color: var(--carb); }
  .v28-meta .m[data-k="f"] { color: var(--fat); }
  .v28-slots {
    display: flex; gap: 4px; margin-bottom: var(--space-3);
    padding-bottom: var(--space-2); border-bottom: 1px solid var(--border);
  }
  .v28-slot {
    display: inline-flex; align-items: center; justify-content: center;
    width: 18px; height: 18px;
    border-radius: var(--radius-sm);
    border: 1px dashed var(--border);
    color: var(--text-3);
  }
  .v28-slot-on {
    border: 1px solid var(--cal);
    background: var(--cal-bg);
    color: var(--cal);
  }

  /* 29 · Two-tone + sparkline foot */
  .v29 { padding: 0; }
  .v29-band {
    background: var(--carb-bg);
    padding: var(--space-3) var(--space-4);
    display: flex; justify-content: space-between; align-items: center;
    border-bottom: 1.5px solid var(--carb);
  }
  .v29-body {
    padding: var(--space-3) var(--space-4);
    flex: 1; display: flex; flex-direction: column;
  }
  .v29-foot {
    background: var(--carb-bg);
    padding: var(--space-2) var(--space-4) var(--space-3);
    border-top: 1.5px solid var(--carb);
  }
  .v29-foot .bottom-actions { border-top: none; padding-top: 0; margin-top: 0; }
  .v29-spark {
    display: flex; align-items: flex-end; gap: 3px;
    height: 18px; margin-bottom: var(--space-2);
  }
  .v29-bar {
    flex: 1;
    background: var(--carb);
    border-radius: 1px 1px 0 0;
    min-height: 2px;
    opacity: 0.7;
  }

  /* 30 · Display + slot strip */
  .v30-head { margin-bottom: var(--space-3); }
  .v30-display {
    font-size: 26px; font-weight: 700; letter-spacing: -0.03em;
    line-height: 1; margin-bottom: 4px;
  }
  .v30-eyebrow {
    display: flex; align-items: center; gap: 6px;
    font-size: 10px; color: var(--text-3);
  }
  .v30-date { letter-spacing: 0.1em; font-weight: 600; }
  .v30-bullet { opacity: 0.5; }
  .v30-eyebrow .kcal { font-size: 11px; }
  .v30-strip {
    display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px;
    margin-bottom: var(--space-3); padding-bottom: var(--space-3);
    border-bottom: 1px solid var(--border);
  }
  .v30-slot {
    display: flex; flex-direction: column; align-items: center; gap: 2px;
    padding: 6px 2px;
    border-radius: var(--radius-sm);
    color: var(--text-3);
    font-size: 8px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;
  }
  .v30-slot-on { color: var(--cal); background: var(--cal-bg); }

  /* ════════ Group F ════════════════════════════════════════════════ */

  /* 31 · Linear-style */
  .v31-head { display: flex; flex-direction: column; gap: 6px; margin-bottom: var(--space-2); }
  .v31-id {
    display: flex; align-items: baseline; gap: 8px;
  }
  .v31-name { font-size: var(--font-md); font-weight: 600; letter-spacing: -0.01em; }
  .v31-date { font-size: 11px; color: var(--text-3); }
  .v31-today {
    font-size: 8px; font-weight: 700; letter-spacing: 0.1em;
    color: var(--cal);
    background: var(--cal-bg);
    padding: 2px 6px;
    border-radius: var(--radius-sm);
    margin-left: auto;
  }
  .v31-stats {
    display: flex; gap: var(--space-3);
    padding-bottom: var(--space-2);
  }
  .v31-stat {
    display: flex; align-items: baseline; gap: 2px;
    font-family: var(--font-mono);
  }
  .v31-stat-v { font-size: 12px; font-weight: 600; color: var(--text-1); }
  .v31-stat-l { font-size: 9px; color: var(--text-3); text-transform: uppercase; letter-spacing: 0.05em; }
  .v31-stat[data-k="p"] .v31-stat-v { color: var(--pro); }
  .v31-stat[data-k="c"] .v31-stat-v { color: var(--carb); }
  .v31-stat[data-k="f"] .v31-stat-v { color: var(--fat); }
  .v31-progress {
    height: 2px; background: var(--bg-3);
    border-radius: 999px; overflow: hidden;
    margin-bottom: var(--space-3);
  }
  .v31-progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--cal), var(--pro));
    transition: width 600ms ease;
  }

  /* 32 · Apple Health */
  .v32 { padding: var(--space-3); }
  .v32-panel {
    background: var(--bg-3);
    border-radius: var(--radius-xl);
    padding: var(--space-4);
    margin-bottom: var(--space-3);
  }
  .v32-panel-top {
    display: flex; justify-content: space-between; align-items: flex-start;
    margin-bottom: var(--space-3);
  }
  .v32-panel-id { display: flex; flex-direction: column; gap: 2px; }
  .v32-day { font-size: var(--font-md); font-weight: 600; letter-spacing: -0.01em; }
  .v32-date { font-size: 11px; color: var(--text-3); }
  .v32-today-pill {
    font-size: 9px; font-weight: 700;
    padding: 2px 8px;
    background: var(--cal);
    color: var(--bg-0);
    border-radius: 999px;
  }
  .v32-kcal-row { display: flex; align-items: baseline; gap: 6px; margin-bottom: var(--space-2); }
  .v32-kcal { font-size: var(--font-2xl); font-weight: 700; color: var(--text-0); letter-spacing: -0.03em; line-height: 1; }
  .v32-kcal-goal { font-size: 11px; color: var(--text-3); }
  .v32-bar {
    height: 6px; background: var(--bg-1); border: 1px solid var(--border);
    border-radius: 999px; overflow: hidden; margin-bottom: var(--space-3);
  }
  .v32-bar-fill {
    height: 100%; background: linear-gradient(90deg, var(--cal), var(--pro));
    border-radius: 999px;
  }
  .v32-macros {
    display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-2);
  }
  .v32-m { display: flex; flex-direction: column; gap: 1px; }
  .v32-m-v { font-size: var(--font-sm); font-weight: 600; }
  .v32-m-l { font-size: 9px; color: var(--text-3); text-transform: uppercase; letter-spacing: 0.05em; }
  .v32-m[data-k="p"] .v32-m-v { color: var(--pro); }
  .v32-m[data-k="c"] .v32-m-v { color: var(--carb); }
  .v32-m[data-k="f"] .v32-m-v { color: var(--fat); }

  /* 33 · Stripe-style */
  .v33 { padding-top: 0; }
  .v33-accent {
    height: 3px;
    background: linear-gradient(90deg, var(--cal), var(--pro), var(--carb));
    margin: 0 calc(var(--space-4) * -1) var(--space-4);
  }
  .v33-head {
    display: flex; justify-content: space-between; align-items: center;
    margin-bottom: var(--space-3); padding-bottom: var(--space-3);
    border-bottom: 1px solid var(--border);
  }
  .v33-id { display: flex; align-items: center; gap: 8px; }
  .v33-name { font-size: var(--font-md); font-weight: 600; letter-spacing: -0.01em; }
  .v33-date { font-size: 10px; color: var(--text-3); }
  .v33-grid {
    display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--space-3);
    margin-bottom: var(--space-3); padding-bottom: var(--space-3);
    border-bottom: 1px solid var(--border);
  }
  .v33-cell { display: flex; flex-direction: column; gap: 2px; }
  .v33-l { font-size: 9px; color: var(--text-3); text-transform: uppercase; letter-spacing: 0.08em; font-weight: 600; }
  .v33-v { font-size: var(--font-base); font-weight: 600; color: var(--text-0); letter-spacing: -0.01em; }
  .v33-cell[data-k="p"] .v33-v { color: var(--pro); }
  .v33-cell[data-k="c"] .v33-v { color: var(--carb); }
  .v33-cell[data-k="f"] .v33-v { color: var(--fat); }

  /* 34 · Vercel-style */
  .v34-head { display: flex; flex-direction: column; gap: var(--space-2); margin-bottom: var(--space-3); }
  .v34-status {
    display: inline-flex; align-items: center; gap: 6px;
    align-self: flex-start;
    padding: 3px 8px;
    background: var(--carb-bg);
    border: 1px solid var(--carb);
    border-radius: 999px;
  }
  .v34-pulse {
    width: 6px; height: 6px; border-radius: 999px;
    background: var(--carb);
    box-shadow: 0 0 8px var(--carb);
    animation: v34Pulse 2s ease-in-out infinite;
  }
  @keyframes v34Pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
  .v34-status-text { font-size: 9px; color: var(--carb); font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; }
  .v34-id { display: flex; justify-content: space-between; align-items: baseline; }
  .v34-name { font-size: var(--font-lg); font-weight: 700; letter-spacing: -0.02em; }
  .v34-date { font-size: 11px; color: var(--text-3); }
  .v34-meta {
    display: flex; flex-direction: column; gap: 4px;
    padding: var(--space-2) 0 var(--space-3);
    margin-bottom: var(--space-3);
    border-bottom: 1px solid var(--border);
  }
  .v34-meta-row { display: flex; align-items: baseline; gap: 8px; }
  .v34-meta-l { font-size: 10px; color: var(--text-3); text-transform: uppercase; letter-spacing: 0.06em; min-width: 50px; }
  .v34-meta-v { font-size: var(--font-sm); color: var(--text-1); }
  .v34-meta-pct {
    margin-left: auto; font-size: 10px; color: var(--cal); font-weight: 600;
  }
  .v34-meta-v [data-k="p"] { color: var(--pro); }
  .v34-meta-v [data-k="c"] { color: var(--carb); }
  .v34-meta-v [data-k="f"] { color: var(--fat); }
  .v34-sep { color: var(--text-3); opacity: 0.5; margin: 0 2px; }

  /* 35 · Notion-style */
  .v35-head { display: flex; gap: var(--space-3); margin-bottom: var(--space-3); }
  .v35-icon {
    width: 32px; height: 32px;
    display: flex; align-items: center; justify-content: center;
    background: var(--bg-3);
    border-radius: var(--radius-md);
    color: var(--text-2);
    flex-shrink: 0;
  }
  .v35-id { display: flex; flex-direction: column; gap: 6px; flex: 1; min-width: 0; }
  .v35-name { font-size: var(--font-md); font-weight: 600; letter-spacing: -0.01em; line-height: 1.2; }
  .v35-badges { display: flex; gap: 4px; flex-wrap: wrap; }
  .v35-badge {
    display: inline-flex; align-items: center; gap: 3px;
    font-size: 9px; font-weight: 500;
    padding: 2px 6px;
    background: var(--bg-3);
    color: var(--text-2);
    border-radius: var(--radius-sm);
  }
  .v35-badge :global(svg) { color: var(--text-3); }
  .v35-badge-today { background: var(--cal-bg); color: var(--cal); }
  .v35-badge-cal { color: var(--cal); }
  .v35-badge-cal :global(svg) { color: var(--cal); }
  .v35-macros { padding-bottom: var(--space-3); border-bottom: 1px solid var(--border); }

  /* 36 · The Apex */
  .v36 {
    padding: 0;
    border: 1.5px solid var(--border);
    background:
      radial-gradient(ellipse at top, var(--cal-bg) 0%, transparent 60%),
      var(--bg-1);
  }
  .v36-stripe {
    display: flex; height: 3px;
    border-radius: var(--radius-lg) var(--radius-lg) 0 0;
    overflow: hidden;
  }
  .v36-seg { transition: width 600ms ease; }
  .v36-head {
    display: flex; justify-content: space-between; align-items: center;
    padding: var(--space-4) var(--space-4) var(--space-3);
  }
  .v36-id { display: flex; flex-direction: column; gap: 2px; }
  .v36-id-row { display: flex; align-items: center; gap: 8px; }
  .v36-name { font-size: var(--font-lg); font-weight: 700; letter-spacing: -0.02em; }
  .v36-today {
    font-size: 8px; font-weight: 700; letter-spacing: 0.1em;
    color: var(--cal);
    background: var(--cal-bg);
    padding: 2px 6px;
    border-radius: var(--radius-sm);
    text-transform: uppercase;
  }
  .v36-date { font-size: 11px; color: var(--text-3); }
  .v36-ring-wrap { position: relative; flex-shrink: 0; }
  .v36-ring { transform: rotate(-90deg); }
  .v36-bg { fill: none; stroke: var(--border); stroke-width: 3; }
  .v36-fg { fill: none; stroke: var(--cal); stroke-width: 3; stroke-linecap: round; }
  .v36-ring-inner {
    position: absolute; inset: 0;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    line-height: 1;
  }
  .v36-kcal { font-size: 11px; font-weight: 700; color: var(--cal); }
  .v36-kcal-unit { font-size: 7px; color: var(--text-3); text-transform: uppercase; letter-spacing: 0.05em; margin-top: 1px; }
  .v36-macros {
    display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-2);
    padding: 0 var(--space-4) var(--space-3);
    margin-bottom: var(--space-3);
    border-bottom: 1px solid var(--border);
  }
  .v36-m { display: flex; flex-direction: column; gap: 2px; }
  .v36-m-v { font-size: var(--font-sm); font-weight: 600; }
  .v36-m-l { font-size: 9px; color: var(--text-3); text-transform: uppercase; letter-spacing: 0.05em; }
  .v36-m[data-k="p"] .v36-m-v { color: var(--pro); }
  .v36-m[data-k="c"] .v36-m-v { color: var(--carb); }
  .v36-m[data-k="f"] .v36-m-v { color: var(--fat); }
  .v36 .meals { padding: 0 var(--space-4); }
  .v36 .bottom-actions {
    margin: 0 var(--space-4);
    padding-top: var(--space-3);
  }
  .v36-foot-spark {
    display: grid; grid-template-columns: repeat(4, 1fr); gap: 3px;
    height: 16px;
    padding: var(--space-2) var(--space-4) var(--space-3);
  }
  .v36-bar-wrap { display: flex; align-items: flex-end; }
  .v36-bar {
    width: 100%;
    background: linear-gradient(180deg, var(--cal), var(--pro));
    border-radius: 1px 1px 0 0;
    min-height: 2px;
    opacity: 0.7;
  }
  .v36-tag { color: var(--cal); }

  /* ════════ Group G — Whisper-quiet ═══════════════════════════════ */

  /* 37 · Soft accent border */
  .v37 {
    border-color: var(--cal);
    opacity: 1;
  }

  /* 38 · Inset depth (no outer border, soft inner frame) */
  .v38 {
    border: none;
    background: var(--bg-3);
    box-shadow:
      inset 0 0 0 1px rgba(255,255,255,0.04),
      inset 0 1px 0 rgba(255,255,255,0.05);
  }
  .v38-goal { color: var(--text-3); font-weight: 400; opacity: 0.65; }

  /* 39 · Tonal step (elevated bg, no border) + thin accent rule under header */
  .v39 {
    background: var(--bg-3);
    border: none;
  }
  .v39-rule {
    height: 2px;
    background: var(--bg-1);
    border-radius: 999px;
    overflow: hidden;
    margin-bottom: var(--space-3);
  }
  .v39-rule-fill {
    height: 100%;
    background: var(--cal);
    border-radius: 999px;
    transition: width 600ms ease;
    opacity: 0.7;
  }

  /* 40 · Date watermark only */
  .v40-watermark {
    position: absolute;
    top: 4px; right: 8px;
    font-size: 88px; font-weight: 700; line-height: 1;
    color: var(--text-1);
    opacity: 0.04;
    letter-spacing: -0.06em;
    pointer-events: none;
  }

  /* 41 · Whisper ring */
  .v41-ring-wrap {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .v41-ring { transform: rotate(-90deg); flex-shrink: 0; }
  .v41-bg { fill: none; stroke: var(--border); stroke-width: 1.5; }
  .v41-fg {
    fill: none; stroke: var(--cal);
    stroke-width: 1.5; stroke-linecap: round;
    transition: stroke-dasharray 600ms ease;
  }
  .v41-kcal { font-size: var(--font-sm); }

  /* 42 · Inline ticker sparkline */
  .v42-ticker {
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }
  .v42-spark { opacity: 0.6; }

  /* 43 · Trace footline */
  .v43 { padding-bottom: 0; }
  .v43-trace {
    width: calc(100% + var(--space-4) * 2);
    height: 14px;
    margin: var(--space-3) calc(var(--space-4) * -1) 0;
    display: block;
    opacity: 0.45;
  }

  /* 44 · Corner glow */
  .v44-glow {
    position: absolute;
    top: -50px; right: -50px;
    width: 160px; height: 160px;
    background: radial-gradient(circle, var(--cal-bg) 0%, transparent 65%);
    filter: blur(20px);
    pointer-events: none;
  }

  /* 45 · Date stub split */
  .v45 {
    padding: 0;
    flex-direction: row;
  }
  .v45-stub {
    width: 56px;
    flex-shrink: 0;
    background: var(--bg-3);
    border-right: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    padding: var(--space-3) 0;
    position: relative;
  }
  .v45-stub-name {
    font-size: 9px;
    font-weight: 700;
    color: var(--text-3);
    letter-spacing: 0.12em;
  }
  .v45-stub-num {
    font-size: var(--font-2xl);
    font-weight: 700;
    color: var(--text-0);
    letter-spacing: -0.04em;
    line-height: 1;
  }
  .v45-stub-today {
    width: 6px; height: 6px;
    border-radius: 999px;
    background: var(--cal);
    box-shadow: 0 0 8px var(--cal);
    margin-top: 4px;
  }
  .v45-body {
    flex: 1;
    padding: var(--space-4);
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .v45-head {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: var(--space-3);
  }
  .v45-macros { margin-bottom: 0; }

  /* 46 · Slot pips */
  .v46-right {
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }
  .v46-pips {
    display: inline-flex;
    gap: 3px;
  }
  .v46-pip {
    width: 5px; height: 5px;
    border-radius: 999px;
    background: var(--border);
    transition: background var(--transition-fast);
  }
  .v46-pip-on {
    background: var(--cal);
  }

  /* 47 · Tonal header band */
  .v47 {
    padding: 0;
  }
  .v47-head {
    background: var(--bg-3);
    padding: var(--space-3) var(--space-4);
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid var(--border);
  }
  .v47-body {
    padding: var(--space-3) var(--space-4);
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  /* 48 · Pure typography */
  .v48 {
    border-color: var(--border);
  }
  .v48-head {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: var(--space-3);
  }
  .v48-id {
    display: flex;
    align-items: baseline;
    gap: 8px;
  }
  .v48-name {
    font-size: var(--font-md);
    font-weight: 600;
    letter-spacing: -0.015em;
  }
  .v48-date {
    font-size: 11px;
    color: var(--text-3);
    letter-spacing: -0.005em;
  }
  .v48-stat {
    display: inline-flex;
    align-items: baseline;
    gap: 3px;
  }
  .v48-kcal {
    font-size: var(--font-md);
    color: var(--text-0);
    font-weight: 600;
    letter-spacing: -0.02em;
  }
  .v48-kcal-u {
    font-size: 9px;
    color: var(--text-3);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
  .v48-rule {
    height: 1px;
    background: var(--border);
    margin-bottom: var(--space-3);
  }

  /* ════════ Group H — G38 base + watermark + goal ring ══════════ */

  /* Base: all v49-v56 use inset frame (NO bg color change like G38) */
  .v49, .v50, .v51, .v52, .v53, .v54, .v55, .v56 {
    border: none;
    background: var(--bg-1);
    box-shadow:
      inset 0 0 0 1px rgba(255,255,255,0.04),
      inset 0 1px 0 rgba(255,255,255,0.05);
  }

  /* 49 · Hero ring on right */
  .v49-watermark {
    position: absolute;
    top: 8px; right: 12px;
    font-size: 80px; font-weight: 700; line-height: 1;
    color: var(--text-1);
    opacity: 0.04;
    letter-spacing: -0.06em;
    pointer-events: none;
  }
  .v49-ring {
    position: relative;
    flex-shrink: 0;
  }
  .v49-ring svg { transform: rotate(-90deg); }
  .v49-bg { fill: none; stroke: var(--border); stroke-width: 3; }
  .v49-fg { fill: none; stroke: var(--cal); stroke-width: 3; stroke-linecap: round; }
  .v49-kcal {
    position: absolute; inset: 0;
    display: flex; align-items: center; justify-content: center;
    font-size: 13px; font-weight: 700; color: var(--cal);
  }

  /* 50 · Ring left, identity right */
  .v50-watermark {
    position: absolute;
    top: 8px; right: 12px;
    font-size: 80px; font-weight: 700; line-height: 1;
    color: var(--text-1);
    opacity: 0.04;
    letter-spacing: -0.06em;
    pointer-events: none;
  }
  .v50-ring {
    position: relative;
    flex-shrink: 0;
  }
  .v50-ring svg { transform: rotate(-90deg); }
  .v50-bg { fill: none; stroke: var(--border); stroke-width: 2.5; }
  .v50-fg { fill: none; stroke: var(--cal); stroke-width: 2.5; stroke-linecap: round; }
  .v50-kcal {
    position: absolute; inset: 0;
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 700; color: var(--cal);
  }

  /* 51 · Tiny ring next to kcal */
  .v51-watermark {
    position: absolute;
    top: 8px; right: 12px;
    font-size: 76px; font-weight: 700; line-height: 1;
    color: var(--text-1);
    opacity: 0.04;
    letter-spacing: -0.06em;
    pointer-events: none;
  }
  .v51-duo { display: inline-flex; align-items: center; gap: 8px; }
  .v51-tiny-ring {
    position: relative;
    flex-shrink: 0;
  }
  .v51-tiny-ring svg { transform: rotate(-90deg); }
  .v51-bg { fill: none; stroke: var(--border); stroke-width: 1.5; }
  .v51-fg { fill: none; stroke: var(--cal); stroke-width: 1.5; stroke-linecap: round; }
  .v51-pct {
    position: absolute; inset: 0;
    display: flex; align-items: center; justify-content: center;
    font-size: 7px; font-weight: 700; color: var(--cal);
  }

  /* 52 · Ring below header as its own row */
  .v52-watermark {
    position: absolute;
    top: 8px; right: 12px;
    font-size: 80px; font-weight: 700; line-height: 1;
    color: var(--text-1);
    opacity: 0.04;
    letter-spacing: -0.06em;
    pointer-events: none;
  }
  .v52-ring-row {
    display: flex; align-items: center; justify-content: center; gap: 8px;
    padding: var(--space-3) 0;
    margin-bottom: var(--space-3);
    border-bottom: 1px solid var(--border);
  }
  .v52-ring svg { transform: rotate(-90deg); flex-shrink: 0; }
  .v52-bg { fill: none; stroke: var(--border); stroke-width: 2; }
  .v52-fg { fill: none; stroke: var(--cal); stroke-width: 2; stroke-linecap: round; }
  .v52-pct { font-size: 11px; font-weight: 600; color: var(--cal); }

  /* 53 · Ring floating in top-right corner */
  .v53-watermark {
    position: absolute;
    top: 8px; left: 12px;
    font-size: 84px; font-weight: 700; line-height: 1;
    color: var(--text-1);
    opacity: 0.04;
    letter-spacing: -0.06em;
    pointer-events: none;
  }
  .v53-corner-ring {
    position: absolute;
    top: 8px; right: 8px;
    width: 36px; height: 36px;
    display: flex; align-items: center; justify-content: center;
  }
  .v53-corner-ring svg { transform: rotate(-90deg); }
  .v53-bg { fill: none; stroke: var(--border); stroke-width: 2; }
  .v53-fg { fill: none; stroke: var(--cal); stroke-width: 2; stroke-linecap: round; }
  .v53-kcal {
    position: absolute; inset: 0;
    display: flex; align-items: center; justify-content: center;
    font-size: 8px; font-weight: 700; color: var(--cal);
  }

  /* 54 · Ring + number side by side, tight */
  .v54-pair { display: inline-flex; align-items: center; gap: 6px; }
  .v54-ring {
    position: relative;
    flex-shrink: 0;
  }
  .v54-ring svg { transform: rotate(-90deg); }
  .v54-bg { fill: none; stroke: var(--border); stroke-width: 2; }
  .v54-fg { fill: none; stroke: var(--cal); stroke-width: 2; stroke-linecap: round; }
  .v54-kcal {
    position: absolute; inset: 0;
    display: flex; align-items: center; justify-content: center;
    font-size: 10px; font-weight: 700; color: var(--cal);
  }
  .v54-num { font-size: 16px; color: var(--text-2); font-weight: 500; }

  /* 55 · Ring as arc underline */
  .v55-watermark {
    position: absolute;
    top: 8px; right: 12px;
    font-size: 80px; font-weight: 700; line-height: 1;
    color: var(--text-1);
    opacity: 0.04;
    letter-spacing: -0.06em;
    pointer-events: none;
  }
  .v55-kcal-arc { display: inline-flex; flex-direction: column; align-items: center; gap: 2px; }
  .v55-arc { opacity: 0.5; }
  .v55-bg { fill: none; stroke: var(--border); stroke-width: 1; stroke-linecap: round; }
  .v55-fg { fill: none; stroke: var(--cal); stroke-width: 1; stroke-linecap: round; }

  /* 56 · Vertical bar on left edge */
  .v56-watermark {
    position: absolute;
    top: 8px; right: 12px;
    font-size: 80px; font-weight: 700; line-height: 1;
    color: var(--text-1);
    opacity: 0.04;
    letter-spacing: -0.06em;
    pointer-events: none;
  }
  .v56-edge {
    position: absolute;
    left: 0; top: 0;
    width: 3px;
    background: linear-gradient(180deg, var(--cal), var(--pro));
    border-radius: var(--radius-lg) 0 0 0;
    transition: height 600ms ease;
  }
</style>
