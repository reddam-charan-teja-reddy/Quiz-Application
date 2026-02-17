from fastapi import APIRouter, HTTPException
from bson import ObjectId

from models import Profile, UpdateHistoryRequest
from db import db
from utils.auth import verify_user

router = APIRouter(prefix="/api", tags=["history"])


@router.post("/updateHistory")
async def update_history(req: UpdateHistoryRequest):
    """Updates the user's profile with quiz attempt history."""
    user = await verify_user(req.token, req.username)
    print(f"Update history request for user {req.username}, quiz {req.quiz_id}.")

    history_entry = {
        "quiz_id": req.quiz_id,
        "correct": [q.model_dump() for q in req.correct],
        "wrong": [q.model_dump() for q in req.wrong],
        "total": req.total,
        "score": req.score
    }

    update_result = await db.users.update_one(
        {"_id": ObjectId(req.token)},
        {"$push": {"history": history_entry}}
    )

    if update_result.modified_count == 1:
        print(f"Successfully updated history for user {req.username}.")
        return {"status": "history updated successfully"}
    else:
        print(f"Failed to update history for user {req.username}.")
        raise HTTPException(status_code=500, detail="Failed to update history")


@router.post("/history")
async def get_history(profile: Profile):
    """Retrieves the user's quiz attempt history."""
    user = await verify_user(profile.token, profile.username)

    history = user.get("history", [])
    print(f"Returning history for user {profile.username}, total entries: {len(history)}.")
    return {"history": history}
