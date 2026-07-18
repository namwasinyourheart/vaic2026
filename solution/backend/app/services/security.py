import hashlib
import secrets
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt

from ..config import get_settings


def hash_password(value: str) -> str:
    if len(value.encode("utf-8")) > 72:
        raise ValueError("Password cannot exceed 72 UTF-8 bytes for bcrypt")
    return bcrypt.hashpw(value.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, stored_hash: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), stored_hash.encode("utf-8"))
    except (ValueError, TypeError):
        return False


def create_access_token(user_id: str) -> str:
    settings = get_settings()
    expires = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_minutes)
    return jwt.encode(
        {"sub": user_id, "type": "access", "exp": expires},
        settings.jwt_secret_key,
        algorithm=settings.jwt_algorithm,
    )


def create_refresh_token() -> tuple[str, str, datetime]:
    settings = get_settings()
    value = secrets.token_urlsafe(48)
    expires = datetime.now(timezone.utc) + timedelta(days=settings.refresh_token_days)
    return value, hashlib.sha256(value.encode()).hexdigest(), expires


def decode_access_token(token: str) -> str:
    settings = get_settings()
    payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
    if payload.get("type") != "access" or not payload.get("sub"):
        raise ValueError("Invalid access token")
    return str(payload["sub"])


def create_guest_access_token(
    request_id: str, source_group_id: str, graph_id: str, chunk_ids: list[str]
) -> str:
    settings = get_settings()
    expires = datetime.now(timezone.utc) + timedelta(minutes=30)
    return jwt.encode(
        {
            "type": "guest",
            "sub": request_id,
            "source_group_id": source_group_id,
            "graph_id": graph_id,
            "chunk_ids": chunk_ids,
            "exp": expires,
        },
        settings.jwt_secret_key,
        algorithm=settings.jwt_algorithm,
    )


def decode_guest_access_token(token: str) -> dict:
    settings = get_settings()
    payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
    if payload.get("type") != "guest" or not payload.get("sub"):
        raise ValueError("Invalid guest token")
    return payload
