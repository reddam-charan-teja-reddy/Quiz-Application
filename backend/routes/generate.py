import json

from jsonschema import ValidationError
from fastapi import APIRouter, Depends, HTTPException, Request

from models import Quiz, GenerateRequest, GenerateResponse
from gemini_client import model
from limiter import limiter
from utils.auth import get_current_user

router = APIRouter(prefix="/api", tags=["generate"])

# Manually defined JSON schema for the AI response to ensure compatibility do not rely on Pydantic's schema or other use only manual coded schema .
QUIZ_SCHEMA = {
    "type": "object",
    "properties": {
        "id": {"type": "string", "description": "This will be null, backend handles the real ID."},
        "title": {"type": "string"},
        "description": {"type": "string"},
        "author": {"type": "string"},
        "num_questions": {"type": "integer"},
        "categories": {
            "type": "array",
            "items": {"type": "string"}
        },
        "questions": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "id": {"type": "string"},
                    "question": {"type": "string"},
                    "options": {
                        "type": "array",
                        "items": {"type": "string"}
                    },
                    "answer": {"type": "string"}
                },
                "required": ["id", "question", "options", "answer"]
            }
        }
    },
    "required": ["title", "description", "author", "num_questions", "categories", "questions"]
}


@router.post("/generate", response_model=GenerateResponse)
@limiter.limit("5/minute")
async def generate_quiz(request: Request, req: GenerateRequest, user: dict = Depends(get_current_user)):
    """
    Generates a quiz using the Gemini API with a manually defined JSON schema
    to ensure compatibility with older Pydantic versions.
    """
    prompt = f"""
    You are a helpful assistant who is an expert in creating educational material. 
    Your task is to generate a complete, high-quality quiz based on the User Request: "{req.prompt}".

    Please make the questions clear and engaging. The difficulty should be appropriate
    based on the request provided. Ensure the provided answers are factually correct.
    For the 'author' field, please set it to "AI Assistant".
    """

    try:
        print(f"Generating quiz with structured output for topic: '{req.prompt}'")

        generation_config = {
            "response_mime_type": "application/json",
            "response_schema": QUIZ_SCHEMA
        }

        response = model.generate_content(
            prompt,
            generation_config=generation_config
        )

        quiz_data = json.loads(response.text)
        validated_quiz = Quiz(**quiz_data)

        print("Successfully generated and validated quiz.")
        return GenerateResponse(quiz=validated_quiz)

    except (json.JSONDecodeError, ValidationError) as e:
        print(f"Error: Failed to decode or validate the AI response. Error: {e}")
        try:
            print("Raw AI response was:", response.text)
        except NameError:
            print("Response object not available.")
        raise HTTPException(
            status_code=500,
            detail="The AI returned an invalid data structure. Please try again."
        )
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred while generating the quiz."
        )
