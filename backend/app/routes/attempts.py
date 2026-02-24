"""
Quiz attempt routes — server-side scoring, attempt history, leaderboards.

Attempts are stored in a dedicated `attempts` collection with server-side
score calculation. Questions and options are randomized at attempt start.
"""

import logging
import random
from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status

from app.db import db
from app.models import (
    AttemptFinishRequest,
    AttemptListResponse,
    AttemptResult,
    AttemptStartResponse,
    AttemptSummary,
    ErrorResponse,
    GlobalLeaderboardEntry,
    GlobalLeaderboardResponse,
    LeaderboardEntry,
    QuizLeaderboardResponse,
)
from app.utils.auth import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1", tags=["attempts"])


# ── Start an attempt ─────────────────────────────────────────────────────────


@router.post(
    "/attempts/start/{quiz_id}",
    response_model=AttemptStartResponse,
    status_code=status.HTTP_201_CREATED,
    responses={404: {"model": ErrorResponse}},
)
async def start_attempt(quiz_id: str, user: dict = Depends(get_current_user)):
    """Begin a quiz attempt — creates an attempt record with randomized order."""
    try:
        quiz = await db.quizzes.find_one({"_id": ObjectId(quiz_id), "is_deleted": {"$ne": True}})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid quiz ID format")

    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    # Randomize question order (#9) and option order (#10)
    questions = list(quiz.get("questions", []))
    random.shuffle(questions)
    for q in questions:
        correct_answer = q["answer"]
        options = list(q["options"])
        random.shuffle(options)
        q["options"] = options
        # answer field stays the same text value — it's matched by string
        q["answer"] = correct_answer

    attempt_doc = {
        "user_id": user["id"],
        "quiz_id": quiz_id,
        "quiz_title": quiz["title"],
        "questions": questions,  # Store the shuffled snapshot
        "answers": [],
        "score": 0,
        "total": len(questions),
        "correct_count": 0,
        "status": "in_progress",
        "created_at": datetime.now(timezone.utc),
    }

    result = await db.attempts.insert_one(attempt_doc)
    attempt_id = str(result.inserted_id)
    logger.info(
        "Attempt started: %s for quiz %s by user %s",
        attempt_id,
        quiz_id,
        user["username"],
    )

    return AttemptStartResponse(
        attempt_id=attempt_id,
        quiz_id=quiz_id,
        total_questions=len(questions),
        questions=[
            {
                "id": q["id"],
                "question": q["question"],
                "options": q["options"],
                "answer": q["answer"],
                "explanation": q.get("explanation", ""),
            }
            for q in questions
        ],
    )


# ── Finish an attempt (submit all answers, server scores) ────────────────────


@router.post(
    "/attempts/{attempt_id}/finish",
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

    # Use the shuffled questions snapshot stored in the attempt (not the quiz)
    attempt_questions = attempt.get("questions", [])
    correct_answers: dict[str, str] = {}
    question_lookup: dict[str, dict] = {}
    for q in attempt_questions:
        correct_answers[q["id"]] = q["answer"]
        question_lookup[q["id"]] = q

    # Fall back to quiz if attempt has no snapshot (old attempts)
    if not attempt_questions:
        try:
            quiz = await db.quizzes.find_one({"_id": ObjectId(attempt["quiz_id"])})
        except Exception:
            quiz = None
        if quiz:
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
        details.append(
            {
                "question_id": submission.question_id,
                "question": q_data.get("question", ""),
                "selected_answer": submission.selected_answer,
                "correct_answer": expected or "",
                "is_correct": is_correct,
                "explanation": q_data.get("explanation", ""),
            }
        )

    total = len(attempt_questions) or len(correct_answers)
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
        attempt_id,
        correct_count,
        total,
        score,
        user["username"],
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


@router.get("/attempts", response_model=AttemptListResponse)
async def list_attempts(user: dict = Depends(get_current_user)):
    """Return all completed attempts for the authenticated user (newest first)."""
    cursor = db.attempts.find({"user_id": user["id"], "status": "completed"}).sort("created_at", -1)

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
    "/attempts/{attempt_id}",
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


# ── Delete a single attempt ─────────────────────────────────────────────────


@router.delete(
    "/attempts/{attempt_id}",
    responses={404: {"model": ErrorResponse}},
)
async def delete_attempt(attempt_id: str, user: dict = Depends(get_current_user)):
    """Delete one of the user's own completed attempts."""
    try:
        doc = await db.attempts.find_one({"_id": ObjectId(attempt_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid attempt ID format")

    if not doc:
        raise HTTPException(status_code=404, detail="Attempt not found")

    if doc["user_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="This attempt does not belong to you")

    await db.attempts.delete_one({"_id": ObjectId(attempt_id)})
    logger.info("Attempt deleted: %s by user %s", attempt_id, user["username"])
    return {"message": "Attempt deleted successfully"}


# ── Quiz-specific leaderboard ────────────────────────────────────────────────


@router.get(
    "/quizzes/{quiz_id}/leaderboard",
    response_model=QuizLeaderboardResponse,
    responses={404: {"model": ErrorResponse}},
)
async def quiz_leaderboard(quiz_id: str):
    """Return the top scores for a specific quiz (best attempt per user)."""
    try:
        quiz = await db.quizzes.find_one({"_id": ObjectId(quiz_id), "is_deleted": {"$ne": True}})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid quiz ID format")

    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    pipeline = [
        {"$match": {"quiz_id": quiz_id, "status": "completed"}},
        {"$sort": {"score": -1, "created_at": 1}},
        {
            "$group": {
                "_id": "$user_id",
                "username": {"$first": "$username"},
                "score": {"$max": "$score"},
                "total": {"$first": "$total"},
                "correct_count": {"$first": "$correct_count"},
                "created_at": {"$first": "$created_at"},
            }
        },
        {"$sort": {"score": -1}},
        {"$limit": 50},
    ]

    entries: list[LeaderboardEntry] = []
    lb_cursor = await db.attempts.aggregate(pipeline)
    async for doc in lb_cursor:
        # username may not be stored in attempt; look up if missing
        username = doc.get("username") or ""
        if not username:
            user_doc = await db.users.find_one({"_id": ObjectId(doc["_id"])})
            username = user_doc["username"] if user_doc else "Unknown"
        entries.append(
            LeaderboardEntry(
                username=username,
                score=doc.get("score", 0),
                total=doc.get("total", 0),
                correct_count=doc.get("correct_count", 0),
                created_at=doc.get("created_at"),
            )
        )

    return QuizLeaderboardResponse(
        quiz_id=quiz_id,
        quiz_title=quiz.get("title", ""),
        entries=entries,
    )


# ── Global leaderboard ──────────────────────────────────────────────────────


@router.get(
    "/leaderboard",
    response_model=GlobalLeaderboardResponse,
)
async def global_leaderboard():
    """Return aggregate stats across all users ranked by average score."""
    pipeline = [
        {"$match": {"status": "completed"}},
        {
            "$group": {
                "_id": "$user_id",
                "total_attempts": {"$sum": 1},
                "average_score": {"$avg": "$score"},
                "best_score": {"$max": "$score"},
            }
        },
        {"$sort": {"average_score": -1}},
        {"$limit": 50},
    ]

    entries: list[GlobalLeaderboardEntry] = []
    gl_cursor = await db.attempts.aggregate(pipeline)
    async for doc in gl_cursor:
        user_doc = await db.users.find_one({"_id": ObjectId(doc["_id"])})
        username = user_doc["username"] if user_doc else "Unknown"
        entries.append(
            GlobalLeaderboardEntry(
                username=username,
                total_attempts=doc.get("total_attempts", 0),
                average_score=round(doc.get("average_score", 0), 1),
                best_score=doc.get("best_score", 0),
            )
        )

    return GlobalLeaderboardResponse(entries=entries)
