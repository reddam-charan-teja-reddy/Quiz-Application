"""AI quiz generation route using Gemini."""

import json
import logging

from fastapi import APIRouter, Depends, HTTPException, Request
from google.genai import types
from pydantic import ValidationError

from app.gemini_client import MODEL_NAME, get_client
from app.limiter import limiter
from app.models import (
    ErrorResponse,
    GenerateRequest,
    GenerateResponse,
    QuizDetail,
)
from app.utils.auth import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1", tags=["generate"])

# Manually defined JSON schema for the AI response to ensure compatibility.
QUIZ_SCHEMA = {
    "type": "object",
    "properties": {
        "id": {
            "type": "string",
            "description": "Will be ignored — backend assigns the real ID.",
        },
        "title": {"type": "string"},
        "description": {"type": "string"},
        "author": {"type": "string"},
        "num_questions": {"type": "integer"},
        "categories": {
            "type": "array",
            "items": {"type": "string"},
        },
        "questions": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "id": {"type": "string"},
                    "question": {"type": "string"},
                    "options": {
                        "type": "array",
                        "items": {"type": "string"},
                    },
                    "answer": {"type": "string"},
                },
                "required": ["id", "question", "options", "answer"],
            },
        },
    },
    "required": [
        "title",
        "description",
        "author",
        "num_questions",
        "categories",
        "questions",
    ],
}


@router.post(
    "/generate",
    response_model=GenerateResponse,
    responses={500: {"model": ErrorResponse}},
)
@limiter.limit("5/minute")
async def generate_quiz(
    request: Request,
    req: GenerateRequest,
    user: dict = Depends(get_current_user),
):
    """Generate a quiz using the Gemini API with structured JSON output."""
    prompt = f"""
    You are a helpful assistant who is an expert in creating educational material.
    Your task is to generate a complete, high-quality quiz based on the User
    Request: "{req.prompt}".

    Please make the questions clear and engaging. The difficulty should be appropriate
    based on the request provided. Ensure the provided answers are factually correct.
    For the 'author' field, please set it to "AI Assistant".
    """

    try:
        logger.info(
            "Generating quiz for topic '%s' (user=%s)",
            req.prompt,
            user["username"],
        )

        client = get_client()

        # Use the new google-genai async API (no asyncio.to_thread needed)
        response = await client.aio.models.generate_content(
            model=MODEL_NAME,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_json_schema=QUIZ_SCHEMA,
            ),
        )

        raw_text = response.text
        if not raw_text:
            logger.error("Gemini returned empty response")
            raise HTTPException(
                status_code=500,
                detail="AI returned an empty response. Please try again.",
            )

        quiz_data = json.loads(raw_text)

        # Map into QuizDetail (id/author_id will be placeholders — frontend discards them)
        quiz = QuizDetail(
            id="generated",
            title=quiz_data.get("title", ""),
            description=quiz_data.get("description", ""),
            author=quiz_data.get("author", "AI Assistant"),
            author_id="",
            num_questions=len(quiz_data.get("questions", [])),
            categories=quiz_data.get("categories", []),
            questions=quiz_data.get("questions", []),
        )

        logger.info(
            "Quiz generated successfully: '%s' (%d questions)",
            quiz.title,
            quiz.num_questions,
        )
        return GenerateResponse(quiz=quiz)

    except json.JSONDecodeError as e:
        logger.error("Failed to decode AI JSON response: %s", e)
        raise HTTPException(
            status_code=500,
            detail="The AI returned an invalid data structure. Please try again.",
        )
    except ValidationError as e:
        logger.error("AI response failed Pydantic validation: %s", e)
        raise HTTPException(
            status_code=500,
            detail="The AI returned data that doesn't match the expected quiz format.",
        )
    except RuntimeError as e:
        # Gemini API key not configured
        logger.error("Gemini client error: %s", e)
        raise HTTPException(status_code=503, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Unexpected error during quiz generation: %s", e)
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred while generating the quiz.",
        )
