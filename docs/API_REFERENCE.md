# API Reference

Base URL: `http://localhost:8000`

All endpoints are prefixed with `/api/v1`. Authentication uses `Authorization: Bearer <access_token>` headers unless noted otherwise.

Rate limits are specified per-endpoint where applicable.

---

## Authentication

### POST `/auth/register`

Create a new user account and return JWT tokens.

**Rate limit:** 5 requests/minute

**Request body:**

```json
{
  "username": "string (3-30 chars, alphanumeric + _ -)",
  "password": "string (min 6 chars)"
}
```

**Response `201`:**

```json
{
  "access_token": "eyJ...",
  "token_type": "bearer",
  "username": "johndoe"
}
```

**Errors:** `409` Username already taken

**Cookies set:** `refresh_token` (HTTP-only, path `/api/v1/auth`)

---

### POST `/auth/login`

Authenticate user and return JWT tokens.

**Rate limit:** 10 requests/minute

**Request body:**

```json
{
  "username": "string",
  "password": "string"
}
```

**Response `200`:**

```json
{
  "access_token": "eyJ...",
  "token_type": "bearer",
  "username": "johndoe"
}
```

**Errors:** `401` Invalid username or password

**Cookies set:** `refresh_token` (HTTP-only, path `/api/v1/auth`)

---

### POST `/auth/refresh`

Issue a new access token using the refresh token cookie. No auth header required.

**Response `200`:**

```json
{
  "access_token": "eyJ...",
  "token_type": "bearer",
  "username": "johndoe"
}
```

**Errors:** `401` No refresh token provided / Invalid or expired refresh token

---

### POST `/auth/logout`

Clear the refresh token cookie. No auth header required.

**Response `200`:**

```json
{
  "message": "Logged out successfully"
}
```

---

### PUT `/auth/password`

Change the authenticated user's password.

**Request body:**

```json
{
  "current_password": "string",
  "new_password": "string (min 6 chars)"
}
```

**Response `200`:**

```json
{
  "message": "Password changed successfully"
}
```

**Errors:** `400` Current password is incorrect / New password must differ from current

---

## Quizzes

### GET `/quizzes`

List published quizzes with search, filter, sort, and pagination.

**Query parameters:**

| Param        | Type   | Default  | Description                                    |
| ------------ | ------ | -------- | ---------------------------------------------- |
| `search`     | string | `""`     | Full-text search on title/description          |
| `category`   | string | `""`     | Filter by category (case-insensitive)          |
| `difficulty` | string | `""`     | Filter by difficulty: `easy`, `medium`, `hard` |
| `sort`       | string | `"date"` | Sort by: `date`, `title`, `difficulty`         |
| `order`      | string | `"desc"` | Sort order: `asc`, `desc`                      |
| `page`       | int    | `1`      | Page number (1-based)                          |
| `page_size`  | int    | `20`     | Items per page (1-100)                         |

**Response `200`:**

```json
{
  "quizzes": [
    {
      "id": "60f...",
      "title": "JavaScript Basics",
      "description": "Test your JS knowledge",
      "author": "johndoe",
      "author_id": "60f...",
      "num_questions": 10,
      "categories": ["JavaScript", "Programming"],
      "difficulty": "medium",
      "time_limit_minutes": 15,
      "time_per_question_seconds": null,
      "is_published": true,
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 42,
  "page": 1,
  "page_size": 20
}
```

---

### GET `/quizzes/my`

List quizzes created by the authenticated user (including drafts).

**Query parameters:** `page`, `page_size` (same as above)

**Response `200`:** Same shape as `GET /quizzes`

---

### POST `/quizzes`

Create a new quiz.

**Request body:**

```json
{
  "title": "string (1-200 chars)",
  "description": "string",
  "categories": ["string"],
  "difficulty": "easy | medium | hard | null",
  "time_limit_minutes": "int (1-180) | null",
  "time_per_question_seconds": "int (5-300) | null",
  "is_published": true,
  "questions": [
    {
      "id": "q_abc123",
      "question": "What is 2 + 2?",
      "options": ["3", "4", "5", "6"],
      "answer": "4",
      "explanation": "Basic addition"
    }
  ]
}
```

**Response `201`:**

```json
{
  "id": "60f...",
  "message": "Quiz created successfully"
}
```

---

### GET `/quizzes/:id`

Get full quiz detail by ID.

**Response `200`:**

```json
{
  "quiz": {
    "id": "60f...",
    "title": "...",
    "description": "...",
    "author": "johndoe",
    "author_id": "60f...",
    "num_questions": 10,
    "categories": ["..."],
    "difficulty": "medium",
    "time_limit_minutes": 15,
    "time_per_question_seconds": null,
    "is_published": true,
    "questions": [
      {
        "id": "q_abc123",
        "question": "...",
        "options": ["..."],
        "answer": "...",
        "explanation": "..."
      }
    ],
    "created_at": "...",
    "updated_at": "..."
  },
  "can_edit": false
}
```

**Errors:** `404` Quiz not found

---

### PUT `/quizzes/:id`

Update an existing quiz (owner only). Request body is the same shape as `POST /quizzes`.

**Response `200`:**

```json
{
  "message": "Quiz updated successfully",
  "success": true
}
```

**Errors:** `403` You can only edit quizzes you created, `404` Quiz not found

---

### DELETE `/quizzes/:id`

Soft-delete a quiz (owner only).

**Response `200`:**

```json
{
  "message": "Quiz deleted successfully"
}
```

**Errors:** `403` You can only delete quizzes you created, `404` Quiz not found

---

### POST `/quizzes/:id/duplicate`

Create a copy of an existing quiz, owned by the current user. Starts as a draft.

**Response `201`:**

```json
{
  "id": "60f...",
  "message": "Quiz duplicated successfully"
}
```

**Errors:** `404` Quiz not found

---

### GET `/quizzes/:id/export`

Export a quiz as JSON (includes answers, strips metadata).

**Response `200`:**

```json
{
  "title": "...",
  "description": "...",
  "categories": ["..."],
  "difficulty": "medium",
  "time_limit_minutes": 15,
  "time_per_question_seconds": null,
  "questions": [
    {
      "question": "...",
      "options": ["..."],
      "answer": "...",
      "explanation": "..."
    }
  ]
}
```

---

### POST `/quizzes/import`

Import a quiz from exported JSON data. Starts as a draft.

**Request body:** Same shape as export response, plus `title` required.

**Response `201`:**

```json
{
  "id": "60f...",
  "message": "Quiz imported successfully"
}
```

---

### GET `/categories`

List all categories with their quiz count.

**Response `200`:**

```json
{
  "categories": [
    { "name": "JavaScript", "count": 15 },
    { "name": "Python", "count": 8 }
  ]
}
```

---

## AI Generation

### POST `/generate`

Generate a quiz using Google Gemini AI.

**Rate limit:** 5 requests/minute

**Request body:**

```json
{
  "prompt": "string (3-500 chars)"
}
```

**Response `200`:**

```json
{
  "quiz": {
    "id": "generated",
    "title": "...",
    "description": "...",
    "author": "AI Assistant",
    "author_id": "",
    "num_questions": 10,
    "categories": ["..."],
    "questions": [...]
  }
}
```

**Errors:** `500` AI returned invalid response, `503` Gemini API key not configured

---

## Attempts

### POST `/attempts/start/:quizId`

Start a quiz attempt. Questions and options are randomized server-side.

**Response `201`:**

```json
{
  "attempt_id": "60f...",
  "quiz_id": "60f...",
  "total_questions": 10,
  "questions": [
    {
      "id": "q_abc123",
      "question": "...",
      "options": ["...(shuffled)"],
      "answer": "...",
      "explanation": "..."
    }
  ]
}
```

**Errors:** `404` Quiz not found

---

### POST `/attempts/:id/finish`

Submit answers and finish the attempt. Server calculates the score.

**Request body:**

```json
{
  "answers": [
    {
      "question_id": "q_abc123",
      "selected_answer": "4"
    }
  ]
}
```

**Response `200`:**

```json
{
  "attempt_id": "60f...",
  "quiz_id": "60f...",
  "quiz_title": "JavaScript Basics",
  "score": 80,
  "total": 10,
  "correct_count": 8,
  "wrong_count": 2,
  "details": [
    {
      "question_id": "q_abc123",
      "question": "What is 2 + 2?",
      "selected_answer": "4",
      "correct_answer": "4",
      "is_correct": true,
      "explanation": "Basic addition"
    }
  ],
  "created_at": "..."
}
```

**Errors:** `400` Attempt already completed, `403` Not your attempt, `404` Attempt not found

---

### GET `/attempts`

List all completed attempts for the authenticated user (newest first).

**Response `200`:**

```json
{
  "attempts": [
    {
      "attempt_id": "60f...",
      "quiz_id": "60f...",
      "quiz_title": "JavaScript Basics",
      "score": 80,
      "total": 10,
      "correct_count": 8,
      "created_at": "..."
    }
  ]
}
```

---

### GET `/attempts/:id`

Get full detail for a single completed attempt.

**Response `200`:** Same shape as `POST /attempts/:id/finish` response.

**Errors:** `403` Not your attempt, `404` Attempt not found

---

### DELETE `/attempts/:id`

Delete one of the user's own completed attempts.

**Response `200`:**

```json
{
  "message": "Attempt deleted successfully"
}
```

**Errors:** `403` Not your attempt, `404` Attempt not found

---

## Leaderboards

### GET `/quizzes/:id/leaderboard`

Top scores for a specific quiz (best attempt per user, max 50 entries).

**No authentication required.**

**Response `200`:**

```json
{
  "quiz_id": "60f...",
  "quiz_title": "JavaScript Basics",
  "entries": [
    {
      "username": "johndoe",
      "score": 100,
      "total": 10,
      "correct_count": 10,
      "created_at": "..."
    }
  ]
}
```

---

### GET `/leaderboard`

Global leaderboard — aggregate stats across all users ranked by average score.

**No authentication required.**

**Response `200`:**

```json
{
  "entries": [
    {
      "username": "johndoe",
      "total_attempts": 25,
      "average_score": 85.5,
      "best_score": 100
    }
  ]
}
```

---

## Profile

### GET `/profile`

Get the authenticated user's profile with stats and created quizzes.

**Response `200`:**

```json
{
  "username": "johndoe",
  "display_name": "John Doe",
  "email": "john@example.com",
  "created_at": "...",
  "total_attempts": 25,
  "average_score": 85.5,
  "best_score": 100,
  "created_quizzes": [
    {
      "id": "60f...",
      "title": "My Quiz",
      "num_questions": 10,
      "difficulty": "medium"
    }
  ]
}
```

---

### PUT `/profile`

Update display name and/or email.

**Request body:**

```json
{
  "display_name": "John Doe",
  "email": "john@example.com"
}
```

**Response `200`:** Updated profile (same shape as `GET /profile`).

---

### DELETE `/profile`

Soft-delete the user account.

**Request body:**

```json
{
  "password": "string",
  "keep_quizzes": true
}
```

**Response `200`:**

```json
{
  "message": "Account deleted successfully"
}
```

**Errors:** `400` Incorrect password

---

### GET `/stats`

Detailed statistics for the authenticated user.

**Response `200`:**

```json
{
  "total_attempts": 25,
  "average_score": 85.5,
  "best_score": 100,
  "total_quizzes_created": 5,
  "category_breakdown": [
    {
      "category": "JavaScript",
      "attempts": 10,
      "average_score": 90.0
    }
  ],
  "recent_attempts": [...],
  "score_distribution": [
    { "range": "81-100", "count": 15 },
    { "range": "61-80", "count": 7 }
  ]
}
```

---

### GET `/user/:username`

Public profile for a given username. No authentication required.

**Response `200`:**

```json
{
  "username": "johndoe",
  "display_name": "John Doe",
  "total_attempts": 25,
  "average_score": 85.5,
  "created_quizzes": [...],
  "member_since": "..."
}
```

**Errors:** `404` User not found

---

## Health

### GET `/health`

**No authentication required.**

**Response `200`:**

```json
{
  "status": "ok",
  "version": "0.4.0"
}
```

---

## Error Responses

All error responses follow this shape:

```json
{
  "detail": "Human-readable error message"
}
```

Common HTTP status codes:

- `400` — Bad request / validation error
- `401` — Unauthorized (missing or invalid token)
- `403` — Forbidden (not resource owner)
- `404` — Not found
- `409` — Conflict (e.g., duplicate username)
- `413` — Request body too large (> 2 MB)
- `429` — Rate limit exceeded
- `500` — Internal server error
- `503` — Service unavailable (e.g., Gemini API not configured)
