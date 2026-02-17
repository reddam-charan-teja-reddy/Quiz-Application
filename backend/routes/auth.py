from fastapi import APIRouter
from bson import ObjectId

from models import LoginRequest, LoginResponse
from db import db

router = APIRouter(prefix="/api", tags=["auth"])


@router.post("/login")
async def login(login_request: LoginRequest):
    """Handles user login and registration."""
    username = login_request.username
    print(f"User {username} login request received.")

    user = await db.users.find_one({"username": username})
    if user:
        print(f"User {username} found in database.")
        return LoginResponse(token=str(user["_id"]), status="existing user")
    else:
        print(f"User {username} not found. Creating new user.")
        user_id = await db.users.insert_one({"username": username})
        print(f"User {username} created with id {user_id.inserted_id}.")
        return LoginResponse(token=str(user_id.inserted_id), status="new user created")