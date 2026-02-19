from fastapi import APIRouter, Depends, HTTPException

from models import UpdateHistoryRequest
from db import db
from utils.auth import get_current_user

router = APIRouter(prefix="/api", tags=["history"])


@router.post("/history")
async def update_history(req: UpdateHistoryRequest, user: dict = Depends(get_current_user)):
    """Record a quiz attempt in the user's history."""
    history_entry = {
        "quiz_id": req.quiz_id,
        "correct": [q.model_dump() for q in req.correct],
        "wrong": [q.model_dump() for q in req.wrong],
        "total": req.total,
        "score": req.score,
    }

    result = await db.users.update_one(
        {"_id": user["_id"]},
        {"$push": {"history": history_entry}},
    )

    if result.modified_count == 1:
        return {"status": "history updated successfully"}
    raise HTTPException(status_code=500, detail="Failed to update history")


@router.get("/history")
async def get_history(user: dict = Depends(get_current_user)):
    """Return the authenticated user's quiz history."""
    return {"history": user.get("history", [])}
