# Contributing to Quiz App

Hey, thanks for your interest in contributing! This doc walks you through everything you need to know — from getting the project running on your machine to submitting a pull request that doesn't make me cry.

## Table of Contents

- [Before You Start](#before-you-start)
- [Setting Up Your Dev Environment](#setting-up-your-dev-environment)
- [How the Codebase is Organized](#how-the-codebase-is-organized)
- [Where to Find Things](#where-to-find-things)
- [Making Changes](#making-changes)
- [Writing Tests](#writing-tests)
- [Code Style](#code-style)
- [Submitting a Pull Request](#submitting-a-pull-request)

---

## Before You Start

**Have a question?** Open a GitHub issue with the `question` label. Don't submit a PR just to ask something.

**Found a bug?** Check if there's already an issue for it. If not, open one with:

- What you expected to happen
- What actually happened
- Steps to reproduce (be specific — "it doesn't work" isn't helpful)
- Browser / OS / Node version if relevant

**Want to add a feature?** Open an issue first to discuss it. I'd rather talk about the approach before you spend hours coding something that doesn't fit the project direction. The [roadmap](docs/08_VERSION_ROADMAP.md) has the planned features — if your idea fits one of those, mention it.

---

## Setting Up Your Dev Environment

### What You Need

| Tool    | Version | Why                                   |
| ------- | ------- | ------------------------------------- |
| Python  | 3.12+   | Backend runtime                       |
| uv      | latest  | Python project & dependency manager   |
| Bun     | 1.3.6+  | Frontend package manager + JS runtime |
| MongoDB | 7.x+    | Database (local install or Docker)    |
| Git     | any     | Version control                       |

A Gemini API key is optional — you only need it if you're working on the AI generation feature. Get one free at [ai.google.dev](https://ai.google.dev/).

### Clone and Install

```bash
git clone <repo-url>
cd Quiz-App
```

**Backend:**

```bash
cd backend
uv sync --group dev   # installs all dependencies (runtime + dev)
```

**Frontend:**

```bash
cd frontend
bun install
```

### Environment Files

You need two `.env` files. There's a `.env.example` in the backend directory you can copy.

**backend/.env:**

```env
MONGO_URI=mongodb://localhost:27017
DB=quiz
JWT_SECRET=dev-secret-change-in-production
GEMINI_API_KEY=           # leave blank if you don't have one
```

**frontend/.env:**

```env
VITE_API_URL=http://localhost:8000
```

### Running the App

You'll need two terminals:

```bash
# Terminal 1 — Backend (runs on :8000)
cd backend
uvicorn app.main:app --reload

# Terminal 2 — Frontend (runs on :5173)
cd frontend
bun run dev
```

Once both are running, open [http://localhost:5173](http://localhost:5173).

The backend serves interactive API docs at [http://localhost:8000/docs](http://localhost:8000/docs) — useful for testing endpoints directly.

---

## How the Codebase is Organized

This is a monorepo with two independent apps:

```
Quiz-App/
├── backend/         → FastAPI REST API (Python)
├── frontend/        → React SPA (JavaScript/JSX)
└── docs/            → Architecture docs, roadmap, design docs
```

### Backend

The backend is a **FastAPI** app. Here's where things live:

| File / Directory     | What's in it                                                     |
| -------------------- | ---------------------------------------------------------------- |
| `main.py`            | App startup, middleware (CORS, body limit), global error handler |
| `config.py`          | All settings via pydantic-settings (reads `.env`)                |
| `db.py`              | MongoDB connection, collection accessors, index creation         |
| `models.py`          | Every Pydantic model — requests, responses, DB documents         |
| `gemini_client.py`   | Gemini AI client (lazy-initialized singleton)                    |
| `limiter.py`         | slowapi rate limiter instance                                    |
| `routes/auth.py`     | Register, login, logout, refresh, change password                |
| `routes/quiz.py`     | Full CRUD, search, duplicate, export/import, categories, publish |
| `routes/generate.py` | AI quiz generation endpoint                                      |
| `routes/profile.py`  | User profile, stats, public profiles, account deletion           |
| `tests/`             | Unit and integration tests                                       |

**Request flow:** Incoming HTTP → FastAPI Router → Route handler → DB / Gemini → Pydantic response model → JSON

**Database:** MongoDB with 3 collections (`users`, `quizzes`, `attempts`) and 12 indexes. We use `pymongo.AsyncMongoClient` — all DB calls are async.

**AI generation:** Uses the `google-genai` SDK. The Gemini client lives in `gemini_client.py`, and the generation route in `routes/generate.py` calls it with native async (`client.aio.models.generate_content()`).

### Frontend

The frontend is a **React 19** SPA with **Vite** and **Redux Toolkit**:

| Directory               | What's in it                                                |
| ----------------------- | ----------------------------------------------------------- |
| `src/App.jsx`           | React Router setup with lazy-loaded route pages             |
| `src/store/`            | Redux Toolkit slices (auth, quiz, attempt, history, ui)     |
| `src/store/apiSlice.js` | RTK Query API definition — all 24 endpoints                 |
| `src/pages/`            | One file per page (CreateQuiz, QuizDetail, Profile, etc.)   |
| `src/components/`       | Shared components (Sidebar, QuizCard, ProtectedRoute, etc.) |
| `src/lib/`              | Utilities: fetch wrapper, sanitizer, validators             |
| `src/__tests__/`        | Vitest unit tests + Playwright E2E tests                    |

**State management:** Redux Toolkit with 5 slices + RTK Query. Server data goes through RTK Query (caching, revalidation). Local UI state uses the `ui` slice. No `useState` for server data.

**Styling:** Plain CSS files — one per component/page. CSS custom properties (design tokens) defined in `colorpallete.css` at the root.

---

## Where to Find Things

Here are the patterns you'll encounter most often:

**Adding a new API endpoint:**

1. Define request/response models in `models.py`
2. Add the route function in the appropriate `routes/*.py` file
3. Add integration tests in `tests/integration/`
4. Update `docs/API_REFERENCE.md`

**Adding a new page:**

1. Create `src/pages/MyPage.jsx` and `src/pages/MyPage.css`
2. Add the lazy-loaded route in `src/App.jsx`
3. If it needs server data, add RTK Query endpoints in `src/store/apiSlice.js`
4. Add tests in `src/__tests__/pages/`

**Adding a new Redux slice:**

1. Create the slice in `src/store/`
2. Register it in `src/store/store.js`

**Changing the database schema:**

1. Update models in `models.py`
2. Add any new indexes in `db.py`'s `ensure_indexes()` function
3. Check that existing data migrates cleanly (we don't have formal migrations yet)

---

## Making Changes

### Branch Naming

Use descriptive branch names with a prefix:

- `feature/quiz-timer` — New functionality
- `fix/login-redirect-loop` — Bug fix
- `refactor/split-quiz-route` — Internal improvement
- `docs/update-api-reference` — Documentation only

### Commit Messages

Write them like you're telling someone what the commit does, in imperative mood:

```
Add quiz export endpoint
Fix pagination breaking on empty search results
Refactor auth slice to use RTK Query
```

Don't do this:

```
Fixed stuff
WIP
asdfasdf
Updated files
```

---

## Writing Tests

Tests are not optional. If you add a feature, add tests. If you fix a bug, add a test that would have caught it.

### Test Philosophy

Write tests that verify **workflows and constraints**, not trivial getters/setters. A good test should:

- Verify behaviour that could break (boundary conditions, auth guards, side-effects)
- Test a meaningful workflow, not just that a field was set to its value
- Add value beyond what other tests already cover — no duplication

**Avoid:**

- Trivial happy-path tests for unconstrained models (e.g., "valid login request creates object")
- Duplicating validation tests across unit and integration layers
- Testing library internals (bcrypt salts, JWT library edge cases)
- Checking cosmetic details (document title, individual labels)

### Test Configuration

Tests use dedicated test variables (not production runtime variables):

| Variable          | Default (local)             | Scope                        |
| ----------------- | --------------------------- | ---------------------------- |
| `TEST_MONGO_URI`  | `mongodb://127.0.0.1:27017` | Backend pytest fixtures      |
| `TEST_DB`         | `quiz_test`                 | Backend pytest fixtures      |
| `TEST_JWT_SECRET` | `test-secret-key`           | Backend pytest fixtures      |
| `E2E_MONGO_URI`   | `mongodb://127.0.0.1:27017` | Playwright backend webServer |
| `E2E_DB`          | `quiz_e2e_test`             | Playwright backend webServer |

Safety guards hard-fail tests if the target DB is not local/test-scoped.

### Backend Tests

```bash
cd backend
uv run pytest                          # Run everything
uv run pytest tests/unit/              # Just unit tests
uv run pytest tests/integration/       # Just integration tests
uv run pytest -v --tb=short            # Verbose with shorter tracebacks
```

Tests run against a separate `quiz_test` database that gets cleaned between runs. The test fixtures live in `tests/conftest.py` and `tests/factories.py`.

⚠️ Backend tests are destructive to the selected test DB:

- collections are cleared between tests
- the full test DB is dropped after the session

**What to test:**

- Auth guard enforcement (all protected endpoints return 401 — `test_security.py`)
- Validation boundaries (min/max field lengths, enum values — `test_models.py`)
- Core auth flow (`get_current_user` with valid, expired, wrong-type tokens — `test_auth_utils.py`)
- Happy path + error cases for each endpoint
- Edge cases (empty results, duplicate entries, not found, partial scoring)

**Example pattern** — every integration test follows this shape:

```python
async def test_create_quiz_success(client, auth_headers):
    response = await client.post("/api/v1/quizzes", json={...}, headers=auth_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "My Quiz"
```

### Frontend Tests

```bash
cd frontend
bun run test                    # Single run
bun run test:watch              # Watch mode
bun run test:coverage           # With coverage report
```

We use **Vitest** + **@testing-library/react**. Redux-connected components need `renderWithProviders` from `src/__tests__/helpers.jsx`.

**RTK Query mocking:** Mock the hooks at module level, not the fetch calls:

```javascript
vi.mock("../../store/apiSlice", () => ({
  useGetQuizzesQuery: vi.fn(() => ({ data: [...], isLoading: false })),
}));
```

### E2E Tests

```bash
cd frontend
bunx playwright install         # First time only
bunx playwright test            # Headless
bunx playwright test --headed   # See the browser
```

E2E tests live in `frontend/e2e/`. They test full user flows (login → create quiz → take quiz → see results).

By default, E2E teardown is non-destructive (it does not delete the shared E2E user). To enable account cleanup in local/CI test runs:

```bash
E2E_DELETE_SHARED_USER=true bunx playwright test
```

### Required Local Validation Before PR

Before opening a PR, run the same core checks used in CI:

```bash
# Backend
cd backend
uv run ruff check . --fix
uv run ruff format .
uv run pytest
uvx pip-audit

# Frontend
cd ../frontend
bun run lint
bun run test
bun run build

# Repo-level hooks
cd ..
uvx pre-commit run --all-files
```

---

## Code Style

### Backend (Python)

We use **ruff** for linting and formatting. Config is in `pyproject.toml`.

```bash
cd backend
uv run ruff check . --fix              # Lint + safe auto-fixes
uv run ruff format .                   # Auto-format
```

The important rules:

- **100-character line limit**
- **Type hints** on every function signature — no exceptions
- **Pydantic models** for all request/response shapes (not raw dicts)
- **`snake_case`** for functions and variables, **`PascalCase`** for classes/models
- **`logger.info/error/exception`** for logging — never `print()`
- **Async route handlers** — use `async def` for all routes
- If you're calling something synchronous in an async handler, wrap it with `asyncio.to_thread()`

### Frontend (JavaScript/JSX)

ESLint with the jsx-a11y accessibility plugin. Config is in `eslint.config.js`.

```bash
cd frontend
bun run lint                    # Check for issues
```

The important rules:

- **Hooks** for state and effects (no HOCs unless absolutely necessary)
- All interactive elements need **ARIA attributes** and **keyboard support**
- Server data goes through **RTK Query** — don't use `useEffect` + `fetch` for API calls
- CSS class naming: use the component/page name as a prefix (e.g., `.quiz-card-title`)

---

## Submitting a Pull Request

1. **Fork** the repo and **clone** your fork
2. **Branch** off `main` with a descriptive name
3. **Make your changes** — keep them focused (one feature/fix per PR)
4. **Run the checks:**

   ```bash
   # Backend
   cd backend && uv run ruff check . --fix && uv run ruff format . && uv run pytest && uvx pip-audit

   # Frontend
   cd frontend && bun run lint && bun run test

   # Repo-level hooks
   cd .. && uvx pre-commit run --all-files
   ```

5. **Update docs** if you added/changed endpoints, models, or user-facing features
6. **Push and open a PR** with:
   - What the change does (not how — I can read the code)
   - Why it's needed (link to issue if there is one)
   - Screenshots/recordings if it's a UI change
   - Any testing notes (edge cases you considered, things you couldn't test)

### What I Look For

- Does it work? (tests pass, no regressions)
- Is it typed? (backend: type hints, frontend: sensible prop usage)
- Is it tested? (new code has tests, bug fixes include regression tests)
- Is it accessible? (keyboard nav, screen reader friendly, ARIA labels)
- Does it follow existing patterns? (don't reinvent the wheel — check how similar things are done in the codebase)
- Is it documented? (new endpoints → API_REFERENCE, architecture changes → BACKEND/FRONTEND_ARCHITECTURE)

### What Will Get Your PR Rejected

- No tests
- Breaking changes without discussion
- Mixing unrelated changes in one PR (formatting + feature + refactor = 3 PRs)
- Ignoring linter errors

---

## Docs

The `/docs` directory has the detailed architecture documentation:

- [API_REFERENCE.md](docs/API_REFERENCE.md) — Every endpoint, request/response shapes, error codes
- [BACKEND_ARCHITECTURE.md](docs/BACKEND_ARCHITECTURE.md) — How the backend works, DB schema, auth flow
- [FRONTEND_ARCHITECTURE.md](docs/FRONTEND_ARCHITECTURE.md) — Component structure, Redux setup, routing
- [08_VERSION_ROADMAP.md](docs/08_VERSION_ROADMAP.md) — Version history and planned features

If you're not sure where to start, read the roadmap — the "Not Started" versions have tasks that need doing.

---

Thanks for contributing. Seriously. Even small fixes and typo corrections are appreciated.
