# Quiz App - Frontend

The frontend for the quiz app. React 19 SPA with Redux Toolkit for state management and RTK Query for API caching.

## Setup

```bash
bun install
bun run dev     # starts on http://localhost:5173
```

Make sure the backend is running on port 8000 (or set `VITE_API_URL` in `.env`).

## Scripts

- `bun run dev` - dev server with HMR
- `bun run build` - production build
- `bun run lint` - ESLint (includes jsx-a11y for accessibility)
- `bun run test` - run unit tests (Vitest)
- `bun run test:watch` - tests in watch mode
- `bun run test:coverage` - tests with coverage report
- `bunx playwright test` - E2E tests (needs `bunx playwright install` first)

## How it's organized

- `src/pages/` - one file per route, all lazy-loaded via `React.lazy()`. 16 pages total.
- `src/store/` - Redux Toolkit. 5 slices (auth, quiz, attempt, history, ui) + RTK Query API with 24 endpoints.
- `src/components/` - shared stuff like Sidebar, QuizCard, Toast, Pagination, etc.
- `src/lib/` - fetch wrapper with token management, input sanitizer
- `src/__tests__/` - Vitest unit/component tests

## State management

Server data goes through RTK Query (handles caching, refetching, cache invalidation via tags). Local UI state (sidebar open, toasts, confirm dialogs) lives in the `ui` slice. The attempt slice is persisted to localStorage so you don't lose your quiz progress on refresh.

## Styling

Plain CSS, one file per component/page. No CSS framework. Design tokens (colors, spacing) are in CSS custom properties.
