"""
Database connection, indexes, and lifespan management.
"""

import logging
from contextlib import asynccontextmanager
from urllib.parse import urlsplit

from pymongo import (
    ASCENDING,
    TEXT,
    AsyncMongoClient,
    IndexModel,
    ReadPreference,
    WriteConcern,
)

from app.config import settings

logger = logging.getLogger(__name__)


def _is_local_mongo_uri(uri: str) -> bool:
    try:
        parsed = urlsplit(uri)
    except Exception:
        return False

    if parsed.scheme != "mongodb":
        return False

    netloc = parsed.netloc.rsplit("@", 1)[-1]
    if not netloc:
        return False

    allowed_hosts = {"localhost", "127.0.0.1", "mongodb"}
    hosts = [host_port.split(":", 1)[0].strip("[]").lower() for host_port in netloc.split(",")]
    return bool(hosts) and all(host in allowed_hosts for host in hosts)


def _assert_safe_test_database_target() -> None:
    environment = settings.ENVIRONMENT.lower()
    if environment not in {"test", "testing"}:
        return

    db_name = settings.DB_NAME.lower()
    is_test_db_name = "test" in db_name or db_name.startswith("e2e_") or db_name.endswith("_e2e")
    is_local_uri = _is_local_mongo_uri(settings.MONGO_URI)

    if not is_test_db_name or not is_local_uri:
        raise RuntimeError(
            "Unsafe testing database target detected. "
            f"ENVIRONMENT={settings.ENVIRONMENT!r}, DB={settings.DB_NAME!r}, "
            f"MONGO_URI={settings.MONGO_URI!r}. "
            "Use a local Mongo URI and a test-only DB name (e.g. quiz_test / quiz_e2e_test)."
        )


class DatabaseProxy:
    def __init__(self):
        self._db = None

    def bind(self, database):
        self._db = database

    def unbind(self):
        self._db = None

    def __getattr__(self, name):
        if self._db is None:
            raise RuntimeError("Database is not connected")
        return getattr(self._db, name)


# ── Connection (lazy — created at startup via lifespan) ──────────────────────
client: AsyncMongoClient | None = None
db = DatabaseProxy()


async def _create_indexes() -> None:
    """Create all required indexes (idempotent — safe to call on every startup)."""
    # ── Users ──
    await db.users.create_indexes(
        [
            IndexModel([("username", ASCENDING)], unique=True),
        ]
    )
    logger.info("Users indexes ensured")

    # ── Quizzes ──
    await db.quizzes.create_indexes(
        [
            IndexModel([("author_id", ASCENDING)]),
            IndexModel([("author", ASCENDING)]),
            IndexModel([("title", TEXT), ("description", TEXT)]),
            IndexModel([("created_at", ASCENDING)]),
            IndexModel([("is_deleted", ASCENDING)]),
            IndexModel([("category", ASCENDING)]),
            IndexModel([("difficulty", ASCENDING)]),
            IndexModel([("is_published", ASCENDING)]),
        ]
    )
    logger.info("Quizzes indexes ensured")

    # ── Attempts ──
    await db.attempts.create_indexes(
        [
            IndexModel([("user_id", ASCENDING), ("created_at", ASCENDING)]),
            IndexModel([("quiz_id", ASCENDING)]),
            IndexModel([("user_id", ASCENDING), ("quiz_id", ASCENDING)]),
            IndexModel([("status", ASCENDING)]),
            IndexModel(
                [
                    ("quiz_id", ASCENDING),
                    ("status", ASCENDING),
                    ("score", ASCENDING),
                ]
            ),
        ]
    )
    logger.info("Attempts indexes ensured")


async def connect() -> None:
    """Connect to MongoDB and ensure indexes exist."""
    global client

    _assert_safe_test_database_target()

    client = AsyncMongoClient(
        settings.MONGO_URI,
        minPoolSize=settings.MONGO_MIN_POOL_SIZE,
        maxPoolSize=settings.MONGO_MAX_POOL_SIZE,
    )

    raw_db = client.get_database(settings.DB_NAME)
    # Apply majority write concern + primary read preference
    db.bind(
        raw_db.with_options(
            write_concern=WriteConcern(w="majority"),
            read_preference=ReadPreference.PRIMARY,
        )
    )

    # Verify connection
    await client.admin.command("ping")
    logger.info(
        "Connected to MongoDB at %s / db=%s",
        settings.MONGO_URI,
        settings.DB_NAME,
    )

    # Indexes (idempotent)
    await _create_indexes()


async def disconnect() -> None:
    """Close the MongoDB connection."""
    global client
    if client:
        await client.aclose()
        client = None
        db.unbind()
        logger.info("Disconnected from MongoDB")


@asynccontextmanager
async def lifespan(app):
    """FastAPI lifespan — manages DB connection."""
    await connect()
    yield
    await disconnect()
