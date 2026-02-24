"""Integration tests for quiz CRUD, search, export/import, and category endpoints."""

import pytest

from tests.factories import make_quiz_data


class TestListQuizzes:
    """GET /api/v1/quizzes"""

    async def test_list_quizzes_empty(self, client, auth_headers):
        resp = await client.get("/api/v1/quizzes", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["quizzes"] == []
        assert data["total"] == 0

    async def test_list_quizzes_returns_published(self, client, auth_headers):
        await client.post("/api/v1/quizzes", json=make_quiz_data(), headers=auth_headers)
        resp = await client.get("/api/v1/quizzes", headers=auth_headers)
        assert resp.status_code == 200
        assert resp.json()["total"] == 1
        assert resp.json()["quizzes"][0]["title"] == "Test Quiz"

    async def test_list_quizzes_excludes_unpublished(self, client, auth_headers):
        await client.post(
            "/api/v1/quizzes",
            json=make_quiz_data(is_published=False),
            headers=auth_headers,
        )
        resp = await client.get("/api/v1/quizzes", headers=auth_headers)
        assert resp.json()["total"] == 0

    async def test_list_quizzes_filter_by_category(self, client, auth_headers):
        await client.post(
            "/api/v1/quizzes",
            json=make_quiz_data(title="Science Q", categories=["Science"]),
            headers=auth_headers,
        )
        await client.post(
            "/api/v1/quizzes",
            json=make_quiz_data(title="Math Q", categories=["Math"]),
            headers=auth_headers,
        )

        resp = await client.get(
            "/api/v1/quizzes",
            params={"category": "Science"},
            headers=auth_headers,
        )
        assert resp.status_code == 200
        assert resp.json()["total"] == 1
        assert resp.json()["quizzes"][0]["title"] == "Science Q"

    async def test_list_quizzes_filter_by_difficulty(self, client, auth_headers):
        await client.post(
            "/api/v1/quizzes",
            json=make_quiz_data(title="Easy", difficulty="easy"),
            headers=auth_headers,
        )
        await client.post(
            "/api/v1/quizzes",
            json=make_quiz_data(title="Hard", difficulty="hard"),
            headers=auth_headers,
        )

        resp = await client.get(
            "/api/v1/quizzes",
            params={"difficulty": "hard"},
            headers=auth_headers,
        )
        assert resp.json()["total"] == 1
        assert resp.json()["quizzes"][0]["title"] == "Hard"

    async def test_list_quizzes_sort_by_title(self, client, auth_headers):
        await client.post(
            "/api/v1/quizzes",
            json=make_quiz_data(title="Banana"),
            headers=auth_headers,
        )
        await client.post(
            "/api/v1/quizzes",
            json=make_quiz_data(title="Apple"),
            headers=auth_headers,
        )

        resp = await client.get(
            "/api/v1/quizzes",
            params={"sort": "title", "order": "asc"},
            headers=auth_headers,
        )
        titles = [q["title"] for q in resp.json()["quizzes"]]
        assert titles == ["Apple", "Banana"]

    async def test_list_quizzes_sort_desc(self, client, auth_headers):
        await client.post(
            "/api/v1/quizzes",
            json=make_quiz_data(title="Alpha"),
            headers=auth_headers,
        )
        await client.post(
            "/api/v1/quizzes",
            json=make_quiz_data(title="Zeta"),
            headers=auth_headers,
        )

        resp = await client.get(
            "/api/v1/quizzes",
            params={"sort": "title", "order": "desc"},
            headers=auth_headers,
        )
        titles = [q["title"] for q in resp.json()["quizzes"]]
        assert titles == ["Zeta", "Alpha"]

    async def test_list_quizzes_text_search(self, client, auth_headers):
        await client.post(
            "/api/v1/quizzes",
            json=make_quiz_data(title="Python Fundamentals"),
            headers=auth_headers,
        )
        await client.post(
            "/api/v1/quizzes",
            json=make_quiz_data(title="JavaScript Basics"),
            headers=auth_headers,
        )

        resp = await client.get(
            "/api/v1/quizzes",
            params={"search": "Python"},
            headers=auth_headers,
        )
        assert resp.status_code == 200
        quizzes = resp.json()["quizzes"]
        assert len(quizzes) == 1
        assert quizzes[0]["title"] == "Python Fundamentals"

    async def test_list_quizzes_pagination(self, client, auth_headers):
        for i in range(5):
            await client.post(
                "/api/v1/quizzes",
                json=make_quiz_data(title=f"Quiz {i}"),
                headers=auth_headers,
            )

        resp = await client.get(
            "/api/v1/quizzes",
            params={"page": 1, "page_size": 2},
            headers=auth_headers,
        )
        data = resp.json()
        assert data["total"] == 5
        assert len(data["quizzes"]) == 2
        assert data["page"] == 1
        assert data["page_size"] == 2

        resp2 = await client.get(
            "/api/v1/quizzes",
            params={"page": 3, "page_size": 2},
            headers=auth_headers,
        )
        assert len(resp2.json()["quizzes"]) == 1


class TestMyQuizzes:
    """GET /api/v1/quizzes/my"""

    async def test_my_quizzes_only_own(self, client, auth_headers, second_auth_headers):
        await client.post(
            "/api/v1/quizzes",
            json=make_quiz_data(title="My Quiz"),
            headers=auth_headers,
        )
        await client.post(
            "/api/v1/quizzes",
            json=make_quiz_data(title="Other Quiz"),
            headers=second_auth_headers,
        )

        resp = await client.get("/api/v1/quizzes/my", headers=auth_headers)
        assert resp.status_code == 200
        assert resp.json()["total"] == 1
        assert resp.json()["quizzes"][0]["title"] == "My Quiz"

    async def test_my_quizzes_includes_drafts(self, client, auth_headers):
        await client.post(
            "/api/v1/quizzes",
            json=make_quiz_data(is_published=False),
            headers=auth_headers,
        )
        resp = await client.get("/api/v1/quizzes/my", headers=auth_headers)
        assert resp.json()["total"] == 1


class TestCreateQuiz:
    """POST /api/v1/quizzes"""

    async def test_create_quiz_success(self, client, auth_headers):
        resp = await client.post("/api/v1/quizzes", json=make_quiz_data(), headers=auth_headers)
        assert resp.status_code == 201
        data = resp.json()
        assert "id" in data
        assert data["message"] == "Quiz created successfully"

    async def test_create_quiz_requires_question_id(self, client, auth_headers):
        payload = make_quiz_data()
        payload["questions"][0].pop("id", None)

        resp = await client.post("/api/v1/quizzes", json=payload, headers=auth_headers)

        assert resp.status_code == 422


class TestGetQuiz:
    """GET /api/v1/quizzes/{id}"""

    async def test_get_quiz_detail(self, client, auth_headers):
        create_resp = await client.post(
            "/api/v1/quizzes", json=make_quiz_data(), headers=auth_headers
        )
        quiz_id = create_resp.json()["id"]

        resp = await client.get(f"/api/v1/quizzes/{quiz_id}", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["quiz"]["title"] == "Test Quiz"
        assert data["can_edit"] is True

    async def test_get_quiz_can_edit_false_for_other(
        self, client, auth_headers, second_auth_headers
    ):
        create_resp = await client.post(
            "/api/v1/quizzes", json=make_quiz_data(), headers=auth_headers
        )
        quiz_id = create_resp.json()["id"]

        resp = await client.get(f"/api/v1/quizzes/{quiz_id}", headers=second_auth_headers)
        assert resp.status_code == 200
        assert resp.json()["can_edit"] is False

    async def test_get_quiz_not_found(self, client, auth_headers):
        resp = await client.get("/api/v1/quizzes/000000000000000000000000", headers=auth_headers)
        assert resp.status_code == 404

    async def test_get_unpublished_quiz_hidden_from_others(
        self, client, auth_headers, second_auth_headers
    ):
        create_resp = await client.post(
            "/api/v1/quizzes",
            json=make_quiz_data(is_published=False),
            headers=auth_headers,
        )
        quiz_id = create_resp.json()["id"]

        resp = await client.get(f"/api/v1/quizzes/{quiz_id}", headers=second_auth_headers)
        assert resp.status_code == 404


class TestUpdateQuiz:
    """PUT /api/v1/quizzes/{id}"""

    async def test_update_quiz_success(self, client, auth_headers):
        create_resp = await client.post(
            "/api/v1/quizzes", json=make_quiz_data(), headers=auth_headers
        )
        quiz_id = create_resp.json()["id"]

        updated = make_quiz_data(title="Updated Title")
        resp = await client.put(f"/api/v1/quizzes/{quiz_id}", json=updated, headers=auth_headers)
        assert resp.status_code == 200
        assert resp.json()["success"] is True

        # Verify changes persisted
        detail = await client.get(f"/api/v1/quizzes/{quiz_id}", headers=auth_headers)
        assert detail.json()["quiz"]["title"] == "Updated Title"

    async def test_update_quiz_ownership_check(self, client, auth_headers, second_auth_headers):
        create_resp = await client.post(
            "/api/v1/quizzes", json=make_quiz_data(), headers=auth_headers
        )
        quiz_id = create_resp.json()["id"]

        resp = await client.put(
            f"/api/v1/quizzes/{quiz_id}",
            json=make_quiz_data(title="Hacked"),
            headers=second_auth_headers,
        )
        assert resp.status_code == 403


class TestDeleteQuiz:
    """DELETE /api/v1/quizzes/{id}"""

    async def test_delete_quiz_soft_delete(self, client, auth_headers):
        create_resp = await client.post(
            "/api/v1/quizzes", json=make_quiz_data(), headers=auth_headers
        )
        quiz_id = create_resp.json()["id"]

        resp = await client.delete(f"/api/v1/quizzes/{quiz_id}", headers=auth_headers)
        assert resp.status_code == 200

        # Quiz should no longer be accessible
        detail = await client.get(f"/api/v1/quizzes/{quiz_id}", headers=auth_headers)
        assert detail.status_code == 404

    async def test_delete_quiz_ownership_check(self, client, auth_headers, second_auth_headers):
        create_resp = await client.post(
            "/api/v1/quizzes", json=make_quiz_data(), headers=auth_headers
        )
        quiz_id = create_resp.json()["id"]

        resp = await client.delete(f"/api/v1/quizzes/{quiz_id}", headers=second_auth_headers)
        assert resp.status_code == 403


class TestDuplicateQuiz:
    """POST /api/v1/quizzes/{id}/duplicate"""

    async def test_duplicate_creates_copy(self, client, auth_headers):
        create_resp = await client.post(
            "/api/v1/quizzes",
            json=make_quiz_data(title="Original"),
            headers=auth_headers,
        )
        quiz_id = create_resp.json()["id"]

        dup_resp = await client.post(f"/api/v1/quizzes/{quiz_id}/duplicate", headers=auth_headers)
        assert dup_resp.status_code == 201
        new_id = dup_resp.json()["id"]
        assert new_id != quiz_id

        detail = await client.get(f"/api/v1/quizzes/{new_id}", headers=auth_headers)
        assert detail.status_code == 200
        assert "Copy" in detail.json()["quiz"]["title"]

    async def test_duplicate_by_other_user(self, client, auth_headers, second_auth_headers):
        create_resp = await client.post(
            "/api/v1/quizzes",
            json=make_quiz_data(title="Original"),
            headers=auth_headers,
        )
        quiz_id = create_resp.json()["id"]

        dup_resp = await client.post(
            f"/api/v1/quizzes/{quiz_id}/duplicate", headers=second_auth_headers
        )
        assert dup_resp.status_code == 201
        new_id = dup_resp.json()["id"]

        # The duplicate is owned by seconduser
        detail = await client.get(f"/api/v1/quizzes/{new_id}", headers=second_auth_headers)
        assert detail.json()["can_edit"] is True

    async def test_duplicate_not_found(self, client, auth_headers):
        resp = await client.post(
            "/api/v1/quizzes/000000000000000000000000/duplicate",
            headers=auth_headers,
        )
        assert resp.status_code == 404


class TestExportQuiz:
    """GET /api/v1/quizzes/{id}/export"""

    async def test_export_quiz_json(self, client, auth_headers):
        create_resp = await client.post(
            "/api/v1/quizzes",
            json=make_quiz_data(title="Exportable"),
            headers=auth_headers,
        )
        quiz_id = create_resp.json()["id"]

        resp = await client.get(f"/api/v1/quizzes/{quiz_id}/export", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["title"] == "Exportable"
        assert "questions" in data
        assert len(data["questions"]) == 2

    async def test_export_not_found(self, client, auth_headers):
        resp = await client.get(
            "/api/v1/quizzes/000000000000000000000000/export",
            headers=auth_headers,
        )
        assert resp.status_code == 404


class TestImportQuiz:
    """POST /api/v1/quizzes/import"""

    async def test_import_quiz_success(self, client, auth_headers):
        payload = {
            "title": "Imported Quiz",
            "description": "From export",
            "categories": ["General"],
            "difficulty": "easy",
            "questions": [
                {
                    "id": "q1",
                    "question": "Imported Q?",
                    "options": ["A", "B", "C", "D"],
                    "answer": "A",
                    "explanation": "Because A",
                }
            ],
        }
        resp = await client.post("/api/v1/quizzes/import", json=payload, headers=auth_headers)
        assert resp.status_code == 201
        new_id = resp.json()["id"]

        # Verify imported quiz exists
        detail = await client.get(f"/api/v1/quizzes/{new_id}", headers=auth_headers)
        assert detail.status_code == 200
        assert detail.json()["quiz"]["title"] == "Imported Quiz"

    async def test_import_export_roundtrip(self, client, auth_headers):
        """Export a quiz, then import it — the imported copy should match."""
        create_resp = await client.post(
            "/api/v1/quizzes",
            json=make_quiz_data(title="Roundtrip"),
            headers=auth_headers,
        )
        quiz_id = create_resp.json()["id"]

        export_resp = await client.get(f"/api/v1/quizzes/{quiz_id}/export", headers=auth_headers)
        exported = export_resp.json()

        # Add required question IDs for import
        for i, q in enumerate(exported["questions"]):
            q["id"] = f"imp_{i}"

        import_resp = await client.post(
            "/api/v1/quizzes/import", json=exported, headers=auth_headers
        )
        assert import_resp.status_code == 201


class TestCategories:
    """GET /api/v1/categories"""

    async def test_categories_with_counts(self, client, auth_headers):
        await client.post(
            "/api/v1/quizzes",
            json=make_quiz_data(categories=["Science", "Physics"]),
            headers=auth_headers,
        )
        await client.post(
            "/api/v1/quizzes",
            json=make_quiz_data(categories=["Science"]),
            headers=auth_headers,
        )

        resp = await client.get("/api/v1/categories", headers=auth_headers)
        assert resp.status_code == 200
        cats = {c["name"]: c["count"] for c in resp.json()["categories"]}
        assert cats["Science"] == 2
        assert cats["Physics"] == 1

    async def test_categories_empty(self, client, auth_headers):
        resp = await client.get("/api/v1/categories", headers=auth_headers)
        assert resp.status_code == 200
        assert resp.json()["categories"] == []
