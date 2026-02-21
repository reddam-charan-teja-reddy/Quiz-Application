"""Integration tests for auth guards — protected endpoints must return 401 without credentials."""

import pytest

from tests.factories import make_quiz_data


class TestAuthGuards:
    """Verify that all protected endpoints reject unauthenticated requests."""

    async def test_get_quizzes_requires_auth(self, client):
        resp = await client.get("/api/v1/quizzes")
        assert resp.status_code == 401

    async def test_post_quizzes_requires_auth(self, client):
        resp = await client.post("/api/v1/quizzes", json=make_quiz_data())
        assert resp.status_code == 401

    async def test_get_my_quizzes_requires_auth(self, client):
        resp = await client.get("/api/v1/quizzes/my")
        assert resp.status_code == 401

    async def test_get_profile_requires_auth(self, client):
        resp = await client.get("/api/v1/profile")
        assert resp.status_code == 401

    async def test_put_profile_requires_auth(self, client):
        resp = await client.put(
            "/api/v1/profile",
            json={"display_name": "Hacker", "email": ""},
        )
        assert resp.status_code == 401

    async def test_delete_profile_requires_auth(self, client):
        resp = await client.request(
            "DELETE",
            "/api/v1/profile",
            json={"password": "whatever", "keep_quizzes": True},
        )
        assert resp.status_code == 401

    async def test_get_stats_requires_auth(self, client):
        resp = await client.get("/api/v1/stats")
        assert resp.status_code == 401

    async def test_get_attempts_requires_auth(self, client):
        resp = await client.get("/api/v1/attempts")
        assert resp.status_code == 401

    async def test_post_generate_requires_auth(self, client):
        resp = await client.post(
            "/api/v1/generate", json={"prompt": "Make a quiz about cats"}
        )
        assert resp.status_code == 401

    async def test_start_attempt_requires_auth(self, client):
        resp = await client.post(
            "/api/v1/attempts/start/000000000000000000000000"
        )
        assert resp.status_code == 401

    async def test_get_categories_requires_auth(self, client):
        resp = await client.get("/api/v1/categories")
        assert resp.status_code == 401

    async def test_change_password_requires_auth(self, client):
        resp = await client.put(
            "/api/v1/auth/password",
            json={"current_password": "x", "new_password": "y12345"},
        )
        assert resp.status_code == 401

    async def test_put_quiz_requires_auth(self, client):
        resp = await client.put(
            "/api/v1/quizzes/000000000000000000000000",
            json=make_quiz_data(),
        )
        assert resp.status_code == 401

    async def test_delete_quiz_requires_auth(self, client):
        resp = await client.delete("/api/v1/quizzes/000000000000000000000000")
        assert resp.status_code == 401

    async def test_duplicate_quiz_requires_auth(self, client):
        resp = await client.post(
            "/api/v1/quizzes/000000000000000000000000/duplicate"
        )
        assert resp.status_code == 401

    async def test_export_quiz_requires_auth(self, client):
        resp = await client.get(
            "/api/v1/quizzes/000000000000000000000000/export"
        )
        assert resp.status_code == 401

    async def test_import_quiz_requires_auth(self, client):
        resp = await client.post(
            "/api/v1/quizzes/import", json=make_quiz_data()
        )
        assert resp.status_code == 401

    async def test_finish_attempt_requires_auth(self, client):
        resp = await client.post(
            "/api/v1/attempts/000000000000000000000000/finish",
            json={"answers": []},
        )
        assert resp.status_code == 401

    async def test_get_attempt_requires_auth(self, client):
        resp = await client.get(
            "/api/v1/attempts/000000000000000000000000"
        )
        assert resp.status_code == 401

    async def test_delete_attempt_requires_auth(self, client):
        resp = await client.delete(
            "/api/v1/attempts/000000000000000000000000"
        )
        assert resp.status_code == 401
