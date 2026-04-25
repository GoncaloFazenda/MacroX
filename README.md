# MacroX — Nutrition Tracking & Meal Planner

Premium full-stack nutrition tracking application with drag-and-drop meal planning.

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | SvelteKit + Vite |
| Backend | Express.js + TypeScript |
| Database | MongoDB + Mongoose |
| Validation | Zod (frontend + backend) |
| Auth | JWT with HTTP-only cookies |
| DnD | svelte-dnd-action |
| Testing | Vitest |
| API Docs | Swagger UI |

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

### 1. Backend Setup
```bash
cd backend
cp .env.example .env
# Edit .env with your MongoDB URI
npm install
npm run seed    # Seed 54 foods
npm run dev     # Runs on http://localhost:4000
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev     # Runs on http://localhost:5173
```

### 3. Access
- App: http://localhost:5173
- API Docs: http://localhost:4000/api/docs
- Playground: http://localhost:5173/playground

## Features
- 🍽️ **Food Database** — 54+ real foods with full macros
- 🔧 **Composite Meals** — Combine foods into reusable meals
- 📅 **Daily Planner** — Drag & drop into breakfast/lunch/dinner/snack
- 🗓️ **Weekly Planner** — 7-day drag & drop planning
- 📊 **Overview** — Animated macro gauges with progress tracking
- 📋 **Templates** — Save and reuse meal configurations
- 🌗 **Dark/Light Mode** — Premium theme system
- 🔐 **JWT Auth** — HTTP-only cookie authentication
- 🧪 **Playground** — 12 automated E2E tests
