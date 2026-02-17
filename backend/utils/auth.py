from bson import ObjectId
from fastapi import HTTPException

from db import db


async def verify_user(token: str, username: str):
    """
    Verifies a user's identity by checking the token and username against the database.
    Returns the user document if valid, otherwise raises an HTTPException.
    """
    try:
        if not token or len(token) != 24:
            raise HTTPException(status_code=401, detail="Invalid token format.")
        user = await db.users.find_one({"_id": ObjectId(token), "username": username})
    except HTTPException:
        raise
    except Exception as e:
        print(f"Invalid token format: {token}. Error: {e}")
        raise HTTPException(status_code=401, detail="Invalid token format.")

    if not user:
        print(f"User {username} with token {token} not found.")
        raise HTTPException(status_code=401, detail="User authentication failed.")

    return user
