"""
Gemini AI client — lazy-initialized to avoid crashing at import time.

Uses the unified google-genai SDK (replaces deprecated google-generativeai).
"""

import logging
from functools import lru_cache

from google import genai

from app.config import settings

logger = logging.getLogger(__name__)

MODEL_NAME = "gemini-2.5-flash-lite"


@lru_cache(maxsize=1)
def _get_client() -> genai.Client:
    """Return a configured Gemini client, initializing on first call."""
    if not settings.GEMINI_API_KEY:
        raise RuntimeError(
            "GEMINI_API_KEY is not set. Add it to your .env file."
        )
    client = genai.Client(api_key=settings.GEMINI_API_KEY)
    logger.info("Gemini client initialized (model=%s)", MODEL_NAME)
    return client


def get_client() -> genai.Client:
    """Public accessor for the Gemini client (lazy singleton)."""
    return _get_client()
