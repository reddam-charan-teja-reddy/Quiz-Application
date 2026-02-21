"""Test data factories for creating quiz, attempt, and user test data."""

from datetime import datetime, timezone


def make_user_data(username="testuser", password="testpass123"):
    """Create user registration payload."""
    return {"username": username, "password": password}


def make_quiz_data(
    title="Test Quiz",
    description="A test quiz",
    categories=None,
    difficulty="medium",
    num_questions=2,
    is_published=True,
    time_limit_minutes=None,
    time_per_question_seconds=None,
):
    """Create quiz creation payload."""
    questions = []
    for i in range(num_questions):
        questions.append({
            "id": f"q{i+1}",
            "question": f"Question {i+1}?",
            "options": [f"Option A{i}", f"Option B{i}", f"Option C{i}", f"Option D{i}"],
            "answer": f"Option A{i}",
            "explanation": f"Explanation for question {i+1}",
        })

    return {
        "title": title,
        "description": description,
        "categories": categories or ["General"],
        "difficulty": difficulty,
        "questions": questions,
        "is_published": is_published,
        "time_limit_minutes": time_limit_minutes,
        "time_per_question_seconds": time_per_question_seconds,
    }


def make_answers(questions, all_correct=True):
    """Create answer submission payload from quiz questions.

    Args:
        questions: List of question dicts (from attempt start response)
        all_correct: If True, answers are correct; otherwise all wrong
    """
    answers = []
    for q in questions:
        selected = q["answer"] if all_correct else q["options"][-1]
        # If last option == answer, pick second-to-last
        if not all_correct and selected == q["answer"]:
            selected = q["options"][-2]
        answers.append({
            "question_id": q["id"],
            "selected_answer": selected,
        })
    return answers
