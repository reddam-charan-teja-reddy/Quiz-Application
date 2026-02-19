from pydantic import BaseModel, Field
from typing import List, Optional


# ── Auth ─────────────────────────────────────────────

class RegisterRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=30)
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


class Quiz(BaseModel):
    id: Optional[str] = None
    title: str
    description: str
    author: str
    num_questions: int
    categories: List[str]
    questions: List[Question]


class QuizzesList(BaseModel):
    quizzes: list[Quiz]


# ── Generate ─────────────────────────────────────────

class GenerateRequest(BaseModel):
    prompt: str


class GenerateResponse(BaseModel):
    quiz: Quiz


# ── History ──────────────────────────────────────────

class UpdateHistoryRequest(BaseModel):
    quiz_id: str
    correct: List[Question]
    wrong: List[Question]
    total: int
    score: int


# ── Profile ──────────────────────────────────────────

class CreatedQuizInfo(BaseModel):
    id: str
    title: str


class UserProfileResponse(BaseModel):
    username: str
    history: list
    created_quizzes: List[CreatedQuizInfo]


# ── Edit Quiz ────────────────────────────────────────

class EditQuizRequest(BaseModel):
    quiz: Quiz


class EditQuizResponse(BaseModel):
    message: str
    success: bool