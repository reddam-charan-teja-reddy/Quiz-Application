# Quiz Application

A full-stack quiz application built with **React 19** + **Redux Toolkit** and **FastAPI** + **MongoDB**, featuring user authentication, quiz creation, AI-powered quiz generation, server-side scoring, leaderboards, and detailed analytics.

## Features

### Core Features

- **User Authentication** — JWT-based registration/login with refresh tokens (HTTP-only cookies)
- **Quiz Taking** — Interactive quiz interface with randomized questions and timed sessions
- **Quiz Creation** — Manual quiz creation with customizable questions, categories, difficulty levels
- **AI Generation** — Generate quizzes using Google Gemini AI based on a topic description
- **Server-Side Scoring** — Tamper-proof scoring with full answer detail stored per attempt
- **Leaderboards** — Per-quiz and global leaderboards with best-attempt-per-user ranking
- **Progress Tracking** — Track quiz attempts, scores, and performance over time
- **User Profile** — View/edit profile, display name, email, created quizzes, analytics
- **Quiz Management** — Duplicate, export, import, publish/draft, soft-delete quizzes

### User Interface

- **Responsive Design** — Mobile and desktop optimized
- **Code-Split Pages** — React.lazy + Suspense for fast initial load (~246 KB main chunk)
- **Keyboard Accessible** — Skip-to-content, keyboard navigation for quiz answers (1-4), ARIA labels throughout
- **Real-time Feedback** — Toast notifications, loading spinners, error boundaries

## Tech Stack

| Layer              | Technology                                   |
| ------------------ | -------------------------------------------- |
| Frontend           | React 19.1, React Router DOM 7.9, Vite 7.1   |
| State Management   | Redux Toolkit 2.11, RTK Query, redux-persist |
| Charts             | Recharts 3.7                                 |
| Backend            | FastAPI 0.117, Python 3.12, Pydantic 2.x     |
| Database           | MongoDB (pymongo 4.10 AsyncMongoClient)      |
| Authentication     | JWT (python-jose), bcrypt (passlib)          |
| AI                 | Google Gemini (google-genai 1.64+)           |
| Rate Limiting      | slowapi                                      |
| Testing (Backend)  | pytest, pytest-asyncio, httpx                |
| Testing (Frontend) | Vitest, @testing-library/react, Playwright   |
| Linting            | ruff (backend), ESLint + jsx-a11y (frontend) |
| Package Manager    | uv (backend), Bun 1.3.6+ (frontend)          |

## Getting Started

### Prerequisites

- **uv** (backend dependency management) — [install](https://docs.astral.sh/uv/getting-started/installation/)
- **Bun** 1.3.6 or later (frontend)
- **Python** 3.12+ (backend)
- **MongoDB** running locally or remote URI
- **Google Gemini API key** (optional — for AI quiz generation)

### Backend Setup

```bash
cd backend

# Install all dependencies (creates .venv automatically)
uv sync --group dev

# Create .env file (see Environment Variables section)
```

Create a `.env` file in the `backend/` directory:

```env
MONGO_URI=mongodb://localhost:27017
DB=quiz
JWT_SECRET=your-strong-secret-here
GEMINI_API_KEY=your_gemini_api_key_here
CORS_ORIGINS=["http://localhost:5173"]
```

Start the server:

```bash
uv run uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000` with interactive docs at `/docs`.

### Frontend Setup

```bash
cd frontend

# Install dependencies
bun install

# Start development server
bun run dev
```

The app will be available at `http://localhost:5173`.

### Running Tests

```bash
# Backend tests
cd backend
uv run pytest

# Frontend unit/component tests
cd frontend
bun run test

# Frontend tests with coverage
bun run test:coverage

# E2E tests (Playwright starts backend + frontend automatically)
bunx playwright install
bunx playwright test
```

Playwright uses `frontend/playwright.config.js` to start:

- Backend: `uv run uvicorn app.main:app --host 127.0.0.1 --port 8000`
- Frontend: `bun run dev`

You can still reuse already-running local servers in non-CI mode.

## Project Structure

```
Quiz-App/
├── backend/
│   ├── pyproject.toml        # Project config, dependencies, ruff, pytest
│   ├── uv.lock               # Locked dependency versions (managed by uv)
│   ├── app/                   # Application source package
│   │   ├── __init__.py
│   │   ├── main.py            # FastAPI entry point
│   │   ├── config.py          # pydantic-settings configuration
│   │   ├── db.py              # MongoDB connection + index management
│   │   ├── models.py          # All Pydantic request/response models
│   │   ├── gemini_client.py   # Google Gemini AI client wrapper
│   │   ├── limiter.py         # slowapi rate limiter instance
│   │   ├── routes/
│   │   │   ├── auth.py        # Register, login, refresh, logout, change password
│   │   │   ├── quiz.py        # CRUD, search, duplicate, export/import, categories
│   │   │   ├── attempts.py    # Start/finish attempts, history, leaderboards
│   │   │   ├── profile.py     # Profile, stats, edit, delete account, public profile
│   │   │   └── generate.py    # AI quiz generation
│   │   └── utils/
│   │       └── auth.py        # Password hashing, JWT creation/validation
│   ├── migrations/            # Database migration scripts
│   └── tests/
│       ├── conftest.py        # Async test client + fixtures
│       ├── factories.py       # Test data builders
│       ├── unit/              # Model + utility tests
│       └── integration/       # Full endpoint tests
│
├── frontend/
│   ├── index.html
│   ├── vite.config.js         # Vite config with code-splitting
│   ├── vitest.config.js       # Unit test configuration
│   ├── playwright.config.js   # E2E test configuration
│   ├── package.json
│   └── src/
│       ├── App.jsx            # Router + lazy-loaded routes
│       ├── lib/
│       │   ├── api.js         # Fetch wrapper, token management
│       │   └── sanitize.js    # Input sanitization utilities
│       ├── store/
│       │   ├── index.js       # Redux store (5 slices + RTK Query + persist)
│       │   ├── hooks.js       # Typed useAppDispatch/useAppSelector
│       │   ├── api/
│       │   │   └── apiSlice.js # RTK Query — 24 auto-cached endpoints
│       │   └── slices/        # auth, quiz, attempt, history, ui
│       ├── components/        # Shared UI: Sidebar, QuizCard, Toast, etc.
│       ├── pages/             # 16 route pages (code-split)
│       └── __tests__/         # Unit, store, component, page tests
│
├── docs/                      # Architecture docs, audits, roadmap
└── .github/workflows/         # CI pipelines (backend, frontend, e2e)
```

## API Overview

All API endpoints are prefixed with `/api/v1`. Authentication uses Bearer JWT tokens.

| Method | Endpoint                   | Description                                   |
| ------ | -------------------------- | --------------------------------------------- |
| POST   | `/auth/register`           | Create account (rate-limited: 5/min)          |
| POST   | `/auth/login`              | Login (rate-limited: 10/min)                  |
| POST   | `/auth/refresh`            | Refresh access token via cookie               |
| POST   | `/auth/logout`             | Clear refresh token cookie                    |
| PUT    | `/auth/password`           | Change password                               |
| GET    | `/quizzes`                 | List quizzes (search, filter, sort, paginate) |
| GET    | `/quizzes/my`              | List user's own quizzes                       |
| POST   | `/quizzes`                 | Create quiz                                   |
| GET    | `/quizzes/:id`             | Get quiz detail                               |
| PUT    | `/quizzes/:id`             | Update quiz (owner only)                      |
| DELETE | `/quizzes/:id`             | Soft-delete quiz (owner only)                 |
| POST   | `/quizzes/:id/duplicate`   | Duplicate quiz                                |
| GET    | `/quizzes/:id/export`      | Export quiz as JSON                           |
| POST   | `/quizzes/import`          | Import quiz from JSON                         |
| GET    | `/categories`              | List categories with counts                   |
| POST   | `/generate`                | AI quiz generation (rate-limited: 5/min)      |
| POST   | `/attempts/start/:quizId`  | Start quiz attempt                            |
| POST   | `/attempts/:id/finish`     | Submit answers + get score                    |
| GET    | `/attempts`                | List user's attempt history                   |
| GET    | `/attempts/:id`            | Get attempt detail                            |
| DELETE | `/attempts/:id`            | Delete attempt                                |
| GET    | `/quizzes/:id/leaderboard` | Quiz leaderboard                              |
| GET    | `/leaderboard`             | Global leaderboard                            |
| GET    | `/profile`                 | User profile                                  |
| PUT    | `/profile`                 | Edit profile                                  |
| DELETE | `/profile`                 | Delete account                                |
| GET    | `/stats`                   | User analytics/stats                          |
| GET    | `/user/:username`          | Public profile                                |
| GET    | `/health`                  | Health check                                  |

See [docs/API_REFERENCE.md](docs/API_REFERENCE.md) for full request/response schemas.

## Environment Variables

### Backend (`backend/.env`)

| Variable                      | Default                       | Description                   |
| ----------------------------- | ----------------------------- | ----------------------------- |
| `MONGO_URI`                   | `mongodb://localhost:27017`   | MongoDB connection string     |
| `DB`                          | `quiz`                        | Database name                 |
| `JWT_SECRET`                  | `change-me-in-production-...` | Secret key for JWT signing    |
| `JWT_ALGORITHM`               | `HS256`                       | JWT algorithm                 |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `15`                          | Access token TTL              |
| `REFRESH_TOKEN_EXPIRE_DAYS`   | `7`                           | Refresh token TTL             |
| `GEMINI_API_KEY`              | _(empty)_                     | Google Gemini API key         |
| `CORS_ORIGINS`                | `["http://localhost:5173"]`   | Allowed CORS origins          |
| `MAX_REQUEST_BODY_BYTES`      | `2097152` (2 MB)              | Request body size limit       |
| `ENVIRONMENT`                 | `development`                 | `development` or `production` |

### Frontend (`frontend/.env`)

| Variable       | Default                 | Description          |
| -------------- | ----------------------- | -------------------- |
| `VITE_API_URL` | `http://localhost:8000` | Backend API base URL |

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup, coding standards, and PR guidelines.

## License

This project is licensed under the MIT License.
