from fastapi import APIRouter, HTTPException
from bson import ObjectId

from models import (
    Profile, QuizzesList, UploadQuizRequest,
    GetQuizRequest, EditQuizRequest, EditQuizResponse
)
from db import db
from utils.auth import verify_user

router = APIRouter(prefix="/api", tags=["quiz"])


@router.post("/getquizzes")
async def get_quizzes(profile: Profile):
    """Returns all quizzes for display on the home page."""
    user = await verify_user(profile.token, profile.username)
    print(f"User {profile.username} login successful.")

    quizzes_cursor = db.quizzes.find({})
    quizzes = []
    async for quiz in quizzes_cursor:
        quiz["id"] = str(quiz["_id"])
        del quiz["_id"]
        quizzes.append(quiz)

    print(f"Returning {len(quizzes)} quizzes.")
    return QuizzesList(quizzes=quizzes)


@router.post("/plus")
async def upload_quiz(request: UploadQuizRequest):
    """Creates a new quiz and links it to the user's profile."""
    profile = request.profile
    quiz_object = request.quiz

    user = await verify_user(profile.token, profile.username)
    print(f"User '{profile.username}' authenticated successfully.")

    quiz_data = quiz_object.model_dump(exclude={"id"})
    quiz_data["author"] = profile.username
    result = await db.quizzes.insert_one(quiz_data)
    new_quiz_id = result.inserted_id
    print(f"Quiz created with id {new_quiz_id} by user {profile.username}.")

    await db.users.update_one(
        {"_id": ObjectId(profile.token)},
        {"$push": {"created_quizzes": str(new_quiz_id)}}
    )
    print(f"Updated profile for user '{profile.username}' with new quiz ID.")

    return {"id": str(new_quiz_id), "status": "quiz created and linked to profile"}


@router.post("/getquiz")
async def get_quiz(req: GetQuizRequest):
    """Get a single quiz by ID for editing (only if user is the creator)."""
    user = await verify_user(req.token, req.username)
    print(f"User found: {user['username']}")

    # Get the quiz
    try:
        if not req.quiz_id or len(req.quiz_id) != 24:
            raise HTTPException(status_code=400, detail="Invalid quiz ID format")

        quiz = await db.quizzes.find_one({"_id": ObjectId(req.quiz_id)})
        if not quiz:
            raise HTTPException(status_code=404, detail="Quiz not found")
        print(f"Quiz found: {quiz['title']} by {quiz['author']}")
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error finding quiz: {str(e)}")
        raise HTTPException(status_code=404, detail="Quiz not found")

    # Check if user is the creator
    user_created_quizzes = user.get("created_quizzes", [])
    is_author = quiz["author"] == req.username
    is_in_created_list = str(quiz["_id"]) in user_created_quizzes

    if not (is_author or is_in_created_list):
        print(f"Access denied. Quiz author: {quiz['author']}, Requesting user: {req.username}")
        raise HTTPException(status_code=403, detail="You can only edit quizzes you created")

    print(f"Access granted. Author match: {is_author}, In created list: {is_in_created_list}")

    quiz_dict = {
        "id": str(quiz["_id"]),
        "title": quiz["title"],
        "description": quiz["description"],
        "author": quiz["author"],
        "num_questions": quiz["num_questions"],
        "categories": quiz["categories"],
        "questions": quiz["questions"]
    }

    print(f"Successfully returning quiz data for: {quiz['title']}")
    return {"quiz": quiz_dict, "success": True}


@router.post("/editquiz", response_model=EditQuizResponse)
async def edit_quiz(req: EditQuizRequest):
    """Edit an existing quiz (only by the creator)."""
    user = await verify_user(req.token, req.username)
    print(f"Edit quiz request - Username: {req.username}, Quiz ID: {req.quiz_id}")

    # Get the existing quiz
    try:
        if not req.quiz_id or len(req.quiz_id) != 24:
            raise HTTPException(status_code=400, detail="Invalid quiz ID format")

        existing_quiz = await db.quizzes.find_one({"_id": ObjectId(req.quiz_id)})
        if not existing_quiz:
            raise HTTPException(status_code=404, detail="Quiz not found")
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid quiz ID format")

    # Check if user is the creator
    user_created_quizzes = user.get("created_quizzes", [])
    is_author = existing_quiz["author"] == req.username
    is_in_created_list = str(existing_quiz["_id"]) in user_created_quizzes

    if not (is_author or is_in_created_list):
        print(f"Access denied. Quiz author: {existing_quiz['author']}, Requesting user: {req.username}")
        raise HTTPException(status_code=403, detail="You can only edit quizzes you created")

    print(f"Access granted. Author match: {is_author}, In created list: {is_in_created_list}")

    # Update the quiz
    updated_quiz = {
        "title": req.quiz.title,
        "description": req.quiz.description,
        "author": req.quiz.author,
        "num_questions": req.quiz.num_questions,
        "categories": req.quiz.categories,
        "questions": [q.dict() for q in req.quiz.questions]
    }

    result = await db.quizzes.update_one(
        {"_id": ObjectId(req.quiz_id)},
        {"$set": updated_quiz}
    )

    if result.modified_count > 0:
        print(f"Quiz updated successfully: {req.quiz.title}")
        return EditQuizResponse(message="Quiz updated successfully", success=True)
    else:
        print(f"No changes made to quiz: {req.quiz.title}")
        return EditQuizResponse(message="No changes made to quiz", success=True)
