from collections.abc import Callable

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from .database import get_db
from .models import Permission, Role, RolePermission, User, UserRole
from .services.security import decode_access_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


async def current_user(
    token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)
) -> User:
    try:
        user_id = decode_access_token(token)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token"
        ) from exc
    user = await db.get(User, user_id)
    if not user or user.status != "ACTIVE" or user.deleted_at:
        raise HTTPException(status_code=401, detail="User is inactive")
    return user


async def user_role_codes(user: User, db: AsyncSession) -> set[str]:
    result = await db.execute(
        select(Role.code)
        .join(UserRole, UserRole.role_id == Role.id)
        .where(UserRole.user_id == user.id)
    )
    return set(result.scalars().all())


def require_roles(*roles: str) -> Callable:
    async def dependency(
        user: User = Depends(current_user), db: AsyncSession = Depends(get_db)
    ) -> User:
        if not (await user_role_codes(user, db) & set(roles)):
            raise HTTPException(status_code=403, detail="Role is not allowed")
        return user

    return dependency


def require_permission(permission_code: str) -> Callable:
    async def dependency(
        user: User = Depends(current_user), db: AsyncSession = Depends(get_db)
    ) -> User:
        result = await db.execute(
            select(Permission.code)
            .join(RolePermission, RolePermission.permission_id == Permission.id)
            .join(UserRole, UserRole.role_id == RolePermission.role_id)
            .where(UserRole.user_id == user.id, Permission.code == permission_code)
        )
        if result.scalar_one_or_none() is None:
            raise HTTPException(status_code=403, detail=f"Missing permission: {permission_code}")
        return user

    return dependency
