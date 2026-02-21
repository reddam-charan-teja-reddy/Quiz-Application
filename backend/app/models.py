"""Pydantic models for request/response validation."""

from datetime import datetime
from enum import Enum
from typing import Literal

from pydantic import BaseModel, Field

# ── Enums ────────────────────────────────────────────

class Difficulty(str, Enum):
    easy = "easy"
    medium = "medium"
    hard = "hard"


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


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=6)


# ── Quiz ─────────────────────────────────────────────

class Question(BaseModel):
    id: str
    question: str
    options: list[str]
    answer: str
    explanation: str = ""


class QuizCreate(BaseModel):
    """Request body for creating a quiz."""
    title: str = Field(..., min_length=1, max_length=200)
    description: str = Field(default="")
    categories: list[str] = Field(default_factory=list)
    difficulty: Difficulty | None = None
    time_limit_minutes: int | None = Field(default=None, ge=1, le=180)
    time_per_question_seconds: int | None = Field(default=None, ge=5, le=300)
    is_published: bool = True
    questions: list[Question] = Field(..., min_length=1)


class QuizUpdate(BaseModel):
    """Request body for editing a quiz."""
    title: str = Field(..., min_length=1, max_length=200)
    description: str = Field(default="")
    categories: list[str] = Field(default_factory=list)
    difficulty: Difficulty | None = None
    time_limit_minutes: int | None = Field(default=None, ge=1, le=180)
    time_per_question_seconds: int | None = Field(default=None, ge=5, le=300)
    is_published: bool = True
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
    difficulty: str | None = None
    time_limit_minutes: int | None = None
    time_per_question_seconds: int | None = None
    is_published: bool = True
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
    difficulty: str | None = None
    time_limit_minutes: int | None = None
    time_per_question_seconds: int | None = None
    is_published: bool = True
    questions: list[Question]
    created_at: datetime | None = None
    updated_at: datetime | None = None


class QuizListResponse(BaseModel):
    quizzes: list[QuizSummary]
    total: int = 0
    page: int = 1
    page_size: int = 20


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


class QuizImportRequest(BaseModel):
    """Import a quiz from exported JSON."""
    title: str = Field(..., min_length=1, max_length=200)
    description: str = Field(default="")
    categories: list[str] = Field(default_factory=list)
    difficulty: Difficulty | None = None
    time_limit_minutes: int | None = Field(default=None, ge=1, le=180)
    time_per_question_seconds: int | None = Field(default=None, ge=5, le=300)
    questions: list[Question] = Field(..., min_length=1)


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
    questions: list[Question]  # Shuffled questions for the attempt


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


# ── Categories ───────────────────────────────────────

class CategoryInfo(BaseModel):
    name: str
    count: int


class CategoryListResponse(BaseModel):
    categories: list[CategoryInfo]


# ── Leaderboard ──────────────────────────────────────

class LeaderboardEntry(BaseModel):
    username: str
    score: int
    total: int
    correct_count: int
    created_at: datetime | None = None


class QuizLeaderboardResponse(BaseModel):
    quiz_id: str
    quiz_title: str
    entries: list[LeaderboardEntry]


class GlobalLeaderboardEntry(BaseModel):
    username: str
    total_attempts: int
    average_score: float
    best_score: int


class GlobalLeaderboardResponse(BaseModel):
    entries: list[GlobalLeaderboardEntry]


# ── Profile ──────────────────────────────────────────

class CreatedQuizInfo(BaseModel):
    id: str
    title: str
    num_questions: int = 0
    difficulty: str | None = None


class UserProfileResponse(BaseModel):
    username: str
    display_name: str = ""
    email: str = ""
    created_at: datetime | None = None
    total_attempts: int = 0
    average_score: float = 0.0
    best_score: int = 0
    created_quizzes: list[CreatedQuizInfo] = Field(default_factory=list)


class EditProfileRequest(BaseModel):
    display_name: str = Field(default="", max_length=50)
    email: str = Field(default="", max_length=100)


class DeleteAccountRequest(BaseModel):
    keep_quizzes: bool = True
    password: str


class PublicProfileResponse(BaseModel):
    username: str
    display_name: str = ""
    total_attempts: int = 0
    average_score: float = 0.0
    created_quizzes: list[CreatedQuizInfo] = Field(default_factory=list)
    member_since: datetime | None = None


class UserStatsResponse(BaseModel):
    total_attempts: int = 0
    average_score: float = 0.0
    best_score: int = 0
    total_quizzes_created: int = 0
    category_breakdown: list[dict] = Field(default_factory=list)
    recent_attempts: list[AttemptSummary] = Field(default_factory=list)
    score_distribution: list[dict] = Field(default_factory=list)


# ── Shared error response ───────────────────────────

class ErrorResponse(BaseModel):
    detail: str
