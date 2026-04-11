# MacroX

## Overview
MacroX is a premium nutrition tracking and meal planning web application. Full-stack TypeScript monorepo with an Express.js API backend and SvelteKit frontend.

## Architecture

```
macrox/
├── backend/          # Express.js REST API (port 4000)
│   └── src/
│       ├── server.ts            # App entry, Swagger at /api/docs
│       ├── seed.ts              # Seeds 55 foods into MongoDB
│       ├── config/db.ts         # Mongoose connection (IPv4-first DNS fix for Atlas)
│       ├── middleware/auth.ts    # JWT cookie authentication
│       ├── middleware/errorHandler.ts
│       ├── models/              # 6 Mongoose models
│       │   ├── User.ts          # email, name, password, goals
│       │   ├── Food.ts          # per-100g macros, auto-computed netCarbs
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
│           ├── schemas.ts       # 15 Zod schemas (single source of truth)
│           └── jwt.ts           # sign/verify + HTTP-only cookie config
├── frontend/         # SvelteKit + Vite (port 5173)
│   └── src/
│       ├── app.html             # Plus Jakarta Sans + JetBrains Mono
│       ├── app.css              # Complete design system (~409 lines)
│       ├── lib/
│       │   ├── api/client.ts    # Fetch wrapper for /api calls
│       │   ├── stores/          # Svelte stores (auth, foods, meals, planner, theme)
│       │   ├── utils/macros.ts  # Percentage/formatting helpers
│       │   └── components/layout/Navbar.svelte
│       └── routes/
│           ├── +layout.svelte   # Auth guard, navbar, theme init
│           ├── +page.svelte     # Redirect to /dashboard or /login
│           ├── login/           # Sign in
│           ├── register/        # Create account
│           ├── dashboard/       # Macro gauges + quick nav
│           ├── foods/           # Table view, search, category chips
│           ├── meals/           # List + /new builder
│           ├── planner/daily/   # DnD with 4 meal slots
│           ├── planner/weekly/  # 7-day DnD grid
│           ├── templates/       # Saved meal templates
│           └── playground/      # 12 automated E2E tests
```

## Tech Stack
- **Backend**: Node.js, Express, Mongoose, Zod, Swagger, JWT (HTTP-only cookies), bcryptjs
- **Frontend**: SvelteKit (Svelte 5 runes: `$state`, `$derived`, `$effect`), Vite, `svelte-dnd-action`, `lucide-svelte`
- **Database**: MongoDB Atlas (cluster: `macroxcluster.7tvtdas.mongodb.net`)
- **Fonts**: Plus Jakarta Sans (body) + JetBrains Mono (numbers)

## Features Built (Do Not Re-Implement)
- **Auth**: JWT HTTP-only cookies (register/login/logout/me/goals)
- **Foods Database**: 55 seeded foods across 8 categories, CRUD, search/filter
- **Composite Meals**: Combine multiple foods with specific quantities
- **Daily Planner**: 4 drag-and-drop meal slots per day
- **Weekly Planner**: 7-day drag-and-drop grid
- **Templates**: Save specific meals as reusable templates
- **Dashboard**: Macro gauges and progress bars based on user goals
- **Testing**: Playground with 12 automated E2E tests

## Design System
- **Aesthetic**: Luxurious minimalism — stone gray palette, no emojis, thin Lucide icons (1.5 stroke)
- **Dark theme**: Warm stone grays (`#1a1918` bg, `#252423` cards) — NOT blue/zinc
- **Cards lighter than background** — cards pop as elevated surfaces
- **Max-width**: 1600px centered, navbar matches
- **Font scale**: xs=13px, sm=14px, base=16px, md=17px, lg=18px, xl=22px
- **Macro colors**: Calories=amber `#d4a574`, Protein=lavender `#8b9cf7`, Carbs=sage `#6ec9a8`, Fat=rose `#c4879b`
- **All sizes use CSS custom properties** — never hardcode px values for fonts
- **Animations**: Subtle slideUp/fadeIn/scaleIn with stagger delays, no flashy effects

## Key Patterns
- **Per-100g base**: All food macros stored per 100g; quantities multiply against this
- **Auto-computed netCarbs**: `netCarbs = totalCarbs - fiber`, auto-computed on save
- **Upsert pattern**: Daily/weekly plans use `findOneAndUpdate` with `upsert: true`
- **Vite proxy**: Frontend proxies `/api` to Express port 4000 during dev
- **IPv4-first DNS**: `dns.setDefaultResultOrder('ipv4first')` in db.ts for Atlas SRV resolution
- **Standard MongoDB URI**: Uses explicit shard hosts (not `mongodb+srv://`) to bypass SRV DNS issues

## Running
```bash
# Backend (requires .env with MONGODB_URI)
cd backend && npm run dev

# Frontend
cd frontend && npm run dev

# Seed database
cd backend && npx tsx src/seed.ts
```

## Environment Variables (backend/.env)
```
PORT=4000
MONGODB_URI=mongodb://...@ac-zuwukys-shard-00-00.7tvtdas.mongodb.net:27017,.../macrox?tls=true&authSource=admin
JWT_SECRET=<secret>
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

## Important Notes
- Do NOT use emojis in the UI — text-only or thin Lucide icons
- Do NOT use bright/saturated colors — everything is muted
- Do NOT hardcode font sizes in px — always use `var(--font-*)` tokens
- The user wants a PRO, billionaire-level aesthetic: practical, sophisticated, minimal
- Save buttons must have try/catch with error feedback (alert) and success confirmation
