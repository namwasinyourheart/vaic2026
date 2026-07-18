import asyncio
import uuid

from sqlalchemy import select

from .database import SessionLocal, init_db
from .models import (
    AuditLog,
    Conversation,
    Document,
    Message,
    Permission,
    RetrievalGraphRef,
    Role,
    RolePermission,
    SourceGroup,
    SourceRef,
    User,
    UserRole,
)
from .services.security import hash_password

PERMISSIONS = [
    "conversation.read_own",
    "conversation.create",
    "document.read",
    "document.download",
    "document.upload",
    "document.update",
    "document.expire",
    "document.reindex",
    "metadata.read",
    "metadata.update",
    "relation.read",
    "relation.create",
    "relation.update",
    "user.create",
    "user.update",
    "user.lock",
    "user.unlock",
    "role.update",
    "audit_log.read",
]
ROLE_PERMS = {
    "customer": ["conversation.read_own", "conversation.create"],
    "bank_employee": [
        "conversation.read_own",
        "conversation.create",
        "document.read",
        "document.download",
        "relation.read",
    ],
    "knowledge_manager": [
        "document.read",
        "document.download",
        "document.upload",
        "document.update",
        "document.expire",
        "document.reindex",
        "metadata.read",
        "metadata.update",
        "relation.read",
        "relation.create",
        "relation.update",
    ],
    "system_admin": [
        "user.create",
        "user.update",
        "user.lock",
        "user.unlock",
        "role.update",
        "audit_log.read",
    ],
}
USERS = [
    ("customer", "Nguyễn Thị Mai", "mai@example.com", "customer"),
    ("employee", "Trần Văn Hùng", "hung@shb.vn", "bank_employee"),
    ("knowledge", "Lê Thu Hà", "ha@shb.vn", "knowledge_manager"),
    ("admin", "Admin Hệ thống", "admin@shb.vn", "system_admin"),
]


async def seed() -> None:
    await init_db()
    async with SessionLocal() as db:
        roles = {}
        for code in ROLE_PERMS:
            role = (await db.execute(select(Role).where(Role.code == code))).scalar_one_or_none()
            if not role:
                role = Role(id=str(uuid.uuid4()), code=code, name=code.replace("_", " ").title())
                db.add(role)
            roles[code] = role
        permissions = {}
        for code in PERMISSIONS:
            permission = (
                await db.execute(select(Permission).where(Permission.code == code))
            ).scalar_one_or_none()
            if not permission:
                permission = Permission(
                    id=str(uuid.uuid4()),
                    code=code,
                    name=code,
                    resource=code.split(".")[0],
                    action=code.split(".")[1],
                )
                db.add(permission)
            permissions[code] = permission
        await db.flush()
        for code, allowed in ROLE_PERMS.items():
            for permission_code in allowed:
                exists = await db.get(
                    RolePermission,
                    {
                        "role_id": roles[code].id,
                        "permission_id": permissions[permission_code].id,
                    },
                )
                if not exists:
                    db.add(
                        RolePermission(
                            role_id=roles[code].id,
                            permission_id=permissions[permission_code].id,
                        )
                    )
        for username, name, email, role_code in USERS:
            user = (
                await db.execute(select(User).where(User.username == username))
            ).scalar_one_or_none()
            if not user:
                user = User(
                    id=str(uuid.uuid4()),
                    username=username,
                    email=email,
                    password_hash=hash_password("password"),
                    full_name=name,
                    status="ACTIVE",
                )
                db.add(user)
                await db.flush()
            else:
                # Development seed resets demo accounts to bcrypt("password").
                user.password_hash = hash_password("password")
            if not await db.get(UserRole, {"user_id": user.id, "role_id": roles[role_code].id}):
                db.add(UserRole(user_id=user.id, role_id=roles[role_code].id))
        await db.flush()
        knowledge_user = (
            await db.execute(select(User).where(User.username == "knowledge"))
        ).scalar_one()
        for code, title, scope in [
            ("SHB-QD-001", "Quy định tiền gửi tiết kiệm", "PUBLIC"),
            ("SHB-QT-002", "Quy trình phê duyệt tín dụng", "INTERNAL"),
        ]:
            if not (
                await db.execute(select(Document).where(Document.document_code == code))
            ).scalar_one_or_none():
                db.add(
                    Document(
                        id=str(uuid.uuid4()),
                        document_code=code,
                        title=title,
                        document_type="REGULATION",
                        access_scope=scope,
                        effective_status="EFFECTIVE",
                        processing_status="COMPLETED",
                        index_status="INDEXED",
                        created_by=knowledge_user.id,
                        updated_by=knowledge_user.id,
                    )
                )
        customer = (await db.execute(select(User).where(User.username == "customer"))).scalar_one()
        conversation = (
            await db.execute(
                select(Conversation).where(
                    Conversation.owner_user_id == customer.id,
                    Conversation.title == "Hỏi đáp tiền gửi mẫu",
                )
            )
        ).scalar_one_or_none()
        if not conversation:
            conversation = Conversation(
                id=str(uuid.uuid4()),
                owner_user_id=customer.id,
                title="Hỏi đáp tiền gửi mẫu",
                scope="PUBLIC",
            )
            question = Message(
                id=str(uuid.uuid4()),
                conversation_id=conversation.id,
                role="user",
                content="Điều kiện gửi tiết kiệm là gì?",
                status="COMPLETED",
            )
            answer = Message(
                id=str(uuid.uuid4()),
                conversation_id=conversation.id,
                role="assistant",
                content="Đây là câu trả lời mẫu; nguồn chi tiết được lấy từ AI Service.",
                status="COMPLETED",
                ai_request_id="seed_request_001",
            )
            group = SourceGroup(
                id=str(uuid.uuid4()),
                conversation_id=conversation.id,
                user_message_id=question.id,
                assistant_message_id=answer.id,
                ai_source_group_id="seed_source_group_001",
                question_snapshot=question.content,
                chunk_count=1,
            )
            db.add_all(
                [
                    conversation,
                    question,
                    answer,
                    group,
                    SourceRef(
                        id=str(uuid.uuid4()),
                        source_group_id=group.id,
                        ai_chunk_id="seed_chunk_001",
                        rank=1,
                        relevance_score=0.95,
                    ),
                    RetrievalGraphRef(
                        id=str(uuid.uuid4()),
                        assistant_message_id=answer.id,
                        ai_graph_id="seed_graph_001",
                    ),
                ]
            )
        if not (
            await db.execute(select(AuditLog).where(AuditLog.request_id == "seed"))
        ).scalar_one_or_none():
            db.add(
                AuditLog(
                    id=str(uuid.uuid4()),
                    request_id="seed",
                    actor_user_id=knowledge_user.id,
                    actor_role="knowledge_manager",
                    action="SEED_DATA",
                    resource_type="SYSTEM",
                    result="SUCCESS",
                )
            )
        await db.commit()


if __name__ == "__main__":
    asyncio.run(seed())
