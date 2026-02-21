"""
Quiz attempt routes — server-side scoring, attempt history.

Replaces the old history routes that stored data inside the user document.
Attempts are now stored in a dedicated `attempts` collection with server-side
score calculation.
"""

import logging
from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status

from db import db
from models import (
    AttemptFinishRequest,
    AttemptStartResponse,
    AttemptResult,
    AttemptSummary,
    AttemptListResponse,
    ErrorResponse,
)
from utils.auth import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/attempts", tags=["attempts"])


# ── Start an attempt ─────────────────────────────────────────────────────────

@router.post(
    "/start/{quiz_id}",
    response_model=AttemptStartResponse,
    status_code=status.HTTP_201_CREATED,
    responses={404: {"model": ErrorResponse}},
)
async def start_attempt(quiz_id: str, user: dict = Depends(get_current_user)):
    """Begin a quiz attempt — creates an attempt record."""
    try:
        quiz = await db.quizzes.find_one({"_id": ObjectId(quiz_id), "is_deleted": {"$ne": True}})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid quiz ID format")

    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    attempt_doc = {
        "user_id": user["id"],
        "quiz_id": quiz_id,
        "quiz_title": quiz["title"],
        "answers": [],
        "score": 0,
        "total": len(quiz.get("questions", [])),
        "correct_count": 0,
        "status": "in_progress",
        "created_at": datetime.now(timezone.utc),
    }

    result = await db.attempts.insert_one(attempt_doc)
    attempt_id = str(result.inserted_id)
    logger.info("Attempt started: %s for quiz %s by user %s", attempt_id, quiz_id, user["username"])

    return AttemptStartResponse(
        attempt_id=attempt_id,
        quiz_id=quiz_id,
        total_questions=len(quiz.get("questions", [])),
    )


# ── Finish an attempt (submit all answers, server scores) ────────────────────

@router.post(
    "/{attempt_id}/finish",
    response_model=AttemptResult,
    responses={404: {"model": ErrorResponse}, 400: {"model": ErrorResponse}},
)
async def finish_attempt(
    attempt_id: str,
    body: AttemptFinishRequest,
    user: dict = Depends(get_current_user),
):
    """Submit answers and finish the attempt. Server calculates the score."""
    try:
        attempt = await db.attempts.find_one({"_id": ObjectId(attempt_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid attempt ID format")

    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")

    if attempt["user_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="This attempt does not belong to you")

    if attempt.get("status") == "completed":
        raise HTTPException(status_code=400, detail="This attempt has already been completed")

    # Fetch the quiz to get correct answers
    try:
        quiz = await db.quizzes.find_one({"_id": ObjectId(attempt["quiz_id"])})
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to load quiz for scoring")

    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz no longer exists")

    # Build answer lookup from quiz questions
    correct_answers: dict[str, str] = {}
    question_lookup: dict[str, dict] = {}
    for q in quiz.get("questions", []):
        correct_answers[q["id"]] = q["answer"]
        question_lookup[q["id"]] = q

    # Server-side scoring
    details: list[dict] = []
    correct_count = 0
    for submission in body.answers:
        expected = correct_answers.get(submission.question_id)
        is_correct = expected is not None and submission.selected_answer == expected
        if is_correct:
            correct_count += 1

        q_data = question_lookup.get(submission.question_id, {})
        details.append({
            "question_id": submission.question_id,
            "question": q_data.get("question", ""),
            "selected_answer": submission.selected_answer,
            "correct_answer": expected or "",
            "is_correct": is_correct,
        })

    total = len(quiz.get("questions", []))
    score = round((correct_count / total) * 100) if total > 0 else 0

    # Update the attempt document
    now = datetime.now(timezone.utc)
    await db.attempts.update_one(
        {"_id": ObjectId(attempt_id)},
        {
            "$set": {
                "answers": [a.model_dump() for a in body.answers],
                "details": details,
                "score": score,
                "total": total,
                "correct_count": correct_count,
                "status": "completed",
                "completed_at": now,
            }
        },
    )

    logger.info(
        "Attempt finished: %s — score %d/%d (%d%%) by user %s",
        attempt_id, correct_count, total, score, user["username"],
    )

    return AttemptResult(
        attempt_id=attempt_id,
        quiz_id=attempt["quiz_id"],
        quiz_title=attempt.get("quiz_title", ""),
        score=score,
        total=total,
        correct_count=correct_count,
        wrong_count=total - correct_count,
        details=details,
        created_at=attempt.get("created_at"),
    )


# ── List user's attempts (history) ──────────────────────────────────────────

@router.get("", response_model=AttemptListResponse)
async def list_attempts(user: dict = Depends(get_current_user)):
    """Return all completed attempts for the authenticated user (newest first)."""
    cursor = (
        db.attempts
        .find({"user_id": user["id"], "status": "completed"})
        .sort("created_at", -1)
    )

    attempts: list[AttemptSummary] = []
    async for doc in cursor:
        attempts.append(
            AttemptSummary(
                attempt_id=str(doc["_id"]),
                quiz_id=doc["quiz_id"],
                quiz_title=doc.get("quiz_title", ""),
                score=doc.get("score", 0),
                total=doc.get("total", 0),
                correct_count=doc.get("correct_count", 0),
                created_at=doc.get("created_at"),
            )
        )

    return AttemptListResponse(attempts=attempts)


# ── Get single attempt detail ────────────────────────────────────────────────

@router.get(
    "/{attempt_id}",
    response_model=AttemptResult,
    responses={404: {"model": ErrorResponse}},
)
async def get_attempt(attempt_id: str, user: dict = Depends(get_current_user)):
    """Return full detail for a single completed attempt."""
    try:
        doc = await db.attempts.find_one({"_id": ObjectId(attempt_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid attempt ID format")

    if not doc:
        raise HTTPException(status_code=404, detail="Attempt not found")

    if doc["user_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="This attempt does not belong to you")

    return AttemptResult(
        attempt_id=str(doc["_id"]),
        quiz_id=doc["quiz_id"],
        quiz_title=doc.get("quiz_title", ""),
        score=doc.get("score", 0),
        total=doc.get("total", 0),
        correct_count=doc.get("correct_count", 0),
        wrong_count=doc.get("total", 0) - doc.get("correct_count", 0),
        details=doc.get("details", []),
        created_at=doc.get("created_at"),
    )
