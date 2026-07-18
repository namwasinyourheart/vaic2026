import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ...database import get_db
from ...dependencies import current_user, user_role_codes
from ...models import (
    Conversation,
    Message,
    MessageFeedback,
    RetrievalGraphRef,
    SourceGroup,
    SourceRef,
    User,
)
from ...schemas import (
    ConversationCreate,
    ConversationOut,
    FeedbackCreate,
    MessageCreate,
    MessageOut,
)
from ...services.ai_adapter import get_ai_adapter

router = APIRouter(prefix="/conversations", tags=["Conversations"])
message_router = APIRouter(prefix="/messages", tags=["Messages"])


@router.post("", response_model=ConversationOut, status_code=201)
async def create_conversation(
    payload: ConversationCreate,
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
) -> ConversationOut:
    roles = await user_role_codes(user, db)
    if payload.scope == "INTERNAL" and "ROLE_CUSTOMER" in roles:
        raise HTTPException(403, "Customer cannot create internal conversation")
    item = Conversation(
        id=str(uuid.uuid4()),
        owner_user_id=user.id,
        title=payload.title,
        scope=payload.scope,
    )
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return ConversationOut.model_validate(item)


@router.get("", response_model=list[ConversationOut])
async def list_conversations(
    user: User = Depends(current_user), db: AsyncSession = Depends(get_db)
) -> list[ConversationOut]:
    result = await db.execute(
        select(Conversation)
        .where(Conversation.owner_user_id == user.id, Conversation.deleted_at.is_(None))
        .order_by(Conversation.updated_at.desc())
    )
    return [ConversationOut.model_validate(item) for item in result.scalars().all()]


@router.get("/{conversation_id}")
async def get_conversation(
    conversation_id: str,
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    conversation = await db.get(Conversation, conversation_id)
    if not conversation or conversation.owner_user_id != user.id:
        raise HTTPException(404, "Conversation not found")
    messages = (
        (
            await db.execute(
                select(Message)
                .where(Message.conversation_id == conversation_id)
                .order_by(Message.created_at)
            )
        )
        .scalars()
        .all()
    )
    return {
        "conversation": ConversationOut.model_validate(conversation),
        "messages": [MessageOut.model_validate(item) for item in messages],
    }


@router.patch("/{conversation_id}", response_model=ConversationOut)
async def update_conversation(
    conversation_id: str,
    payload: ConversationCreate,
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
) -> ConversationOut:
    item = await db.get(Conversation, conversation_id)
    if not item or item.owner_user_id != user.id:
        raise HTTPException(404, "Conversation not found")
    item.title = payload.title
    await db.commit()
    await db.refresh(item)
    return ConversationOut.model_validate(item)


@router.delete("/{conversation_id}")
async def delete_conversation(
    conversation_id: str,
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, str]:
    item = await db.get(Conversation, conversation_id)
    if not item or item.owner_user_id != user.id:
        raise HTTPException(404, "Conversation not found")
    item.deleted_at = datetime.now(timezone.utc)
    await db.commit()
    return {"message": "Conversation deleted"}


@router.post("/{conversation_id}/messages")
async def send_message(
    conversation_id: str,
    payload: MessageCreate,
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    conversation = await db.get(Conversation, conversation_id)
    if not conversation or conversation.owner_user_id != user.id:
        raise HTTPException(404, "Conversation not found")
    user_message = Message(
        id=str(uuid.uuid4()),
        conversation_id=conversation_id,
        role="user",
        content=payload.content,
        status="COMPLETED",
    )
    db.add(user_message)
    await db.flush()
    result = await get_ai_adapter().query(
        user_id=user.id,
        scope=conversation.scope,
        question=payload.content,
        conversation_id=conversation_id,
    )
    assistant = Message(
        id=str(uuid.uuid4()),
        conversation_id=conversation_id,
        role="assistant",
        content=result.answer,
        status="COMPLETED",
        ai_request_id=result.ai_request_id,
    )
    db.add(assistant)
    await db.flush()
    group = SourceGroup(
        id=str(uuid.uuid4()),
        conversation_id=conversation_id,
        user_message_id=user_message.id,
        assistant_message_id=assistant.id,
        ai_source_group_id=result.source_group_id,
        question_snapshot=payload.content,
        chunk_count=len(result.chunks),
    )
    db.add(group)
    for chunk in result.chunks:
        db.add(
            SourceRef(
                id=str(uuid.uuid4()),
                source_group_id=group.id,
                ai_chunk_id=chunk["ai_chunk_id"],
                rank=chunk.get("rank", 1),
                relevance_score=chunk.get("relevance_score"),
            )
        )
    db.add(
        RetrievalGraphRef(
            id=str(uuid.uuid4()),
            assistant_message_id=assistant.id,
            ai_graph_id=result.graph_id,
        )
    )
    await db.commit()
    return {
        "user_message": MessageOut.model_validate(user_message),
        "assistant_message": MessageOut.model_validate(assistant),
        "source_group_id": group.id,
        "ai_source_group_id": result.source_group_id,
        "ai_graph_id": result.graph_id,
    }


@message_router.post("/{message_id}/feedback")
async def feedback(
    message_id: str,
    payload: FeedbackCreate,
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, str]:
    message = await db.get(Message, message_id)
    if not message:
        raise HTTPException(404, "Message not found")
    conversation = await db.get(Conversation, message.conversation_id)
    if not conversation or conversation.owner_user_id != user.id:
        raise HTTPException(404, "Message not found")
    db.add(
        MessageFeedback(
            id=str(uuid.uuid4()),
            message_id=message_id,
            user_id=user.id,
            feedback_type=payload.feedback_type,
            comment=payload.comment,
        )
    )
    await db.commit()
    return {"message": "Feedback recorded"}
