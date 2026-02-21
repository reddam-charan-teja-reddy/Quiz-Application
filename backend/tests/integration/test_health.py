"""Integration tests for the health check endpoint."""


class TestHealth:
    """GET /health"""

    async def test_health_check_ok(self, client):
        resp = await client.get("/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "ok"
        assert "version" in data
