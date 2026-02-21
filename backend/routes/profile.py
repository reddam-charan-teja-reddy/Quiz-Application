"""User profile routes."""

import logging

from fastapi import APIRouter, Depends

from db import db
from models import UserProfileResponse, CreatedQuizInfo
from utils.auth import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1", tags=["profile"])


@router.get("/profile", response_model=UserProfileResponse)
async def get_profile(user: dict = Depends(get_current_user)):
    """Return the authenticated user's profile with stats and created quizzes."""
    user_id = user["id"]

    # Fetch quizzes authored by this user (from quizzes collection, not user doc)
    cursor = db.quizzes.find(
        {"author_id": user_id, "is_deleted": {"$ne": True}},
        {"_id": 1, "title": 1},
    )
    created_quizzes: list[CreatedQuizInfo] = []
    async for doc in cursor:
        created_quizzes.append(
            CreatedQuizInfo(id=str(doc["_id"]), title=doc["title"])
        )

    # Aggregate attempt stats
    pipeline = [
        {"$match": {"user_id": user_id, "status": "completed"}},
        {
            "$group": {
                "_id": None,
                "total_attempts": {"$sum": 1},
                "average_score": {"$avg": "$score"},
            }
        },
    ]
    stats = await db.attempts.aggregate(pipeline).to_list(1)
    total_attempts = stats[0]["total_attempts"] if stats else 0
    average_score = round(stats[0]["average_score"], 1) if stats else 0.0

    return UserProfileResponse(
        username=user["username"],
        created_at=user.get("created_at"),
        total_attempts=total_attempts,
        average_score=average_score,
        created_quizzes=created_quizzes,
    )
