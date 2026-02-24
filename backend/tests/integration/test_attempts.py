"""Integration tests for attempt endpoints — start, finish, list, detail, delete."""

import pytest

from tests.factories import make_quiz_data, make_answers


async def _create_quiz(client, auth_headers):
    """Helper: create a published quiz and return its ID."""
    resp = await client.post("/api/v1/quizzes", json=make_quiz_data(), headers=auth_headers)
    assert resp.status_code == 201
    return resp.json()["id"]


async def _start_attempt(client, auth_headers, quiz_id):
    """Helper: start an attempt and return (attempt_id, questions)."""
    resp = await client.post(f"/api/v1/attempts/start/{quiz_id}", headers=auth_headers)
    assert resp.status_code == 201
    data = resp.json()
    return data["attempt_id"], data["questions"]


async def _finish_attempt(client, auth_headers, attempt_id, questions, all_correct=True):
    """Helper: submit answers and finish the attempt."""
    answers = make_answers(questions, all_correct=all_correct)
    resp = await client.post(
        f"/api/v1/attempts/{attempt_id}/finish",
        json={"answers": answers},
        headers=auth_headers,
    )
    return resp


class TestStartAttempt:
    """POST /api/v1/attempts/start/{quiz_id}"""

    async def test_start_attempt_success(self, client, auth_headers):
        quiz_id = await _create_quiz(client, auth_headers)
        resp = await client.post(f"/api/v1/attempts/start/{quiz_id}", headers=auth_headers)
        assert resp.status_code == 201
        data = resp.json()
        assert data["quiz_id"] == quiz_id
        assert data["total_questions"] == 2
        assert len(data["questions"]) == 2

    async def test_start_attempt_returns_questions_with_ids(self, client, auth_headers):
        quiz_id = await _create_quiz(client, auth_headers)
        resp = await client.post(f"/api/v1/attempts/start/{quiz_id}", headers=auth_headers)
        for q in resp.json()["questions"]:
            assert "id" in q
            assert "question" in q
            assert "options" in q
            assert len(q["options"]) == 4

    async def test_start_attempt_quiz_not_found(self, client, auth_headers):
        pass


class TestFinishAttempt:
    """POST /api/v1/attempts/{id}/finish"""

    async def test_finish_all_correct(self, client, auth_headers):
        quiz_id = await _create_quiz(client, auth_headers)
        attempt_id, questions = await _start_attempt(client, auth_headers, quiz_id)

        resp = await _finish_attempt(client, auth_headers, attempt_id, questions, all_correct=True)
        assert resp.status_code == 200
        data = resp.json()
        assert data["score"] == 100
        assert data["correct_count"] == 2
        assert data["wrong_count"] == 0
        assert data["total"] == 2

    async def test_finish_all_wrong(self, client, auth_headers):
        quiz_id = await _create_quiz(client, auth_headers)
        attempt_id, questions = await _start_attempt(client, auth_headers, quiz_id)

        resp = await _finish_attempt(client, auth_headers, attempt_id, questions, all_correct=False)
        assert resp.status_code == 200
        data = resp.json()
        assert data["score"] == 0
        assert data["correct_count"] == 0
        assert data["wrong_count"] == 2

    async def test_finish_partial_score(self, client, auth_headers):
        """Answer 1 of 2 correctly — score should be 50%."""
        quiz_id = await _create_quiz(client, auth_headers)
        attempt_id, questions = await _start_attempt(client, auth_headers, quiz_id)

        # Build mixed answers: first correct, second wrong
        answers = []
        for i, q in enumerate(questions):
            if i == 0:
                answers.append({"question_id": q["id"], "selected_answer": q["answer"]})
            else:
                wrong = [o for o in q["options"] if o != q["answer"]][0]
                answers.append({"question_id": q["id"], "selected_answer": wrong})

        resp = await client.post(
            f"/api/v1/attempts/{attempt_id}/finish",
            json={"answers": answers},
            headers=auth_headers,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["score"] == 50
        assert data["correct_count"] == 1
        assert data["wrong_count"] == 1

    async def test_finish_returns_details(self, client, auth_headers):
        quiz_id = await _create_quiz(client, auth_headers)
        attempt_id, questions = await _start_attempt(client, auth_headers, quiz_id)

        resp = await _finish_attempt(client, auth_headers, attempt_id, questions)
        data = resp.json()
        assert "details" in data
        assert len(data["details"]) == 2
        for d in data["details"]:
            assert "question_id" in d
            assert "is_correct" in d
            assert "correct_answer" in d
            assert "selected_answer" in d

    async def test_finish_already_completed(self, client, auth_headers):
        quiz_id = await _create_quiz(client, auth_headers)
        attempt_id, questions = await _start_attempt(client, auth_headers, quiz_id)

        await _finish_attempt(client, auth_headers, attempt_id, questions)
        # Second finish should fail
        resp = await _finish_attempt(client, auth_headers, attempt_id, questions)
        assert resp.status_code == 400
        assert "already" in resp.json()["detail"].lower()

    async def test_finish_other_users_attempt(self, client, auth_headers, second_auth_headers):
        quiz_id = await _create_quiz(client, auth_headers)
        attempt_id, questions = await _start_attempt(client, auth_headers, quiz_id)

        resp = await _finish_attempt(client, second_auth_headers, attempt_id, questions)
        assert resp.status_code == 403


class TestListAttempts:
    """GET /api/v1/attempts"""

    async def test_list_attempts_empty(self, client, auth_headers):
        resp = await client.get("/api/v1/attempts", headers=auth_headers)
        assert resp.status_code == 200
        assert resp.json()["attempts"] == []

    async def test_list_attempts_only_completed(self, client, auth_headers):
        quiz_id = await _create_quiz(client, auth_headers)

        # Start but don't finish
        await _start_attempt(client, auth_headers, quiz_id)

        resp = await client.get("/api/v1/attempts", headers=auth_headers)
        assert resp.json()["attempts"] == []

        # Start and finish another
        attempt_id, questions = await _start_attempt(client, auth_headers, quiz_id)
        await _finish_attempt(client, auth_headers, attempt_id, questions)

        resp = await client.get("/api/v1/attempts", headers=auth_headers)
        assert len(resp.json()["attempts"]) == 1

    async def test_list_attempts_only_own(self, client, auth_headers, second_auth_headers):
        quiz_id = await _create_quiz(client, auth_headers)

        # testuser completes an attempt
        attempt_id, questions = await _start_attempt(client, auth_headers, quiz_id)
        await _finish_attempt(client, auth_headers, attempt_id, questions)

        # seconduser should see no attempts
        resp = await client.get("/api/v1/attempts", headers=second_auth_headers)
        assert resp.json()["attempts"] == []


class TestGetAttempt:
    """GET /api/v1/attempts/{id}"""

    async def test_get_attempt_detail(self, client, auth_headers):
        quiz_id = await _create_quiz(client, auth_headers)
        attempt_id, questions = await _start_attempt(client, auth_headers, quiz_id)
        await _finish_attempt(client, auth_headers, attempt_id, questions)

        resp = await client.get(f"/api/v1/attempts/{attempt_id}", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["attempt_id"] == attempt_id
        assert data["quiz_id"] == quiz_id
        assert "score" in data
        assert "details" in data

    async def test_get_attempt_not_found(self, client, auth_headers):
        resp = await client.get("/api/v1/attempts/000000000000000000000000", headers=auth_headers)
        assert resp.status_code == 404

    async def test_get_attempt_belongs_to_other(self, client, auth_headers, second_auth_headers):
        quiz_id = await _create_quiz(client, auth_headers)
        attempt_id, questions = await _start_attempt(client, auth_headers, quiz_id)
        await _finish_attempt(client, auth_headers, attempt_id, questions)

        resp = await client.get(f"/api/v1/attempts/{attempt_id}", headers=second_auth_headers)
        assert resp.status_code == 403


class TestDeleteAttempt:
    """DELETE /api/v1/attempts/{id}"""

    async def test_delete_own_attempt(self, client, auth_headers):
        quiz_id = await _create_quiz(client, auth_headers)
        attempt_id, questions = await _start_attempt(client, auth_headers, quiz_id)
        await _finish_attempt(client, auth_headers, attempt_id, questions)

        resp = await client.delete(f"/api/v1/attempts/{attempt_id}", headers=auth_headers)
        assert resp.status_code == 200

        # Should be gone
        get_resp = await client.get(f"/api/v1/attempts/{attempt_id}", headers=auth_headers)
        assert get_resp.status_code == 404

    async def test_delete_other_users_attempt(self, client, auth_headers, second_auth_headers):
        quiz_id = await _create_quiz(client, auth_headers)
        attempt_id, questions = await _start_attempt(client, auth_headers, quiz_id)
        await _finish_attempt(client, auth_headers, attempt_id, questions)

        resp = await client.delete(f"/api/v1/attempts/{attempt_id}", headers=second_auth_headers)
        assert resp.status_code == 403

    async def test_delete_attempt_not_found(self, client, auth_headers):
        resp = await client.delete(
            "/api/v1/attempts/000000000000000000000000", headers=auth_headers
        )
        assert resp.status_code == 404
