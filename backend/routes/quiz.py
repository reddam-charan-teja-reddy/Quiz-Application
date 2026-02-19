from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId

from models import Quiz, QuizzesList, EditQuizRequest, EditQuizResponse
from db import db
from utils.auth import get_current_user

router = APIRouter(prefix="/api", tags=["quiz"])


@router.get("/quizzes")
async def get_quizzes(user: dict = Depends(get_current_user)):
    """Return all quizzes."""
    quizzes_cursor = db.quizzes.find({})
    quizzes = []
    async for quiz in quizzes_cursor:
        quiz["id"] = str(quiz["_id"])
        del quiz["_id"]
        quizzes.append(quiz)

    return QuizzesList(quizzes=quizzes)


@router.post("/quizzes", status_code=201)
async def create_quiz(quiz: Quiz, user: dict = Depends(get_current_user)):
    """Create a new quiz and link it to the authenticated user."""
    quiz_data = quiz.model_dump(exclude={"id"})
    quiz_data["author"] = user["username"]
    result = await db.quizzes.insert_one(quiz_data)
    new_quiz_id = str(result.inserted_id)

    await db.users.update_one(
        {"_id": user["_id"]},
        {"$push": {"created_quizzes": new_quiz_id}},
    )

    return {"id": new_quiz_id, "status": "quiz created"}


@router.get("/quizzes/{quiz_id}")
async def get_quiz(quiz_id: str, user: dict = Depends(get_current_user)):
    """Get a single quiz by ID."""
    try:
        quiz = await db.quizzes.find_one({"_id": ObjectId(quiz_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid quiz ID format")

    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    user_created_quizzes = user.get("created_quizzes", [])
    is_author = quiz.get("author") == user["username"]
    is_in_created_list = str(quiz["_id"]) in user_created_quizzes

    quiz_dict = {
        "id": str(quiz["_id"]),
        "title": quiz["title"],
        "description": quiz["description"],
        "author": quiz["author"],
        "num_questions": quiz["num_questions"],
        "categories": quiz["categories"],
        "questions": quiz["questions"],
    }

    return {"quiz": quiz_dict, "success": True, "can_edit": is_author or is_in_created_list}


@router.put("/quizzes/{quiz_id}", response_model=EditQuizResponse)
async def edit_quiz(quiz_id: str, req: EditQuizRequest, user: dict = Depends(get_current_user)):
    """Update an existing quiz (owner only)."""
    try:
        existing_quiz = await db.quizzes.find_one({"_id": ObjectId(quiz_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid quiz ID format")

    if not existing_quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    user_created_quizzes = user.get("created_quizzes", [])
    is_author = existing_quiz.get("author") == user["username"]
    is_in_created_list = str(existing_quiz["_id"]) in user_created_quizzes

    if not (is_author or is_in_created_list):
        raise HTTPException(status_code=403, detail="You can only edit quizzes you created")

    updated_quiz = {
        "title": req.quiz.title,
        "description": req.quiz.description,
        "author": user["username"],
        "num_questions": req.quiz.num_questions,
        "categories": req.quiz.categories,
        "questions": [q.model_dump() for q in req.quiz.questions],
    }

    result = await db.quizzes.update_one(
        {"_id": ObjectId(quiz_id)},
        {"$set": updated_quiz},
    )

    if result.modified_count > 0:
        return EditQuizResponse(message="Quiz updated successfully", success=True)
    return EditQuizResponse(message="No changes made to quiz", success=True)
