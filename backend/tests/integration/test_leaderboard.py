"""Integration tests for leaderboard endpoints — quiz and global."""

import pytest

from tests.factories import make_quiz_data, make_answers


async def _create_quiz(client, auth_headers):
    """Helper: create a published quiz and return its ID."""
    resp = await client.post("/api/v1/quizzes", json=make_quiz_data(), headers=auth_headers)
    return resp.json()["id"]


async def _complete_attempt(client, auth_headers, quiz_id, all_correct=True):
    """Helper: start and finish an attempt, return the result."""
    start = await client.post(f"/api/v1/attempts/start/{quiz_id}", headers=auth_headers)
    data = start.json()
    attempt_id = data["attempt_id"]
    questions = data["questions"]
    answers = make_answers(questions, all_correct=all_correct)

    finish = await client.post(
        f"/api/v1/attempts/{attempt_id}/finish",
        json={"answers": answers},
        headers=auth_headers,
    )
    return finish.json()


class TestQuizLeaderboard:
    """GET /api/v1/quizzes/{id}/leaderboard"""

    async def test_leaderboard_empty(self, client, auth_headers):
        quiz_id = await _create_quiz(client, auth_headers)
        resp = await client.get(f"/api/v1/quizzes/{quiz_id}/leaderboard")
        assert resp.status_code == 200
        data = resp.json()
        assert data["quiz_id"] == quiz_id
        assert data["entries"] == []

    async def test_leaderboard_with_entries(self, client, auth_headers, second_auth_headers):
        quiz_id = await _create_quiz(client, auth_headers)

        # testuser scores 100%
        await _complete_attempt(client, auth_headers, quiz_id, all_correct=True)
        # seconduser scores 0%
        await _complete_attempt(client, second_auth_headers, quiz_id, all_correct=False)

        resp = await client.get(f"/api/v1/quizzes/{quiz_id}/leaderboard")
        assert resp.status_code == 200
        entries = resp.json()["entries"]
        assert len(entries) == 2
        # Best score first
        assert entries[0]["score"] >= entries[1]["score"]

    async def test_leaderboard_quiz_not_found(self, client):
        resp = await client.get("/api/v1/quizzes/000000000000000000000000/leaderboard")
        assert resp.status_code == 404


class TestGlobalLeaderboard:
    """GET /api/v1/leaderboard"""

    async def test_global_leaderboard_empty(self, client):
        resp = await client.get("/api/v1/leaderboard")
        assert resp.status_code == 200
        assert resp.json()["entries"] == []

    async def test_global_leaderboard_with_entries(self, client, auth_headers, second_auth_headers):
        quiz_id = await _create_quiz(client, auth_headers)

        await _complete_attempt(client, auth_headers, quiz_id, all_correct=True)
        await _complete_attempt(client, second_auth_headers, quiz_id, all_correct=False)

        resp = await client.get("/api/v1/leaderboard")
        assert resp.status_code == 200
        entries = resp.json()["entries"]
        assert len(entries) == 2
        for entry in entries:
            assert "username" in entry
            assert "total_attempts" in entry
            assert "average_score" in entry
            assert "best_score" in entry

    async def test_global_leaderboard_ranked_by_avg(
        self, client, auth_headers, second_auth_headers
    ):
        quiz_id = await _create_quiz(client, auth_headers)

        # testuser: 100%
        await _complete_attempt(client, auth_headers, quiz_id, all_correct=True)
        # seconduser: 0%
        await _complete_attempt(client, second_auth_headers, quiz_id, all_correct=False)

        resp = await client.get("/api/v1/leaderboard")
        entries = resp.json()["entries"]
        assert entries[0]["average_score"] >= entries[1]["average_score"]
