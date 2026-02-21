"""
Gemini AI client — lazy-initialized to avoid crashing at import time.
"""

import logging
from functools import lru_cache

import google.generativeai as genai

from config import settings

logger = logging.getLogger(__name__)


@lru_cache(maxsize=1)
def _get_model() -> genai.GenerativeModel:
    """Return a configured Gemini model, initializing on first call."""
    if not settings.GEMINI_API_KEY:
        raise RuntimeError(
            "GEMINI_API_KEY is not set. Add it to your .env file."
        )
    genai.configure(api_key=settings.GEMINI_API_KEY)
    logger.info("Gemini client initialized (model=gemini-2.5-flash)")
    return genai.GenerativeModel("gemini-2.5-flash")


def get_model() -> genai.GenerativeModel:
    """Public accessor for the Gemini model (lazy singleton)."""
    return _get_model()
