"""Integration tests for profile, stats, and public profile endpoints."""

import pytest

from tests.factories import make_quiz_data, make_answers


async def _create_quiz(client, auth_headers):
    resp = await client.post("/api/v1/quizzes", json=make_quiz_data(), headers=auth_headers)
    return resp.json()["id"]


async def _complete_attempt(client, auth_headers, quiz_id, all_correct=True):
    start = await client.post(f"/api/v1/attempts/start/{quiz_id}", headers=auth_headers)
    data = start.json()
    answers = make_answers(data["questions"], all_correct=all_correct)
    await client.post(
        f"/api/v1/attempts/{data['attempt_id']}/finish",
        json={"answers": answers},
        headers=auth_headers,
    )


class TestGetProfile:
    """GET /api/v1/profile"""

    async def test_get_own_profile(self, client, auth_headers):
        resp = await client.get("/api/v1/profile", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["username"] == "testuser"
        assert "total_attempts" in data
        assert "average_score" in data
        assert "created_quizzes" in data

    async def test_get_profile_includes_created_quizzes(self, client, auth_headers):
        await _create_quiz(client, auth_headers)
        resp = await client.get("/api/v1/profile", headers=auth_headers)
        assert len(resp.json()["created_quizzes"]) == 1


class TestEditProfile:
    """PUT /api/v1/profile"""

    async def test_edit_display_name(self, client, auth_headers):
        resp = await client.put(
            "/api/v1/profile",
            json={"display_name": "Test User", "email": ""},
            headers=auth_headers,
        )
        assert resp.status_code == 200
        assert resp.json()["display_name"] == "Test User"

    async def test_edit_email(self, client, auth_headers):
        resp = await client.put(
            "/api/v1/profile",
            json={"display_name": "", "email": "test@example.com"},
            headers=auth_headers,
        )
        assert resp.status_code == 200
        assert resp.json()["email"] == "test@example.com"

    async def test_edit_profile_persists(self, client, auth_headers):
        await client.put(
            "/api/v1/profile",
            json={"display_name": "Persistent", "email": "p@test.com"},
            headers=auth_headers,
        )
        resp = await client.get("/api/v1/profile", headers=auth_headers)
        assert resp.json()["display_name"] == "Persistent"
        assert resp.json()["email"] == "p@test.com"


class TestDeleteAccount:
    """DELETE /api/v1/profile"""

    async def test_delete_account_success(self, client, auth_headers):
        resp = await client.request(
            "DELETE",
            "/api/v1/profile",
            json={"password": "testpass123", "keep_quizzes": True},
            headers=auth_headers,
        )
        assert resp.status_code == 200
        assert "deleted" in resp.json()["message"].lower()

    async def test_delete_account_wrong_password(self, client, auth_headers):
        resp = await client.request(
            "DELETE",
            "/api/v1/profile",
            json={"password": "wrongpass", "keep_quizzes": True},
            headers=auth_headers,
        )
        assert resp.status_code == 400
        assert "incorrect" in resp.json()["detail"].lower()

    async def test_delete_account_also_deletes_quizzes(self, client, auth_headers):
        quiz_id = await _create_quiz(client, auth_headers)

        await client.request(
            "DELETE",
            "/api/v1/profile",
            json={"password": "testpass123", "keep_quizzes": False},
            headers=auth_headers,
        )

        # Re-register to get new auth headers for querying
        reg = await client.post(
            "/api/v1/auth/register",
            json={"username": "checker", "password": "testpass123"},
        )
        new_headers = {"Authorization": f"Bearer {reg.json()['access_token']}"}

        # The quiz should be soft-deleted
        detail = await client.get(f"/api/v1/quizzes/{quiz_id}", headers=new_headers)
        assert detail.status_code == 404

    async def test_delete_account_keep_quizzes(self, client, auth_headers):
        quiz_id = await _create_quiz(client, auth_headers)

        await client.request(
            "DELETE",
            "/api/v1/profile",
            json={"password": "testpass123", "keep_quizzes": True},
            headers=auth_headers,
        )

        reg = await client.post(
            "/api/v1/auth/register",
            json={"username": "checker2", "password": "testpass123"},
        )
        new_headers = {"Authorization": f"Bearer {reg.json()['access_token']}"}

        # The quiz should still be accessible
        detail = await client.get(f"/api/v1/quizzes/{quiz_id}", headers=new_headers)
        assert detail.status_code == 200


class TestStats:
    """GET /api/v1/stats"""

    async def test_stats_empty(self, client, auth_headers):
        resp = await client.get("/api/v1/stats", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["total_attempts"] == 0
        assert data["total_quizzes_created"] == 0

    async def test_stats_with_data(self, client, auth_headers):
        quiz_id = await _create_quiz(client, auth_headers)
        await _complete_attempt(client, auth_headers, quiz_id, all_correct=True)

        resp = await client.get("/api/v1/stats", headers=auth_headers)
        data = resp.json()
        assert data["total_attempts"] == 1
        assert data["total_quizzes_created"] == 1
        assert data["average_score"] == 100.0
        assert data["best_score"] == 100

    async def test_stats_includes_recent_attempts(self, client, auth_headers):
        quiz_id = await _create_quiz(client, auth_headers)
        await _complete_attempt(client, auth_headers, quiz_id)

        resp = await client.get("/api/v1/stats", headers=auth_headers)
        assert len(resp.json()["recent_attempts"]) == 1


class TestPublicProfile:
    """GET /api/v1/user/{username}"""

    async def test_public_profile_exists(self, client, auth_headers):
        resp = await client.get("/api/v1/user/testuser")
        assert resp.status_code == 200
        data = resp.json()
        assert data["username"] == "testuser"
        assert "total_attempts" in data
        assert "created_quizzes" in data

    async def test_public_profile_not_found(self, client):
        resp = await client.get("/api/v1/user/nonexistent")
        assert resp.status_code == 404

    async def test_public_profile_shows_published_quizzes(self, client, auth_headers):
        await client.post(
            "/api/v1/quizzes",
            json=make_quiz_data(title="Published", is_published=True),
            headers=auth_headers,
        )
        await client.post(
            "/api/v1/quizzes",
            json=make_quiz_data(title="Draft", is_published=False),
            headers=auth_headers,
        )

        resp = await client.get("/api/v1/user/testuser")
        quizzes = resp.json()["created_quizzes"]
        # Only published quizzes visible on public profile
        assert len(quizzes) == 1
        assert quizzes[0]["title"] == "Published"

    async def test_public_profile_shows_stats(self, client, auth_headers):
        quiz_id = await _create_quiz(client, auth_headers)
        await _complete_attempt(client, auth_headers, quiz_id)

        resp = await client.get("/api/v1/user/testuser")
        data = resp.json()
        assert data["total_attempts"] == 1
        assert data["average_score"] == 100.0
