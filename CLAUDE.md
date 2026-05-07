# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commit message tracking (READ EVERY TURN)

A running commit-message draft lives at `COMMIT_MESSAGE.md` (gitignored). The user copies from it when ready to commit, then deletes the contents to start a fresh cycle. A Stop hook will block you from ending the turn if you edited code under `backend/src`, `frontend/src`, or `CLAUDE.md` without touching `COMMIT_MESSAGE.md`.

**Rules:**
1. **At the start of every turn that touches code**, read `COMMIT_MESSAGE.md`. If empty/whitespace-only → start a fresh draft. If it has content → you are continuing an existing cycle; update in place.
2. **Format**: a single subject line in the project's style (`feat:`, `fix:`, `ui:`, `Improve:`, `refactor:`) under ~70 chars, optionally followed by a blank line and bullet points. Match the tone of recent `git log` commits.
3. **Two implicit sections** (no headers — just bullets, but track the distinction mentally):
   - **Added/changed in this cycle**: things you did since the last commit reset.
   - **Removed**: things the user asked you to delete that *were already committed to the repo* before this cycle started. These matter because the commit must record the removal even though you didn't author the original code.
4. **Net-zero rule**: if the user undoes something you added *within this cycle*, delete the bullet entirely — no trace. Only record net change.
5. **Pre-existing removals**: if the user asks you to remove a feature/file that existed before this cycle started (i.e., not in your bullet list), add a "Remove X" bullet — you can confirm it's pre-existing via `git log` / `git status`.
6. **Length cap**: keep under ~15 bullets. When over, collapse granular bullets into broader ones (e.g., 4 card tweaks → "redesign meal cards") rather than dropping detail entirely. Keep the most impactful items specific.
7. **No filler**: skip trivial things (typo fixes inside a larger change, lint nits). Subject line should reflect the dominant theme.
8. **Always update `COMMIT_MESSAGE.md` in the same turn you change code** — the Stop hook will block otherwise.

## Overview
MacroX is a premium nutrition tracking and meal planning web application. Full-stack TypeScript monorepo with an Express.js API backend and SvelteKit frontend.

## Commands

```bash
# Backend (port 4000)
cd backend && npm run dev        # tsx watch mode
cd backend && npm run build      # compile to dist/
cd backend && npm run start      # run compiled JS
cd backend && npx tsx src/seed.ts  # seed 55 foods into MongoDB

# Frontend (port 5173)
cd frontend && npm run dev
cd frontend && npm run build
cd frontend && npm run test        # Vitest
cd frontend && npm run test:watch
```

Access points: app → `localhost:5173`, API docs → `localhost:4000/api/docs`

## Architecture

```
macrox/
├── backend/
│   └── src/
│       ├── server.ts            # App entry, middleware chain: helmet → cors → cookieParser → json → routes → errorHandler
│       ├── seed.ts              # Seeds 55 foods into MongoDB
│       ├── config/db.ts         # Mongoose connection (IPv4-first DNS fix for Atlas)
│       ├── middleware/auth.ts   # JWT cookie authentication (authenticate / optionalAuth)
│       ├── middleware/errorHandler.ts  # Handles ZodError → 400, CastError → 404, duplicate key → 409
│       ├── models/              # 6 Mongoose models
│       │   ├── User.ts          # email, name, password, goals
│       │   ├── Food.ts          # per-100g macros, auto-computed netCarbs via pre-save hook
│       │   ├── CompositeMeal.ts # combines foods with quantities
│       │   ├── DailyPlan.ts     # date + 4 meal slots
│       │   ├── WeeklyPlan.ts    # weekStart + 7 days
│       │   └── MealTemplate.ts  # reusable meal configs
│       ├── routes/              # 6 route files with Swagger JSDoc
│       │   ├── auth.ts          # register, login, logout, me, goals
│       │   ├── foods.ts         # CRUD + search + category filter
│       │   ├── compositeMeals.ts
│       │   ├── dailyPlans.ts    # upsert + range query
│       │   ├── weeklyPlans.ts   # upsert
│       │   └── templates.ts
│       └── utils/
│           ├── schemas.ts       # 15 Zod schemas — single source of truth for validation
│           └── jwt.ts           # sign/verify + HTTP-only cookie config
├── frontend/
│   └── src/
│       ├── app.html             # Plus Jakarta Sans + JetBrains Mono fonts
│       ├── app.css              # Complete design system (~409 lines)
│       ├── lib/
│       │   ├── api/client.ts    # Fetch wrapper for /api calls (credentials: 'include')
│       │   ├── stores/          # Svelte writable stores: auth, foods, meals, planner, theme
│       │   ├── utils/macros.ts  # Percentage/formatting helpers
│       │   └── components/layout/Navbar.svelte
│       └── routes/
│           ├── +layout.svelte   # Auth guard, navbar, theme init
│           ├── +page.svelte     # Redirect to /overview or /login
│           ├── overview/        # Macro gauges + quick nav
│           ├── foods/           # Table view, search, category chips
│           ├── meals/           # List + /new builder
│           ├── planner/daily/   # DnD with 4 meal slots (svelte-dnd-action)
│           ├── planner/weekly/  # 7-day DnD grid
│           └── templates/       # Saved meal templates
```

## Tech Stack
- **Backend**: Node.js, Express, Mongoose, Zod, Swagger JSDoc, JWT (HTTP-only cookies), bcryptjs
- **Frontend**: SvelteKit (Svelte 5 runes: `$state`, `$derived`, `$effect`), Vite, `svelte-dnd-action`, `lucide-svelte`
- **Database**: MongoDB Atlas
- **Fonts**: Plus Jakarta Sans (body) + JetBrains Mono (numbers)

## Frontend Path Aliases (svelte.config.js)
- `$components` → `src/lib/components`
- `$stores` → `src/lib/stores`
- `$api` → `src/lib/api`
- `$utils` → `src/lib/utils`

## Key Patterns
- **Per-100g base**: All food macros stored per 100g; quantities multiply against this for macro calculations
- **Auto-computed netCarbs**: `netCarbs = totalCarbs - fiber`, computed via Mongoose pre-save hook on Food
- **Upsert pattern**: Daily/weekly plans use `findOneAndUpdate` with `upsert: true` — never separate create/update routes
- **Vite proxy**: Frontend proxies `/api` → Express port 4000 during dev (no CORS complexity in dev)
- **IPv4-first DNS**: `dns.setDefaultResultOrder('ipv4first')` in db.ts for MongoDB Atlas SRV resolution
- **Zod schemas**: All validation lives in `backend/src/utils/schemas.ts`; ZodErrors propagate to the global error handler which formats them as 400 with field-level messages
- **Save buttons**: Must have try/catch with alert for errors and success confirmation

## Design System
- **Aesthetic**: Luxurious minimalism — stone gray palette, no emojis, thin Lucide icons (stroke-width 1.5)
- **Dark theme**: Cool gray-stone (`#18181b` bg, `#27272a` cards) — neutral gray, not warm brown, not blue/zinc
- **Cards lighter than background** — cards pop as elevated surfaces
- **Max-width**: 1600px centered, navbar matches
- **Font sizes**: Always use `var(--font-*)` tokens — never hardcode px values (xs=13px, sm=14px, base=16px, md=17px, lg=18px, xl=22px)
- **Macro colors**: Calories=amber `#d4a574`, Protein=lavender `#8b9cf7`, Carbs=sage `#6ec9a8`, Fat=rose `#c4879b`
- **Animations**: Subtle slideUp/fadeIn/scaleIn with stagger delays — no flashy effects
- Do NOT use bright/saturated colors — everything is muted

## Environment Variables (`backend/.env`)
```
PORT=4000
MONGODB_URI=mongodb://...
JWT_SECRET=<secret>
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```
