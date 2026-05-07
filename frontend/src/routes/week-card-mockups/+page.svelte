<script>
  import {
    Sunrise, Sun, Moon, Cookie, Bookmark, Plus, X,
    ChevronDown, Copy, Flame, Calendar, Sparkles, Search, Filter, Grip, ArrowRight
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

  // ── Sample plan (used for the Plan Card mockups) ─────────────────────
  const samplePlan = {
    name: "High-Protein Lean",
    cal: 1840,
    pro: 162,
    carb: 138,
    fat: 58,
    items: 6,
    filledSlots: ['breakfast', 'lunch', 'dinner', 'snack'],
  };

  // ── Sample list of plans (used for the Day Plans Container mockups) ──
  // ── Sample week (used for the Week Summary card mockups) ─────────────
  const sampleWeek = {
    cal: 12350,         // weekly total kcal
    pro: 920,
    carb: 1180,
    fat: 410,
    goalCal: 14000,     // typical 2000/day × 7
    daysPlanned: 5,
    todayIdx: 4,        // Friday
    dailyCal: [1840, 2100, 1620, 1980, 2240, 2570, 0],
  };
  const sampleWeekDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const sampleAvg = Math.round(sampleWeek.cal / sampleWeek.daysPlanned);
  const samplePct = Math.min(100, Math.round((sampleWeek.cal / sampleWeek.goalCal) * 100));
  const sampleProCal = sampleWeek.pro * 4;
  const sampleCarbCal = sampleWeek.carb * 4;
  const sampleFatCal = sampleWeek.fat * 9;
  const sampleMacroTotalCal = sampleProCal + sampleCarbCal + sampleFatCal;
  const sampleProPct = Math.round(sampleProCal / sampleMacroTotalCal * 100);
  const sampleCarbPct = Math.round(sampleCarbCal / sampleMacroTotalCal * 100);
  const sampleFatPct = 100 - sampleProPct - sampleCarbPct;

  // Donut math (WS2)
  const ws2DonutCirc = 2 * Math.PI * 14;
  const ws2ProLen  = ws2DonutCirc * sampleProPct  / 100;
  const ws2CarbLen = ws2DonutCirc * sampleCarbPct / 100;
  const ws2FatLen  = ws2DonutCirc * sampleFatPct  / 100;

  // Daily-bars max (WS3)
  const ws3Max = Math.max(...[1840, 2100, 1620, 1980, 2240, 2570, 0], 1);

  // Sparkline math (WS6)
  const ws6Max = Math.max(...[1840, 2100, 1620, 1980, 2240, 2570, 0], 1);
  const ws6Pts = [1840, 2100, 1620, 1980, 2240, 2570, 0]
    .map((c, i) => `${(i / 6) * 140},${40 - (c / ws6Max) * 36 - 2}`)
    .join(' ');
  const ws6TodayCx = (4 / 6) * 140;
  const ws6TodayCy = 40 - (2240 / ws6Max) * 36 - 2;

  const samplePlans = [
    { name: "High-Protein Lean", cal: 1840, pro: 162, carb: 138, fat: 58, items: 6 },
    { name: "Cut Day",           cal: 1620, pro: 145, carb: 110, fat: 52, items: 5 },
    { name: "Refeed",            cal: 2640, pro: 175, carb: 320, fat: 70, items: 8 },
  ];

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

  <!-- ════════════════════════════════════════════════════════════════
       PLAN CARD — Day Plans dock on the My Week page
       ════════════════════════════════════════════════════════════════ -->
  <section class="group">
    <h2 class="group-title">Plan Card — 8 approaches</h2>
    <p class="group-sub">The card used in the Day Plans dock on the My Week page. Sample plan: "{samplePlan.name}".</p>

    <div class="plan-grid">

      <!-- 1 · Minimal text stack -->
      <article class="plan-card pv1">
        <header class="pv-head">
          <span class="pv-name">{samplePlan.name}</span>
          <button class="pv-del" aria-label="Delete"><X size={11} strokeWidth={2} /></button>
        </header>
        <div class="pv1-cal mono">{samplePlan.cal.toLocaleString()} <span class="pv1-unit">kcal</span></div>
        <div class="pv1-macros mono">
          <span style="color: var(--pro)">{samplePlan.pro}p</span> ·
          <span style="color: var(--carb)">{samplePlan.carb}c</span> ·
          <span style="color: var(--fat)">{samplePlan.fat}f</span>
        </div>
        <div class="pv1-items">{samplePlan.items} items</div>
        <span class="variant-tag">1 · Minimal stack</span>
      </article>

      <!-- 2 · Inline single row -->
      <article class="plan-card pv2">
        <header class="pv-head">
          <span class="pv-name">{samplePlan.name}</span>
          <button class="pv-del" aria-label="Delete"><X size={11} strokeWidth={2} /></button>
        </header>
        <div class="pv2-row">
          <span class="pv2-cal mono">{samplePlan.cal.toLocaleString()}</span>
          <span class="pv2-sep">·</span>
          <span class="mono" style="color: var(--pro)">{samplePlan.pro}p</span>
          <span class="mono" style="color: var(--carb)">{samplePlan.carb}c</span>
          <span class="mono" style="color: var(--fat)">{samplePlan.fat}f</span>
          <span class="pv2-items">{samplePlan.items} items</span>
        </div>
        <span class="variant-tag">2 · Inline row</span>
      </article>

      <!-- 3 · 2-column grid (cal | macros) -->
      <article class="plan-card pv3">
        <header class="pv-head">
          <span class="pv-name">{samplePlan.name}</span>
          <button class="pv-del" aria-label="Delete"><X size={11} strokeWidth={2} /></button>
        </header>
        <div class="pv3-grid">
          <div class="pv3-cell pv3-cal">
            <span class="pv3-num mono">{samplePlan.cal.toLocaleString()}</span>
            <span class="pv3-label">kcal</span>
          </div>
          <div class="pv3-cell pv3-macros">
            <div class="pv3-line"><span class="pv3-label">Pro</span><span class="mono" style="color: var(--pro)">{samplePlan.pro}g</span></div>
            <div class="pv3-line"><span class="pv3-label">Carb</span><span class="mono" style="color: var(--carb)">{samplePlan.carb}g</span></div>
            <div class="pv3-line"><span class="pv3-label">Fat</span><span class="mono" style="color: var(--fat)">{samplePlan.fat}g</span></div>
          </div>
        </div>
        <span class="variant-tag">3 · Split grid</span>
      </article>

      <!-- 4 · Left accent bar -->
      <article class="plan-card pv4">
        <span class="pv4-bar"></span>
        <div class="pv4-content">
          <header class="pv-head">
            <span class="pv-name">{samplePlan.name}</span>
            <button class="pv-del" aria-label="Delete"><X size={11} strokeWidth={2} /></button>
          </header>
          <div class="pv4-cal mono">{samplePlan.cal.toLocaleString()} <span class="pv4-unit">kcal</span></div>
          <div class="pv4-macros mono">
            <span style="color: var(--pro)">{samplePlan.pro}p</span>
            <span style="color: var(--carb)">{samplePlan.carb}c</span>
            <span style="color: var(--fat)">{samplePlan.fat}f</span>
          </div>
        </div>
        <span class="variant-tag">4 · Left accent</span>
      </article>

      <!-- 5 · Cal centered hero -->
      <article class="plan-card pv5">
        <button class="pv-del pv5-del" aria-label="Delete"><X size={11} strokeWidth={2} /></button>
        <div class="pv5-eyebrow">{samplePlan.name}</div>
        <div class="pv5-cal mono">{samplePlan.cal.toLocaleString()}</div>
        <div class="pv5-unit">kcal</div>
        <div class="pv5-macros mono">
          <span style="color: var(--pro)">{samplePlan.pro}<span class="pv5-g">g</span></span>
          <span style="color: var(--carb)">{samplePlan.carb}<span class="pv5-g">g</span></span>
          <span style="color: var(--fat)">{samplePlan.fat}<span class="pv5-g">g</span></span>
        </div>
        <span class="variant-tag">5 · Centered hero</span>
      </article>

      <!-- 6 · Slot icons primary -->
      <article class="plan-card pv6">
        <header class="pv-head">
          <span class="pv-name">{samplePlan.name}</span>
          <button class="pv-del" aria-label="Delete"><X size={11} strokeWidth={2} /></button>
        </header>
        <div class="pv6-slots">
          {#each slotOrder as slot}
            {@const SlotIcon = slotIcons[slot]}
            <span class="pv6-slot" class:pv6-slot-on={samplePlan.filledSlots.includes(slot)}>
              <SlotIcon size={14} strokeWidth={1.75} />
            </span>
          {/each}
        </div>
        <div class="pv6-stats">
          <span class="pv6-cal mono">{samplePlan.cal.toLocaleString()} kcal</span>
          <span class="pv6-macros mono">
            <span style="color: var(--pro)">{samplePlan.pro}p</span> ·
            <span style="color: var(--carb)">{samplePlan.carb}c</span> ·
            <span style="color: var(--fat)">{samplePlan.fat}f</span>
          </span>
        </div>
        <span class="variant-tag">6 · Slots first</span>
      </article>

      <!-- 7 · Bookmark icon prefix -->
      <article class="plan-card pv7">
        <span class="pv7-icon"><Bookmark size={18} strokeWidth={1.5} /></span>
        <div class="pv7-content">
          <header class="pv-head">
            <span class="pv-name">{samplePlan.name}</span>
            <button class="pv-del" aria-label="Delete"><X size={11} strokeWidth={2} /></button>
          </header>
          <div class="pv7-stats mono">
            <span style="color: var(--cal)">{samplePlan.cal.toLocaleString()} kcal</span>
            <span class="pv7-sep">·</span>
            <span style="color: var(--pro)">{samplePlan.pro}p</span>
            <span style="color: var(--carb)">{samplePlan.carb}c</span>
            <span style="color: var(--fat)">{samplePlan.fat}f</span>
          </div>
        </div>
        <span class="variant-tag">7 · Bookmark prefix</span>
      </article>

      <!-- 8 · Macro pill chips -->
      <article class="plan-card pv8">
        <header class="pv-head">
          <span class="pv-name">{samplePlan.name}</span>
          <button class="pv-del" aria-label="Delete"><X size={11} strokeWidth={2} /></button>
        </header>
        <div class="pv8-cal mono">{samplePlan.cal.toLocaleString()} <span class="pv8-unit">kcal</span></div>
        <div class="pv8-chips">
          <span class="pv8-chip" data-k="p"><span class="mono">{samplePlan.pro}</span>g pro</span>
          <span class="pv8-chip" data-k="c"><span class="mono">{samplePlan.carb}</span>g carb</span>
          <span class="pv8-chip" data-k="f"><span class="mono">{samplePlan.fat}</span>g fat</span>
        </div>
        <span class="variant-tag">8 · Macro pills</span>
      </article>

    </div>
  </section>

  <!-- ════════════════════════════════════════════════════════════════
       DAY PLANS CONTAINER — 8 approaches (all using "left accent" cards)
       ════════════════════════════════════════════════════════════════ -->
  <section class="group">
    <h2 class="group-title">Day Plans Container — 8 approaches</h2>
    <p class="group-sub">Different takes on the dock that holds the plan cards. Cards use the <strong>left accent</strong> style from variant #4.</p>

    <div class="dock-grid">

      <!-- 1 · Classic vertical -->
      <div class="dock-mock dv1">
        <header class="dv-head">
          <div class="dv-title-row">
            <span class="dv-title">Day Plans</span>
            <span class="dv-count mono">{samplePlans.length}</span>
            <button class="dv-add" aria-label="Add"><Plus size={14} strokeWidth={1.75} /></button>
          </div>
          <div class="dv-search">
            <input type="text" placeholder="Search…" />
          </div>
        </header>
        <div class="dv-cards">
          {#each samplePlans as p}{@render leftAccentCard(p)}{/each}
        </div>
        <span class="variant-tag">1 · Classic vertical</span>
      </div>

      <!-- 2 · Compact pill header -->
      <div class="dock-mock dv2">
        <header class="dv2-head">
          <span class="dv2-pill">Day Plans · <span class="mono">{samplePlans.length}</span></span>
          <div class="dv2-search">
            <input type="text" placeholder="Search…" />
          </div>
          <button class="dv-add" aria-label="Add"><Plus size={14} strokeWidth={1.75} /></button>
        </header>
        <div class="dv-cards">
          {#each samplePlans as p}{@render leftAccentCard(p)}{/each}
        </div>
        <span class="variant-tag">2 · Compact pill header</span>
      </div>

      <!-- 3 · Sidebar tabs -->
      <div class="dock-mock dv3">
        <header class="dv3-head">
          <div class="dv3-tabs">
            <button class="dv3-tab dv3-tab-active">Plans</button>
            <button class="dv3-tab">Recent</button>
          </div>
          <button class="dv-add" aria-label="Add"><Plus size={14} strokeWidth={1.75} /></button>
        </header>
        <div class="dv-cards">
          {#each samplePlans as p}{@render leftAccentCard(p)}{/each}
        </div>
        <span class="variant-tag">3 · Sidebar tabs</span>
      </div>

      <!-- 4 · Borderless flowing -->
      <div class="dock-mock dv4">
        <header class="dv4-head">
          <span class="dv4-title">Day Plans</span>
          <button class="dv-add" aria-label="Add"><Plus size={14} strokeWidth={1.75} /></button>
        </header>
        <div class="dv4-cards">
          {#each samplePlans as p, i}
            {@render leftAccentCard(p)}
            {#if i < samplePlans.length - 1}<div class="dv4-divider"></div>{/if}
          {/each}
        </div>
        <span class="variant-tag">4 · Borderless flowing</span>
      </div>

      <!-- 5 · Search-first -->
      <div class="dock-mock dv5">
        <header class="dv5-head">
          <div class="dv5-search">
            <span class="dv5-search-icon"><Sparkles size={12} strokeWidth={1.75} /></span>
            <input type="text" placeholder="Find a day plan…" />
          </div>
          <div class="dv5-sub">
            <span class="dv5-sub-label">{samplePlans.length} saved</span>
            <button class="dv-add" aria-label="Add"><Plus size={14} strokeWidth={1.75} /></button>
          </div>
        </header>
        <div class="dv-cards">
          {#each samplePlans as p}{@render leftAccentCard(p)}{/each}
        </div>
        <span class="variant-tag">5 · Search-first</span>
      </div>

      <!-- 6 · Floating cards -->
      <div class="dock-mock dv6">
        <header class="dv-head">
          <div class="dv-title-row">
            <span class="dv-title">Day Plans</span>
            <button class="dv-add" aria-label="Add"><Plus size={14} strokeWidth={1.75} /></button>
          </div>
        </header>
        <div class="dv6-cards">
          {#each samplePlans as p}{@render leftAccentCard(p)}{/each}
        </div>
        <span class="variant-tag">6 · Floating cards</span>
      </div>

      <!-- 7 · Numbered slots -->
      <div class="dock-mock dv7">
        <header class="dv-head">
          <div class="dv-title-row">
            <span class="dv-title">Day Plans</span>
            <button class="dv-add" aria-label="Add"><Plus size={14} strokeWidth={1.75} /></button>
          </div>
        </header>
        <div class="dv-cards">
          {#each samplePlans as p, i}
            <div class="dv7-row">
              <span class="dv7-num mono">{String(i + 1).padStart(2, '0')}</span>
              {@render leftAccentCard(p)}
            </div>
          {/each}
        </div>
        <span class="variant-tag">7 · Numbered slots</span>
      </div>

      <!-- 8 · Minimal list -->
      <div class="dock-mock dv8">
        <header class="dv8-head">
          <span class="dv8-title">Day Plans</span>
        </header>
        <div class="dv-cards">
          {#each samplePlans as p}{@render leftAccentCard(p)}{/each}
        </div>
        <button class="dv8-add">
          <Plus size={12} strokeWidth={1.75} />
          New plan
        </button>
        <span class="variant-tag">8 · Minimal list</span>
      </div>

    </div>
  </section>

  <!-- ════════════════════════════════════════════════════════════════
       DAY PLANS CONTAINER — 8 more (in the spirit of #6 + #8)
       ════════════════════════════════════════════════════════════════ -->
  <section class="group">
    <h2 class="group-title">Day Plans Container — 8 more (floating · minimal)</h2>
    <p class="group-sub">All in the spirit of variants #6 (floating cards) and #8 (minimal list) — transparent containers, almost no chrome, cards do the visual work.</p>

    <div class="dock-grid">

      <!-- 9 · Floating + count + bottom add -->
      <div class="dock-mock dv9">
        <header class="dv9-head">
          <span class="dv9-title">Day Plans</span>
          <span class="dv9-count mono">{samplePlans.length}</span>
        </header>
        <div class="dv9-search">
          <Search size={12} strokeWidth={1.75} />
          <input type="text" placeholder="Search…" />
        </div>
        <div class="dv9-cards">
          {#each samplePlans as p}{@render leftAccentCard(p)}{/each}
        </div>
        <button class="dv9-add">
          <Plus size={12} strokeWidth={1.75} />
          New plan
        </button>
        <span class="variant-tag">9 · Float + count + add</span>
      </div>

      <!-- 10 · Eyebrow header -->
      <div class="dock-mock dv10">
        <span class="dv10-eyebrow">Day Plans · <span class="mono">{samplePlans.length}</span></span>
        <div class="dv10-search">
          <Search size={11} strokeWidth={1.75} />
          <input type="text" placeholder="Search…" />
        </div>
        <div class="dv10-cards">
          {#each samplePlans as p}{@render leftAccentCard(p)}{/each}
        </div>
        <button class="dv10-add">
          <Plus size={11} strokeWidth={1.75} />
          New
        </button>
        <span class="variant-tag">10 · Eyebrow only</span>
      </div>

      <!-- 11 · Group sections -->
      <div class="dock-mock dv11">
        <div class="dv11-search">
          <Search size={12} strokeWidth={1.75} />
          <input type="text" placeholder="Search plans…" />
        </div>
        <span class="dv11-group-label">Recent</span>
        <div class="dv11-cards">
          {@render leftAccentCard(samplePlans[0])}
          {@render leftAccentCard(samplePlans[1])}
        </div>
        <span class="dv11-group-label">All</span>
        <div class="dv11-cards">
          {@render leftAccentCard(samplePlans[2])}
        </div>
        <button class="dv11-add">
          <Plus size={12} strokeWidth={1.75} />
          New plan
        </button>
        <span class="variant-tag">11 · Grouped sections</span>
      </div>

      <!-- 12 · FAB add -->
      <div class="dock-mock dv12">
        <header class="dv12-head">
          <span class="dv12-title">Day Plans</span>
          <button class="dv12-search-btn" aria-label="Search"><Search size={14} strokeWidth={1.75} /></button>
        </header>
        <div class="dv12-search">
          <Search size={12} strokeWidth={1.75} />
          <input type="text" placeholder="Search…" />
        </div>
        <div class="dv12-cards">
          {#each samplePlans as p}{@render leftAccentCard(p)}{/each}
        </div>
        <button class="dv12-fab" aria-label="New plan">
          <Plus size={18} strokeWidth={2} />
        </button>
        <span class="variant-tag">12 · FAB add</span>
      </div>

      <!-- 13 · Centered everything -->
      <div class="dock-mock dv13">
        <header class="dv13-head">
          <span class="dv13-title">Day Plans</span>
        </header>
        <div class="dv13-search">
          <Search size={12} strokeWidth={1.75} />
          <input type="text" placeholder="Search…" />
        </div>
        <div class="dv13-cards">
          {#each samplePlans as p}{@render leftAccentCard(p)}{/each}
        </div>
        <a href="#" class="dv13-link">+ Add a plan</a>
        <span class="variant-tag">13 · Centered</span>
      </div>

      <!-- 14 · Card-as-add -->
      <div class="dock-mock dv14">
        <header class="dv14-head">
          <span class="dv14-title">Day Plans</span>
          <span class="dv14-count mono">{samplePlans.length}</span>
          <div class="dv14-search">
            <Search size={11} strokeWidth={1.75} />
            <input type="text" placeholder="Find…" />
          </div>
        </header>
        <div class="dv14-cards">
          {#each samplePlans as p}{@render leftAccentCard(p)}{/each}
          <article class="dv14-add-card">
            <Plus size={16} strokeWidth={1.5} />
            <span>Create a new plan</span>
          </article>
        </div>
        <span class="variant-tag">14 · Add as card</span>
      </div>

      <!-- 15 · No header, ghost add at end -->
      <div class="dock-mock dv15">
        <div class="dv15-search">
          <Search size={12} strokeWidth={1.75} />
          <input type="text" placeholder="Search day plans…" />
        </div>
        <div class="dv15-cards">
          {#each samplePlans as p}{@render leftAccentCard(p)}{/each}
        </div>
        <button class="dv15-add" aria-label="New plan">
          <Plus size={14} strokeWidth={1.75} />
          New plan
        </button>
        <span class="variant-tag">15 · No header</span>
      </div>

      <!-- 16 · Vertical brand bar -->
      <div class="dock-mock dv16">
        <span class="dv16-bar"></span>
        <div class="dv16-content">
          <header class="dv16-head">
            <span class="dv16-title">Day Plans</span>
            <span class="dv16-count mono">{samplePlans.length}</span>
          </header>
          <div class="dv16-search">
            <Search size={12} strokeWidth={1.75} />
            <input type="text" placeholder="Search…" />
          </div>
          <div class="dv16-cards">
            {#each samplePlans as p}{@render leftAccentCard(p)}{/each}
          </div>
          <button class="dv16-add">
            <Plus size={12} strokeWidth={1.75} />
            New plan
          </button>
        </div>
        <span class="variant-tag">16 · Vertical brand bar</span>
      </div>

    </div>
  </section>

  <!-- ════════════════════════════════════════════════════════════════
       DAY PLANS — 8 card-focused refinements (built inside the
       variant-16 vertical-bar container so the card improvements
       can be evaluated in their final context)
       ════════════════════════════════════════════════════════════════ -->
  <section class="group">
    <h2 class="group-title">Day Plans Container — 8 card refinements</h2>
    <p class="group-sub">Each variant explores a different card name treatment plus a matching title + search refinement. Same vertical-bar container, different chrome details so you can compare side-by-side.</p>

    <div class="dock-grid">

      <!-- 17 · Headline names -->
      <div class="dock-mock dx17">
        <span class="dx17-bar" aria-hidden="true"></span>
        <div class="dx17-content">
          <header class="dx17-head">
            <h3 class="dx17-title">Day Plans</h3>
            <span class="dx17-count mono">{samplePlans.length}</span>
            <span class="dx17-underline" aria-hidden="true"></span>
          </header>
          <div class="dx17-search">
            <Search size={12} strokeWidth={1.75} />
            <input type="text" placeholder="Search…" />
          </div>
          <div class="dx17-cards">
            {#each samplePlans as p}
              <article class="dx17-card">
                <h4 class="dx17-name">{p.name}</h4>
                <div class="dx17-meta mono">
                  <span class="dx17-cal">{p.cal.toLocaleString()}</span><span class="dx17-cal-unit">kcal</span>
                  <span class="dx17-sep">·</span>
                  <span style="color: var(--pro)">{p.pro}p</span>
                  <span style="color: var(--carb)">{p.carb}c</span>
                  <span style="color: var(--fat)">{p.fat}f</span>
                </div>
              </article>
            {/each}
          </div>
          <button class="dx-add">
            <Plus size={12} strokeWidth={1.75} />New plan
          </button>
        </div>
        <span class="variant-tag">17 · Headline names</span>
      </div>

      <!-- 18 · Two-line names with line-clamp -->
      <div class="dock-mock dx18">
        <span class="dx-bar" aria-hidden="true"></span>
        <div class="dx-content">
          <header class="dx18-head">
            <span class="dx18-title">Day Plans</span>
            <p class="dx18-sub"><span class="mono">{samplePlans.length}</span> saved templates</p>
          </header>
          <div class="dx18-search">
            <Search size={12} strokeWidth={1.75} />
            <input type="text" placeholder="Search day plans…" />
          </div>
          <div class="dx-cards">
            {#each samplePlans as p}
              <article class="dx18-card">
                <span class="dx18-name">{p.name} — generous wrap allowed</span>
                <div class="dx18-stats">
                  <span class="dx18-cal mono">{p.cal.toLocaleString()}<span class="dx18-cal-unit">kcal</span></span>
                  <div class="dx18-macros mono">
                    <span style="color: var(--pro)">{p.pro}<span class="dx18-g">g</span></span>
                    <span style="color: var(--carb)">{p.carb}<span class="dx18-g">g</span></span>
                    <span style="color: var(--fat)">{p.fat}<span class="dx18-g">g</span></span>
                  </div>
                </div>
              </article>
            {/each}
          </div>
          <button class="dx-add"><Plus size={12} strokeWidth={1.75} />New plan</button>
        </div>
        <span class="variant-tag">18 · Two-line names</span>
      </div>

      <!-- 19 · List rows — name dominant left, stats right -->
      <div class="dock-mock dx19">
        <span class="dx-bar" aria-hidden="true"></span>
        <div class="dx-content">
          <header class="dx19-head">
            <span class="dx19-eyebrow">Day Plans</span>
            <span class="dx19-count mono">{samplePlans.length}</span>
          </header>
          <div class="dx19-search">
            <Search size={12} strokeWidth={1.75} />
            <input type="text" placeholder="Find a plan…" />
          </div>
          <div class="dx-cards">
            {#each samplePlans as p}
              <article class="dx19-card">
                <div class="dx19-left">
                  <span class="dx19-name">{p.name}</span>
                  <div class="dx19-macros mono">
                    <span style="color: var(--pro)">{p.pro}p</span>
                    <span style="color: var(--carb)">{p.carb}c</span>
                    <span style="color: var(--fat)">{p.fat}f</span>
                  </div>
                </div>
                <div class="dx19-right">
                  <span class="dx19-cal mono">{p.cal.toLocaleString()}</span>
                  <span class="dx19-cal-unit">kcal</span>
                </div>
              </article>
            {/each}
          </div>
          <button class="dx-add"><Plus size={12} strokeWidth={1.75} />New plan</button>
        </div>
        <span class="variant-tag">19 · List rows</span>
      </div>

      <!-- 20 · Side calorie column -->
      <div class="dock-mock dx20">
        <span class="dx-bar" aria-hidden="true"></span>
        <div class="dx-content">
          <header class="dx20-head">
            <span class="dx20-title">Day Plans</span>
            <span class="dx20-count">{samplePlans.length} saved</span>
          </header>
          <div class="dx20-search">
            <Search size={11} strokeWidth={1.75} />
            <input type="text" placeholder="Search…" />
          </div>
          <div class="dx-cards">
            {#each samplePlans as p}
              <article class="dx20-card">
                <div class="dx20-body">
                  <span class="dx20-name">{p.name}</span>
                  <div class="dx20-macros mono">
                    <span style="color: var(--pro)">{p.pro}p</span> ·
                    <span style="color: var(--carb)">{p.carb}c</span> ·
                    <span style="color: var(--fat)">{p.fat}f</span>
                  </div>
                </div>
                <div class="dx20-cal-col">
                  <span class="dx20-cal mono">{p.cal.toLocaleString()}</span>
                  <span class="dx20-cal-unit">kcal</span>
                </div>
              </article>
            {/each}
          </div>
          <button class="dx-add"><Plus size={12} strokeWidth={1.75} />New plan</button>
        </div>
        <span class="variant-tag">20 · Side calorie</span>
      </div>

      <!-- 21 · Tag-style with macro pills -->
      <div class="dock-mock dx21">
        <span class="dx-bar" aria-hidden="true"></span>
        <div class="dx-content">
          <header class="dx21-head">
            <Bookmark size={14} strokeWidth={1.75} class="dx21-icon" />
            <h3 class="dx21-title">Day Plans</h3>
            <span class="dx21-count mono">{samplePlans.length}</span>
          </header>
          <div class="dx21-search">
            <Search size={12} strokeWidth={1.75} />
            <input type="text" placeholder="Search…" />
          </div>
          <div class="dx-cards">
            {#each samplePlans as p}
              <article class="dx21-card">
                <header class="dx21-card-head">
                  <span class="dx21-name">{p.name}</span>
                  <span class="dx21-cal mono">{p.cal.toLocaleString()}<span class="dx21-cal-unit"> kcal</span></span>
                </header>
                <div class="dx21-pills">
                  <span class="dx21-pill" data-k="p"><span class="mono">{p.pro}</span>g</span>
                  <span class="dx21-pill" data-k="c"><span class="mono">{p.carb}</span>g</span>
                  <span class="dx21-pill" data-k="f"><span class="mono">{p.fat}</span>g</span>
                </div>
              </article>
            {/each}
          </div>
          <button class="dx-add"><Plus size={12} strokeWidth={1.75} />New plan</button>
        </div>
        <span class="variant-tag">21 · Macro pills</span>
      </div>

      <!-- 22 · Numeric-led -->
      <div class="dock-mock dx22">
        <span class="dx-bar" aria-hidden="true"></span>
        <div class="dx-content">
          <header class="dx22-head">
            <span class="dx22-title">Day Plans</span>
          </header>
          <div class="dx22-search">
            <input type="text" placeholder="Search…" />
            <Search size={12} strokeWidth={1.75} />
          </div>
          <div class="dx-cards">
            {#each samplePlans as p}
              <article class="dx22-card">
                <div class="dx22-num-col">
                  <span class="dx22-num mono">{p.cal.toLocaleString()}</span>
                  <span class="dx22-unit">kcal</span>
                </div>
                <div class="dx22-info">
                  <span class="dx22-name">{p.name}</span>
                  <div class="dx22-macros mono">
                    <span style="color: var(--pro)">{p.pro}p</span>
                    <span style="color: var(--carb)">{p.carb}c</span>
                    <span style="color: var(--fat)">{p.fat}f</span>
                  </div>
                </div>
              </article>
            {/each}
          </div>
          <button class="dx-add"><Plus size={12} strokeWidth={1.75} />New plan</button>
        </div>
        <span class="variant-tag">22 · Numeric-led</span>
      </div>

      <!-- 23 · Dossier (uppercase eyebrow + filter pills) -->
      <div class="dock-mock dx23">
        <span class="dx-bar" aria-hidden="true"></span>
        <div class="dx-content">
          <header class="dx23-head">
            <span class="dx23-eyebrow">Day Plans</span>
            <span class="dx23-count mono">·  {samplePlans.length}</span>
          </header>
          <div class="dx23-filters">
            <button class="dx23-filter dx23-filter-on">All</button>
            <button class="dx23-filter">Recent</button>
            <button class="dx23-filter dx23-filter-icon"><Search size={11} strokeWidth={1.75} /></button>
          </div>
          <div class="dx-cards">
            {#each samplePlans as p}
              <article class="dx23-card">
                <span class="dx23-name">{p.name}</span>
                <span class="dx23-divider" aria-hidden="true"></span>
                <span class="dx23-meta mono">
                  <span class="dx23-cal">{p.cal.toLocaleString()}</span>
                  <span class="dx23-sep">·</span>
                  <span style="color: var(--pro)">{p.pro}</span>/<span style="color: var(--carb)">{p.carb}</span>/<span style="color: var(--fat)">{p.fat}</span>
                </span>
              </article>
            {/each}
          </div>
          <button class="dx-add"><Plus size={12} strokeWidth={1.75} />New plan</button>
        </div>
        <span class="variant-tag">23 · Dossier</span>
      </div>

      <!-- 24 · Bar-driven (kcal as a thin progress hint) -->
      <div class="dock-mock dx24">
        <span class="dx-bar" aria-hidden="true"></span>
        <div class="dx-content">
          <header class="dx24-head">
            <h3 class="dx24-title">
              <span class="dx24-title-day">Day</span><span class="dx24-title-plans">Plans</span>
            </h3>
            <span class="dx24-count mono">{samplePlans.length}</span>
          </header>
          <div class="dx24-search">
            <Sparkles size={11} strokeWidth={1.75} />
            <input type="text" placeholder="Find by name or food…" />
          </div>
          <div class="dx-cards">
            {#each samplePlans as p}
              <article class="dx24-card">
                <div class="dx24-row">
                  <span class="dx24-name">{p.name}</span>
                  <span class="dx24-cal mono">{p.cal.toLocaleString()}<span class="dx24-cal-unit">kcal</span></span>
                </div>
                <div class="dx24-bar">
                  <span class="dx24-bar-seg" style="width: {Math.round(p.pro * 4 / p.cal * 100)}%; background: var(--pro)"></span>
                  <span class="dx24-bar-seg" style="width: {Math.round(p.carb * 4 / p.cal * 100)}%; background: var(--carb)"></span>
                  <span class="dx24-bar-seg" style="width: {Math.round(p.fat * 9 / p.cal * 100)}%; background: var(--fat)"></span>
                </div>
                <div class="dx24-macros mono">
                  <span style="color: var(--pro)">{p.pro}<small>p</small></span>
                  <span style="color: var(--carb)">{p.carb}<small>c</small></span>
                  <span style="color: var(--fat)">{p.fat}<small>f</small></span>
                </div>
              </article>
            {/each}
          </div>
          <button class="dx-add"><Plus size={12} strokeWidth={1.75} />New plan</button>
        </div>
        <span class="variant-tag">24 · Bar-driven</span>
      </div>

    </div>
  </section>

  <!-- ════════════════════════════════════════════════════════════════
       DAY PLANS — 8 BIGGER card designs, all using variant 17's chrome
       ════════════════════════════════════════════════════════════════ -->
  <section class="group">
    <h2 class="group-title">Day Plans Container — 8 bigger card designs (built on #17's chrome)</h2>
    <p class="group-sub">Same vertical bar + neutral gradient title + amber underline + borderless search + dashed "New plan" button. Cards are bigger, more visual, and try different ways to highlight the name and macros.</p>

    <div class="dock-grid">

      {#each [
        { id: 25, label: 'Stat hero',         tag: '25 · Stat hero' },
        { id: 26, label: 'Segmented bar',     tag: '26 · Segmented bar' },
        { id: 27, label: '2×2 grid',          tag: '27 · 2×2 grid' },
        { id: 28, label: 'Magazine headline', tag: '28 · Magazine' },
        { id: 29, label: 'Stacked macro bars',tag: '29 · Macro stacks' },
        { id: 30, label: 'Header + body',     tag: '30 · Header strip' },
        { id: 31, label: 'Iconic + columns',  tag: '31 · Iconic columns' },
        { id: 32, label: 'Tile w/ ring',      tag: '32 · Tile ring' },
      ] as v}
        <div class="dock-mock dx-big">
          <span class="dx17-bar" aria-hidden="true"></span>
          <div class="dx17-content">
            <header class="dx17-head">
              <h3 class="dx17-title">Day Plans</h3>
              <span class="dx17-count mono">{samplePlans.length}</span>
              <span class="dx17-underline" aria-hidden="true"></span>
            </header>
            <div class="dx17-search">
              <Search size={12} strokeWidth={1.75} />
              <input type="text" placeholder="Search…" />
            </div>

            <div class="dx-cards">
              {#each samplePlans as p}
                {#if v.id === 25}
                  {@const t = p.pro * 4 + p.carb * 4 + p.fat * 9}
                  <!-- 25 · STAT HERO — kcal as headline, name below, macro bars -->
                  <article class="big25-card">
                    <div class="big25-cal-row">
                      <span class="big25-cal mono">{p.cal.toLocaleString()}</span>
                      <span class="big25-cal-unit">kcal</span>
                    </div>
                    <h4 class="big25-name">{p.name}</h4>
                    <div class="big25-bars">
                      <span class="big25-seg" style="width: {Math.round(p.pro * 4 / t * 100)}%; background: var(--pro)"></span>
                      <span class="big25-seg" style="width: {Math.round(p.carb * 4 / t * 100)}%; background: var(--carb)"></span>
                      <span class="big25-seg" style="width: {Math.round(p.fat * 9 / t * 100)}%; background: var(--fat)"></span>
                    </div>
                    <div class="big25-macros mono">
                      <span style="color: var(--pro)">{p.pro}<small>g pro</small></span>
                      <span style="color: var(--carb)">{p.carb}<small>g carb</small></span>
                      <span style="color: var(--fat)">{p.fat}<small>g fat</small></span>
                    </div>
                  </article>
                {:else if v.id === 26}
                  {@const t = p.pro * 4 + p.carb * 4 + p.fat * 9}
                  {@const pp = Math.round(p.pro * 4 / t * 100)}
                  {@const cp = Math.round(p.carb * 4 / t * 100)}
                  {@const fp = Math.round(p.fat * 9 / t * 100)}
                  <!-- 26 · SEGMENTED — name + macro split bar with labels -->
                  <article class="big26-card">
                    <div class="big26-row">
                      <h4 class="big26-name">{p.name}</h4>
                      <span class="big26-cal mono">{p.cal.toLocaleString()}<span class="big26-unit"> kcal</span></span>
                    </div>
                    <div class="big26-bar">
                      <span class="big26-seg" style="width: {pp}%; background: var(--pro)"></span>
                      <span class="big26-seg" style="width: {cp}%; background: var(--carb)"></span>
                      <span class="big26-seg" style="width: {fp}%; background: var(--fat)"></span>
                    </div>
                    <div class="big26-legend">
                      <span class="big26-leg" data-k="p"><span class="mono">{p.pro}g</span><span class="big26-pct mono">{pp}%</span></span>
                      <span class="big26-leg" data-k="c"><span class="mono">{p.carb}g</span><span class="big26-pct mono">{cp}%</span></span>
                      <span class="big26-leg" data-k="f"><span class="mono">{p.fat}g</span><span class="big26-pct mono">{fp}%</span></span>
                    </div>
                  </article>
                {:else if v.id === 27}
                  <!-- 27 · 2×2 GRID — name as header, 4 stat cells -->
                  <article class="big27-card">
                    <h4 class="big27-name">{p.name}</h4>
                    <div class="big27-grid">
                      <div class="big27-cell">
                        <span class="big27-label">kcal</span>
                        <span class="big27-val mono" style="color: var(--cal)">{p.cal.toLocaleString()}</span>
                      </div>
                      <div class="big27-cell">
                        <span class="big27-label">protein</span>
                        <span class="big27-val mono" style="color: var(--pro)">{p.pro}<span class="big27-g">g</span></span>
                      </div>
                      <div class="big27-cell">
                        <span class="big27-label">carbs</span>
                        <span class="big27-val mono" style="color: var(--carb)">{p.carb}<span class="big27-g">g</span></span>
                      </div>
                      <div class="big27-cell">
                        <span class="big27-label">fat</span>
                        <span class="big27-val mono" style="color: var(--fat)">{p.fat}<span class="big27-g">g</span></span>
                      </div>
                    </div>
                  </article>
                {:else if v.id === 28}
                  <!-- 28 · MAGAZINE HEADLINE — big bold name, then secondary line -->
                  <article class="big28-card">
                    <span class="big28-eyebrow">Day plan</span>
                    <h4 class="big28-name">{p.name}</h4>
                    <div class="big28-foot">
                      <span class="big28-cal mono">{p.cal.toLocaleString()} kcal</span>
                      <span class="big28-dot"></span>
                      <span class="mono" style="color: var(--pro)">{p.pro}p</span>
                      <span class="mono" style="color: var(--carb)">{p.carb}c</span>
                      <span class="mono" style="color: var(--fat)">{p.fat}f</span>
                    </div>
                  </article>
                {:else if v.id === 29}
                  {@const goalP = 200}
                  {@const goalC = 250}
                  {@const goalF = 90}
                  <!-- 29 · MACRO STACKS — name + 3 horizontal bars per macro -->
                  <article class="big29-card">
                    <header class="big29-head">
                      <h4 class="big29-name">{p.name}</h4>
                      <span class="big29-cal mono">{p.cal.toLocaleString()}</span>
                    </header>
                    {#each [
                      { k:'p', label:'Protein', val:p.pro, goal:goalP, color:'var(--pro)' },
                      { k:'c', label:'Carbs',   val:p.carb,goal:goalC, color:'var(--carb)' },
                      { k:'f', label:'Fat',     val:p.fat, goal:goalF, color:'var(--fat)' },
                    ] as m}
                      <div class="big29-row">
                        <span class="big29-label">{m.label}</span>
                        <div class="big29-bar"><span class="big29-fill" style="width: {Math.min(100, m.val/m.goal*100)}%; background: {m.color}"></span></div>
                        <span class="big29-val mono" style="color: {m.color}">{m.val}<span class="big29-g">g</span></span>
                      </div>
                    {/each}
                  </article>
                {:else if v.id === 30}
                  <!-- 30 · HEADER STRIP — header band with name + body with stats -->
                  <article class="big30-card">
                    <div class="big30-strip">
                      <h4 class="big30-name">{p.name}</h4>
                      <span class="big30-cal mono">{p.cal.toLocaleString()}<small> kcal</small></span>
                    </div>
                    <div class="big30-body">
                      <div class="big30-stat" data-k="p">
                        <span class="big30-label">P</span>
                        <span class="big30-val mono">{p.pro}<small>g</small></span>
                      </div>
                      <div class="big30-stat" data-k="c">
                        <span class="big30-label">C</span>
                        <span class="big30-val mono">{p.carb}<small>g</small></span>
                      </div>
                      <div class="big30-stat" data-k="f">
                        <span class="big30-label">F</span>
                        <span class="big30-val mono">{p.fat}<small>g</small></span>
                      </div>
                    </div>
                  </article>
                {:else if v.id === 31}
                  <!-- 31 · ICONIC COLUMNS — bookmark icon + 2 columns -->
                  <article class="big31-card">
                    <span class="big31-icon"><Bookmark size={20} strokeWidth={1.5} /></span>
                    <div class="big31-body">
                      <h4 class="big31-name">{p.name}</h4>
                      <div class="big31-cols">
                        <div class="big31-col">
                          <span class="big31-label">Calories</span>
                          <span class="big31-val mono" style="color: var(--cal)">{p.cal.toLocaleString()}</span>
                        </div>
                        <div class="big31-col big31-col-macros">
                          <span class="big31-label">Macros</span>
                          <span class="mono">
                            <span style="color: var(--pro)">{p.pro}</span>/<span style="color: var(--carb)">{p.carb}</span>/<span style="color: var(--fat)">{p.fat}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </article>
                {:else if v.id === 32}
                  <!-- 32 · TILE WITH RING — calorie ring + name + macros -->
                  <article class="big32-card">
                    <div class="big32-ring-wrap">
                      <svg class="big32-ring" viewBox="0 0 36 36" width="42" height="42">
                        <circle cx="18" cy="18" r="14" class="big32-ring-bg" />
                        <circle cx="18" cy="18" r="14" class="big32-ring-fg"
                          style="stroke-dasharray: {Math.min(100, p.cal/2400*100) * 0.88} 88;" />
                      </svg>
                      <span class="big32-ring-cal mono">{Math.round(p.cal/100)/10}<small>k</small></span>
                    </div>
                    <div class="big32-body">
                      <h4 class="big32-name">{p.name}</h4>
                      <div class="big32-macros mono">
                        <span style="color: var(--pro)">{p.pro}p</span>
                        <span style="color: var(--carb)">{p.carb}c</span>
                        <span style="color: var(--fat)">{p.fat}f</span>
                      </div>
                    </div>
                  </article>
                {/if}
              {/each}
            </div>

            <button class="dx-add"><Plus size={12} strokeWidth={1.75} />New plan</button>
          </div>
          <span class="variant-tag">{v.tag}</span>
        </div>
      {/each}

    </div>
  </section>

  <!-- ════════════════════════════════════════════════════════════════
       WEEK SUMMARY CARD — 8 variants
       ════════════════════════════════════════════════════════════════ -->
  <section class="group">
    <h2 class="group-title">Week Summary Card — 8 variants</h2>
    <p class="group-sub">Different approaches to the summary card that lives at the end of the week grid. Same sample data: <span class="mono">{sampleWeek.cal.toLocaleString()}</span> kcal across <span class="mono">{sampleWeek.daysPlanned}</span> planned days.</p>

    <div class="ws-grid">

      <!-- WS1 · Calorie hero + 3 stat columns -->
      <article class="ws-card ws1">
        <span class="ws-eyebrow">Week Summary</span>
        <div class="ws1-hero">
          <span class="ws1-cal mono">{sampleWeek.cal.toLocaleString()}</span>
          <span class="ws1-unit">kcal</span>
        </div>
        <span class="ws1-avg">{sampleAvg.toLocaleString()} daily avg</span>
        <div class="ws1-stats">
          <div class="ws1-stat" style="--mc: var(--pro)">
            <span class="ws1-label">Pro</span>
            <span class="ws1-val mono">{sampleWeek.pro}<small>g</small></span>
          </div>
          <div class="ws1-stat" style="--mc: var(--carb)">
            <span class="ws1-label">Carb</span>
            <span class="ws1-val mono">{sampleWeek.carb}<small>g</small></span>
          </div>
          <div class="ws1-stat" style="--mc: var(--fat)">
            <span class="ws1-label">Fat</span>
            <span class="ws1-val mono">{sampleWeek.fat}<small>g</small></span>
          </div>
        </div>
        <div class="ws1-foot">
          <div class="ws1-track">
            {#each sampleWeekDays as letter, di}
              <span class="ws1-day" class:on={sampleWeek.dailyCal[di] > 0} class:today={di === sampleWeek.todayIdx}>{letter}</span>
            {/each}
          </div>
          <span class="ws1-planned"><strong class="mono">{sampleWeek.daysPlanned}</strong> of 7 days</span>
        </div>
        <span class="variant-tag">WS1 · Hero + columns</span>
      </article>

      <!-- WS2 · Donut macro split -->
      <article class="ws-card ws2">
        <span class="ws-eyebrow">Week Summary</span>
        <div class="ws2-row">
          <div class="ws2-donut">
            <svg viewBox="0 0 36 36" width="100" height="100">
              <circle cx="18" cy="18" r="14" fill="none" stroke="var(--bg-hover)" stroke-width="4" />
              <circle cx="18" cy="18" r="14" fill="none" stroke="var(--pro)" stroke-width="4"
                stroke-dasharray="{ws2ProLen} {ws2DonutCirc}" stroke-dashoffset="0" transform="rotate(-90 18 18)" />
              <circle cx="18" cy="18" r="14" fill="none" stroke="var(--carb)" stroke-width="4"
                stroke-dasharray="{ws2CarbLen} {ws2DonutCirc}" stroke-dashoffset="-{ws2ProLen}" transform="rotate(-90 18 18)" />
              <circle cx="18" cy="18" r="14" fill="none" stroke="var(--fat)" stroke-width="4"
                stroke-dasharray="{ws2FatLen} {ws2DonutCirc}" stroke-dashoffset="-{ws2ProLen + ws2CarbLen}" transform="rotate(-90 18 18)" />
            </svg>
            <div class="ws2-donut-center">
              <span class="ws2-donut-cal mono">{Math.round(sampleWeek.cal/1000*10)/10}<small>k</small></span>
              <span class="ws2-donut-unit">kcal</span>
            </div>
          </div>
          <div class="ws2-legend">
            <div class="ws2-leg"><span class="ws2-dot" style="background: var(--pro)"></span><span class="ws2-leg-name">Protein</span><span class="mono ws2-leg-val">{sampleWeek.pro}<small>g</small></span></div>
            <div class="ws2-leg"><span class="ws2-dot" style="background: var(--carb)"></span><span class="ws2-leg-name">Carbs</span><span class="mono ws2-leg-val">{sampleWeek.carb}<small>g</small></span></div>
            <div class="ws2-leg"><span class="ws2-dot" style="background: var(--fat)"></span><span class="ws2-leg-name">Fat</span><span class="mono ws2-leg-val">{sampleWeek.fat}<small>g</small></span></div>
          </div>
        </div>
        <div class="ws2-foot">
          <span class="mono">{sampleAvg.toLocaleString()}</span> kcal / day · <span class="mono">{sampleWeek.daysPlanned}</span> of 7 days
        </div>
        <span class="variant-tag">WS2 · Donut split</span>
      </article>

      <!-- WS3 · Day-by-day vertical bars -->
      <article class="ws-card ws3">
        <span class="ws-eyebrow">Week Summary</span>
        <div class="ws3-totals">
          <span class="ws3-cal mono">{sampleWeek.cal.toLocaleString()}</span>
          <span class="ws3-unit">kcal · {samplePct}% of goal</span>
        </div>
        <div class="ws3-chart">
          {#each sampleWeek.dailyCal as cal, di}
            <div class="ws3-col" class:ws3-today={di === sampleWeek.todayIdx}>
              <span class="ws3-bar" style="height: {Math.round(cal / ws3Max * 100)}%; opacity: {cal > 0 ? 1 : 0.2}"></span>
              <span class="ws3-letter mono">{sampleWeekDays[di]}</span>
            </div>
          {/each}
        </div>
        <div class="ws3-macros mono">
          <span style="color: var(--pro)">{sampleWeek.pro}p</span>
          <span style="color: var(--carb)">{sampleWeek.carb}c</span>
          <span style="color: var(--fat)">{sampleWeek.fat}f</span>
        </div>
        <span class="variant-tag">WS3 · Day bars</span>
      </article>

      <!-- WS4 · Stacked rows with bars (close to current production design) -->
      <article class="ws-card ws4">
        <span class="ws-eyebrow">Week Summary</span>
        <div class="ws4-hero">
          <span class="ws4-cal mono">{sampleWeek.cal.toLocaleString()}</span>
          <span class="ws4-unit">kcal</span>
          <span class="ws4-avg">· <span class="mono">{sampleAvg.toLocaleString()}</span>/day</span>
        </div>
        <div class="ws4-rows">
          {#each [
            { k:'cal',  label:'Calories', val:sampleWeek.cal,  pct: samplePct,    color:'var(--cal)',  unit:'kcal' },
            { k:'pro',  label:'Protein',  val:sampleWeek.pro,  pct: sampleProPct, color:'var(--pro)',  unit:'g' },
            { k:'carb', label:'Carbs',    val:sampleWeek.carb, pct: sampleCarbPct,color:'var(--carb)', unit:'g' },
            { k:'fat',  label:'Fat',      val:sampleWeek.fat,  pct: sampleFatPct, color:'var(--fat)',  unit:'g' },
          ] as m}
            <div class="ws4-row" style="--mc: {m.color}">
              <div class="ws4-row-head">
                <span class="ws4-label">{m.label}</span>
                <span class="ws4-val mono">{m.val.toLocaleString()}<small>{m.unit}</small></span>
              </div>
              <div class="ws4-bar"><span style="width: {m.pct}%"></span></div>
            </div>
          {/each}
        </div>
        <span class="variant-tag">WS4 · Macro rows</span>
      </article>

      <!-- WS5 · Goal-driven hero (% of weekly cal goal) -->
      <article class="ws-card ws5">
        <span class="ws-eyebrow">Weekly Goal</span>
        <div class="ws5-pct mono">{samplePct}<span class="ws5-pct-sym">%</span></div>
        <div class="ws5-bar"><span style="width: {samplePct}%"></span></div>
        <div class="ws5-meta">
          <span class="mono">{sampleWeek.cal.toLocaleString()}</span> of <span class="mono">{sampleWeek.goalCal.toLocaleString()}</span> kcal
        </div>
        <div class="ws5-macros">
          <span style="color: var(--pro)" class="mono">{sampleWeek.pro}p</span>
          <span class="ws5-sep">·</span>
          <span style="color: var(--carb)" class="mono">{sampleWeek.carb}c</span>
          <span class="ws5-sep">·</span>
          <span style="color: var(--fat)" class="mono">{sampleWeek.fat}f</span>
        </div>
        <span class="variant-tag">WS5 · Goal-driven</span>
      </article>

      <!-- WS6 · Sparkline timeline -->
      <article class="ws-card ws6">
        <span class="ws-eyebrow">Week Summary</span>
        <div class="ws6-cal-row">
          <span class="ws6-cal mono">{sampleWeek.cal.toLocaleString()}</span>
          <span class="ws6-unit">kcal · this week</span>
        </div>
        <svg class="ws6-spark" viewBox="0 0 140 40" preserveAspectRatio="none">
          <polyline points={ws6Pts} fill="none" stroke="var(--cal)" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round" opacity="0.9" />
          <polyline points={ws6Pts + ` 140,40 0,40`} fill="var(--cal)" opacity="0.08" stroke="none" />
          <circle cx={ws6TodayCx} cy={ws6TodayCy} r="2.5" fill="var(--cal)" />
        </svg>
        <div class="ws6-foot">
          <div class="ws6-stat"><span class="ws6-label">Avg</span><span class="mono">{sampleAvg.toLocaleString()}</span></div>
          <div class="ws6-stat"><span class="ws6-label">Days</span><span class="mono">{sampleWeek.daysPlanned}/7</span></div>
          <div class="ws6-stat"><span class="ws6-label">Goal</span><span class="mono">{samplePct}%</span></div>
        </div>
        <span class="variant-tag">WS6 · Sparkline</span>
      </article>

      <!-- WS7 · Compact dashboard — info dense -->
      <article class="ws-card ws7">
        <header class="ws7-head">
          <span class="ws-eyebrow">Week Summary</span>
          <span class="ws7-pct mono">{samplePct}%</span>
        </header>
        <div class="ws7-grid">
          <div class="ws7-cell ws7-cell-cal">
            <span class="ws7-label">kcal</span>
            <span class="ws7-val mono">{sampleWeek.cal.toLocaleString()}</span>
          </div>
          <div class="ws7-cell">
            <span class="ws7-label">avg</span>
            <span class="ws7-val mono">{sampleAvg.toLocaleString()}</span>
          </div>
          <div class="ws7-cell">
            <span class="ws7-label">days</span>
            <span class="ws7-val mono">{sampleWeek.daysPlanned}<small>/7</small></span>
          </div>
          <div class="ws7-cell" style="--mc: var(--pro)">
            <span class="ws7-label">pro</span>
            <span class="ws7-val mono">{sampleWeek.pro}<small>g</small></span>
          </div>
          <div class="ws7-cell" style="--mc: var(--carb)">
            <span class="ws7-label">carb</span>
            <span class="ws7-val mono">{sampleWeek.carb}<small>g</small></span>
          </div>
          <div class="ws7-cell" style="--mc: var(--fat)">
            <span class="ws7-label">fat</span>
            <span class="ws7-val mono">{sampleWeek.fat}<small>g</small></span>
          </div>
        </div>
        <div class="ws7-track">
          {#each sampleWeekDays as letter, di}
            <span class="ws7-day-mark" class:on={sampleWeek.dailyCal[di] > 0} class:today={di === sampleWeek.todayIdx}></span>
          {/each}
        </div>
        <span class="variant-tag">WS7 · Dashboard</span>
      </article>

      <!-- WS8 · Hero with calorie ring + macro chips -->
      <article class="ws-card ws8">
        <span class="ws-eyebrow">Week Summary</span>
        <div class="ws8-ring-row">
          <div class="ws8-ring-wrap">
            <svg viewBox="0 0 36 36" width="78" height="78">
              <circle cx="18" cy="18" r="14" fill="none" stroke="var(--bg-hover)" stroke-width="3" />
              <circle cx="18" cy="18" r="14" fill="none" stroke="var(--cal)" stroke-width="3"
                stroke-linecap="round"
                stroke-dasharray="{samplePct * 0.88} 88"
                transform="rotate(-90 18 18)" />
            </svg>
            <div class="ws8-ring-inner">
              <span class="ws8-ring-pct mono">{samplePct}<small>%</small></span>
              <span class="ws8-ring-label">of goal</span>
            </div>
          </div>
          <div class="ws8-side">
            <span class="ws8-cal mono">{sampleWeek.cal.toLocaleString()}<small> kcal</small></span>
            <span class="ws8-avg"><span class="mono">{sampleAvg.toLocaleString()}</span> daily avg</span>
            <div class="ws8-chips">
              <span class="ws8-chip" data-k="p"><span class="mono">{sampleWeek.pro}</span>g pro</span>
              <span class="ws8-chip" data-k="c"><span class="mono">{sampleWeek.carb}</span>g carb</span>
              <span class="ws8-chip" data-k="f"><span class="mono">{sampleWeek.fat}</span>g fat</span>
            </div>
          </div>
        </div>
        <span class="variant-tag">WS8 · Goal ring</span>
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

{#snippet leftAccentCard(p)}
  <article class="plan-card pv4">
    <span class="pv4-bar"></span>
    <div class="pv4-content">
      <header class="pv-head">
        <span class="pv-name">{p.name}</span>
        <button class="pv-del" aria-label="Delete"><X size={11} strokeWidth={2} /></button>
      </header>
      <div class="pv4-cal mono">{p.cal.toLocaleString()} <span class="pv4-unit">kcal</span></div>
      <div class="pv4-macros mono">
        <span style="color: var(--pro)">{p.pro}p</span>
        <span style="color: var(--carb)">{p.carb}c</span>
        <span style="color: var(--fat)">{p.fat}f</span>
      </div>
    </div>
  </article>
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

  /* ── Plan Card mockups ─────────────────────────────────────────── */
  .plan-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: var(--space-4);
  }
  .plan-card {
    position: relative;
    background: var(--bg-1);
    border: var(--border-width) solid var(--border);
    border-radius: var(--radius-md);
    padding: var(--space-3);
    display: flex;
    flex-direction: column;
    gap: 8px;
    overflow: hidden;
  }
  .pv-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-2);
  }
  .pv-name {
    font-size: var(--font-sm);
    font-weight: 600;
    color: var(--text-0);
    letter-spacing: -0.015em;
    flex: 1;
    min-width: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .pv-del {
    background: transparent;
    border: none;
    color: var(--text-3);
    cursor: pointer;
    width: 20px;
    height: 20px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    border-radius: var(--radius-sm);
    flex-shrink: 0;
  }
  .pv-del:hover {
    color: var(--danger);
    background: var(--danger-bg);
  }

  /* 1 · Minimal stack */
  .pv1-cal {
    font-size: var(--font-xl);
    font-weight: 700;
    color: var(--cal);
    letter-spacing: -0.03em;
    line-height: 1;
  }
  .pv1-unit {
    font-size: 10px;
    color: var(--text-3);
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .pv1-macros {
    font-size: var(--font-xs);
    color: var(--text-3);
  }
  .pv1-items {
    font-size: 10px;
    color: var(--text-3);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  /* 2 · Inline single row */
  .pv2-row {
    display: flex;
    align-items: baseline;
    gap: 6px;
    flex-wrap: wrap;
    font-size: var(--font-xs);
  }
  .pv2-cal {
    font-size: var(--font-sm);
    font-weight: 600;
    color: var(--cal);
  }
  .pv2-sep { color: var(--text-3); opacity: 0.5; }
  .pv2-items {
    margin-left: auto;
    font-size: 10px;
    color: var(--text-3);
  }

  /* 3 · Split grid */
  .pv3-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-3);
    padding-top: 4px;
  }
  .pv3-cell { display: flex; flex-direction: column; gap: 2px; }
  .pv3-cal { justify-content: flex-end; }
  .pv3-num {
    font-size: var(--font-xl);
    font-weight: 700;
    color: var(--cal);
    letter-spacing: -0.03em;
    line-height: 1;
  }
  .pv3-label {
    font-size: 9px;
    color: var(--text-3);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: 500;
  }
  .pv3-line {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    font-size: var(--font-xs);
  }

  /* 4 · Left accent */
  .pv4 {
    padding-left: 0;
  }
  .pv4-bar {
    position: absolute;
    left: 0; top: 0; bottom: 0;
    width: 3px;
    background: var(--cal);
  }
  .pv4-content {
    padding-left: var(--space-3);
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .pv4-cal {
    font-size: var(--font-xl);
    font-weight: 700;
    color: var(--text-0);
    letter-spacing: -0.03em;
    line-height: 1;
  }
  .pv4-unit {
    font-size: 10px;
    color: var(--text-3);
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .pv4-macros {
    display: flex;
    gap: 8px;
    font-size: var(--font-xs);
  }

  /* 5 · Centered hero */
  .pv5 {
    align-items: center;
    text-align: center;
    gap: 4px;
    padding: var(--space-4) var(--space-3);
  }
  .pv5-del {
    position: absolute;
    top: 8px;
    right: 8px;
  }
  .pv5-eyebrow {
    font-size: 10px;
    font-weight: 600;
    color: var(--text-2);
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }
  .pv5-cal {
    font-size: var(--font-2xl);
    font-weight: 700;
    color: var(--cal);
    letter-spacing: -0.04em;
    line-height: 1;
  }
  .pv5-unit {
    font-size: 10px;
    color: var(--text-3);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
  .pv5-macros {
    display: flex;
    gap: 12px;
    font-size: var(--font-sm);
    font-weight: 600;
    margin-top: 4px;
  }
  .pv5-g {
    font-size: 9px;
    color: var(--text-3);
    font-weight: 400;
    margin-left: 1px;
  }

  /* 6 · Slots first */
  .pv6-slots {
    display: flex;
    gap: 6px;
    padding: 6px 0;
  }
  .pv6-slot {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    color: var(--text-3);
    opacity: 0.3;
    border-radius: var(--radius-sm);
    background: var(--bg-hover);
  }
  .pv6-slot-on {
    opacity: 1;
    color: var(--text-1);
    background: var(--bg-active);
  }
  .pv6-stats {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 8px;
    font-size: var(--font-xs);
    padding-top: 4px;
    border-top: 1px solid var(--border);
  }
  .pv6-cal { font-weight: 600; color: var(--cal); }

  /* 7 · Bookmark prefix */
  .pv7 {
    flex-direction: row;
    align-items: flex-start;
    gap: var(--space-3);
  }
  .pv7-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    color: var(--text-2);
    background: var(--bg-hover);
    border-radius: var(--radius-md);
    flex-shrink: 0;
  }
  .pv7-content {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .pv7-stats {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    font-size: var(--font-xs);
  }
  .pv7-sep { color: var(--text-3); opacity: 0.5; }

  /* 8 · Macro pills */
  .pv8-cal {
    font-size: var(--font-xl);
    font-weight: 700;
    color: var(--cal);
    letter-spacing: -0.03em;
    line-height: 1;
  }
  .pv8-unit {
    font-size: 10px;
    color: var(--text-3);
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .pv8-chips {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
  }
  .pv8-chip {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    padding: 3px 8px;
    background: var(--bg-hover);
    border: 1px solid var(--border);
    border-radius: var(--radius-full);
    font-size: 10px;
    color: var(--text-2);
  }
  .pv8-chip[data-k="p"] .mono { color: var(--pro); font-weight: 600; }
  .pv8-chip[data-k="c"] .mono { color: var(--carb); font-weight: 600; }
  .pv8-chip[data-k="f"] .mono { color: var(--fat); font-weight: 600; }

  /* ── Day Plans Container mockups ───────────────────────────────── */
  .dock-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
    gap: var(--space-5);
  }
  .dock-mock {
    position: relative;
    background: var(--bg-1);
    border: var(--border-width) solid var(--border);
    border-radius: var(--radius-lg);
    padding: var(--space-4);
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    min-height: 380px;
  }
  /* Shared sub-elements */
  .dv-head {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }
  .dv-title-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .dv-title {
    font-size: var(--font-md);
    font-weight: 700;
    color: var(--text-0);
    letter-spacing: -0.02em;
  }
  .dv-count {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 22px;
    height: 20px;
    padding: 0 6px;
    background: var(--bg-hover);
    border: 1px solid var(--border);
    border-radius: var(--radius-full);
    font-size: 10px;
    font-weight: 600;
    color: var(--text-2);
    line-height: 1;
  }
  .dv-add {
    margin-left: auto;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    background: var(--text-0);
    color: var(--bg-0);
    border: none;
    border-radius: var(--radius-md);
    cursor: pointer;
  }
  .dv-search {
    display: flex;
    align-items: center;
    border: var(--border-width) solid var(--border);
    border-radius: var(--radius-md);
    background: var(--bg-hover);
    padding: 0 8px;
  }
  .dv-search input {
    flex: 1;
    border: none;
    background: transparent;
    padding: 7px 0;
    font-size: var(--font-xs);
    color: var(--text-1);
    outline: none;
    min-width: 0;
    font-family: var(--font-sans);
  }
  .dv-search input::placeholder { color: var(--text-3); }
  .dv-cards {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  /* 2 · Compact pill header */
  .dv2-head {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .dv2-pill {
    display: inline-flex;
    align-items: center;
    padding: 5px 10px;
    background: var(--bg-hover);
    border: 1px solid var(--border);
    border-radius: var(--radius-full);
    font-size: var(--font-xs);
    font-weight: 600;
    color: var(--text-1);
    white-space: nowrap;
  }
  .dv2-search {
    flex: 1;
    display: flex;
    align-items: center;
    border: var(--border-width) solid var(--border);
    border-radius: var(--radius-md);
    background: var(--bg-hover);
    padding: 0 8px;
  }
  .dv2-search input {
    flex: 1; border: none; background: transparent;
    padding: 6px 0; font-size: var(--font-xs);
    color: var(--text-1); outline: none; min-width: 0;
    font-family: var(--font-sans);
  }
  .dv2-search input::placeholder { color: var(--text-3); }
  .dv2 .dv-add { margin-left: 0; }

  /* 3 · Sidebar tabs */
  .dv3-head {
    display: flex;
    align-items: center;
    gap: 8px;
    padding-bottom: var(--space-3);
    border-bottom: 1px solid var(--border);
  }
  .dv3-tabs {
    display: flex;
    gap: 4px;
    flex: 1;
  }
  .dv3-tab {
    padding: 5px 10px;
    background: transparent;
    border: none;
    border-radius: var(--radius-sm);
    font-size: var(--font-xs);
    font-weight: 600;
    color: var(--text-3);
    cursor: pointer;
    font-family: var(--font-sans);
    transition: color var(--transition-fast), background var(--transition-fast);
  }
  .dv3-tab:hover { color: var(--text-1); background: var(--bg-hover); }
  .dv3-tab-active {
    color: var(--text-0);
    background: var(--bg-active);
  }

  /* 4 · Borderless flowing */
  .dv4 {
    background: transparent;
    border: none;
    padding: var(--space-3) 0;
  }
  .dv4-head {
    display: flex;
    align-items: center;
    padding: 0 var(--space-2);
    margin-bottom: var(--space-3);
  }
  .dv4-title {
    font-size: var(--font-md);
    font-weight: 700;
    color: var(--text-0);
    letter-spacing: -0.02em;
  }
  .dv4-cards {
    display: flex;
    flex-direction: column;
  }
  .dv4-cards .plan-card {
    border: none;
    background: transparent;
    border-radius: 0;
    padding: var(--space-3) var(--space-2);
  }
  .dv4-cards .pv4-bar {
    left: 8px;
  }
  .dv4-divider {
    height: 1px;
    background: var(--border);
    margin: 0 var(--space-2);
  }

  /* 5 · Search-first */
  .dv5-head {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .dv5-search {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 10px;
    background: var(--bg-hover);
    border: var(--border-width) solid var(--border-strong);
    border-radius: var(--radius-md);
  }
  .dv5-search-icon {
    display: inline-flex;
    color: var(--text-2);
  }
  .dv5-search input {
    flex: 1; border: none; background: transparent;
    font-size: var(--font-sm); color: var(--text-0);
    outline: none; min-width: 0;
    font-family: var(--font-sans);
  }
  .dv5-search input::placeholder { color: var(--text-3); }
  .dv5-sub {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 4px;
  }
  .dv5-sub-label {
    font-size: 10px;
    color: var(--text-3);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    font-weight: 600;
  }
  .dv5 .dv-add { margin-left: 0; width: 24px; height: 24px; }

  /* 6 · Floating cards */
  .dv6 {
    background: transparent;
    border: none;
  }
  .dv6-cards {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .dv6-cards .plan-card {
    border: none;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.18), 0 1px 2px rgba(0, 0, 0, 0.08);
  }

  /* 7 · Numbered slots */
  .dv7-row {
    display: flex;
    align-items: stretch;
    gap: 8px;
  }
  .dv7-num {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 22px;
    font-size: 10px;
    font-weight: 700;
    color: var(--text-3);
    letter-spacing: 0.04em;
  }
  .dv7-row .plan-card {
    flex: 1;
    min-width: 0;
  }

  /* 8 · Minimal list */
  .dv8 {
    background: transparent;
    border: none;
    padding: var(--space-2) 0;
  }
  .dv8-head {
    padding: 0 var(--space-2);
  }
  .dv8-title {
    font-size: var(--font-md);
    font-weight: 700;
    color: var(--text-0);
    letter-spacing: -0.02em;
  }
  .dv8-add {
    align-self: center;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    margin-top: var(--space-3);
    padding: 5px 12px;
    background: transparent;
    border: 1px dashed var(--border-strong);
    border-radius: var(--radius-full);
    color: var(--text-2);
    font-size: var(--font-xs);
    font-weight: 500;
    font-family: var(--font-sans);
    cursor: pointer;
    transition: color var(--transition-fast), border-color var(--transition-fast);
  }
  .dv8-add:hover {
    color: var(--text-0);
    border-color: var(--text-2);
  }

  /* ── Day Plans Container — second batch (floating · minimal) ───── */
  /* Shared floating-card aesthetic for all dv9–dv16 cards */
  .dv9 .plan-card,
  .dv10 .plan-card,
  .dv11 .plan-card,
  .dv12 .plan-card,
  .dv13 .plan-card,
  .dv14 .plan-card,
  .dv15 .plan-card,
  .dv16 .plan-card {
    border: none;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.18), 0 1px 2px rgba(0, 0, 0, 0.08);
  }

  /* 9 · Float + count + bottom add */
  .dv9 {
    background: transparent;
    border: none;
  }
  .dv9-head {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 0 var(--space-2);
  }
  .dv9-title {
    font-size: var(--font-md);
    font-weight: 700;
    color: var(--text-0);
    letter-spacing: -0.02em;
  }
  .dv9-count {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 22px;
    height: 20px;
    padding: 0 6px;
    background: var(--bg-hover);
    border: 1px solid var(--border);
    border-radius: var(--radius-full);
    font-size: 10px;
    font-weight: 600;
    color: var(--text-2);
    line-height: 1;
  }
  .dv9-cards {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .dv9-add {
    align-self: center;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    margin-top: var(--space-3);
    padding: 5px 12px;
    background: transparent;
    border: 1px dashed var(--border-strong);
    border-radius: var(--radius-full);
    color: var(--text-2);
    font-size: var(--font-xs);
    font-weight: 500;
    font-family: var(--font-sans);
    cursor: pointer;
    transition: color var(--transition-fast), border-color var(--transition-fast);
  }
  .dv9-add:hover { color: var(--text-0); border-color: var(--text-2); }

  /* 10 · Eyebrow only */
  .dv10 {
    background: transparent;
    border: none;
  }
  .dv10-eyebrow {
    font-size: 10px;
    font-weight: 600;
    color: var(--text-3);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    padding: 0 var(--space-2);
    margin-bottom: 4px;
  }
  .dv10-cards {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .dv10-add {
    align-self: flex-start;
    display: inline-flex;
    align-items: center;
    gap: 3px;
    margin-top: 8px;
    padding: 4px 8px;
    background: transparent;
    border: none;
    color: var(--text-3);
    font-size: 10.5px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    cursor: pointer;
    font-family: var(--font-sans);
    transition: color var(--transition-fast);
  }
  .dv10-add:hover { color: var(--text-0); }

  /* 11 · Grouped sections */
  .dv11 {
    background: transparent;
    border: none;
    gap: var(--space-2);
  }
  .dv11-group-label {
    font-size: 10px;
    font-weight: 600;
    color: var(--text-3);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    padding: 0 var(--space-2);
    margin-top: var(--space-2);
  }
  .dv11-group-label:first-child { margin-top: 0; }
  .dv11-cards {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .dv11-add {
    align-self: center;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    margin-top: var(--space-3);
    padding: 5px 12px;
    background: transparent;
    border: 1px dashed var(--border-strong);
    border-radius: var(--radius-full);
    color: var(--text-2);
    font-size: var(--font-xs);
    font-weight: 500;
    font-family: var(--font-sans);
    cursor: pointer;
  }
  .dv11-add:hover { color: var(--text-0); border-color: var(--text-2); }

  /* 12 · FAB add */
  .dv12 {
    background: transparent;
    border: none;
    padding-bottom: 56px;
  }
  .dv12-head {
    padding: 0 var(--space-2);
  }
  .dv12-title {
    font-size: var(--font-md);
    font-weight: 700;
    color: var(--text-0);
    letter-spacing: -0.02em;
  }
  .dv12-cards {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .dv12-fab {
    position: absolute;
    bottom: 12px;
    right: 12px;
    width: 40px;
    height: 40px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: var(--text-0);
    color: var(--bg-0);
    border: none;
    border-radius: 50%;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25), 0 2px 4px rgba(0, 0, 0, 0.1);
    transition: transform var(--transition-fast);
  }
  .dv12-fab:hover { transform: scale(1.05); }
  .dv12-fab:active { transform: scale(0.95); }

  /* 13 · Centered */
  .dv13 {
    background: transparent;
    border: none;
    align-items: center;
  }
  .dv13-head {
    display: flex;
    justify-content: center;
  }
  .dv13-title {
    font-size: var(--font-md);
    font-weight: 700;
    color: var(--text-0);
    letter-spacing: -0.02em;
    text-align: center;
  }
  .dv13-cards {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .dv13-link {
    margin-top: 8px;
    color: var(--text-3);
    font-size: var(--font-xs);
    font-weight: 500;
    text-decoration: none;
    transition: color var(--transition-fast);
  }
  .dv13-link:hover { color: var(--text-0); }

  /* 14 · Add as card */
  .dv14 {
    background: transparent;
    border: none;
  }
  .dv14-head {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 0 var(--space-2);
  }
  .dv14-title {
    font-size: var(--font-md);
    font-weight: 700;
    color: var(--text-0);
    letter-spacing: -0.02em;
  }
  .dv14-count {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 22px;
    height: 20px;
    padding: 0 6px;
    background: var(--bg-hover);
    border: 1px solid var(--border);
    border-radius: var(--radius-full);
    font-size: 10px;
    font-weight: 600;
    color: var(--text-2);
    line-height: 1;
  }
  .dv14-cards {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .dv14-add-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    min-height: 80px;
    padding: var(--space-3);
    background: transparent;
    border: 1.5px dashed var(--border-strong);
    border-radius: var(--radius-md);
    color: var(--text-3);
    font-size: var(--font-xs);
    font-weight: 500;
    cursor: pointer;
    box-shadow: none;
    transition: color var(--transition-fast), border-color var(--transition-fast), background var(--transition-fast);
  }
  .dv14-add-card:hover {
    color: var(--text-0);
    border-color: var(--text-2);
    background: var(--bg-hover);
  }

  /* 15 · No header */
  .dv15 {
    background: transparent;
    border: none;
    padding: var(--space-2) 0;
  }
  .dv15-cards {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .dv15-add {
    align-self: center;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    margin-top: var(--space-4);
    padding: 6px 14px;
    background: var(--text-0);
    color: var(--bg-0);
    border: none;
    border-radius: var(--radius-full);
    font-size: var(--font-xs);
    font-weight: 600;
    font-family: var(--font-sans);
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    transition: opacity var(--transition-fast);
  }
  .dv15-add:hover { opacity: 0.85; }

  /* 16 · Vertical brand bar */
  .dv16 {
    flex-direction: row;
    background: transparent;
    border: none;
    gap: 0;
    padding: 0;
    align-items: stretch;
  }
  .dv16-bar {
    width: 2px;
    background: linear-gradient(180deg, var(--cal), transparent);
    border-radius: var(--radius-full);
    flex-shrink: 0;
  }
  .dv16-content {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    padding: 4px 0 4px var(--space-4);
  }
  .dv16-head {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .dv16-title {
    font-size: var(--font-md);
    font-weight: 700;
    color: var(--text-0);
    letter-spacing: -0.02em;
  }
  .dv16-count {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 22px;
    height: 20px;
    padding: 0 6px;
    background: var(--bg-hover);
    border: 1px solid var(--border);
    border-radius: var(--radius-full);
    font-size: 10px;
    font-weight: 600;
    color: var(--text-2);
    line-height: 1;
  }
  .dv16-cards {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .dv16-add {
    align-self: flex-start;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 10px;
    background: transparent;
    border: 1px dashed var(--border-strong);
    border-radius: var(--radius-full);
    color: var(--text-2);
    font-size: var(--font-xs);
    font-weight: 500;
    font-family: var(--font-sans);
    cursor: pointer;
  }
  .dv16-add:hover { color: var(--text-0); border-color: var(--text-2); }

  /* ── Search inputs (one per variant) ───────────────────────────── */
  /* Shared search reset for any input rendered inside dv9–dv16 */
  .dv9 .dv9-search input,
  .dv10 .dv10-search input,
  .dv11 .dv11-search input,
  .dv12 .dv12-search input,
  .dv13 .dv13-search input,
  .dv14 .dv14-search input,
  .dv15 .dv15-search input,
  .dv16 .dv16-search input {
    flex: 1;
    border: none;
    background: transparent;
    outline: none;
    min-width: 0;
    font-family: var(--font-sans);
    color: var(--text-1);
  }
  .dv9 .dv9-search input::placeholder,
  .dv10 .dv10-search input::placeholder,
  .dv11 .dv11-search input::placeholder,
  .dv12 .dv12-search input::placeholder,
  .dv13 .dv13-search input::placeholder,
  .dv14 .dv14-search input::placeholder,
  .dv15 .dv15-search input::placeholder,
  .dv16 .dv16-search input::placeholder {
    color: var(--text-3);
  }
  .dv9 .dv9-search :global(svg),
  .dv10 .dv10-search :global(svg),
  .dv11 .dv11-search :global(svg),
  .dv12 .dv12-search :global(svg),
  .dv13 .dv13-search :global(svg),
  .dv14 .dv14-search :global(svg),
  .dv15 .dv15-search :global(svg),
  .dv16 .dv16-search :global(svg) {
    color: var(--text-3);
    flex-shrink: 0;
  }

  /* 9 — soft pill */
  .dv9-search {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 10px;
    background: var(--bg-hover);
    border-radius: var(--radius-full);
    margin: 0 var(--space-2);
  }
  .dv9-search input { font-size: var(--font-xs); padding: 0; }

  /* 10 — underline only, very minimal */
  .dv10-search {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 0;
    margin: 4px var(--space-2) 0;
    border-bottom: 1px solid var(--border);
  }
  .dv10-search input { font-size: 11px; padding: 2px 0; }

  /* 11 — full-width pill at top of grouped list */
  .dv11-search {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 7px 10px;
    background: var(--bg-hover);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    margin-bottom: var(--space-2);
  }
  .dv11-search input { font-size: var(--font-xs); padding: 0; }

  /* 12 — search icon button + collapsing search row */
  .dv12-search-btn {
    margin-left: auto;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    background: transparent;
    border: none;
    color: var(--text-3);
    border-radius: var(--radius-sm);
    cursor: pointer;
    transition: color var(--transition-fast), background var(--transition-fast);
  }
  .dv12-search-btn:hover { color: var(--text-0); background: var(--bg-hover); }
  .dv12-head { display: flex; align-items: center; }
  .dv12-search {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 10px;
    background: var(--bg-hover);
    border-radius: var(--radius-md);
  }
  .dv12-search input { font-size: var(--font-xs); padding: 0; }

  /* 13 — centered, borderless */
  .dv13-search {
    align-self: stretch;
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    background: var(--bg-hover);
    border-radius: var(--radius-full);
    text-align: center;
  }
  .dv13-search input { font-size: var(--font-xs); padding: 0; text-align: center; }

  /* 14 — inline with the title row */
  .dv14-search {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    background: var(--bg-hover);
    border-radius: var(--radius-full);
    max-width: 130px;
  }
  .dv14-search input { font-size: 11px; padding: 0; }
  .dv14-head { flex-wrap: wrap; }

  /* 15 — solid card-like search */
  .dv15-search {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    background: var(--bg-1);
    border: var(--border-width) solid var(--border);
    border-radius: var(--radius-md);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
  }
  .dv15-search input { font-size: var(--font-sm); padding: 0; }

  /* 16 — sits inside the brand-bar content */
  .dv16-search {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 10px;
    background: var(--bg-hover);
    border-radius: var(--radius-md);
  }
  .dv16-search input { font-size: var(--font-xs); padding: 0; }

  /* ════════════════════════════════════════════════════════════════
     Day Plans Container — 8 card refinements (dx17–dx24)
     ════════════════════════════════════════════════════════════════ */

  /* Shared chrome between dx17–dx24 */
  .dock-mock[class*="dx"] {
    background: transparent;
    border: none;
    flex-direction: row;
    align-items: stretch;
    gap: 0;
    padding: 0;
  }
  .dx-bar, .dx17-bar {
    width: 2px;
    background: linear-gradient(180deg, var(--cal), transparent);
    border-radius: var(--radius-full);
    flex-shrink: 0;
  }
  .dx-content, .dx17-content {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    padding: 4px 0 4px var(--space-4);
  }
  .dx-cards {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .dx-add {
    align-self: center;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    margin-top: 4px;
    padding: 5px 12px;
    background: transparent;
    border: 1px dashed var(--border-strong);
    border-radius: var(--radius-full);
    color: var(--text-2);
    font-size: var(--font-xs);
    font-weight: 500;
    font-family: var(--font-sans);
    cursor: pointer;
    transition: color var(--transition-fast), border-color var(--transition-fast);
  }
  .dx-add:hover { color: var(--text-0); border-color: var(--text-2); }

  /* Shared floating-card shadow for the new card variants */
  .dx17-card,
  .dx18-card,
  .dx19-card,
  .dx20-card,
  .dx21-card,
  .dx22-card,
  .dx23-card,
  .dx24-card {
    background: var(--bg-1);
    border-radius: var(--radius-md);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.18), 0 1px 2px rgba(0, 0, 0, 0.08);
    padding: 10px var(--space-3);
    cursor: grab;
    transition: box-shadow var(--transition-fast), transform var(--transition-fast);
    position: relative;
  }
  .dx17-card:hover, .dx18-card:hover, .dx19-card:hover,
  .dx20-card:hover, .dx21-card:hover, .dx22-card:hover,
  .dx23-card:hover, .dx24-card:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.22), 0 2px 4px rgba(0, 0, 0, 0.12);
  }

  /* Each variant gets the left amber border-strong stripe */
  .dx17-card::before, .dx18-card::before, .dx19-card::before,
  .dx20-card::before, .dx21-card::before, .dx22-card::before,
  .dx23-card::before, .dx24-card::before {
    content: '';
    position: absolute;
    left: 0; top: 0; bottom: 0;
    width: 3px;
    background: var(--border-strong);
    border-radius: var(--radius-md) 0 0 var(--radius-md);
  }

  /* ── 17 · Headline names — name is the hero ── */
  .dx17-head {
    position: relative;
    display: flex;
    align-items: baseline;
    gap: 8px;
    padding-bottom: 6px;
  }
  .dx17-title {
    margin: 0;
    font-size: var(--font-xl);
    font-weight: 700;
    letter-spacing: -0.03em;
    line-height: 1;
    /* Neutral light → slightly cooler depth gradient — no color tint,
       stays bright enough to read against the page bg. */
    background: linear-gradient(180deg, #ffffff 0%, var(--text-0) 30%, var(--text-1) 130%);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    -webkit-text-fill-color: transparent;
  }
  .dx17-count {
    font-size: 11px;
    color: var(--text-3);
    font-weight: 600;
    letter-spacing: 0.04em;
  }
  .dx17-underline {
    position: absolute;
    left: 0; bottom: 0;
    width: 28px;
    height: 2px;
    background: var(--cal);
    border-radius: var(--radius-full);
    opacity: 0.7;
  }
  .dx17-search {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 0;
    border-bottom: 1px solid var(--border);
    transition: border-color var(--transition-fast);
  }
  .dx17-search:focus-within { border-bottom-color: var(--cal); }
  .dx17-search :global(svg) { color: var(--text-3); flex-shrink: 0; }
  .dx17-search input {
    flex: 1; border: none; background: transparent; outline: none;
    font-family: var(--font-sans); color: var(--text-1);
    font-size: 11px; padding: 2px 0; min-width: 0;
  }
  .dx17-search input::placeholder { color: var(--text-3); }
  .dx17-cards { display: flex; flex-direction: column; gap: 8px; }
  .dx17-name {
    margin: 0 0 4px;
    font-size: var(--font-md);
    font-weight: 700;
    color: var(--text-0);
    letter-spacing: -0.02em;
    line-height: 1.2;
  }
  .dx17-meta {
    display: flex;
    align-items: baseline;
    gap: 5px;
    font-size: 10.5px;
    color: var(--text-3);
  }
  .dx17-cal { color: var(--cal); font-weight: 600; }
  .dx17-cal-unit { color: var(--text-3); font-weight: 400; font-size: 9px; margin-left: 1px; text-transform: uppercase; letter-spacing: 0.04em; }
  .dx17-sep { opacity: 0.5; }

  /* ── 18 · Two-line names ── */
  .dx18-head { display: flex; flex-direction: column; gap: 0; }
  .dx18-title {
    font-size: var(--font-lg);
    font-weight: 700;
    color: var(--text-0);
    letter-spacing: -0.025em;
    line-height: 1.1;
  }
  .dx18-sub {
    margin: 2px 0 0;
    font-size: 10.5px;
    color: var(--text-3);
  }
  .dx18-sub .mono { color: var(--text-2); font-weight: 600; }
  .dx18-search {
    display: flex; align-items: center; gap: 6px;
    padding: 7px 10px;
    background: var(--bg-hover);
    border-radius: var(--radius-md);
  }
  .dx18-search :global(svg) { color: var(--text-3); flex-shrink: 0; }
  .dx18-search input {
    flex: 1; border: none; background: transparent; outline: none;
    font-family: var(--font-sans); color: var(--text-1);
    font-size: var(--font-xs); padding: 0; min-width: 0;
  }
  .dx18-search input::placeholder { color: var(--text-3); }
  .dx18-card { display: flex; flex-direction: column; gap: 8px; }
  .dx18-name {
    font-size: var(--font-sm);
    font-weight: 600;
    color: var(--text-0);
    letter-spacing: -0.01em;
    line-height: 1.35;
    /* Allow up to 2 lines, then ellipsis */
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .dx18-stats {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--space-2);
    padding-top: 6px;
    border-top: 1px solid var(--border);
  }
  .dx18-cal { font-size: var(--font-base); font-weight: 700; color: var(--text-0); letter-spacing: -0.02em; }
  .dx18-cal-unit { font-size: 9px; color: var(--text-3); font-weight: 400; margin-left: 2px; text-transform: uppercase; letter-spacing: 0.04em; }
  .dx18-macros { display: flex; gap: 6px; font-size: 10.5px; }
  .dx18-g { font-size: 8px; color: var(--text-3); margin-left: 1px; }

  /* ── 19 · List rows ── */
  .dx19-head {
    display: flex;
    align-items: baseline;
    gap: 6px;
  }
  .dx19-eyebrow {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--text-2);
  }
  .dx19-count { font-size: 10px; color: var(--text-3); }
  .dx19-search {
    display: flex; align-items: center; gap: 6px;
    padding: 6px 10px;
    background: var(--bg-hover);
    border-radius: var(--radius-md);
  }
  .dx19-search :global(svg) { color: var(--text-3); flex-shrink: 0; }
  .dx19-search input {
    flex: 1; border: none; background: transparent; outline: none;
    font-family: var(--font-sans); color: var(--text-1);
    font-size: var(--font-xs); padding: 0; min-width: 0;
  }
  .dx19-search input::placeholder { color: var(--text-3); }
  .dx19-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
  }
  .dx19-left { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
  .dx19-name {
    font-size: var(--font-sm);
    font-weight: 600;
    color: var(--text-0);
    letter-spacing: -0.01em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .dx19-macros { display: flex; gap: 5px; font-size: 10px; }
  .dx19-right {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    flex-shrink: 0;
  }
  .dx19-cal { font-size: var(--font-md); font-weight: 700; color: var(--cal); letter-spacing: -0.02em; line-height: 1; }
  .dx19-cal-unit { font-size: 8px; color: var(--text-3); text-transform: uppercase; letter-spacing: 0.06em; }

  /* ── 20 · Side calorie column ── */
  .dx20-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
  }
  .dx20-title {
    font-size: var(--font-md);
    font-weight: 700;
    color: var(--text-0);
    letter-spacing: -0.025em;
  }
  .dx20-count { font-size: 10px; color: var(--text-3); text-transform: uppercase; letter-spacing: 0.06em; font-weight: 500; }
  .dx20-search {
    display: flex; align-items: center; gap: 6px;
    padding: 5px 10px;
    background: var(--bg-hover);
    border: 1px solid transparent;
    border-radius: var(--radius-full);
    transition: border-color var(--transition-fast);
  }
  .dx20-search:focus-within { border-color: var(--border-strong); }
  .dx20-search :global(svg) { color: var(--text-3); flex-shrink: 0; }
  .dx20-search input {
    flex: 1; border: none; background: transparent; outline: none;
    font-family: var(--font-sans); color: var(--text-1);
    font-size: 11px; padding: 0; min-width: 0;
  }
  .dx20-search input::placeholder { color: var(--text-3); }
  .dx20-card {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: 12px var(--space-3);
  }
  .dx20-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
  .dx20-name {
    font-size: var(--font-sm);
    font-weight: 600;
    color: var(--text-0);
    letter-spacing: -0.01em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .dx20-macros { font-size: 10px; color: var(--text-3); }
  .dx20-cal-col {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    padding-left: var(--space-3);
    border-left: 1px solid var(--border);
    flex-shrink: 0;
  }
  .dx20-cal { font-size: var(--font-lg); font-weight: 700; color: var(--cal); letter-spacing: -0.03em; line-height: 1; }
  .dx20-cal-unit { font-size: 8px; color: var(--text-3); text-transform: uppercase; letter-spacing: 0.06em; margin-top: 2px; }

  /* ── 21 · Macro pills ── */
  .dx21-head {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .dx21-head :global(.dx21-icon) { color: var(--cal); }
  .dx21-title {
    margin: 0;
    font-size: var(--font-md);
    font-weight: 700;
    color: var(--text-0);
    letter-spacing: -0.025em;
    flex: 1;
  }
  .dx21-count {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 22px;
    height: 20px;
    padding: 0 6px;
    background: var(--bg-hover);
    border-radius: var(--radius-full);
    font-size: 10px;
    font-weight: 600;
    color: var(--text-2);
    line-height: 1;
  }
  .dx21-search {
    display: flex; align-items: center; gap: 6px;
    padding: 7px 12px;
    background: var(--bg-hover);
    border-radius: var(--radius-full);
  }
  .dx21-search :global(svg) { color: var(--text-3); flex-shrink: 0; }
  .dx21-search input {
    flex: 1; border: none; background: transparent; outline: none;
    font-family: var(--font-sans); color: var(--text-1);
    font-size: var(--font-xs); padding: 0; min-width: 0;
  }
  .dx21-search input::placeholder { color: var(--text-3); }
  .dx21-card { display: flex; flex-direction: column; gap: 8px; }
  .dx21-card-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--space-2);
  }
  .dx21-name {
    font-size: var(--font-sm);
    font-weight: 600;
    color: var(--text-0);
    letter-spacing: -0.01em;
    flex: 1;
    min-width: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .dx21-cal { font-size: 11px; color: var(--text-3); }
  .dx21-cal :first-child { color: var(--cal); font-weight: 600; }
  .dx21-cal-unit { font-size: 9px; }
  .dx21-pills { display: flex; gap: 4px; flex-wrap: wrap; }
  .dx21-pill {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    padding: 2px 8px;
    background: var(--bg-hover);
    border-radius: var(--radius-full);
    font-size: 10px;
    font-weight: 500;
  }
  .dx21-pill[data-k="p"] { color: var(--pro); }
  .dx21-pill[data-k="c"] { color: var(--carb); }
  .dx21-pill[data-k="f"] { color: var(--fat); }
  .dx21-pill .mono { font-weight: 600; }

  /* ── 22 · Numeric-led — kcal column on the left ── */
  .dx22-head { display: flex; align-items: center; }
  .dx22-title {
    font-size: var(--font-md);
    font-weight: 700;
    color: var(--text-0);
    letter-spacing: -0.025em;
  }
  .dx22-search {
    display: flex; align-items: center; gap: 6px;
    padding: 6px 10px;
    background: transparent;
    border-bottom: 1px solid var(--border);
    border-radius: 0;
    transition: border-color var(--transition-fast);
  }
  .dx22-search:focus-within { border-bottom-color: var(--text-2); }
  .dx22-search :global(svg) { color: var(--text-3); flex-shrink: 0; order: 2; }
  .dx22-search input {
    flex: 1; border: none; background: transparent; outline: none;
    font-family: var(--font-sans); color: var(--text-1);
    font-size: var(--font-xs); padding: 0; min-width: 0;
  }
  .dx22-search input::placeholder { color: var(--text-3); }
  .dx22-card {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: 10px var(--space-3);
  }
  .dx22-num-col {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    flex-shrink: 0;
    min-width: 56px;
  }
  .dx22-num {
    font-size: var(--font-xl);
    font-weight: 700;
    color: var(--text-0);
    letter-spacing: -0.04em;
    line-height: 0.95;
  }
  .dx22-unit { font-size: 9px; color: var(--text-3); text-transform: uppercase; letter-spacing: 0.08em; margin-top: 2px; }
  .dx22-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; padding-left: var(--space-2); border-left: 1px solid var(--border); }
  .dx22-name {
    font-size: var(--font-sm);
    font-weight: 600;
    color: var(--text-0);
    letter-spacing: -0.01em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .dx22-macros { display: flex; gap: 5px; font-size: 10px; }

  /* ── 23 · Dossier ── */
  .dx23-head {
    display: flex;
    align-items: baseline;
    gap: 4px;
  }
  .dx23-eyebrow {
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--text-0);
  }
  .dx23-count { font-size: 11px; color: var(--text-3); font-weight: 500; }
  .dx23-filters {
    display: flex;
    gap: 4px;
    align-items: center;
  }
  .dx23-filter {
    padding: 4px 10px;
    background: transparent;
    border: 1px solid var(--border);
    border-radius: var(--radius-full);
    font-size: 10px;
    font-weight: 500;
    color: var(--text-3);
    cursor: pointer;
    font-family: var(--font-sans);
    transition: all var(--transition-fast);
  }
  .dx23-filter:hover { color: var(--text-0); border-color: var(--border-strong); }
  .dx23-filter-on { background: var(--text-0); color: var(--bg-0); border-color: var(--text-0); }
  .dx23-filter-icon {
    margin-left: auto;
    padding: 4px 7px;
    display: inline-flex;
    align-items: center;
  }
  .dx23-card {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }
  .dx23-name {
    font-size: var(--font-sm);
    font-weight: 600;
    color: var(--text-0);
    letter-spacing: -0.01em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex: 1;
    min-width: 0;
  }
  .dx23-divider {
    flex-shrink: 0;
    width: 1px;
    height: 14px;
    background: var(--border);
  }
  .dx23-meta { display: inline-flex; align-items: baseline; gap: 4px; font-size: 10.5px; color: var(--text-3); flex-shrink: 0; }
  .dx23-cal { color: var(--cal); font-weight: 600; }
  .dx23-sep { opacity: 0.5; }

  /* ── 24 · Bar-driven — title with two-tone, segmented macro bar ── */
  .dx24-head {
    display: flex;
    align-items: baseline;
    gap: 8px;
  }
  .dx24-title {
    margin: 0;
    font-size: var(--font-xl);
    font-weight: 700;
    letter-spacing: -0.035em;
    line-height: 1;
    flex: 1;
  }
  .dx24-title-day { color: var(--text-3); font-weight: 500; }
  .dx24-title-plans { color: var(--text-0); margin-left: 4px; }
  .dx24-count {
    font-size: 11px;
    color: var(--text-2);
    font-weight: 600;
    padding: 2px 8px;
    background: var(--bg-hover);
    border-radius: var(--radius-full);
  }
  .dx24-search {
    display: flex; align-items: center; gap: 6px;
    padding: 7px 10px;
    background: var(--bg-hover);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    transition: border-color var(--transition-fast), background var(--transition-fast);
  }
  .dx24-search:focus-within {
    border-color: var(--cal);
    background: var(--bg-active);
  }
  .dx24-search :global(svg) { color: var(--cal); flex-shrink: 0; }
  .dx24-search input {
    flex: 1; border: none; background: transparent; outline: none;
    font-family: var(--font-sans); color: var(--text-1);
    font-size: var(--font-xs); padding: 0; min-width: 0;
  }
  .dx24-search input::placeholder { color: var(--text-3); }
  .dx24-card {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .dx24-row { display: flex; align-items: baseline; justify-content: space-between; gap: var(--space-2); }
  .dx24-name {
    font-size: var(--font-sm);
    font-weight: 600;
    color: var(--text-0);
    letter-spacing: -0.01em;
    flex: 1;
    min-width: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .dx24-cal { font-size: var(--font-sm); font-weight: 700; color: var(--cal); letter-spacing: -0.02em; }
  .dx24-cal-unit { font-size: 9px; color: var(--text-3); text-transform: uppercase; letter-spacing: 0.06em; margin-left: 2px; font-weight: 400; }
  .dx24-bar {
    display: flex;
    width: 100%;
    height: 4px;
    background: var(--bg-hover);
    border-radius: var(--radius-full);
    overflow: hidden;
  }
  .dx24-bar-seg {
    height: 100%;
    transition: width 240ms ease;
  }
  .dx24-macros { display: flex; gap: 8px; font-size: 10px; }
  .dx24-macros small { font-size: 8px; opacity: 0.7; margin-left: 1px; }

  /* ════════════════════════════════════════════════════════════════
     BIGGER cards (variants 25–32) — share the dx17 chrome
     ════════════════════════════════════════════════════════════════ */
  .dock-mock.dx-big {
    background: transparent;
    border: none;
    flex-direction: row;
    align-items: stretch;
    gap: 0;
    padding: 0;
  }

  /* Shared card chrome — floating, larger padding, left amber stripe */
  [class^="big"][class$="-card"] {
    position: relative;
    background: var(--bg-1);
    border-radius: var(--radius-md);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.18), 0 1px 2px rgba(0, 0, 0, 0.08);
    padding: var(--space-3);
    cursor: grab;
    transition: box-shadow var(--transition-fast);
  }
  [class^="big"][class$="-card"]:hover {
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.24), 0 2px 4px rgba(0, 0, 0, 0.12);
  }
  [class^="big"][class$="-card"]::before {
    content: '';
    position: absolute;
    left: 0; top: 0; bottom: 0;
    width: 3px;
    background: var(--border-strong);
    border-radius: var(--radius-md) 0 0 var(--radius-md);
  }

  /* ── 25 · STAT HERO ── */
  .big25-card { display: flex; flex-direction: column; gap: 8px; padding: 14px var(--space-3) 12px; }
  .big25-cal-row { display: flex; align-items: baseline; gap: 4px; }
  .big25-cal {
    font-size: var(--font-2xl);
    font-weight: 700;
    color: var(--text-0);
    letter-spacing: -0.04em;
    line-height: 1;
  }
  .big25-cal-unit {
    font-size: 10px; color: var(--text-3);
    text-transform: uppercase; letter-spacing: 0.06em;
  }
  .big25-name {
    margin: 0;
    font-size: var(--font-sm);
    font-weight: 600;
    color: var(--text-1);
    letter-spacing: -0.01em;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .big25-bars {
    display: flex;
    width: 100%;
    height: 4px;
    background: var(--bg-hover);
    border-radius: var(--radius-full);
    overflow: hidden;
    margin-top: 2px;
  }
  .big25-seg { height: 100%; }
  .big25-macros { display: flex; gap: 10px; font-size: 10.5px; margin-top: 2px; }
  .big25-macros small { font-size: 8.5px; opacity: 0.7; margin-left: 2px; }

  /* ── 26 · SEGMENTED BAR ── */
  .big26-card { display: flex; flex-direction: column; gap: 10px; padding: 14px var(--space-3); }
  .big26-row { display: flex; align-items: baseline; justify-content: space-between; gap: var(--space-2); }
  .big26-name {
    margin: 0;
    font-size: var(--font-md);
    font-weight: 700;
    color: var(--text-0);
    letter-spacing: -0.025em;
    flex: 1; min-width: 0;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .big26-cal { font-size: 12px; color: var(--text-2); font-weight: 600; }
  .big26-unit { font-size: 9px; color: var(--text-3); font-weight: 400; text-transform: uppercase; letter-spacing: 0.06em; }
  .big26-bar {
    display: flex; width: 100%; height: 6px;
    background: var(--bg-hover);
    border-radius: var(--radius-full); overflow: hidden;
  }
  .big26-seg { height: 100%; }
  .big26-legend { display: flex; justify-content: space-between; gap: 6px; }
  .big26-leg {
    display: flex; flex-direction: column; align-items: flex-start; gap: 1px;
    flex: 1; min-width: 0;
    padding-left: 6px;
    border-left: 2px solid currentColor;
    font-size: 11px;
  }
  .big26-leg[data-k="p"] { color: var(--pro); }
  .big26-leg[data-k="c"] { color: var(--carb); }
  .big26-leg[data-k="f"] { color: var(--fat); }
  .big26-leg .mono { font-weight: 600; }
  .big26-pct { font-size: 9px; color: var(--text-3); font-weight: 500; }

  /* ── 27 · 2×2 STAT GRID ── */
  .big27-card { display: flex; flex-direction: column; gap: 10px; padding: 14px var(--space-3); }
  .big27-name {
    margin: 0;
    font-size: var(--font-md);
    font-weight: 700;
    color: var(--text-0);
    letter-spacing: -0.025em;
    line-height: 1.2;
  }
  .big27-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px 10px;
    padding-top: 6px;
    border-top: 1px solid var(--border);
  }
  .big27-cell { display: flex; flex-direction: column; gap: 1px; }
  .big27-label {
    font-size: 9px;
    color: var(--text-3);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    font-weight: 600;
  }
  .big27-val {
    font-size: var(--font-base);
    font-weight: 700;
    letter-spacing: -0.02em;
    line-height: 1.1;
  }
  .big27-g { font-size: 9px; color: var(--text-3); margin-left: 1px; font-weight: 400; }

  /* ── 28 · MAGAZINE HEADLINE ── */
  .big28-card { display: flex; flex-direction: column; gap: 6px; padding: 16px var(--space-3) 14px; }
  .big28-eyebrow {
    font-size: 9px;
    color: var(--text-3);
    text-transform: uppercase;
    letter-spacing: 0.16em;
    font-weight: 600;
  }
  .big28-name {
    margin: 0;
    font-size: var(--font-lg);
    font-weight: 800;
    color: var(--text-0);
    letter-spacing: -0.035em;
    line-height: 1.05;
  }
  .big28-foot {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 4px;
    font-size: 11px;
  }
  .big28-cal { color: var(--cal); font-weight: 600; }
  .big28-dot {
    width: 3px; height: 3px;
    background: var(--text-3);
    border-radius: 50%;
    opacity: 0.6;
  }

  /* ── 29 · MACRO STACKS — bars per macro ── */
  .big29-card { display: flex; flex-direction: column; gap: 8px; padding: 12px var(--space-3); }
  .big29-head { display: flex; align-items: baseline; justify-content: space-between; }
  .big29-name {
    margin: 0;
    font-size: var(--font-sm);
    font-weight: 700;
    color: var(--text-0);
    letter-spacing: -0.015em;
    flex: 1; min-width: 0;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .big29-cal {
    font-size: var(--font-md);
    color: var(--text-0);
    font-weight: 700;
    letter-spacing: -0.025em;
  }
  .big29-row {
    display: grid;
    grid-template-columns: 50px 1fr 50px;
    align-items: center;
    gap: 6px;
  }
  .big29-label {
    font-size: 10px;
    color: var(--text-3);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    font-weight: 600;
  }
  .big29-bar {
    height: 5px;
    background: var(--bg-hover);
    border-radius: var(--radius-full);
    overflow: hidden;
  }
  .big29-fill {
    display: block;
    height: 100%;
    border-radius: var(--radius-full);
    transition: width 240ms ease;
  }
  .big29-val { font-size: 11px; font-weight: 600; text-align: right; }
  .big29-g { font-size: 9px; color: var(--text-3); margin-left: 1px; font-weight: 400; }

  /* ── 30 · HEADER STRIP ── */
  .big30-card { padding: 0; overflow: hidden; }
  .big30-strip {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--space-2);
    padding: 12px var(--space-3) 10px;
    background: linear-gradient(180deg, var(--bg-hover), transparent);
  }
  .big30-name {
    margin: 0;
    font-size: var(--font-md);
    font-weight: 700;
    color: var(--text-0);
    letter-spacing: -0.025em;
    flex: 1; min-width: 0;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .big30-cal {
    font-size: var(--font-sm);
    color: var(--cal);
    font-weight: 700;
    letter-spacing: -0.02em;
  }
  .big30-cal small { font-size: 9px; color: var(--text-3); font-weight: 400; text-transform: uppercase; letter-spacing: 0.06em; }
  .big30-body {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 8px;
    padding: 10px var(--space-3) 12px;
  }
  .big30-stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    padding: 4px 0;
    border-radius: var(--radius-sm);
  }
  .big30-label {
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-weight: 700;
    color: var(--text-3);
  }
  .big30-val { font-size: var(--font-base); font-weight: 700; letter-spacing: -0.02em; }
  .big30-val small { font-size: 9px; color: var(--text-3); margin-left: 1px; font-weight: 400; }
  .big30-stat[data-k="p"] .big30-val { color: var(--pro); }
  .big30-stat[data-k="c"] .big30-val { color: var(--carb); }
  .big30-stat[data-k="f"] .big30-val { color: var(--fat); }

  /* ── 31 · ICONIC + COLUMNS ── */
  .big31-card {
    display: flex;
    align-items: stretch;
    gap: var(--space-3);
    padding: 12px var(--space-3);
  }
  .big31-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 38px;
    height: 38px;
    color: var(--cal);
    background: color-mix(in srgb, var(--cal) 15%, transparent);
    border-radius: var(--radius-md);
    flex-shrink: 0;
    align-self: center;
  }
  .big31-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 6px; }
  .big31-name {
    margin: 0;
    font-size: var(--font-sm);
    font-weight: 700;
    color: var(--text-0);
    letter-spacing: -0.015em;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .big31-cols {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-2);
  }
  .big31-col { display: flex; flex-direction: column; gap: 1px; }
  .big31-col-macros { padding-left: 8px; border-left: 1px solid var(--border); }
  .big31-label {
    font-size: 9px;
    color: var(--text-3);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    font-weight: 600;
  }
  .big31-val { font-size: var(--font-sm); font-weight: 700; letter-spacing: -0.02em; }
  .big31-col-macros .mono { font-size: var(--font-sm); font-weight: 600; }

  /* ── 32 · TILE WITH RING ── */
  .big32-card {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: 12px var(--space-3);
  }
  .big32-ring-wrap {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 42px; height: 42px;
  }
  .big32-ring { transform: rotate(-90deg); }
  .big32-ring-bg { fill: none; stroke: var(--bg-hover); stroke-width: 3; }
  .big32-ring-fg {
    fill: none; stroke: var(--cal); stroke-width: 3;
    stroke-linecap: round;
    transition: stroke-dasharray 600ms cubic-bezier(0.4, 0, 0.2, 1);
  }
  .big32-ring-cal {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 700;
    color: var(--cal);
    letter-spacing: -0.02em;
  }
  .big32-ring-cal small { font-size: 8px; opacity: 0.7; margin-left: 1px; }
  .big32-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
  .big32-name {
    margin: 0;
    font-size: var(--font-sm);
    font-weight: 700;
    color: var(--text-0);
    letter-spacing: -0.015em;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .big32-macros { display: flex; gap: 8px; font-size: 11px; }

  /* ════════════════════════════════════════════════════════════════
     WEEK SUMMARY CARD — 8 variants (WS1–WS8)
     ════════════════════════════════════════════════════════════════ */
  .ws-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
    gap: var(--space-4);
  }
  .ws-card {
    position: relative;
    background: var(--bg-1);
    border: var(--border-width) solid var(--border);
    border-radius: var(--radius-lg);
    padding: var(--space-4);
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    min-height: 280px;
  }
  .ws-eyebrow {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--text-3);
  }

  /* ── WS1 · Hero + 3 columns ── */
  .ws1 { align-items: flex-start; text-align: left; }
  .ws1-hero { display: flex; align-items: baseline; gap: 6px; }
  .ws1-cal {
    font-size: var(--font-2xl);
    font-weight: 700;
    color: var(--text-0);
    letter-spacing: -0.04em;
    line-height: 1;
    text-shadow: var(--title-shadow);
  }
  .ws1-unit {
    font-size: 11px; color: var(--text-3);
    text-transform: uppercase; letter-spacing: 0.06em;
  }
  .ws1-avg {
    font-size: 11px; color: var(--text-3);
    margin-top: -4px;
  }
  .ws1-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    padding-top: var(--space-3);
    border-top: 1px solid var(--border);
  }
  .ws1-stat {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 6px 8px;
    background: var(--bg-hover);
    border-radius: var(--radius-sm);
    border-left: 2px solid var(--mc);
  }
  .ws1-label {
    font-size: 9px; color: var(--text-3);
    text-transform: uppercase; letter-spacing: 0.06em;
    font-weight: 600;
  }
  .ws1-val { font-size: var(--font-base); font-weight: 700; color: var(--mc); letter-spacing: -0.02em; }
  .ws1-val small { font-size: 9px; color: var(--text-3); margin-left: 1px; font-weight: 400; }
  .ws1-foot {
    margin-top: auto;
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding-top: var(--space-3);
    border-top: 1px solid var(--border);
  }
  .ws1-track {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 4px;
  }
  .ws1-day {
    text-align: center;
    font-size: 9px; font-weight: 600; letter-spacing: 0.04em;
    color: var(--text-3);
    padding: 3px 0;
    border-radius: var(--radius-sm);
    background: var(--bg-hover);
    text-transform: uppercase;
  }
  .ws1-day.on { color: var(--text-1); background: var(--bg-active); }
  .ws1-day.today {
    color: #fff;
    background: #6ec9a8;
    box-shadow: 0 0 6px rgba(110, 201, 168, 0.55);
  }
  .ws1-planned { font-size: 11px; color: var(--text-3); }
  .ws1-planned strong { color: var(--text-1); font-weight: 600; }

  /* ── WS2 · Donut ── */
  .ws2-row { display: flex; align-items: center; gap: var(--space-3); }
  .ws2-donut {
    position: relative;
    width: 100px; height: 100px;
    flex-shrink: 0;
  }
  .ws2-donut-center {
    position: absolute; inset: 0;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
  }
  .ws2-donut-cal {
    font-size: var(--font-lg);
    font-weight: 700;
    color: var(--text-0);
    letter-spacing: -0.03em;
    line-height: 1;
  }
  .ws2-donut-cal small { font-size: 11px; color: var(--text-3); font-weight: 500; }
  .ws2-donut-unit {
    font-size: 9px; color: var(--text-3);
    text-transform: uppercase; letter-spacing: 0.08em;
    margin-top: 2px;
  }
  .ws2-legend { flex: 1; display: flex; flex-direction: column; gap: 6px; }
  .ws2-leg {
    display: flex; align-items: center; gap: 6px;
    font-size: 11px; color: var(--text-2);
  }
  .ws2-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
  .ws2-leg-name { flex: 1; }
  .ws2-leg-val { color: var(--text-0); font-weight: 600; }
  .ws2-leg-val small { font-size: 9px; color: var(--text-3); margin-left: 1px; font-weight: 400; }
  .ws2-foot {
    margin-top: auto;
    padding-top: var(--space-3);
    border-top: 1px solid var(--border);
    font-size: 11px; color: var(--text-3); text-align: center;
  }
  .ws2-foot .mono { color: var(--text-1); font-weight: 600; }

  /* ── WS3 · Day-by-day vertical bars ── */
  .ws3-totals { display: flex; align-items: baseline; gap: 6px; }
  .ws3-cal {
    font-size: var(--font-xl); font-weight: 700;
    color: var(--text-0); letter-spacing: -0.03em; line-height: 1;
  }
  .ws3-unit { font-size: 10px; color: var(--text-3); text-transform: uppercase; letter-spacing: 0.05em; }
  .ws3-chart {
    flex: 1;
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 6px;
    padding: 8px 0;
    align-items: end;
    height: 110px;
  }
  .ws3-col { display: flex; flex-direction: column; align-items: center; gap: 4px; height: 100%; justify-content: flex-end; }
  .ws3-bar {
    width: 100%;
    min-height: 3px;
    background: var(--cal);
    border-radius: var(--radius-sm) var(--radius-sm) 0 0;
    transition: height 240ms ease;
  }
  .ws3-today .ws3-bar {
    background: linear-gradient(180deg, var(--cal), color-mix(in srgb, var(--cal) 60%, transparent));
    box-shadow: 0 0 6px color-mix(in srgb, var(--cal) 40%, transparent);
  }
  .ws3-letter {
    font-size: 9px; color: var(--text-3);
    font-weight: 600; letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  .ws3-today .ws3-letter { color: var(--text-0); }
  .ws3-macros {
    display: flex; gap: 10px; font-size: 11px;
    padding-top: var(--space-2); border-top: 1px solid var(--border);
  }

  /* ── WS4 · Macro rows (close to current production) ── */
  .ws4-hero { display: flex; align-items: baseline; gap: 4px; }
  .ws4-cal {
    font-size: var(--font-xl); font-weight: 700;
    color: var(--text-0); letter-spacing: -0.03em; line-height: 1;
  }
  .ws4-unit { font-size: 10px; color: var(--text-3); text-transform: uppercase; letter-spacing: 0.05em; }
  .ws4-avg { font-size: 11px; color: var(--text-3); margin-left: 4px; }
  .ws4-rows { display: flex; flex-direction: column; gap: 8px; }
  .ws4-row { display: flex; flex-direction: column; gap: 4px; }
  .ws4-row-head {
    display: flex; align-items: baseline; justify-content: space-between;
  }
  .ws4-label {
    font-size: 10px; color: var(--text-3);
    text-transform: uppercase; letter-spacing: 0.06em;
    font-weight: 600;
  }
  .ws4-val { font-size: var(--font-sm); font-weight: 600; color: var(--mc); }
  .ws4-val small { font-size: 9px; color: var(--text-3); font-weight: 400; margin-left: 2px; }
  .ws4-bar {
    width: 100%; height: 3px;
    background: var(--bg-hover);
    border-radius: var(--radius-full);
    overflow: hidden;
  }
  .ws4-bar > span {
    display: block; height: 100%;
    background: var(--mc);
    border-radius: var(--radius-full);
    box-shadow: 0 0 6px color-mix(in srgb, var(--mc) 40%, transparent);
    transition: width 240ms ease;
  }

  /* ── WS5 · Goal-driven hero ── */
  .ws5 { align-items: center; text-align: center; }
  .ws5-pct {
    font-size: 64px;
    font-weight: 700;
    color: var(--cal);
    letter-spacing: -0.05em;
    line-height: 1;
    text-shadow: var(--title-shadow);
  }
  .ws5-pct-sym {
    font-size: 28px;
    color: var(--text-3);
    font-weight: 500;
    letter-spacing: 0;
  }
  .ws5-bar {
    width: 100%; height: 6px;
    background: var(--bg-hover);
    border-radius: var(--radius-full);
    overflow: hidden;
  }
  .ws5-bar > span {
    display: block; height: 100%;
    background: var(--cal);
    border-radius: var(--radius-full);
    box-shadow: 0 0 8px color-mix(in srgb, var(--cal) 50%, transparent);
    transition: width 240ms ease;
  }
  .ws5-meta {
    font-size: 11px; color: var(--text-3);
  }
  .ws5-meta .mono { color: var(--text-1); font-weight: 600; }
  .ws5-macros {
    margin-top: auto;
    display: flex;
    justify-content: center;
    gap: 6px;
    font-size: var(--font-sm);
    font-weight: 600;
    padding-top: var(--space-3);
    border-top: 1px solid var(--border);
    width: 100%;
  }
  .ws5-sep { color: var(--text-3); opacity: 0.5; }

  /* ── WS6 · Sparkline ── */
  .ws6-cal-row { display: flex; align-items: baseline; gap: 6px; }
  .ws6-cal {
    font-size: var(--font-xl); font-weight: 700;
    color: var(--text-0); letter-spacing: -0.03em; line-height: 1;
  }
  .ws6-unit { font-size: 11px; color: var(--text-3); }
  .ws6-spark {
    width: 100%;
    height: 60px;
    display: block;
  }
  .ws6-foot {
    margin-top: auto;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    padding-top: var(--space-3);
    border-top: 1px solid var(--border);
  }
  .ws6-stat {
    display: flex; flex-direction: column;
    align-items: flex-start; gap: 1px;
  }
  .ws6-label {
    font-size: 9px; color: var(--text-3);
    text-transform: uppercase; letter-spacing: 0.08em;
    font-weight: 600;
  }
  .ws6-stat .mono { font-size: var(--font-sm); font-weight: 700; color: var(--text-1); letter-spacing: -0.02em; }

  /* ── WS7 · Compact dashboard ── */
  .ws7-head { display: flex; align-items: center; justify-content: space-between; gap: var(--space-2); }
  .ws7-pct {
    font-size: var(--font-md);
    font-weight: 700;
    color: var(--cal);
    letter-spacing: -0.03em;
  }
  .ws7-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 6px;
    flex: 1;
  }
  .ws7-cell {
    display: flex; flex-direction: column;
    gap: 2px;
    padding: 8px 10px;
    background: var(--bg-hover);
    border-radius: var(--radius-sm);
    border-left: 2px solid var(--mc, var(--text-3));
  }
  .ws7-cell-cal { grid-column: span 3; border-left-color: var(--cal); }
  .ws7-cell-cal .ws7-val { font-size: var(--font-xl); }
  .ws7-label {
    font-size: 9px; color: var(--text-3);
    text-transform: uppercase; letter-spacing: 0.07em;
    font-weight: 600;
  }
  .ws7-val {
    font-size: var(--font-md); font-weight: 700;
    letter-spacing: -0.025em;
    color: var(--mc, var(--text-0));
  }
  .ws7-cell-cal .ws7-val { color: var(--text-0); }
  .ws7-val small { font-size: 9px; color: var(--text-3); margin-left: 1px; font-weight: 400; }
  .ws7-track {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 4px;
    padding-top: var(--space-2);
    border-top: 1px solid var(--border);
  }
  .ws7-day-mark {
    height: 4px;
    border-radius: var(--radius-full);
    background: var(--border);
    transition: background var(--transition-fast);
  }
  .ws7-day-mark.on { background: var(--text-1); }
  .ws7-day-mark.today {
    background: #6ec9a8;
    box-shadow: 0 0 6px rgba(110, 201, 168, 0.55);
  }

  /* ── WS8 · Goal ring + macro chips ── */
  .ws8-ring-row { display: flex; gap: var(--space-3); align-items: center; }
  .ws8-ring-wrap {
    position: relative;
    width: 78px; height: 78px;
    flex-shrink: 0;
  }
  .ws8-ring-inner {
    position: absolute; inset: 0;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
  }
  .ws8-ring-pct {
    font-size: var(--font-md); font-weight: 700;
    color: var(--cal); letter-spacing: -0.03em; line-height: 1;
  }
  .ws8-ring-pct small { font-size: 9px; color: var(--text-3); font-weight: 500; }
  .ws8-ring-label {
    font-size: 8px; color: var(--text-3);
    text-transform: uppercase; letter-spacing: 0.08em;
    margin-top: 2px;
  }
  .ws8-side { flex: 1; display: flex; flex-direction: column; gap: 6px; min-width: 0; }
  .ws8-cal {
    font-size: var(--font-md); font-weight: 700;
    color: var(--text-0); letter-spacing: -0.025em; line-height: 1.1;
  }
  .ws8-cal small { font-size: 10px; color: var(--text-3); font-weight: 500; }
  .ws8-avg { font-size: 10.5px; color: var(--text-3); }
  .ws8-avg .mono { color: var(--text-1); font-weight: 600; }
  .ws8-chips { display: flex; gap: 4px; flex-wrap: wrap; margin-top: 2px; }
  .ws8-chip {
    display: inline-flex; align-items: center; gap: 2px;
    padding: 2px 7px;
    background: var(--bg-hover);
    border-radius: var(--radius-full);
    font-size: 10px; color: var(--text-2);
  }
  .ws8-chip[data-k="p"] .mono { color: var(--pro); font-weight: 600; }
  .ws8-chip[data-k="c"] .mono { color: var(--carb); font-weight: 600; }
  .ws8-chip[data-k="f"] .mono { color: var(--fat); font-weight: 600; }
</style>
