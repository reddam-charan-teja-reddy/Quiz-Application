from pydantic import BaseModel, Field
from typing import List, Optional


class LoginRequest(BaseModel):
    """User login request for /api/login"""
    username: str

class LoginResponse(BaseModel):
    """User login response for /api/login"""
    token: str
    status: str

class Profile(BaseModel):
    """User profile for /api/getquizzes"""
    username: str
    token: str

class Question(BaseModel):
    """Question model for Quiz"""
    id: str
    question: str
    options: list[str]
    answer: str

class Quiz(BaseModel):
    """Quiz model for /api/getquizzes"""
    # id will be empty when user creates the quiz and sends to backend
    # backend will generate a unique id for the quiz
    id: Optional[str] = None
    title: str
    description: str
    author: str
    num_questions: int
    categories: List[str]
    questions: List[Question]

class QuizzesList(BaseModel):
    """List of quizzes for returning in /api/getquizzes"""
    quizzes: list[Quiz]

class GenerateRequest(BaseModel):
    """Request model for /api/generate"""
    prompt: str

class GenerateResponse(BaseModel):
    """Response model for /api/generate"""
    quiz: Quiz

class UpdateHistoryRequest(BaseModel):
    """Request model for /api/updateHistory"""
    username: str
    token: str
    quiz_id: str
    correct: List[Question]
    wrong: List[Question]
    total: int
    score: int

class UploadQuizRequest(BaseModel):
    """Encapsulates user profile and quiz data for uploading."""
    profile: Profile
    quiz: Quiz

class CreatedQuizInfo(BaseModel):
    """A summary of a quiz created by the user."""
    id: str
    title: str

class UserProfileResponse(BaseModel):
    """The complete response payload for the user's profile page."""
    username: str
    history: list # The history objects are already well-structured
    created_quizzes: List[CreatedQuizInfo]

class EditQuizRequest(BaseModel):
    """Request model for /api/editquiz"""
    username: str
    token: str
    quiz_id: str
    quiz: Quiz

class EditQuizResponse(BaseModel):
    """Response model for /api/editquiz"""
    message: str
    success: bool

class GetQuizRequest(BaseModel):
    """Request model for /api/getquiz"""
    username: str
    token: str
    quiz_id: str