"""User profile routes — view, edit, delete account, stats, public profile."""

import logging
from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException

from app.db import db
from app.models import (
    AttemptSummary,
    CreatedQuizInfo,
    DeleteAccountRequest,
    EditProfileRequest,
    ErrorResponse,
    PublicProfileResponse,
    UserProfileResponse,
    UserStatsResponse,
)
from app.utils.auth import get_current_user, verify_password

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1", tags=["profile"])


# ── Helper: build quiz list ──────────────────────────────────────────────────


async def _created_quizzes(user_id: str) -> list[CreatedQuizInfo]:
    cursor = db.quizzes.find(
        {"author_id": user_id, "is_deleted": {"$ne": True}},
        {"_id": 1, "title": 1, "questions": 1, "difficulty": 1},
    )
    quizzes: list[CreatedQuizInfo] = []
    async for doc in cursor:
        quizzes.append(
            CreatedQuizInfo(
                id=str(doc["_id"]),
                title=doc["title"],
                num_questions=len(doc.get("questions", [])),
                difficulty=doc.get("difficulty"),
            )
        )
    return quizzes


# ── Helper: attempt stats ───────────────────────────────────────────────────


async def _attempt_stats(user_id: str) -> dict:
    pipeline = [
        {"$match": {"user_id": user_id, "status": "completed"}},
        {
            "$group": {
                "_id": None,
                "total_attempts": {"$sum": 1},
                "average_score": {"$avg": "$score"},
                "best_score": {"$max": "$score"},
            }
        },
    ]
    cursor = await db.attempts.aggregate(pipeline)
    stats = await cursor.to_list(1)
    if stats:
        return {
            "total_attempts": stats[0]["total_attempts"],
            "average_score": round(stats[0]["average_score"], 1),
            "best_score": stats[0].get("best_score", 0),
        }
    return {"total_attempts": 0, "average_score": 0.0, "best_score": 0}


# ── Get own profile ─────────────────────────────────────────────────────────


@router.get("/profile", response_model=UserProfileResponse)
async def get_profile(user: dict = Depends(get_current_user)):
    """Return the authenticated user's profile with stats and created quizzes."""
    user_id = user["id"]

    # Get fresh user doc for display_name / email
    user_doc = await db.users.find_one({"_id": ObjectId(user_id)})

    created_quizzes = await _created_quizzes(user_id)
    stats = await _attempt_stats(user_id)

    return UserProfileResponse(
        username=user["username"],
        display_name=user_doc.get("display_name", "") if user_doc else "",
        email=user_doc.get("email", "") if user_doc else "",
        created_at=user.get("created_at") or (user_doc.get("created_at") if user_doc else None),
        total_attempts=stats["total_attempts"],
        average_score=stats["average_score"],
        best_score=stats["best_score"],
        created_quizzes=created_quizzes,
    )


# ── Edit profile ────────────────────────────────────────────────────────────


@router.put(
    "/profile",
    response_model=UserProfileResponse,
    responses={400: {"model": ErrorResponse}},
)
async def edit_profile(
    body: EditProfileRequest,
    user: dict = Depends(get_current_user),
):
    """Update display name and/or email."""
    user_id = user["id"]
    update_fields: dict = {"updated_at": datetime.now(timezone.utc)}

    if body.display_name is not None:
        update_fields["display_name"] = body.display_name.strip()
    if body.email is not None:
        update_fields["email"] = body.email.strip()

    await db.users.update_one({"_id": ObjectId(user_id)}, {"$set": update_fields})
    logger.info("Profile updated for user %s", user["username"])

    # Return updated profile
    return await get_profile(user)


# ── Delete account ──────────────────────────────────────────────────────────


@router.delete(
    "/profile",
    responses={400: {"model": ErrorResponse}},
)
async def delete_account(
    body: DeleteAccountRequest,
    user: dict = Depends(get_current_user),
):
    """Soft-delete the user account. Optionally keep or delete owned quizzes."""
    user_id = user["id"]

    # Verify password
    user_doc = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")

    if not verify_password(body.password, user_doc.get("password_hash", "")):
        raise HTTPException(status_code=400, detail="Incorrect password")

    now = datetime.now(timezone.utc)

    # Soft-delete user
    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"is_deleted": True, "deleted_at": now, "updated_at": now}},
    )

    # Handle quizzes
    if not body.keep_quizzes:
        await db.quizzes.update_many(
            {"author_id": user_id},
            {"$set": {"is_deleted": True, "deleted_at": now}},
        )

    logger.info(
        "Account deleted (soft): %s — keep_quizzes=%s",
        user["username"],
        body.keep_quizzes,
    )
    return {"message": "Account deleted successfully"}


# ── User stats dashboard ────────────────────────────────────────────────────


@router.get("/stats", response_model=UserStatsResponse)
async def get_stats(user: dict = Depends(get_current_user)):
    """Return detailed statistics for the authenticated user."""
    user_id = user["id"]
    stats = await _attempt_stats(user_id)

    # Count created quizzes
    total_quizzes_created = await db.quizzes.count_documents(
        {"author_id": user_id, "is_deleted": {"$ne": True}}
    )

    # Category breakdown
    cat_pipeline = [
        {"$match": {"user_id": user_id, "status": "completed"}},
        {
            "$lookup": {
                "from": "quizzes",
                "let": {"qid": {"$toObjectId": "$quiz_id"}},
                "pipeline": [
                    {"$match": {"$expr": {"$eq": ["$_id", "$$qid"]}}},
                    {"$project": {"categories": 1}},
                ],
                "as": "quiz_info",
            }
        },
        {"$unwind": {"path": "$quiz_info", "preserveNullAndEmptyArrays": True}},
        {
            "$unwind": {
                "path": "$quiz_info.categories",
                "preserveNullAndEmptyArrays": True,
            }
        },
        {
            "$group": {
                "_id": {"$ifNull": ["$quiz_info.categories", "Uncategorized"]},
                "attempts": {"$sum": 1},
                "average_score": {"$avg": "$score"},
            }
        },
        {"$sort": {"attempts": -1}},
    ]
    category_breakdown = []
    cat_cursor = await db.attempts.aggregate(cat_pipeline)
    async for doc in cat_cursor:
        category_breakdown.append(
            {
                "category": doc["_id"],
                "attempts": doc["attempts"],
                "average_score": round(doc["average_score"], 1),
            }
        )

    # Recent attempts (last 10)
    recent_cursor = (
        db.attempts.find({"user_id": user_id, "status": "completed"})
        .sort("created_at", -1)
        .limit(10)
    )
    recent_attempts: list[AttemptSummary] = []
    async for doc in recent_cursor:
        recent_attempts.append(
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

    # Score distribution (buckets: 0-20, 21-40, 41-60, 61-80, 81-100)
    dist_pipeline = [
        {"$match": {"user_id": user_id, "status": "completed"}},
        {
            "$bucket": {
                "groupBy": "$score",
                "boundaries": [0, 21, 41, 61, 81, 101],
                "default": "other",
                "output": {"count": {"$sum": 1}},
            }
        },
    ]
    score_distribution = []
    bucket_labels = {
        0: "0-20",
        21: "21-40",
        41: "41-60",
        61: "61-80",
        81: "81-100",
    }
    dist_cursor = await db.attempts.aggregate(dist_pipeline)
    async for doc in dist_cursor:
        label = bucket_labels.get(doc["_id"], str(doc["_id"]))
        score_distribution.append({"range": label, "count": doc["count"]})

    return UserStatsResponse(
        total_attempts=stats["total_attempts"],
        average_score=stats["average_score"],
        best_score=stats["best_score"],
        total_quizzes_created=total_quizzes_created,
        category_breakdown=category_breakdown,
        recent_attempts=recent_attempts,
        score_distribution=score_distribution,
    )


# ── Public profile ──────────────────────────────────────────────────────────


@router.get(
    "/user/{username}",
    response_model=PublicProfileResponse,
    responses={404: {"model": ErrorResponse}},
)
async def get_public_profile(username: str):
    """Return public profile for a given username."""
    user = await db.users.find_one({"username": username, "is_deleted": {"$ne": True}})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user_id = str(user["_id"])

    # Only published quizzes for public view
    cursor = db.quizzes.find(
        {
            "author_id": user_id,
            "is_deleted": {"$ne": True},
            "is_published": {"$ne": False},
        },
        {"_id": 1, "title": 1, "questions": 1, "difficulty": 1},
    )
    created_quizzes: list[CreatedQuizInfo] = []
    async for doc in cursor:
        created_quizzes.append(
            CreatedQuizInfo(
                id=str(doc["_id"]),
                title=doc["title"],
                num_questions=len(doc.get("questions", [])),
                difficulty=doc.get("difficulty"),
            )
        )

    stats = await _attempt_stats(user_id)

    return PublicProfileResponse(
        username=user["username"],
        display_name=user.get("display_name", ""),
        total_attempts=stats["total_attempts"],
        average_score=stats["average_score"],
        created_quizzes=created_quizzes,
        member_since=user.get("created_at"),
    )
