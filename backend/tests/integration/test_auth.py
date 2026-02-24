"""Integration tests for authentication endpoints."""

import pytest

from tests.factories import make_user_data


class TestRegister:
    """POST /api/v1/auth/register"""

    async def test_register_success(self, client):
        resp = await client.post("/api/v1/auth/register", json=make_user_data())
        assert resp.status_code == 201
        data = resp.json()
        assert "access_token" in data
        assert data["username"] == "testuser"
        assert data["token_type"] == "bearer"

    async def test_register_sets_refresh_cookie(self, client):
        resp = await client.post("/api/v1/auth/register", json=make_user_data())
        assert resp.status_code == 201
        cookies = resp.cookies
        assert "refresh_token" in cookies

    async def test_register_duplicate_username(self, client):
        await client.post("/api/v1/auth/register", json=make_user_data())
        resp = await client.post("/api/v1/auth/register", json=make_user_data())
        assert resp.status_code == 409
        assert "already taken" in resp.json()["detail"].lower()

    async def test_register_missing_fields(self, client):
        resp = await client.post("/api/v1/auth/register", json={})
        assert resp.status_code == 422


class TestLogin:
    """POST /api/v1/auth/login"""

    async def test_login_success(self, client):
        await client.post("/api/v1/auth/register", json=make_user_data())
        resp = await client.post(
            "/api/v1/auth/login",
            json={"username": "testuser", "password": "testpass123"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert data["username"] == "testuser"

    async def test_login_sets_refresh_cookie(self, client):
        await client.post("/api/v1/auth/register", json=make_user_data())
        resp = await client.post(
            "/api/v1/auth/login",
            json={"username": "testuser", "password": "testpass123"},
        )
        assert resp.status_code == 200
        assert "refresh_token" in resp.cookies

    async def test_login_wrong_password(self, client):
        await client.post("/api/v1/auth/register", json=make_user_data())
        resp = await client.post(
            "/api/v1/auth/login",
            json={"username": "testuser", "password": "wrongpass"},
        )
        assert resp.status_code == 401

    async def test_login_nonexistent_user(self, client):
        resp = await client.post(
            "/api/v1/auth/login",
            json={"username": "noone", "password": "testpass123"},
        )
        assert resp.status_code == 401


class TestRefresh:
    """POST /api/v1/auth/refresh"""

    async def test_refresh_valid_cookie(self, client):
        # Register to get refresh cookie
        reg_resp = await client.post("/api/v1/auth/register", json=make_user_data())
        assert reg_resp.status_code == 201

        # Extract cookie value and set as a cookie header
        refresh_cookie = reg_resp.cookies.get("refresh_token")
        assert refresh_cookie is not None, "register must set refresh_token cookie"

        refresh_resp = await client.post(
            "/api/v1/auth/refresh",
            headers={"Cookie": f"refresh_token={refresh_cookie}"},
        )
        assert refresh_resp.status_code == 200
        data = refresh_resp.json()
        assert "access_token" in data
        assert data["username"] == "testuser"

    async def test_refresh_missing_cookie(self, client):
        resp = await client.post("/api/v1/auth/refresh")
        assert resp.status_code == 401
        assert "refresh token" in resp.json()["detail"].lower()


class TestLogout:
    """POST /api/v1/auth/logout"""

    async def test_logout_clears_cookie(self, client):
        await client.post("/api/v1/auth/register", json=make_user_data())
        resp = await client.post("/api/v1/auth/logout")
        assert resp.status_code == 200
        assert resp.json()["message"] == "Logged out successfully"
        # Cookie should be deleted (set to empty or max_age=0)
        assert "refresh_token" in resp.headers.get("set-cookie", "")


class TestChangePassword:
    """PUT /api/v1/auth/password"""

    async def test_change_password_success(self, client, auth_headers):
        resp = await client.put(
            "/api/v1/auth/password",
            json={
                "current_password": "testpass123",
                "new_password": "newpass456",
            },
            headers=auth_headers,
        )
        assert resp.status_code == 200
        assert "changed" in resp.json()["message"].lower()

        # Verify can login with new password
        login_resp = await client.post(
            "/api/v1/auth/login",
            json={"username": "testuser", "password": "newpass456"},
        )
        assert login_resp.status_code == 200

    async def test_change_password_wrong_current(self, client, auth_headers):
        resp = await client.put(
            "/api/v1/auth/password",
            json={
                "current_password": "wrongpass",
                "new_password": "newpass456",
            },
            headers=auth_headers,
        )
        assert resp.status_code == 400
        assert "incorrect" in resp.json()["detail"].lower()

    async def test_change_password_same_password(self, client, auth_headers):
        resp = await client.put(
            "/api/v1/auth/password",
            json={
                "current_password": "testpass123",
                "new_password": "testpass123",
            },
            headers=auth_headers,
        )
        assert resp.status_code == 400
        assert "differ" in resp.json()["detail"].lower()
