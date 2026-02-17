from fastapi import APIRouter
from bson import ObjectId

from models import Profile, UserProfileResponse, CreatedQuizInfo
from db import db
from utils.auth import verify_user

router = APIRouter(prefix="/api", tags=["profile"])


@router.post("/profile", response_model=UserProfileResponse)
async def get_profile(profile: Profile):
    """Retrieves a comprehensive user profile including attempt history and created quizzes."""
    user = await verify_user(profile.token, profile.username)
    print(f"Fetching profile for user '{profile.username}'.")

    # Get user's attempt history
    user_history = user.get("history", [])

    # Get the user's created quizzes
    created_quiz_ids = user.get("created_quizzes", [])
    created_quizzes_info = []

    if created_quiz_ids:
        object_ids = [ObjectId(id_str) for id_str in created_quiz_ids]
        quizzes_cursor = db.quizzes.find({"_id": {"$in": object_ids}})

        async for quiz in quizzes_cursor:
            created_quizzes_info.append(
                CreatedQuizInfo(
                    id=str(quiz["_id"]),
                    title=quiz["title"]
                )
            )

    return UserProfileResponse(
        username=user["username"],
        history=user_history,
        created_quizzes=created_quizzes_info
    )
