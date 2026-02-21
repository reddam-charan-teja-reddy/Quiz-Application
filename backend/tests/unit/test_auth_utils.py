"""Unit tests for authentication utilities - password hashing, JWT tokens, and get_current_user."""

from datetime import timedelta
from unittest.mock import AsyncMock, patch, MagicMock

import pytest
from bson import ObjectId
from fastapi import HTTPException
from jose import jwt

from app.utils.auth import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    get_current_user,
)
import app.config as config


class TestPasswordHashing:
    """Tests for bcrypt password hashing and verification."""

    def test_hash_returns_bcrypt_format(self):
        hashed = hash_password("mysecretpassword")
        assert hashed != "mysecretpassword"
        assert hashed.startswith("$2b$")

    def test_verify_correct_password(self):
        hashed = hash_password("correctpassword")
        assert verify_password("correctpassword", hashed) is True

    def test_verify_incorrect_password(self):
        hashed = hash_password("correctpassword")
        assert verify_password("wrongpassword", hashed) is False


class TestJWTTokens:
    """Tests for JWT access and refresh token creation."""

    def test_access_token_contains_subject_and_type(self):
        data = {"sub": "user123", "username": "testuser"}
        token = create_access_token(data)
        payload = jwt.decode(token, config.settings.JWT_SECRET, algorithms=[config.settings.JWT_ALGORITHM])
        assert payload["sub"] == "user123"
        assert payload["username"] == "testuser"
        assert payload["type"] == "access"
        assert "exp" in payload

    def test_refresh_token_contains_subject_and_type(self):
        data = {"sub": "user123", "username": "testuser"}
        token = create_refresh_token(data)
        payload = jwt.decode(token, config.settings.JWT_SECRET, algorithms=[config.settings.JWT_ALGORITHM])
        assert payload["sub"] == "user123"
        assert payload["type"] == "refresh"
        assert "exp" in payload


class TestGetCurrentUser:
    """Tests for the FastAPI auth dependency that extracts and validates JWT tokens."""

    @pytest.fixture
    def valid_user_id(self):
        return str(ObjectId())

    def _make_access_token(self, user_id, username="testuser"):
        return create_access_token({"sub": user_id, "username": username})

    def _make_refresh_token(self, user_id, username="testuser"):
        return create_refresh_token({"sub": user_id, "username": username})

    @patch("app.db.db")
    async def test_valid_token_returns_user(self, mock_db, valid_user_id):
        oid = ObjectId(valid_user_id)
        mock_db.users.find_one = AsyncMock(return_value={
            "_id": oid, "username": "testuser", "password_hash": "xxx",
        })

        token = self._make_access_token(valid_user_id)
        user = await get_current_user(token=token)

        assert user["id"] == valid_user_id
        assert user["username"] == "testuser"
        mock_db.users.find_one.assert_awaited_once()

    @patch("app.db.db")
    async def test_refresh_token_rejected(self, mock_db, valid_user_id):
        """Access endpoints must reject refresh tokens (type != 'access')."""
        token = self._make_refresh_token(valid_user_id)

        with pytest.raises(HTTPException) as exc:
            await get_current_user(token=token)
        assert exc.value.status_code == 401

    @patch("app.db.db")
    async def test_expired_token_rejected(self, mock_db, valid_user_id):
        token = create_access_token(
            {"sub": valid_user_id, "username": "testuser"},
            expires_delta=timedelta(seconds=-1),
        )
        with pytest.raises(HTTPException) as exc:
            await get_current_user(token=token)
        assert exc.value.status_code == 401

    @patch("app.db.db")
    async def test_deleted_user_rejected(self, mock_db, valid_user_id):
        """A valid token for a soft-deleted user should be rejected."""
        mock_db.users.find_one = AsyncMock(return_value=None)

        token = self._make_access_token(valid_user_id)
        with pytest.raises(HTTPException) as exc:
            await get_current_user(token=token)
        assert exc.value.status_code == 401

    async def test_malformed_token_rejected(self):
        with pytest.raises(HTTPException) as exc:
            await get_current_user(token="not.a.jwt")
        assert exc.value.status_code == 401
