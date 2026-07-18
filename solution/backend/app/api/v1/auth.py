import hashlib
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ...database import get_db
from ...dependencies import current_user, user_role_codes
from ...models import Session, User
from ...schemas import (
    ChangePasswordRequest,
    CustomerRegisterRequest,
    LoginRequest,
    ProfileUpdate,
    RefreshRequest,
    TokenResponse,
    UserOut,
)
from ...services.security import (
    create_access_token,
    create_refresh_token,
    hash_password,
    verify_password,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


async def user_out(user: User, db: AsyncSession) -> UserOut:
    roles = sorted(await user_role_codes(user, db))
    return UserOut(
        id=user.id,
        username=user.username,
        email=user.email,
        full_name=user.full_name,
        status=user.status,
        role=roles[0] if roles else "ROLE_CUSTOMER",
        must_change_password=user.must_change_password,
    )


@router.post("/login", response_model=TokenResponse)
async def login(
    payload: LoginRequest, request: Request, db: AsyncSession = Depends(get_db)
) -> TokenResponse:
    user = (
        await db.execute(
            select(User).where(
                User.username == payload.username.strip().lower(), User.deleted_at.is_(None)
            )
        )
    ).scalar_one_or_none()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Tên đăng nhập hoặc mật khẩu không đúng")
    if user.status != "ACTIVE":
        raise HTTPException(status_code=423, detail="Tài khoản đã bị khóa")
    value, digest, expires = create_refresh_token()
    db.add(
        Session(
            id=str(uuid.uuid4()),
            user_id=user.id,
            refresh_token_hash=digest,
            expires_at=expires,
            ip_address=request.client.host if request.client else None,
            device_info=request.headers.get("user-agent"),
        )
    )
    user.last_login_at = datetime.now(timezone.utc)
    await db.commit()
    return TokenResponse(
        access_token=create_access_token(user.id),
        refresh_token=value,
        user=await user_out(user, db),
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh(
    payload: RefreshRequest, request: Request, db: AsyncSession = Depends(get_db)
) -> TokenResponse:
    digest = hashlib.sha256(payload.refresh_token.encode()).hexdigest()
    session = (
        await db.execute(
            select(Session).where(
                Session.refresh_token_hash == digest, Session.revoked_at.is_(None)
            )
        )
    ).scalar_one_or_none()
    expires_at = session.expires_at if session else None
    if expires_at and expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if not session or not expires_at or expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Refresh token expired")
    user = await db.get(User, session.user_id)
    if not user or user.status != "ACTIVE":
        raise HTTPException(status_code=401, detail="User is inactive")
    session.last_used_at = datetime.now(timezone.utc)
    session.revoked_at = datetime.now(timezone.utc)
    value, new_digest, new_expires = create_refresh_token()
    db.add(
        Session(
            id=str(uuid.uuid4()),
            user_id=user.id,
            refresh_token_hash=new_digest,
            expires_at=new_expires,
            ip_address=request.client.host if request.client else None,
            device_info=request.headers.get("user-agent"),
        )
    )
    await db.commit()
    return TokenResponse(
        access_token=create_access_token(user.id),
        refresh_token=value,
        user=await user_out(user, db),
    )


@router.post("/logout")
async def logout(
    payload: RefreshRequest,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(current_user),
) -> dict[str, str]:
    digest = hashlib.sha256(payload.refresh_token.encode()).hexdigest()
    session = (
        await db.execute(
            select(Session).where(Session.refresh_token_hash == digest, Session.user_id == _user.id)
        )
    ).scalar_one_or_none()
    if session:
        session.revoked_at = datetime.now(timezone.utc)
        await db.commit()
    return {"message": "Logged out"}


@router.post("/logout-all")
async def logout_all(
    db: AsyncSession = Depends(get_db), user: User = Depends(current_user)
) -> dict[str, str]:
    sessions = (
        await db.execute(
            select(Session).where(Session.user_id == user.id, Session.revoked_at.is_(None))
        )
    ).scalars()
    now = datetime.now(timezone.utc)
    for session in sessions:
        session.revoked_at = now
    await db.commit()
    return {"message": "Logged out from all devices"}


@router.post("/sign-up", response_model=UserOut, status_code=201)
async def sign_up(payload: CustomerRegisterRequest, db: AsyncSession = Depends(get_db)) -> UserOut:
    username = payload.username.strip().lower()
    email = payload.email.strip().lower() if payload.email else None
    if (await db.execute(select(User).where(User.username == username))).scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Username already exists")
    if email and (await db.execute(select(User).where(User.email == email))).scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Email already exists")
    user = User(
        id=str(uuid.uuid4()),
        username=username,
        email=email,
        full_name=payload.full_name.strip(),
        password_hash=hash_password(payload.password),
        status="ACTIVE",
    )
    db.add(user)
    await db.flush()
    from ...models import Role, UserRole

    role = (await db.execute(select(Role).where(Role.code == "ROLE_CUSTOMER"))).scalar_one()
    db.add(UserRole(user_id=user.id, role_id=role.id, assigned_at=datetime.now(timezone.utc)))
    await db.commit()
    await db.refresh(user)
    return await user_out(user, db)


@router.patch("/me", response_model=UserOut)
async def update_me(
    payload: ProfileUpdate, user: User = Depends(current_user), db: AsyncSession = Depends(get_db)
) -> UserOut:
    if payload.email:
        email = payload.email.strip().lower()
        existing = (
            await db.execute(select(User).where(User.email == email, User.id != user.id))
        ).scalar_one_or_none()
        if existing:
            raise HTTPException(status_code=409, detail="Email already exists")
        user.email = email
    elif payload.email == "":
        user.email = None
    if payload.full_name is not None:
        user.full_name = payload.full_name.strip()
    user.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(user)
    return await user_out(user, db)


@router.put("/me/password")
async def change_password(
    payload: ChangePasswordRequest,
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, str]:
    if not verify_password(payload.current_password, user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    user.password_hash = hash_password(payload.new_password)
    user.must_change_password = False
    sessions = (
        await db.execute(
            select(Session).where(Session.user_id == user.id, Session.revoked_at.is_(None))
        )
    ).scalars()
    now = datetime.now(timezone.utc)
    for session in sessions:
        session.revoked_at = now
    await db.commit()
    return {"message": "Password updated"}


@router.get("/me", response_model=UserOut)
async def me(user: User = Depends(current_user), db: AsyncSession = Depends(get_db)) -> UserOut:
    return await user_out(user, db)
