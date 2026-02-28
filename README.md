# Quiz App

A full-stack quiz application with quiz creation, AI-powered generation (Google Gemini), server-side scoring, leaderboards, and user analytics. Built with React 19 + FastAPI + MongoDB.

## What it does

- **Create quizzes** manually or let Gemini AI generate them from a topic
- **Take quizzes** with a timer, randomized questions, and server-side scoring (no cheating via devtools)
- **Leaderboards** per quiz and globally, ranked by best attempt
- **User profiles** with stats, attempt history, and charts (recharts)
- **Quiz management** - duplicate, export/import as JSON, publish/draft, soft-delete
- Account system with JWT auth, refresh tokens in httpOnly cookies, password changes

## Tech stack

**Frontend:** React 19, Redux Toolkit + RTK Query, React Router, Vite, plain CSS

**Backend:** FastAPI (Python 3.12), MongoDB with async pymongo, Pydantic v2

**AI:** Google Gemini via `google-genai` SDK

**Auth:** JWT access/refresh tokens, Argon2 password hashing

**Testing:** pytest + httpx (backend), Vitest + Testing Library (frontend), Playwright (E2E)

**Tooling:** uv for Python deps, Bun for JS, Ruff for linting, ESLint with jsx-a11y

## Getting started

You'll need Python 3.12+, [uv](https://docs.astral.sh/uv/getting-started/installation/), [Bun](https://bun.sh/) 1.3.6+, and MongoDB running locally. A Gemini API key is optional (only needed for the AI generation feature - you can get one free at [ai.google.dev](https://ai.google.dev/)).

### Backend

```bash
cd backend
uv sync --group dev
```

Create `backend/.env`:

```env
MONGO_URI=mongodb://localhost:27017
DB=quiz
JWT_SECRET=pick-something-random-here
GEMINI_API_KEY=           # optional, leave blank if you don't have one
CORS_ORIGINS=["http://localhost:5173"]
```

Start it:

```bash
uv run uvicorn app.main:app --reload
```

API runs at http://localhost:8000. Interactive docs at http://localhost:8000/docs.

### Frontend

```bash
cd frontend
bun install
bun run dev
```

Open http://localhost:5173.

### Tests

```bash
# backend
cd backend
uv run pytest

# frontend unit tests
cd frontend
bun run test

# E2E (playwright spins up both servers automatically)
bunx playwright install   # first time only
bunx playwright test
```

Tests use separate databases (`quiz_test` / `quiz_e2e_test`) so they won't touch dev data. Safety guards prevent tests from running against non-local or non-test databases.

## Project structure

```
Quiz-App/
├── backend/
│   ├── app/
│   │   ├── main.py           # FastAPI app, middleware, error handling
│   │   ├── config.py         # Settings from .env (pydantic-settings)
│   │   ├── db.py             # MongoDB connection + indexes
│   │   ├── models.py         # ~45 Pydantic models for requests/responses
│   │   ├── gemini_client.py  # Gemini AI wrapper
│   │   └── routes/           # auth, quiz, attempts, profile, generate
│   └── tests/                # unit + integration tests
│
├── frontend/
│   └── src/
│       ├── App.jsx           # Router with lazy-loaded pages
│       ├── store/            # Redux (5 slices + RTK Query with 24 endpoints)
│       ├── pages/            # 16 pages, all code-split
│       ├── components/       # Sidebar, QuizCard, Toast, Pagination, etc.
│       └── lib/              # API wrapper, sanitization utils
│
└── docs/                     # Architecture docs, audit reports, roadmap
```

## API

29 endpoints, all under `/api/v1`. Full docs in [docs/API_REFERENCE.md](docs/API_REFERENCE.md).

The main ones:

- `POST /auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout`
- `GET /quizzes` (search, filter, sort, paginate), `POST /quizzes`, `GET/PUT/DELETE /quizzes/:id`
- `POST /attempts/start/:quizId`, `POST /attempts/:id/finish` (server scores it)
- `GET /quizzes/:id/leaderboard`, `GET /leaderboard` (global)
- `POST /generate` (AI quiz generation, rate limited)
- `GET /profile`, `GET /stats`, `GET /user/:username`

## Environment variables

The backend reads from `backend/.env`. The important ones:

- `MONGO_URI` - MongoDB connection string (default: `mongodb://localhost:27017`)
- `DB` - database name (default: `quiz`)
- `JWT_SECRET` - **change this** from the default
- `GEMINI_API_KEY` - for AI generation (optional)
- `CORS_ORIGINS` - allowed origins (default: `["http://localhost:5173"]`)

For the frontend, just `VITE_API_URL=http://localhost:8000` in `frontend/.env`.

For tests there are separate `TEST_MONGO_URI`, `TEST_DB`, `E2E_MONGO_URI`, `E2E_DB` vars. Check [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## DOCS

- Architecture docs for the [backend](docs/BACKEND_ARCHITECTURE.md) and [frontend](docs/FRONTEND_ARCHITECTURE.md)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for setup, code style, and PR process.
