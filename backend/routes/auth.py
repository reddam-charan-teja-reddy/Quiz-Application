"""Authentication routes — register, login, token refresh, logout."""

import logging
from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, HTTPException, Request, Response, status
from jose import JWTError, jwt

from config import settings
from db import db
from limiter import limiter
from models import RegisterRequest, LoginRequest, AuthResponse, ErrorResponse
from utils.auth import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


@router.post(
    "/register",
    response_model=AuthResponse,
    status_code=status.HTTP_201_CREATED,
    responses={409: {"model": ErrorResponse}},
)
@limiter.limit("5/minute")
async def register(request: Request, req: RegisterRequest, response: Response):
    """Create a new user account and return JWT tokens."""
    existing = await db.users.find_one({"username": req.username})
    if existing:
        raise HTTPException(status_code=409, detail="Username already taken")

    now = datetime.now(timezone.utc)
    user_doc = {
        "username": req.username,
        "password_hash": hash_password(req.password),
        "created_at": now,
        "updated_at": now,
        "is_deleted": False,
    }
    result = await db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)

    logger.info("User registered: %s (id=%s)", req.username, user_id)

    token_data = {"sub": user_id, "username": req.username}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=settings.is_production,
        samesite="lax",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 3600,
        path="/api/v1/auth",
    )

    return AuthResponse(access_token=access_token, username=req.username)


@router.post(
    "/login",
    response_model=AuthResponse,
    responses={401: {"model": ErrorResponse}},
)
@limiter.limit("10/minute")
async def login(request: Request, req: LoginRequest, response: Response):
    """Authenticate user and return JWT tokens."""
    user = await db.users.find_one({"username": req.username, "is_deleted": {"$ne": True}})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid username or password")

    if "password_hash" not in user:
        raise HTTPException(
            status_code=401,
            detail="Account requires migration — please register with a password.",
        )

    if not verify_password(req.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    user_id = str(user["_id"])
    logger.info("User logged in: %s", req.username)

    token_data = {"sub": user_id, "username": req.username}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=settings.is_production,
        samesite="lax",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 3600,
        path="/api/v1/auth",
    )

    return AuthResponse(access_token=access_token, username=req.username)


@router.post("/refresh", response_model=AuthResponse)
async def refresh_token(request: Request, response: Response):
    """Issue a new access token using the refresh token cookie."""
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="No refresh token provided")

    try:
        payload = jwt.decode(
            token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM]
        )
        user_id = payload.get("sub")
        username = payload.get("username")
        token_type = payload.get("type")

        if not user_id or token_type != "refresh":
            raise HTTPException(status_code=401, detail="Invalid refresh token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")

    user = await db.users.find_one({"_id": ObjectId(user_id), "is_deleted": {"$ne": True}})
    if not user:
        raise HTTPException(status_code=401, detail="User no longer exists")

    token_data = {"sub": user_id, "username": username}
    new_access = create_access_token(token_data)
    new_refresh = create_refresh_token(token_data)

    response.set_cookie(
        key="refresh_token",
        value=new_refresh,
        httponly=True,
        secure=settings.is_production,
        samesite="lax",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 3600,
        path="/api/v1/auth",
    )

    return AuthResponse(access_token=new_access, username=username)


@router.post("/logout")
async def logout(response: Response):
    """Clear the refresh token cookie."""
    response.delete_cookie(key="refresh_token", path="/api/v1/auth")
    return {"message": "Logged out successfully"}
