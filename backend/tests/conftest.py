"""Shared test fixtures for the QuizApp backend test suite."""

import asyncio
import os
from datetime import datetime, timezone
from urllib.parse import urlsplit

import pytest
from httpx import AsyncClient, ASGITransport

from app.config import Settings


def _assert_safe_test_target(mongo_uri: str, db_name: str) -> None:
    try:
        parsed = urlsplit(mongo_uri)
    except Exception as exc:
        raise RuntimeError(f"Invalid test Mongo URI: {mongo_uri!r}") from exc

    if parsed.scheme != "mongodb":
        raise RuntimeError(
            "Refusing to run tests with non-local Mongo scheme. "
            f"Expected 'mongodb://', got {parsed.scheme!r}."
        )

    netloc = parsed.netloc.rsplit("@", 1)[-1]
    hosts = [host_port.split(":", 1)[0].strip("[]").lower() for host_port in netloc.split(",")]
    allowed_hosts = {"localhost", "127.0.0.1", "mongodb"}
    is_local_uri = bool(hosts) and all(host in allowed_hosts for host in hosts)

    db = db_name.lower()
    is_test_db_name = "test" in db or db.startswith("e2e_") or db.endswith("_e2e")

    if not is_local_uri or not is_test_db_name:
        raise RuntimeError(
            "Refusing to run tests against an unsafe database target: "
            f"MONGO_URI={mongo_uri!r}, DB={db_name!r}. "
            "Use a local Mongo URI and a test-only DB name."
        )


@pytest.fixture(scope="session")
def event_loop():
    """Create a single event loop for the entire test session."""
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="session", autouse=True)
async def setup_test_db():
    """Connect to a test MongoDB database and clean up after all tests."""
    import app.db as db_module
    from app.main import app

    # Read dedicated test settings (never default to production variables)
    test_settings = Settings(
        MONGO_URI=os.environ.get("TEST_MONGO_URI", "mongodb://127.0.0.1:27017"),
        DB=os.environ.get("TEST_DB", "quiz_test"),
        JWT_SECRET=os.environ.get("TEST_JWT_SECRET", "test-secret-key"),
        ENVIRONMENT="testing",
    )

    _assert_safe_test_target(test_settings.MONGO_URI, test_settings.DB_NAME)

    # Patch settings globally
    import app.config as config

    original_settings = config.settings
    config.settings = test_settings

    # Also patch in modules that imported settings at module level
    import app.utils.auth as auth_utils

    auth_utils.settings = test_settings

    # Disable rate limiter during tests
    from app.limiter import limiter

    limiter.enabled = False

    # Connect to test DB
    await db_module.connect()

    # Patch route-level settings imported at module import time
    import app.routes.auth as routes_auth

    routes_auth.settings = test_settings

    yield db_module.db

    # Drop test database and disconnect
    db_name = os.environ.get("TEST_DB", "quiz_test")
    if db_module.client:
        await db_module.client.drop_database(db_name)
    await db_module.disconnect()
    config.settings = original_settings


@pytest.fixture(autouse=True)
async def clean_collections(setup_test_db):
    """Clear all collections before each test for isolation."""
    db = setup_test_db
    await db.users.delete_many({})
    await db.quizzes.delete_many({})
    await db.attempts.delete_many({})
    yield


@pytest.fixture
async def client():
    """Async HTTP client for testing FastAPI endpoints."""
    from app.main import app

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.fixture
async def auth_headers(client):
    """Register a test user and return auth headers."""
    resp = await client.post(
        "/api/v1/auth/register",
        json={
            "username": "testuser",
            "password": "testpass123",
        },
    )
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
async def second_auth_headers(client):
    """Register a second test user and return auth headers."""
    resp = await client.post(
        "/api/v1/auth/register",
        json={
            "username": "seconduser",
            "password": "testpass456",
        },
    )
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
