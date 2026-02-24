"""Authentication utilities — password hashing, JWT creation/validation."""

from datetime import datetime, timedelta, timezone

from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerificationError, VerifyMismatchError
from authlib.jose import JoseError, jwt
from bson import ObjectId
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from app.config import settings

password_hasher = PasswordHasher()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def hash_password(password: str) -> str:
    return password_hasher.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return password_hasher.verify(hashed_password, plain_password)
    except (VerifyMismatchError, InvalidHashError, VerificationError):
        return False


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": int(expire.timestamp()), "type": "access"})
    token = jwt.encode({"alg": settings.JWT_ALGORITHM}, to_encode, settings.JWT_SECRET)
    return token.decode("utf-8") if isinstance(token, bytes) else token


def create_refresh_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": int(expire.timestamp()), "type": "refresh"})
    token = jwt.encode({"alg": settings.JWT_ALGORITHM}, to_encode, settings.JWT_SECRET)
    return token.decode("utf-8") if isinstance(token, bytes) else token


async def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    """FastAPI dependency — extracts and validates the JWT access token."""
    # Import db here to avoid circular import and to get the lifespan-initialized instance  # noqa: E501
    from app.db import db

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        claims = jwt.decode(token, settings.JWT_SECRET)
        claims.validate()
        payload = dict(claims)
        user_id: str | None = payload.get("sub")
        token_type: str | None = payload.get("type")
        if user_id is None or token_type != "access":
            raise credentials_exception
    except JoseError:
        raise credentials_exception

    try:
        user = await db.users.find_one({"_id": ObjectId(user_id), "is_deleted": {"$ne": True}})
    except Exception:
        raise credentials_exception

    if user is None:
        raise credentials_exception

    user["id"] = str(user["_id"])
    return user
