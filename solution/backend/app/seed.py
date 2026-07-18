import asyncio
import uuid

from sqlalchemy import select

from .database import SessionLocal, init_db
from .models import (
    AIChunkRef,
    AIDocumentRef,
    AIVersionRef,
    AuditLog,
    Conversation,
    Document,
    DocumentVersion,
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
    "ROLE_CUSTOMER": ["conversation.read_own", "conversation.create"],
    "ROLE_STAFF": [
        "conversation.read_own",
        "conversation.create",
        "document.read",
        "document.download",
        "relation.read",
    ],
    "ROLE_COMPLIANCE": [
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
    "ROLE_ADMIN": [
        "user.create",
        "user.update",
        "user.lock",
        "user.unlock",
        "role.update",
        "audit_log.read",
    ],
}
ROLE_NAMES = {
    "ROLE_CUSTOMER": "Customer",
    "ROLE_STAFF": "Staff",
    "ROLE_COMPLIANCE": "Compliance Officer",
    "ROLE_ADMIN": "System Admin",
}
USERS = [
    ("customer", "Nguyễn Thị Mai", "mai@example.com", "ROLE_CUSTOMER"),
    ("employee", "Trần Văn Hùng", "hung@shb.vn", "ROLE_STAFF"),
    ("knowledge", "Lê Thu Hà", "ha@shb.vn", "ROLE_COMPLIANCE"),
    ("admin", "Admin Hệ thống", "admin@shb.vn", "ROLE_ADMIN"),
]


async def seed() -> None:
    await init_db()
    async with SessionLocal() as db:
        roles = {}
        for code in ROLE_PERMS:
            role = (await db.execute(select(Role).where(Role.code == code))).scalar_one_or_none()
            if not role:
                role = Role(id=str(uuid.uuid4()), code=code, name=ROLE_NAMES[code])
                db.add(role)
            elif role.name != ROLE_NAMES[code]:
                role.name = ROLE_NAMES[code]
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
                    password_hash=hash_password("vaic@2026"),
                    must_change_password=False,
                    full_name=name,
                    status="ACTIVE",
                )
                db.add(user)
                await db.flush()
            else:
                # Development seed resets demo accounts to the first-login password.
                user.password_hash = hash_password("vaic@2026")
                user.must_change_password = False
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
        await db.flush()
        # Create a current version and AI reference for every seeded document.
        seeded_documents = (
            (
                await db.execute(
                    select(Document).where(Document.document_code.in_(["SHB-QD-001", "SHB-QT-002"]))
                )
            )
            .scalars()
            .all()
        )
        for document in seeded_documents:
            version = (
                (
                    await db.execute(
                        select(DocumentVersion)
                        .where(DocumentVersion.document_id == document.id)
                        .order_by(DocumentVersion.version_number)
                    )
                )
                .scalars()
                .first()
            )
            if not version:
                version = DocumentVersion(
                    id=str(uuid.uuid4()),
                    document_id=document.id,
                    version_number=1,
                    version_label="v1.0",
                    status="EFFECTIVE",
                    created_by=knowledge_user.id,
                )
                db.add(version)
                await db.flush()
            document.current_version_id = version.id
            ai_ref = (
                await db.execute(
                    select(AIDocumentRef).where(AIDocumentRef.document_id == document.id)
                )
            ).scalar_one_or_none()
            if not ai_ref:
                db.add(
                    AIDocumentRef(
                        id=str(uuid.uuid4()),
                        document_id=document.id,
                        ai_document_id=f"rag_{document.id}",
                        ai_collection="shb-public"
                        if document.access_scope == "PUBLIC"
                        else "shb-internal",
                        sync_status="SYNCED",
                    )
                )
            ai_version = (
                await db.execute(
                    select(AIVersionRef).where(AIVersionRef.document_version_id == version.id)
                )
            ).scalar_one_or_none()
            if not ai_version:
                db.add(
                    AIVersionRef(
                        id=str(uuid.uuid4()),
                        document_version_id=version.id,
                        ai_version_id=f"rag_ver_{version.id}",
                        sync_status="SYNCED",
                    )
                )
            if (
                document.document_code == "SHB-QD-001"
                and not (
                    await db.execute(
                        select(AIChunkRef).where(AIChunkRef.ai_chunk_id == "seed_chunk_001")
                    )
                ).scalar_one_or_none()
            ):
                db.add(
                    AIChunkRef(
                        id=str(uuid.uuid4()), document_id=document.id, ai_chunk_id="seed_chunk_001"
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
                    actor_role="ROLE_COMPLIANCE",
                    action="SEED_DATA",
                    resource_type="SYSTEM",
                    result="SUCCESS",
                )
            )
        await db.commit()


if __name__ == "__main__":
    asyncio.run(seed())
