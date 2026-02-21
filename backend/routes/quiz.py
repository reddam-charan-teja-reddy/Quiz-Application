"""Quiz CRUD routes."""

import logging
from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status

from db import db
from models import (
    QuizCreate,
    QuizUpdate,
    QuizListResponse,
    QuizSummary,
    QuizDetail,
    QuizDetailResponse,
    QuizCreateResponse,
    QuizUpdateResponse,
    QuizDeleteResponse,
    ErrorResponse,
)
from utils.auth import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/quizzes", tags=["quizzes"])


@router.get("", response_model=QuizListResponse)
async def list_quizzes(user: dict = Depends(get_current_user)):
    """Return all quizzes (answers stripped)."""
    cursor = db.quizzes.find({"is_deleted": {"$ne": True}})
    quizzes: list[QuizSummary] = []
    async for doc in cursor:
        quizzes.append(
            QuizSummary(
                id=str(doc["_id"]),
                title=doc["title"],
                description=doc.get("description", ""),
                author=doc.get("author", ""),
                author_id=doc.get("author_id", ""),
                num_questions=len(doc.get("questions", [])),
                categories=doc.get("categories", []),
                created_at=doc.get("created_at"),
                updated_at=doc.get("updated_at"),
            )
        )
    return QuizListResponse(quizzes=quizzes)


@router.post(
    "",
    response_model=QuizCreateResponse,
    status_code=status.HTTP_201_CREATED,
    responses={400: {"model": ErrorResponse}},
)
async def create_quiz(body: QuizCreate, user: dict = Depends(get_current_user)):
    """Create a new quiz."""
    now = datetime.now(timezone.utc)
    quiz_doc = {
        "title": body.title,
        "description": body.description,
        "author": user["username"],
        "author_id": user["id"],
        "categories": body.categories,
        "questions": [q.model_dump() for q in body.questions],
        "created_at": now,
        "updated_at": now,
        "is_deleted": False,
    }
    result = await db.quizzes.insert_one(quiz_doc)
    quiz_id = str(result.inserted_id)
    logger.info("Quiz created: %s by user %s", quiz_id, user["username"])
    return QuizCreateResponse(id=quiz_id)


@router.get(
    "/{quiz_id}",
    response_model=QuizDetailResponse,
    responses={404: {"model": ErrorResponse}},
)
async def get_quiz(quiz_id: str, user: dict = Depends(get_current_user)):
    """Get a single quiz by ID (full detail)."""
    try:
        doc = await db.quizzes.find_one({"_id": ObjectId(quiz_id), "is_deleted": {"$ne": True}})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid quiz ID format")

    if not doc:
        raise HTTPException(status_code=404, detail="Quiz not found")

    is_author = doc.get("author_id") == user["id"] or doc.get("author") == user["username"]

    quiz = QuizDetail(
        id=str(doc["_id"]),
        title=doc["title"],
        description=doc.get("description", ""),
        author=doc.get("author", ""),
        author_id=doc.get("author_id", ""),
        num_questions=len(doc.get("questions", [])),
        categories=doc.get("categories", []),
        questions=doc.get("questions", []),
        created_at=doc.get("created_at"),
        updated_at=doc.get("updated_at"),
    )

    return QuizDetailResponse(quiz=quiz, can_edit=is_author)


@router.put(
    "/{quiz_id}",
    response_model=QuizUpdateResponse,
    responses={403: {"model": ErrorResponse}, 404: {"model": ErrorResponse}},
)
async def update_quiz(quiz_id: str, body: QuizUpdate, user: dict = Depends(get_current_user)):
    """Update an existing quiz (owner only)."""
    try:
        doc = await db.quizzes.find_one({"_id": ObjectId(quiz_id), "is_deleted": {"$ne": True}})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid quiz ID format")

    if not doc:
        raise HTTPException(status_code=404, detail="Quiz not found")

    is_author = doc.get("author_id") == user["id"] or doc.get("author") == user["username"]
    if not is_author:
        raise HTTPException(status_code=403, detail="You can only edit quizzes you created")

    update_data = {
        "title": body.title,
        "description": body.description,
        "categories": body.categories,
        "questions": [q.model_dump() for q in body.questions],
        "updated_at": datetime.now(timezone.utc),
    }

    result = await db.quizzes.update_one(
        {"_id": ObjectId(quiz_id)},
        {"$set": update_data},
    )

    if result.modified_count > 0:
        logger.info("Quiz updated: %s by user %s", quiz_id, user["username"])
        return QuizUpdateResponse(message="Quiz updated successfully", success=True)
    return QuizUpdateResponse(message="No changes made to quiz", success=True)


@router.delete(
    "/{quiz_id}",
    response_model=QuizDeleteResponse,
    responses={403: {"model": ErrorResponse}, 404: {"model": ErrorResponse}},
)
async def delete_quiz(quiz_id: str, user: dict = Depends(get_current_user)):
    """Soft-delete a quiz (owner only)."""
    try:
        doc = await db.quizzes.find_one({"_id": ObjectId(quiz_id), "is_deleted": {"$ne": True}})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid quiz ID format")

    if not doc:
        raise HTTPException(status_code=404, detail="Quiz not found")

    is_author = doc.get("author_id") == user["id"] or doc.get("author") == user["username"]
    if not is_author:
        raise HTTPException(status_code=403, detail="You can only delete quizzes you created")

    await db.quizzes.update_one(
        {"_id": ObjectId(quiz_id)},
        {"$set": {"is_deleted": True, "updated_at": datetime.now(timezone.utc)}},
    )

    logger.info("Quiz soft-deleted: %s by user %s", quiz_id, user["username"])
    return QuizDeleteResponse()

