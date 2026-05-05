# Dashboard Pro

Professional, modular React dashboard starter for expense workflow and approvals.

## Quick Start

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Architecture

- `src/pages`: route-level pages
- `src/mockApi.ts`: replace with real backend APIs
- `src/types.ts`: shared domain models
- `src/App.tsx`: app shell, navigation, role simulation, routes

## User Trial Flow

1. Open Dashboard.
2. Go to `New Request`, submit request.
3. Open `Expenses`, search/filter, toggle status.
4. Open detail page and reject request.
5. Review notifications and project overview.

## Free Deployment (Vercel)

1. Push repository to GitHub.
2. Import project in Vercel.
3. Framework preset: Vite.
4. Build command: `npm run build`.
5. Output directory: `dist`.
