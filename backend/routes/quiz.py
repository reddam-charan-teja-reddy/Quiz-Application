"""Quiz CRUD routes — search, sort, paginate, duplicate, export/import, categories."""

import logging
import uuid
from datetime import datetime, timezone
from typing import Literal

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query, status

from db import db
from models import (
    QuizCreate,
    QuizUpdate,
    QuizImportRequest,
    QuizListResponse,
    QuizSummary,
    QuizDetail,
    QuizDetailResponse,
    QuizCreateResponse,
    QuizUpdateResponse,
    QuizDeleteResponse,
    CategoryInfo,
    CategoryListResponse,
    ErrorResponse,
)
from utils.auth import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1", tags=["quizzes"])


# ── Helpers ──────────────────────────────────────────────────────────────────

def _doc_to_summary(doc: dict) -> QuizSummary:
    return QuizSummary(
        id=str(doc["_id"]),
        title=doc["title"],
        description=doc.get("description", ""),
        author=doc.get("author", ""),
        author_id=doc.get("author_id", ""),
        num_questions=len(doc.get("questions", [])),
        categories=doc.get("categories", []),
        difficulty=doc.get("difficulty"),
        time_limit_minutes=doc.get("time_limit_minutes"),
        time_per_question_seconds=doc.get("time_per_question_seconds"),
        is_published=doc.get("is_published", True),
        created_at=doc.get("created_at"),
        updated_at=doc.get("updated_at"),
    )


def _doc_to_detail(doc: dict) -> QuizDetail:
    return QuizDetail(
        id=str(doc["_id"]),
        title=doc["title"],
        description=doc.get("description", ""),
        author=doc.get("author", ""),
        author_id=doc.get("author_id", ""),
        num_questions=len(doc.get("questions", [])),
        categories=doc.get("categories", []),
        difficulty=doc.get("difficulty"),
        time_limit_minutes=doc.get("time_limit_minutes"),
        time_per_question_seconds=doc.get("time_per_question_seconds"),
        is_published=doc.get("is_published", True),
        questions=doc.get("questions", []),
        created_at=doc.get("created_at"),
        updated_at=doc.get("updated_at"),
    )


# ── List Quizzes (search / sort / paginate / filter) ─────────────────────────

@router.get("/quizzes", response_model=QuizListResponse)
async def list_quizzes(
    user: dict = Depends(get_current_user),
    search: str = Query(default="", max_length=200),
    category: str = Query(default=""),
    difficulty: str = Query(default=""),
    sort: Literal["date", "title", "difficulty"] = Query(default="date"),
    order: Literal["asc", "desc"] = Query(default="desc"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
):
    """Return published quizzes with optional search, filter, sort, pagination."""
    query: dict = {"is_deleted": {"$ne": True}, "is_published": {"$ne": False}}

    if search:
        query["$text"] = {"$search": search}
    if category:
        query["categories"] = {"$regex": f"^{category}$", "$options": "i"}
    if difficulty:
        query["difficulty"] = difficulty

    # Sort mapping
    sort_field = {
        "date": "created_at",
        "title": "title",
        "difficulty": "difficulty",
    }.get(sort, "created_at")
    sort_dir = 1 if order == "asc" else -1

    total = await db.quizzes.count_documents(query)
    skip = (page - 1) * page_size

    cursor = (
        db.quizzes.find(query)
        .sort(sort_field, sort_dir)
        .skip(skip)
        .limit(page_size)
    )

    quizzes: list[QuizSummary] = []
    async for doc in cursor:
        quizzes.append(_doc_to_summary(doc))

    return QuizListResponse(quizzes=quizzes, total=total, page=page, page_size=page_size)


# ── My Quizzes ───────────────────────────────────────────────────────────────

@router.get("/quizzes/my", response_model=QuizListResponse)
async def my_quizzes(
    user: dict = Depends(get_current_user),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
):
    """Return quizzes created by the authenticated user (including drafts)."""
    query = {"author_id": user["id"], "is_deleted": {"$ne": True}}
    total = await db.quizzes.count_documents(query)
    skip = (page - 1) * page_size

    cursor = db.quizzes.find(query).sort("created_at", -1).skip(skip).limit(page_size)
    quizzes: list[QuizSummary] = []
    async for doc in cursor:
        quizzes.append(_doc_to_summary(doc))

    return QuizListResponse(quizzes=quizzes, total=total, page=page, page_size=page_size)


# ── Create Quiz ──────────────────────────────────────────────────────────────

@router.post(
    "/quizzes",
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
        "difficulty": body.difficulty.value if body.difficulty else None,
        "time_limit_minutes": body.time_limit_minutes,
        "time_per_question_seconds": body.time_per_question_seconds,
        "is_published": body.is_published,
        "questions": [q.model_dump() for q in body.questions],
        "created_at": now,
        "updated_at": now,
        "is_deleted": False,
    }
    result = await db.quizzes.insert_one(quiz_doc)
    quiz_id = str(result.inserted_id)
    logger.info("Quiz created: %s by user %s", quiz_id, user["username"])
    return QuizCreateResponse(id=quiz_id)


# ── Get Quiz ─────────────────────────────────────────────────────────────────

@router.get(
    "/quizzes/{quiz_id}",
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

    # Unpublished quizzes only accessible by author
    if not doc.get("is_published", True) and not is_author:
        raise HTTPException(status_code=404, detail="Quiz not found")

    return QuizDetailResponse(quiz=_doc_to_detail(doc), can_edit=is_author)


# ── Update Quiz ──────────────────────────────────────────────────────────────

@router.put(
    "/quizzes/{quiz_id}",
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
        "difficulty": body.difficulty.value if body.difficulty else None,
        "time_limit_minutes": body.time_limit_minutes,
        "time_per_question_seconds": body.time_per_question_seconds,
        "is_published": body.is_published,
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


# ── Delete Quiz ──────────────────────────────────────────────────────────────

@router.delete(
    "/quizzes/{quiz_id}",
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


# ── Duplicate Quiz ───────────────────────────────────────────────────────────

@router.post(
    "/quizzes/{quiz_id}/duplicate",
    response_model=QuizCreateResponse,
    status_code=status.HTTP_201_CREATED,
    responses={404: {"model": ErrorResponse}},
)
async def duplicate_quiz(quiz_id: str, user: dict = Depends(get_current_user)):
    """Create a copy of an existing quiz owned by the current user."""
    try:
        doc = await db.quizzes.find_one({"_id": ObjectId(quiz_id), "is_deleted": {"$ne": True}})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid quiz ID format")

    if not doc:
        raise HTTPException(status_code=404, detail="Quiz not found")

    now = datetime.now(timezone.utc)
    # Generate new question IDs for the clone
    questions = []
    for q in doc.get("questions", []):
        new_q = {**q, "id": f"q_{uuid.uuid4().hex[:12]}"}
        questions.append(new_q)

    clone_doc = {
        "title": f"{doc['title']} (Copy)",
        "description": doc.get("description", ""),
        "author": user["username"],
        "author_id": user["id"],
        "categories": doc.get("categories", []),
        "difficulty": doc.get("difficulty"),
        "time_limit_minutes": doc.get("time_limit_minutes"),
        "time_per_question_seconds": doc.get("time_per_question_seconds"),
        "is_published": False,  # Start as draft
        "questions": questions,
        "created_at": now,
        "updated_at": now,
        "is_deleted": False,
    }

    result = await db.quizzes.insert_one(clone_doc)
    new_id = str(result.inserted_id)
    logger.info("Quiz duplicated: %s → %s by user %s", quiz_id, new_id, user["username"])
    return QuizCreateResponse(id=new_id, message="Quiz duplicated successfully")


# ── Export Quiz ──────────────────────────────────────────────────────────────

@router.get(
    "/quizzes/{quiz_id}/export",
    responses={404: {"model": ErrorResponse}},
)
async def export_quiz(quiz_id: str, user: dict = Depends(get_current_user)):
    """Export a quiz as JSON (answers included, metadata stripped)."""
    try:
        doc = await db.quizzes.find_one({"_id": ObjectId(quiz_id), "is_deleted": {"$ne": True}})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid quiz ID format")

    if not doc:
        raise HTTPException(status_code=404, detail="Quiz not found")

    return {
        "title": doc["title"],
        "description": doc.get("description", ""),
        "categories": doc.get("categories", []),
        "difficulty": doc.get("difficulty"),
        "time_limit_minutes": doc.get("time_limit_minutes"),
        "time_per_question_seconds": doc.get("time_per_question_seconds"),
        "questions": [
            {
                "question": q["question"],
                "options": q["options"],
                "answer": q["answer"],
                "explanation": q.get("explanation", ""),
            }
            for q in doc.get("questions", [])
        ],
    }


# ── Import Quiz ──────────────────────────────────────────────────────────────

@router.post(
    "/quizzes/import",
    response_model=QuizCreateResponse,
    status_code=status.HTTP_201_CREATED,
)
async def import_quiz(body: QuizImportRequest, user: dict = Depends(get_current_user)):
    """Import a quiz from exported JSON data."""
    now = datetime.now(timezone.utc)
    # Ensure all questions have unique IDs
    questions = []
    for q in body.questions:
        q_data = q.model_dump()
        q_data["id"] = f"q_{uuid.uuid4().hex[:12]}"
        questions.append(q_data)

    quiz_doc = {
        "title": body.title,
        "description": body.description,
        "author": user["username"],
        "author_id": user["id"],
        "categories": body.categories,
        "difficulty": body.difficulty.value if body.difficulty else None,
        "time_limit_minutes": body.time_limit_minutes,
        "time_per_question_seconds": body.time_per_question_seconds,
        "is_published": False,  # Start as draft for review
        "questions": questions,
        "created_at": now,
        "updated_at": now,
        "is_deleted": False,
    }

    result = await db.quizzes.insert_one(quiz_doc)
    new_id = str(result.inserted_id)
    logger.info("Quiz imported: %s by user %s", new_id, user["username"])
    return QuizCreateResponse(id=new_id, message="Quiz imported successfully")


# ── Categories ───────────────────────────────────────────────────────────────

@router.get("/categories", response_model=CategoryListResponse, tags=["categories"])
async def list_categories(user: dict = Depends(get_current_user)):
    """Return all categories with their quiz count (from published, non-deleted quizzes)."""
    pipeline = [
        {"$match": {"is_deleted": {"$ne": True}, "is_published": {"$ne": False}}},
        {"$unwind": "$categories"},
        {"$group": {"_id": "$categories", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
    ]

    categories: list[CategoryInfo] = []
    async for doc in db.quizzes.aggregate(pipeline):
        categories.append(CategoryInfo(name=doc["_id"], count=doc["count"]))

    return CategoryListResponse(categories=categories)

