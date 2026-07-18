import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ...database import get_db
from ...dependencies import current_user, require_roles, user_role_codes
from ...models import AuditLog, Permission, Role, RolePermission, Session, User, UserRole
from ...schemas import PasswordResetRequest, UserCreate, UserOut, UserUpdate
from ...services.security import hash_password

router = APIRouter(
    prefix="/admin",
    tags=["System Admin"],
    dependencies=[Depends(require_roles("system_admin"))],
)
DEFAULT_PASSWORD = "vaic@2026"


async def out(user: User, db: AsyncSession) -> UserOut:
    roles = sorted(await user_role_codes(user, db))
    return UserOut(
        id=user.id,
        username=user.username,
        email=user.email,
        full_name=user.full_name,
        status=user.status,
        role=roles[0] if roles else "customer",
        must_change_password=user.must_change_password,
    )


@router.get("/users", response_model=list[UserOut])
async def users(db: AsyncSession = Depends(get_db)) -> list[UserOut]:
    items = (
        (
            await db.execute(
                select(User).where(User.deleted_at.is_(None)).order_by(User.created_at.desc())
            )
        )
        .scalars()
        .all()
    )
    return [await out(item, db) for item in items]


@router.post("/users", response_model=UserOut, status_code=201)
async def create_user(payload: UserCreate, db: AsyncSession = Depends(get_db)) -> UserOut:
    username = payload.username.strip().lower()
    email = payload.email.strip().lower() if payload.email else None
    if (await db.execute(select(User).where(User.username == username))).scalar_one_or_none() or (
        email and (await db.execute(select(User).where(User.email == email))).scalar_one_or_none()
    ):
        raise HTTPException(409, "Username or email already exists")
    role = (await db.execute(select(Role).where(Role.code == payload.role))).scalar_one_or_none()
    if not role:
        raise HTTPException(422, "Unknown role")
    user = User(
        id=str(uuid.uuid4()),
        username=username,
        email=email,
        password_hash=hash_password(DEFAULT_PASSWORD),
        must_change_password=False,
        full_name=payload.full_name,
        department_id=payload.department_id,
        status="ACTIVE",
    )
    db.add(user)
    await db.flush()
    db.add(UserRole(user_id=user.id, role_id=role.id))
    await db.commit()
    return await out(user, db)


@router.post("/users/{user_id}/reset-password", response_model=UserOut)
async def reset_password(
    user_id: str,
    payload: PasswordResetRequest | None = None,
    db: AsyncSession = Depends(get_db),
) -> UserOut:
    user = await db.get(User, user_id)
    if not user or user.deleted_at:
        raise HTTPException(404, "User not found")
    user.password_hash = hash_password((payload.password if payload else DEFAULT_PASSWORD))
    user.must_change_password = False
    for session in (await db.execute(select(Session).where(Session.user_id == user.id, Session.revoked_at.is_(None)))).scalars():
        session.revoked_at = datetime.now(timezone.utc)
    await db.commit()
    return await out(user, db)


@router.patch("/users/{user_id}", response_model=UserOut)
async def update_user(
    user_id: str, payload: UserUpdate, db: AsyncSession = Depends(get_db)
) -> UserOut:
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(404, "User not found")
    data = payload.model_dump(exclude_unset=True)
    role_code = data.pop("role", None)
    for key, value in data.items():
        setattr(user, key, value)
    if role_code:
        role = (await db.execute(select(Role).where(Role.code == role_code))).scalar_one_or_none()
        if not role:
            raise HTTPException(422, "Unknown role")
        current = (await db.execute(select(UserRole).where(UserRole.user_id == user.id))).scalars().first()
        if not current:
            db.add(UserRole(user_id=user.id, role_id=role.id))
        elif current.role_id != role.id:
            current.role_id = role.id
            current.assigned_at = datetime.now(timezone.utc)
    await db.commit()
    return await out(user, db)


@router.post("/users/{user_id}/lock", response_model=UserOut)
async def lock_user(
    user_id: str, db: AsyncSession = Depends(get_db), actor: User = Depends(current_user)
) -> UserOut:
    if user_id == actor.id:
        raise HTTPException(400, "Cannot lock yourself")
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(404, "User not found")
    user.status = "LOCKED"
    for session in (
        await db.execute(
            select(Session).where(Session.user_id == user.id, Session.revoked_at.is_(None))
        )
    ).scalars():
        session.revoked_at = datetime.now(timezone.utc)
    await db.commit()
    return await out(user, db)


@router.post("/users/{user_id}/unlock", response_model=UserOut)
async def unlock_user(user_id: str, db: AsyncSession = Depends(get_db)) -> UserOut:
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(404, "User not found")
    user.status = "ACTIVE"
    await db.commit()
    return await out(user, db)


@router.get("/users/{user_id}", response_model=UserOut)
async def get_user(user_id: str, db: AsyncSession = Depends(get_db)) -> UserOut:
    user = await db.get(User, user_id)
    if not user or user.deleted_at:
        raise HTTPException(404, "User not found")
    return await out(user, db)


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: str, db: AsyncSession = Depends(get_db), actor: User = Depends(current_user)
) -> dict[str, str]:
    if user_id == actor.id:
        raise HTTPException(400, "Cannot delete yourself")
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(404, "User not found")
    user.deleted_at = datetime.now(timezone.utc)
    user.status = "LOCKED"
    await db.commit()
    return {"message": "User deleted"}


@router.get("/roles")
async def roles(db: AsyncSession = Depends(get_db)) -> list[dict]:
    response = []
    for role in (await db.execute(select(Role))).scalars().all():
        permissions = (
            (
                await db.execute(
                    select(Permission.code)
                    .join(RolePermission, RolePermission.permission_id == Permission.id)
                    .where(RolePermission.role_id == role.id)
                )
            )
            .scalars()
            .all()
        )
        response.append(
            {
                "id": role.id,
                "code": role.code,
                "name": role.name,
                "permissions": permissions,
            }
        )
    return response


@router.put("/roles/{role_id}/permissions")
async def update_permissions(
    role_id: str, permission_codes: list[str], db: AsyncSession = Depends(get_db)
) -> dict:
    role = await db.get(Role, role_id)
    if not role:
        raise HTTPException(404, "Role not found")
    for item in (
        (await db.execute(select(RolePermission).where(RolePermission.role_id == role_id)))
        .scalars()
        .all()
    ):
        await db.delete(item)
    permissions = (
        (await db.execute(select(Permission).where(Permission.code.in_(permission_codes))))
        .scalars()
        .all()
    )
    for permission in permissions:
        db.add(RolePermission(role_id=role_id, permission_id=permission.id))
    await db.commit()
    return {"role_id": role_id, "permissions": [item.code for item in permissions]}


@router.get("/audit-logs")
async def audit_logs(
    actor_user_id: str | None = None,
    action: str | None = None,
    result: str | None = None,
    resource_type: str | None = None,
    db: AsyncSession = Depends(get_db),
) -> list[dict]:
    query = select(AuditLog)
    if actor_user_id:
        query = query.where(AuditLog.actor_user_id == actor_user_id)
    if action:
        query = query.where(AuditLog.action.contains(action))
    if result:
        query = query.where(AuditLog.result == result)
    if resource_type:
        query = query.where(AuditLog.resource_type == resource_type)
    items = (
        (await db.execute(query.order_by(AuditLog.created_at.desc()).limit(500))).scalars().all()
    )
    return [
        {
            "id": item.id,
            "request_id": item.request_id,
            "actor_user_id": item.actor_user_id,
            "actor_role": item.actor_role,
            "action": item.action,
            "resource_type": item.resource_type,
            "resource_id": item.resource_id,
            "result": item.result,
            "before": item.before_json,
            "after": item.after_json,
            "created_at": item.created_at,
        }
        for item in items
    ]


@router.get("/audit-logs/{log_id}")
async def audit_log(log_id: str, db: AsyncSession = Depends(get_db)) -> dict:
    item = await db.get(AuditLog, log_id)
    if not item:
        raise HTTPException(404, "Audit log not found")
    return {
        "id": item.id,
        "request_id": item.request_id,
        "action": item.action,
        "resource_type": item.resource_type,
        "resource_id": item.resource_id,
        "result": item.result,
        "before": item.before_json,
        "after": item.after_json,
        "error": item.error_message,
        "created_at": item.created_at,
    }
