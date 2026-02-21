"""Pydantic models for request/response validation."""

from datetime import datetime
from pydantic import BaseModel, Field


# ── Auth ─────────────────────────────────────────────

class RegisterRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=30, pattern=r"^[a-zA-Z0-9_-]+$")
    password: str = Field(..., min_length=6)


class LoginRequest(BaseModel):
    username: str
    password: str


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    username: str


# ── Quiz ─────────────────────────────────────────────

class Question(BaseModel):
    id: str
    question: str
    options: list[str]
    answer: str


class QuizCreate(BaseModel):
    """Request body for creating a quiz."""
    title: str = Field(..., min_length=1, max_length=200)
    description: str = Field(default="")
    categories: list[str] = Field(default_factory=list)
    questions: list[Question] = Field(..., min_length=1)


class QuizUpdate(BaseModel):
    """Request body for editing a quiz."""
    title: str = Field(..., min_length=1, max_length=200)
    description: str = Field(default="")
    categories: list[str] = Field(default_factory=list)
    questions: list[Question] = Field(..., min_length=1)


class QuizSummary(BaseModel):
    """Quiz in list view — no answers exposed."""
    id: str
    title: str
    description: str
    author: str
    author_id: str
    num_questions: int
    categories: list[str]
    created_at: datetime | None = None
    updated_at: datetime | None = None


class QuizDetail(BaseModel):
    """Full quiz for detail / edit views."""
    id: str
    title: str
    description: str
    author: str
    author_id: str
    num_questions: int
    categories: list[str]
    questions: list[Question]
    created_at: datetime | None = None
    updated_at: datetime | None = None


class QuizListResponse(BaseModel):
    quizzes: list[QuizSummary]


class QuizDetailResponse(BaseModel):
    quiz: QuizDetail
    can_edit: bool


class QuizCreateResponse(BaseModel):
    id: str
    message: str = "Quiz created successfully"


class QuizUpdateResponse(BaseModel):
    message: str
    success: bool


class QuizDeleteResponse(BaseModel):
    message: str = "Quiz deleted successfully"


# ── Generate ─────────────────────────────────────────

class GenerateRequest(BaseModel):
    prompt: str = Field(..., min_length=3, max_length=500)


class GenerateResponse(BaseModel):
    quiz: QuizDetail


# ── Attempts (server-side scoring) ───────────────────

class AnswerSubmission(BaseModel):
    question_id: str
    selected_answer: str


class AttemptStartResponse(BaseModel):
    attempt_id: str
    quiz_id: str
    total_questions: int


class AttemptFinishRequest(BaseModel):
    answers: list[AnswerSubmission]


class AttemptResult(BaseModel):
    attempt_id: str
    quiz_id: str
    quiz_title: str
    score: int
    total: int
    correct_count: int
    wrong_count: int
    details: list[dict]
    created_at: datetime | None = None


class AttemptSummary(BaseModel):
    attempt_id: str
    quiz_id: str
    quiz_title: str
    score: int
    total: int
    correct_count: int
    created_at: datetime | None = None


class AttemptListResponse(BaseModel):
    attempts: list[AttemptSummary]


# ── Profile ──────────────────────────────────────────

class CreatedQuizInfo(BaseModel):
    id: str
    title: str


class UserProfileResponse(BaseModel):
    username: str
    created_at: datetime | None = None
    total_attempts: int = 0
    average_score: float = 0.0
    created_quizzes: list[CreatedQuizInfo] = Field(default_factory=list)


# ── Shared error response ───────────────────────────

class ErrorResponse(BaseModel):
    detail: str
