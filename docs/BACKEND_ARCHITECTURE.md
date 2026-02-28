# Backend Architecture

## Overview

FastAPI REST API serving quiz management, user authentication, and AI-powered quiz generation. Uses MongoDB with pymongo's AsyncMongoClient for non-blocking I/O and Pydantic for request/response validation.

## Tech stack

- FastAPI 0.117 — async web framework with auto-generated OpenAPI docs
- Python 3.12
- pymongo 4.10 — official MongoDB async driver (migrated from Motor)
- Pydantic 2.x - request/response validation
- pydantic-settings - reads config from `.env` files
- authlib - JWT tokens
- argon2-cffi - password hashing
- slowapi - rate limiting
- google-genai 1.64+ - Google's unified Gemini SDK

## Project Structure

```
backend/
├── pyproject.toml         # Project config, dependencies, ruff, pytest
├── uv.lock                # Locked dependency versions (managed by uv)
├── app/                    # Application source package
│   ├── __init__.py
│   ├── main.py            # Application entry point + middleware
│   ├── config.py           # Settings (pydantic-settings BaseSettings)
│   ├── db.py               # MongoDB connection, indexes, lifespan
│   ├── models.py           # All Pydantic models (~45 models)
│   ├── gemini_client.py    # Gemini AI client wrapper
│   ├── limiter.py          # slowapi rate limiter instance
│   ├── routes/
│   │   ├── __init__.py     # Router exports
│   │   ├── auth.py         # Authentication (5 endpoints)
│   │   ├── quiz.py         # Quiz CRUD (10 endpoints)
│   │   ├── attempts.py     # Attempts + leaderboards (7 endpoints)
│   │   ├── profile.py      # Profile + stats (5 endpoints)
│   │   ├── generate.py     # AI generation (1 endpoint)
│   │   └── history.py      # Deprecated stub
│   └── utils/
│       └── auth.py         # Password hashing, JWT helpers,
└── tests/
    ├── conftest.py         # Test client + fixtures
    ├── factories.py        # Test data builders
    ├── unit/               # Unit tests (models, utilities)
    └── integration/        # API endpoint tests
```

## Application Lifecycle

The app uses FastAPI's **lifespan** pattern for startup/shutdown:

```python
@asynccontextmanager
async def lifespan(app):
    await connect()     # MongoDB connection + index creation
    yield
    await disconnect()  # Clean MongoDB shutdown
```

### Startup Sequence

1. MongoDB client created with connection pooling (min 5, max 50)
2. Write concern set to `majority`, read preference to `PRIMARY`
3. Connection verified with `ping` command
4. 12 indexes created idempotently across 3 collections

## Configuration

Settings are managed via `pydantic-settings.BaseSettings`, which reads from a `.env` file and environment variables automatically:

```python
class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")
    MONGO_URI: str = "mongodb://localhost:27017"
    DB_NAME: str = Field(default="quiz", alias="DB")
    JWT_SECRET: str = "change-me-in-production"
    # ... etc
```

Key settings groups:

- **Database** — MONGO_URI, DB_NAME, pool sizes
- **Auth/JWT** — JWT_SECRET, algorithm, token TTLs
- **AI** — GEMINI_API_KEY
- **CORS** — CORS_ORIGINS (list of allowed origins)
- **Limits** — MAX_REQUEST_BODY_BYTES (2 MB default)
- **Environment** — ENVIRONMENT (development/production)

## Authentication

### Flow

1. **Register** — Hash password with bcrypt, store user, return JWT pair
2. **Login** — Verify password, return access token + refresh token (HTTP-only cookie)
3. **Refresh** — Validate refresh token cookie, issue new pair
4. **Protect routes** — `get_current_user` dependency validates access token on every request

### Token Structure

- **Access token** — Short-lived (15 min default), sent as Bearer token
- **Refresh token** — Long-lived (7 days default), stored as HTTP-only cookie scoped to `/api/v1/auth`

### Password Security

- Hashed with **bcrypt** via passlib
- Minimum 6 characters enforced by Pydantic model

## Database Design

### Collections

| Collection | Purpose              | Key Fields                                                                        |
| ---------- | -------------------- | --------------------------------------------------------------------------------- |
| `users`    | User accounts        | username (unique), password_hash, display_name, email, is_deleted                 |
| `quizzes`  | Quiz definitions     | title, author_id, questions[], categories[], difficulty, is_published, is_deleted |
| `attempts` | Quiz attempt records | user_id, quiz_id, questions[] (snapshot), answers[], score, status                |

### Indexes (12 total)

**Users:**

- `username` — unique

**Quizzes:**

- `author_id`, `author`, `created_at`, `is_deleted`, `category`, `difficulty`, `is_published`
- TEXT index on `title` + `description` (for full-text search)

**Attempts:**

- `(user_id, created_at)`, `quiz_id`, `(user_id, quiz_id)`, `status`, `(quiz_id, status, score)`

### Data Patterns

- **Soft deletes** — Users and quizzes set `is_deleted: true` instead of physical delete
- **Attempt snapshots** — Shuffled questions stored in each attempt for tamper-proof scoring
- **Server-side scoring** — Score calculation happens server-side in `finish_attempt`

## Middleware Stack

Applied in this order (top = outermost):

1. **BodySizeLimitMiddleware** — Rejects requests > 2 MB (configurable)
2. **CORSMiddleware** — Configured origins, credentials, methods, headers
3. **Rate limiter** — slowapi, applied per-endpoint via decorators
4. **Global exception handler** — Catches unhandled exceptions, logs full stack trace, returns generic 500

## Rate Limiting

Rate limits are applied per-endpoint using decorators:

| Endpoint              | Limit     |
| --------------------- | --------- |
| `POST /auth/register` | 5/minute  |
| `POST /auth/login`    | 10/minute |
| `POST /generate`      | 5/minute  |

All other endpoints have no rate limit.

## Router Organization

| Router     | Prefix         | Endpoints | Auth Required                                            |
| ---------- | -------------- | --------- | -------------------------------------------------------- |
| `auth`     | `/api/v1/auth` | 5         | Mixed (register/login/refresh/logout: no; password: yes) |
| `quiz`     | `/api/v1`      | 10        | Yes                                                      |
| `attempts` | `/api/v1`      | 7         | Yes (leaderboards: no)                                   |
| `profile`  | `/api/v1`      | 5         | Yes (public profile: no)                                 |
| `generate` | `/api/v1`      | 1         | Yes                                                      |

Total: **29 endpoints** (including health check)

## AI Quiz Generation

The `/generate` endpoint uses Google's Gemini API via the unified `google-genai` SDK:

1. User provides a topic prompt (3-500 characters)
2. Backend constructs a structured prompt with JSON schema
3. Gemini returns structured JSON via `response_mime_type: "application/json"`
4. Response is validated against `QuizDetail` Pydantic model
5. Returns a quiz preview (not saved to DB — user reviews and submits via `POST /quizzes`)

The `google-genai` SDK provides native async support via `client.aio.models.generate_content()`, so no `asyncio.to_thread()` wrapper is needed.

## Error Handling

- Pydantic handles validation automatically (422 with field-level errors)
- `HTTPException` for application-level errors (400, 401, 403, 404, 409)
- Global exception handler catches unhandled exceptions, logs the stack trace, returns generic 500
- slowapi handles 429 rate limit responses

## Testing

pytest + pytest-asyncio for async test support, httpx `AsyncClient` for HTTP-level testing.

### Test Structure

- `conftest.py` — Creates async test client, connects to `quiz_test` database, provides auth fixtures
- `factories.py` — `make_quiz_data()` and `make_answers()` for consistent test data
- `unit/` — Tests Pydantic models and utility functions (no DB/HTTP)
- `integration/` — Tests full request→response against all 29 endpoints

### Running Tests

```bash
cd backend
uv sync --group dev
uv run pytest                    # All tests
uv run pytest tests/unit/        # Unit tests only
uv run pytest tests/integration/ # Integration tests only
uv run pytest -v --tb=short      # Verbose with short tracebacks
```

## Linting

Ruff for everything (linting + formatting), configured in `pyproject.toml`. Python 3.12 target, 100 char line limit. Includes isort, bugbear, pyupgrade, and security rules.
