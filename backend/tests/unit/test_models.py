"""Unit tests for Pydantic request/response model validation.

Tests focus on validation boundaries and constraints that protect data integrity.
Trivial happy-path tests for unconstrained models are omitted - those are
covered implicitly by integration tests that construct and submit real payloads.
"""

import pytest
from pydantic import ValidationError

from app.models import (
    RegisterRequest,
    ChangePasswordRequest,
    QuizCreate,
    GenerateRequest,
    EditProfileRequest,
    Question,
    Difficulty,
)


class TestRegisterValidation:
    """RegisterRequest enforces username pattern + length and password length."""

    def test_valid_registration(self):
        r = RegisterRequest(username="testuser", password="securepass123")
        assert r.username == "testuser"

    def test_username_min_boundary(self):
        """Exactly 3 chars should pass (boundary)."""
        r = RegisterRequest(username="abc", password="securepass123")
        assert r.username == "abc"

    def test_username_max_boundary(self):
        """Exactly 30 chars should pass (boundary)."""
        r = RegisterRequest(username="a" * 30, password="securepass123")
        assert len(r.username) == 30

    def test_username_too_short(self):
        with pytest.raises(ValidationError):
            RegisterRequest(username="ab", password="securepass123")

    def test_username_too_long(self):
        with pytest.raises(ValidationError):
            RegisterRequest(username="a" * 31, password="securepass123")

    def test_username_rejects_special_chars(self):
        with pytest.raises(ValidationError):
            RegisterRequest(username="test user!", password="securepass123")

    def test_username_allows_hyphens_underscores(self):
        r = RegisterRequest(username="test_user-1", password="securepass123")
        assert r.username == "test_user-1"

    def test_password_too_short(self):
        with pytest.raises(ValidationError):
            RegisterRequest(username="testuser", password="12345")

    def test_password_min_boundary(self):
        """Exactly 6 chars should pass."""
        r = RegisterRequest(username="testuser", password="123456")
        assert len(r.password) == 6


class TestChangePasswordValidation:
    """ChangePasswordRequest enforces new_password min length."""

    def test_new_password_too_short(self):
        with pytest.raises(ValidationError):
            ChangePasswordRequest(current_password="oldpass", new_password="12345")

    def test_valid_change(self):
        r = ChangePasswordRequest(current_password="oldpass", new_password="newsecure")
        assert r.new_password == "newsecure"


class TestQuizCreateValidation:
    """QuizCreate enforces title, questions, difficulty, and time constraints."""

    def _question(self, id="q1"):
        return Question(
            id=id,
            question="What is 2+2?",
            options=["3", "4", "5", "6"],
            answer="4",
        )

    def test_valid_quiz(self):
        q = QuizCreate(title="Python Basics", questions=[self._question()])
        assert q.title == "Python Basics"
        assert len(q.questions) == 1

    def test_empty_title_rejected(self):
        with pytest.raises(ValidationError):
            QuizCreate(title="", questions=[self._question()])

    def test_title_over_200_chars_rejected(self):
        with pytest.raises(ValidationError):
            QuizCreate(title="x" * 201, questions=[self._question()])

    def test_empty_questions_rejected(self):
        with pytest.raises(ValidationError):
            QuizCreate(title="Test", questions=[])

    def test_invalid_difficulty_rejected(self):
        with pytest.raises(ValidationError):
            QuizCreate(
                title="Test",
                difficulty="impossible",
                questions=[self._question()],
            )

    def test_valid_difficulties(self):
        for diff in Difficulty:
            q = QuizCreate(title="Test", difficulty=diff, questions=[self._question()])
            assert q.difficulty == diff

    def test_time_limit_max_180(self):
        with pytest.raises(ValidationError):
            QuizCreate(title="Test", time_limit_minutes=181, questions=[self._question()])

    def test_time_limit_min_1(self):
        with pytest.raises(ValidationError):
            QuizCreate(title="Test", time_limit_minutes=0, questions=[self._question()])

    def test_time_per_question_max_300(self):
        with pytest.raises(ValidationError):
            QuizCreate(
                title="Test",
                time_per_question_seconds=301,
                questions=[self._question()],
            )

    def test_time_per_question_min_5(self):
        with pytest.raises(ValidationError):
            QuizCreate(
                title="Test",
                time_per_question_seconds=4,
                questions=[self._question()],
            )

    def test_time_per_question_boundary(self):
        q = QuizCreate(
            title="Test",
            time_per_question_seconds=5,
            questions=[self._question()],
        )
        assert q.time_per_question_seconds == 5


class TestProfileValidation:
    """EditProfileRequest enforces field length limits."""

    def test_display_name_over_50_rejected(self):
        with pytest.raises(ValidationError):
            EditProfileRequest(display_name="x" * 51)

    def test_email_over_100_rejected(self):
        with pytest.raises(ValidationError):
            EditProfileRequest(email="x" * 101)

    def test_display_name_at_boundary(self):
        p = EditProfileRequest(display_name="x" * 50)
        assert len(p.display_name) == 50


class TestGenerateValidation:
    """GenerateRequest enforces prompt length constraints."""

    def test_prompt_too_short(self):
        with pytest.raises(ValidationError):
            GenerateRequest(prompt="ab")

    def test_prompt_too_long(self):
        with pytest.raises(ValidationError):
            GenerateRequest(prompt="x" * 501)

    def test_prompt_min_boundary(self):
        g = GenerateRequest(prompt="abc")
        assert g.prompt == "abc"

    def test_prompt_max_boundary(self):
        g = GenerateRequest(prompt="x" * 500)
        assert len(g.prompt) == 500
