# Frontend Architecture

## Overview

The frontend is a **React 19** single-page application built with **Vite**, using **Redux Toolkit** for state management and **RTK Query** for server-state caching. All pages are code-split via `React.lazy()` for optimal loading performance.

## Technology Stack

- **React 19.1** — UI framework
- **React Router DOM 7.9** — Client-side routing with 16 routes
- **Redux Toolkit 2.11** — State management (5 slices)
- **RTK Query** — Server-state caching with 24 auto-generated endpoints
- **redux-persist** — Persist attempt state across refreshes (localStorage)
- **Recharts 3.7** — Charts for analytics pages
- **Vite 7.1** — Build tool with HMR
- **Bun** — Package manager and script runner

## Project Structure

```
frontend/src/
├── App.jsx               # Root component: Router, Suspense, ErrorBoundary
├── App.css               # Global styles + skip-to-content
├── main.jsx              # ReactDOM entry point + Provider/PersistGate
├── index.css             # CSS reset + custom properties
│
├── lib/
│   ├── api.js            # Fetch wrapper, token management, auth failure callback
│   └── sanitize.js       # Input sanitization utilities (XSS prevention)
│
├── store/
│   ├── index.js          # Store config: rootReducer, middleware, devTools
│   ├── hooks.js          # useAppDispatch, useAppSelector (typed)
│   ├── api/
│   │   └── apiSlice.js   # RTK Query API definition (24 endpoints)
│   └── slices/
│       ├── authSlice.js  # Login, register, logout, restore, forceLogout
│       ├── quizSlice.js  # Quiz form state (create/edit)
│       ├── attemptSlice.js # Current attempt state (persisted)
│       ├── historySlice.js # Attempt history state
│       └── uiSlice.js    # Sidebar, toast, confirm dialog
│
├── components/           # Shared/reusable components
│   ├── Sidebar.jsx       # Main navigation with aria-labels
│   ├── QuizCard.jsx      # Quiz list item (memo, keyboard nav)
│   ├── Toast.jsx         # Notification system (role="alert")
│   ├── ConfirmDialog.jsx # Confirmation modal (role="dialog")
│   ├── Pagination.jsx    # Page navigation (<nav>, aria-current)
│   ├── QuizTimer.jsx     # Countdown timer (aria-live)
│   ├── ShareButton.jsx   # Share/copy link button
│   ├── EmptyState.jsx    # Empty content placeholder
│   ├── ErrorBoundary.jsx # React error boundary
│   ├── LoadingSpinner.jsx # Loading animation
│   └── ProtectedRoute.jsx # Auth guard wrapper
│
├── pages/                # Route-level components (all lazy-loaded)
│   ├── Login.jsx         # Login form
│   ├── Register.jsx      # Registration form
│   ├── Home.jsx          # Quiz browse + search + filter
│   ├── QuizDetail.jsx    # Quiz detail + start attempt
│   ├── QuizQuestion.jsx  # Question view + answer (keyboard 1-4)
│   ├── QuizLeaderboard.jsx # Per-quiz leaderboard
│   ├── QuizRankings.jsx  # Rankings view
│   ├── History.jsx       # Attempt history list
│   ├── Profile.jsx       # User profile + created quizzes
│   ├── CreateQuiz.jsx    # Manual + AI quiz creation
│   ├── EditQuiz.jsx      # Quiz editing
│   ├── MyQuizzes.jsx     # User's quiz management
│   ├── Settings.jsx      # Change password
│   ├── GlobalLeaderboard.jsx # Cross-quiz rankings
│   ├── StatsPage.jsx     # Analytics dashboard (charts)
│   └── NotFound.jsx      # 404 page
│
└── __tests__/            # Test files
    ├── setup.js          # jest-dom + cleanup
    ├── helpers.jsx       # renderWithProviders, createTestStore
    ├── unit/             # Utility tests
    ├── store/            # Redux slice tests
    ├── components/       # Component tests
    └── pages/            # Page-level tests
```

## State Management

### Architecture

```
┌─────────────────────────────────────────┐
│               Redux Store               │
├──────────┬──────────┬──────────────────-─┤
│ authSlice│ quizSlice│ attemptSlice(*)    │
│ (login,  │ (form    │ (current attempt, │
│  tokens) │  state)  │  persisted)       │
├──────────┼──────────┼───────────────────-┤
│histSlice │ uiSlice  │ apiSlice (RTK Q)  │
│ (history │ (sidebar,│ (24 cached        │
│  state)  │  toast)  │  endpoints)       │
└──────────┴──────────┴───────────────────-┘
           (*) = redux-persist (localStorage)
```

### Slices

| Slice          | Purpose                                                      | Persistence                               |
| -------------- | ------------------------------------------------------------ | ----------------------------------------- |
| `authSlice`    | User authentication state, JWT tokens, login/register thunks | Session only (tokens in memory + cookies) |
| `quizSlice`    | Quiz form state for create/edit flows                        | None                                      |
| `attemptSlice` | Current in-progress attempt (questions, answers, timer)      | **localStorage** via redux-persist        |
| `historySlice` | Historical attempt list                                      | None                                      |
| `uiSlice`      | Sidebar open/close, toast queue, confirm dialog state        | None                                      |

### RTK Query (apiSlice)

24 auto-cached endpoints with tag-based invalidation:

**Tag types:** `Quiz`, `MyQuiz`, `History`, `Profile`, `Stats`, `Leaderboard`, `Categories`

| Endpoint               | Type     | Tags Provided       | Tags Invalidated                            |
| ---------------------- | -------- | ------------------- | ------------------------------------------- |
| `getQuizzes`           | query    | Quiz(LIST)          | —                                           |
| `getQuiz`              | query    | Quiz(id)            | —                                           |
| `getMyQuizzes`         | query    | MyQuiz(LIST)        | —                                           |
| `createQuiz`           | mutation | —                   | Quiz, MyQuiz, Profile, Categories           |
| `updateQuiz`           | mutation | —                   | Quiz(id), Quiz, MyQuiz, Profile, Categories |
| `deleteQuiz`           | mutation | —                   | Quiz, MyQuiz, Profile, Categories           |
| `duplicateQuiz`        | mutation | —                   | Quiz, MyQuiz, Profile                       |
| `importQuiz`           | mutation | —                   | Quiz, MyQuiz, Profile, Categories           |
| `generateQuiz`         | mutation | —                   | —                                           |
| `startAttempt`         | mutation | —                   | —                                           |
| `finishAttempt`        | mutation | —                   | History, Profile, Stats, Leaderboard        |
| `deleteAttempt`        | mutation | —                   | History, Stats, Profile                     |
| `getHistory`           | query    | History             | —                                           |
| `getQuizLeaderboard`   | query    | Leaderboard(id)     | —                                           |
| `getGlobalLeaderboard` | query    | Leaderboard(GLOBAL) | —                                           |
| `getProfile`           | query    | Profile             | —                                           |
| `editProfile`          | mutation | —                   | Profile                                     |
| `deleteAccount`        | mutation | —                   | —                                           |
| `changePassword`       | mutation | —                   | —                                           |
| `getStats`             | query    | Stats               | —                                           |
| `getPublicProfile`     | query    | —                   | —                                           |
| `getCategories`        | query    | Categories          | —                                           |
| `getAttempt`           | query    | History(id)         | —                                           |
| `exportQuiz`           | query    | —                   | —                                           |

## Routing

16 routes defined in `App.jsx`, all wrapped with `<Suspense>` for code-split loading:

| Path                    | Page                 | Protected |
| ----------------------- | -------------------- | --------- |
| `/login`                | Login                | No        |
| `/register`             | Register             | No        |
| `/`                     | Redirect to `/login` | No        |
| `/home`                 | Home                 | Yes       |
| `/quiz/:id`             | QuizDetail           | Yes       |
| `/quiz/:id/:q_id`       | QuizQuestion         | Yes       |
| `/quiz/:id/leaderboard` | QuizLeaderboard      | Yes       |
| `/quiz/:id/rankings`    | QuizRankings         | Yes       |
| `/history`              | History              | Yes       |
| `/profile`              | Profile              | Yes       |
| `/plus`                 | CreateQuiz           | Yes       |
| `/edit/:id`             | EditQuiz             | Yes       |
| `/my-quizzes`           | MyQuizzes            | Yes       |
| `/settings`             | Settings             | Yes       |
| `/leaderboard`          | GlobalLeaderboard    | Yes       |
| `/stats`                | StatsPage            | Yes       |
| `*`                     | NotFound             | No        |

## Code Splitting

All 16 pages are loaded via `React.lazy()`:

```javascript
const Home = lazy(() => import("./pages/Home"));
```

Vendor chunks are split in `vite.config.js`:

| Chunk    | Contents                                     | Reason                               |
| -------- | -------------------------------------------- | ------------------------------------ |
| `vendor` | react, react-dom, react-router-dom           | Core framework (rarely changes)      |
| `redux`  | @reduxjs/toolkit, react-redux, redux-persist | State layer                          |
| `charts` | recharts                                     | Only needed on stats/analytics pages |

Result: Main bundle ~246 KB (down from ~742 KB before splitting).

## Accessibility

### Implemented Features

- **Skip-to-content link** — Visible on keyboard focus, jumps to `<main id="main-content">`
- **Focus management** — `ScrollToTop` component focuses `<main>` on route changes
- **Keyboard navigation** — Quiz answers selectable with keys 1-4
- **ARIA attributes** on all interactive components:
  - QuizCard: `role="button"`, `tabIndex={0}`, `aria-label`, keyboard enter/space
  - Sidebar: `aria-label` on `<nav>` and all links, `aria-hidden` on icons
  - Pagination: `<nav>`, `aria-label` on buttons, `aria-current="page"`
  - Toast: `role="alert"`, `aria-live="assertive"`
  - ConfirmDialog: `role="dialog"`, `aria-modal="true"`, `aria-labelledby`
  - QuizTimer: `aria-live="polite"`, descriptive `aria-label`
- **Form validation** — `aria-invalid`, `aria-describedby` on inputs, `role="alert"` on errors
- **Document titles** — Every page sets `document.title` via `useEffect`

### ESLint Accessibility Rules

Enforced via `eslint-plugin-jsx-a11y`:

- `alt-text`, `anchor-is-valid`, `click-events-have-key-events`
- `no-static-element-interactions`, `label-has-associated-control`
- `aria-props`, `aria-role`

## Authentication Flow

1. User logs in → `authSlice.login` thunk calls `/auth/login`
2. Access token stored in memory (Redux), refresh token set as HTTP-only cookie
3. Every API call includes `Authorization: Bearer <token>` via RTK Query's `prepareHeaders`
4. On 401 response → `forceLogout()` dispatched via `setOnAuthFailure` callback
5. The `ProtectedRoute` component redirects unauthenticated users to `/login`
6. On app reload → `restoreSession` thunk attempts `/auth/refresh` to get a new access token

## Testing

### Unit & Component Tests (Vitest)

246 tests across 23 files:

| Category        | Files | Tests |
| --------------- | ----- | ----- |
| Unit (sanitize) | 1     | 20    |
| Store (slices)  | 5     | 41    |
| Components      | 8     | 75    |
| Pages           | 9     | 110   |

Run with:

```bash
bun run test          # Single run
bun run test:watch    # Watch mode
bun run test:coverage # With coverage report
```

### E2E Tests (Playwright)

8 spec files covering all critical user flows:

- Auth (register, login, logout, error handling)
- Quiz CRUD (create, edit, navigate)
- Quiz browsing (search, filters)
- Quiz attempts (start, answer, submit)
- My Quizzes, History, Profile, Settings

Run with:

```bash
bunx playwright install   # First time only
bunx playwright test      # Run all E2E tests
```

## Build Configuration

`vite.config.js` features:

- React plugin with automatic JSX runtime
- Manual chunk splitting (vendor, redux, charts)
- Hidden source maps in production (`mode === 'production' ? 'hidden' : true`)
- Dev server proxied to backend port 8000