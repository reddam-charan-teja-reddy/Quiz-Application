from fastapi import APIRouter, Depends
from bson import ObjectId

from models import UserProfileResponse, CreatedQuizInfo
from db import db
from utils.auth import get_current_user

router = APIRouter(prefix="/api", tags=["profile"])


@router.get("/profile", response_model=UserProfileResponse)
async def get_profile(user: dict = Depends(get_current_user)):
    """Return the authenticated user's profile with history and created quizzes."""
    user_history = user.get("history", [])
    created_quiz_ids = user.get("created_quizzes", [])
    created_quizzes_info = []

    if created_quiz_ids:
        object_ids = [ObjectId(id_str) for id_str in created_quiz_ids]
        quizzes_cursor = db.quizzes.find({"_id": {"$in": object_ids}})
        async for quiz in quizzes_cursor:
            created_quizzes_info.append(
                CreatedQuizInfo(id=str(quiz["_id"]), title=quiz["title"])
            )

    return UserProfileResponse(
        username=user["username"],
        history=user_history,
        created_quizzes=created_quizzes_info,
    )
